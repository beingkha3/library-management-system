import crypto from 'crypto';

import Razorpay from 'razorpay';

import { env, isRazorpayEnabled } from '../config/env.js';
import { Fine } from '../models/Fine.js';
import { Payment } from '../models/Payment.js';
import { AppError } from '../utils/appError.js';
import { FINE_STATUSES, PAYMENT_STATUSES } from '../utils/constants.js';
import { recomputeUserFineBalance } from './fineService.js';
import { sendTemplateEmail } from './notificationService.js';

let razorpayClient;

const RECONCILIATION_LOCK_MS = 5 * 60 * 1000;

const getRazorpayClient = () => {
  if (!isRazorpayEnabled) {
    throw new AppError('Razorpay is not configured on the server', 500);
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret
    });
  }

  return razorpayClient;
};

const timingSafeCompare = (left, right) => {
  const leftBuffer = Buffer.from(left || '', 'utf8');
  const rightBuffer = Buffer.from(right || '', 'utf8');

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const isFineClosed = (fine) => [FINE_STATUSES.PAID, FINE_STATUSES.WAIVED].includes(fine.status);

const sendPaymentReceipt = async ({ payment, user, reference }) => {
  await sendTemplateEmail({
    user,
    subject: 'Fine payment received',
    preheader: 'Your payment was processed successfully.',
    bodyLines: [
      `Hi ${user.name},`,
      `We received your fine payment of INR ${payment.amount}.`,
      `Reference: ${reference}`
    ],
    templateKey: 'fine-payment',
    type: 'fine_payment'
  });
};

const reconcileCapturedPayment = async ({ payment, fine, user, reference }) => {
  const lockBefore = new Date(Date.now() - RECONCILIATION_LOCK_MS);
  const claimedPayment = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      status: PAYMENT_STATUSES.CAPTURED,
      reconciledAt: { $exists: false },
      $or: [
        { reconciliationStartedAt: { $exists: false } },
        { reconciliationStartedAt: { $lt: lockBefore } }
      ]
    },
    { $set: { reconciliationStartedAt: new Date() } },
    { new: true }
  );

  if (!claimedPayment) {
    return false;
  }

  try {
    const outstandingAmount = Math.max(fine.amount - fine.paidAmount, 0);
    const appliedAmount = fine.status === FINE_STATUSES.WAIVED ? 0 : Math.min(payment.amount, outstandingAmount);

    if (appliedAmount > 0) {
      fine.paidAmount = Math.min(fine.amount, fine.paidAmount + appliedAmount);
      fine.status = fine.paidAmount >= fine.amount ? FINE_STATUSES.PAID : FINE_STATUSES.PARTIALLY_PAID;
      await fine.save();
    }

    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        appliedAmount,
        reconciledAt: new Date()
      },
      $unset: { reconciliationStartedAt: '' }
    });

    await recomputeUserFineBalance(user._id);

    if (appliedAmount > 0) {
      await sendPaymentReceipt({ payment: { ...payment.toObject(), amount: appliedAmount }, user, reference });
    }

    return true;
  } catch (error) {
    await Payment.findByIdAndUpdate(payment._id, { $unset: { reconciliationStartedAt: '' } });
    throw error;
  }
};

export const createFinePaymentOrder = async ({ user, fineId }) => {
  const fine = await Fine.findById(fineId);

  if (!fine) {
    throw new AppError('Fine not found', 404);
  }

  if (fine.user.toString() !== user._id.toString()) {
    throw new AppError('You can only pay your own fines', 403);
  }

  if (isFineClosed(fine)) {
    throw new AppError('This fine has already been settled', 400);
  }

  const outstandingAmount = Math.max(fine.amount - fine.paidAmount, 0);

  if (outstandingAmount <= 0) {
    throw new AppError('This fine has already been settled', 400);
  }

  const existingPayment = await Payment.findOne({
    user: user._id,
    fine: fine._id,
    status: PAYMENT_STATUSES.CREATED,
    amount: outstandingAmount
  }).sort({ createdAt: -1 });

  if (existingPayment?.gatewayPayload?.id) {
    return {
      order: existingPayment.gatewayPayload,
      payment: existingPayment,
      keyId: env.razorpayKeyId
    };
  }

  const client = getRazorpayClient();
  const receiptNo = `fine_${fine._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`;
  const order = await client.orders.create({
    amount: outstandingAmount * 100,
    currency: fine.currency,
    receipt: receiptNo,
    notes: {
      fineId: fine._id.toString(),
      userId: user._id.toString()
    }
  });

  let payment;

  try {
    payment = await Payment.create({
      user: user._id,
      fine: fine._id,
      razorpayOrderId: order.id,
      amount: outstandingAmount,
      currency: fine.currency,
      receiptNo,
      status: PAYMENT_STATUSES.CREATED,
      gatewayPayload: order
    });
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    const duplicatePayment = await Payment.findOne({
      user: user._id,
      fine: fine._id,
      status: PAYMENT_STATUSES.CREATED,
      amount: outstandingAmount
    }).sort({ createdAt: -1 });

    if (duplicatePayment?.gatewayPayload?.id) {
      return {
        order: duplicatePayment.gatewayPayload,
        payment: duplicatePayment,
        keyId: env.razorpayKeyId
      };
    }

    throw error;
  }

  return {
    order,
    payment,
    keyId: env.razorpayKeyId
  };
};

export const verifyFinePayment = async ({ user, fineId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const payment = await Payment.findOne({ fine: fineId, razorpayOrderId }).populate('user');

  if (!payment) {
    throw new AppError('Payment order not found', 404);
  }

  if (payment.user._id.toString() !== user._id.toString()) {
    throw new AppError('You can only verify your own payments', 403);
  }

  const fine = await Fine.findById(fineId);

  if (!fine) {
    throw new AppError('Fine not found', 404);
  }

  const digest = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (!timingSafeCompare(digest, razorpaySignature)) {
    throw new AppError('Payment signature verification failed', 400);
  }

  if (payment.status === PAYMENT_STATUSES.CAPTURED) {
    if (payment.razorpayPaymentId !== razorpayPaymentId) {
      throw new AppError('This payment order has already been captured', 409);
    }

    await reconcileCapturedPayment({ payment, fine, user: payment.user, reference: razorpayPaymentId });
    return { payment, fine };
  }

  const capturedPayment = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $ne: PAYMENT_STATUSES.CAPTURED } },
    {
      $set: {
        razorpayPaymentId,
        razorpaySignature,
        status: PAYMENT_STATUSES.CAPTURED,
        paidAt: new Date()
      }
    },
    { new: true }
  ).populate('user');

  if (!capturedPayment) {
    const latestPayment = await Payment.findById(payment._id).populate('user');
    if (latestPayment?.status === PAYMENT_STATUSES.CAPTURED) {
      await reconcileCapturedPayment({ payment: latestPayment, fine, user: latestPayment.user, reference: razorpayPaymentId });
    }
    return { payment: latestPayment, fine };
  }

  await reconcileCapturedPayment({
    payment: capturedPayment,
    fine,
    user: capturedPayment.user,
    reference: razorpayPaymentId
  });

  return { payment: capturedPayment, fine };
};

export const listPaymentsForUser = async (userId) =>
  Payment.find({ user: userId }).populate('fine').sort({ createdAt: -1 });

export const handleRazorpayWebhook = async ({ rawBody, signature }) => {
  if (!env.razorpayWebhookSecret) {
    throw new AppError('Razorpay webhook secret is not configured', 500);
  }

  const digest = crypto
    .createHmac('sha256', env.razorpayWebhookSecret)
    .update(rawBody)
    .digest('hex');

  if (!timingSafeCompare(digest, signature)) {
    throw new AppError('Webhook signature verification failed', 400);
  }

  const event = JSON.parse(rawBody);
  const paymentEntity = event.payload?.payment?.entity;
  const orderEntity = event.payload?.order?.entity;
  const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;

  if (!razorpayOrderId) {
    return { acknowledged: true, ignored: true };
  }

  const payment = await Payment.findOne({ razorpayOrderId }).populate('user');

  if (!payment) {
    return { acknowledged: true, ignored: true };
  }

  if (payment.status === PAYMENT_STATUSES.CAPTURED && payment.reconciledAt) {
    return { acknowledged: true, ignored: true };
  }

  const fine = await Fine.findById(payment.fine);

  if (!fine) {
    return { acknowledged: true, ignored: true };
  }

  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    if (!paymentEntity?.id) {
      return { acknowledged: true, ignored: true };
    }

    const capturedPayment = await Payment.findOneAndUpdate(
      { _id: payment._id, status: { $ne: PAYMENT_STATUSES.CAPTURED } },
      {
        $set: {
          razorpayPaymentId: paymentEntity?.id || payment.razorpayPaymentId,
          webhookSignature: signature,
          status: PAYMENT_STATUSES.CAPTURED,
          paidAt: new Date(),
          gatewayPayload: event
        }
      },
      { new: true }
    ).populate('user');

    const paymentForReconciliation = capturedPayment || (await Payment.findById(payment._id).populate('user'));

    if (paymentForReconciliation?.status === PAYMENT_STATUSES.CAPTURED) {
      await reconcileCapturedPayment({
        payment: paymentForReconciliation,
        fine,
        user: paymentForReconciliation.user,
        reference: paymentForReconciliation.razorpayPaymentId || paymentForReconciliation.razorpayOrderId
      });
    }
  }

  if (event.event === 'payment.failed') {
    await Payment.findOneAndUpdate(
      { _id: payment._id, status: PAYMENT_STATUSES.CREATED },
      {
        $set: {
          status: PAYMENT_STATUSES.FAILED,
          razorpayPaymentId: paymentEntity?.id || payment.razorpayPaymentId,
          gatewayPayload: event
        }
      }
    );
  }

  return { acknowledged: true };
};

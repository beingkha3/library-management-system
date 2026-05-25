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

export const createFinePaymentOrder = async ({ user, fineId }) => {
  const fine = await Fine.findById(fineId);

  if (!fine) {
    throw new AppError('Fine not found', 404);
  }

  if (fine.user.toString() !== user._id.toString()) {
    throw new AppError('You can only pay your own fines', 403);
  }

  const outstandingAmount = Math.max(fine.amount - fine.paidAmount, 0);

  if (outstandingAmount <= 0) {
    throw new AppError('This fine has already been settled', 400);
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

  const payment = await Payment.create({
    user: user._id,
    fine: fine._id,
    razorpayOrderId: order.id,
    amount: outstandingAmount,
    currency: fine.currency,
    receiptNo,
    status: PAYMENT_STATUSES.CREATED,
    gatewayPayload: order
  });

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

  if (payment.status === PAYMENT_STATUSES.CAPTURED) {
    if (payment.razorpayPaymentId !== razorpayPaymentId) {
      throw new AppError('This payment order has already been captured', 409);
    }

    return { payment, fine };
  }

  const digest = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (digest !== razorpaySignature) {
    throw new AppError('Payment signature verification failed', 400);
  }

  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.status = PAYMENT_STATUSES.CAPTURED;
  payment.paidAt = new Date();
  await payment.save();

  fine.paidAmount = Math.min(fine.amount, fine.paidAmount + payment.amount);
  fine.status = fine.paidAmount >= fine.amount ? FINE_STATUSES.PAID : FINE_STATUSES.PARTIALLY_PAID;
  await fine.save();

  await recomputeUserFineBalance(user._id);

  await sendTemplateEmail({
    user: payment.user,
    subject: 'Fine payment received',
    preheader: 'Your payment was processed successfully.',
    bodyLines: [
      `Hi ${payment.user.name},`,
      `We received your fine payment of INR ${payment.amount}.`,
      `Reference: ${razorpayPaymentId}`
    ],
    templateKey: 'fine-payment',
    type: 'fine_payment'
  });

  return { payment, fine };
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

  if (digest !== signature) {
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

  if (payment.status === PAYMENT_STATUSES.CAPTURED) {
    return { acknowledged: true, ignored: true };
  }

  const fine = await Fine.findById(payment.fine);

  if (!fine) {
    return { acknowledged: true, ignored: true };
  }

  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    payment.razorpayPaymentId = paymentEntity?.id || payment.razorpayPaymentId;
    payment.razorpaySignature = signature;
    payment.status = PAYMENT_STATUSES.CAPTURED;
    payment.paidAt = new Date();
    payment.gatewayPayload = event;
    await payment.save();

    fine.paidAmount = Math.min(fine.amount, fine.paidAmount + payment.amount);
    fine.status = fine.paidAmount >= fine.amount ? FINE_STATUSES.PAID : FINE_STATUSES.PARTIALLY_PAID;
    await fine.save();
    await recomputeUserFineBalance(payment.user._id);

    await sendTemplateEmail({
      user: payment.user,
      subject: 'Fine payment received',
      preheader: 'Your payment was processed successfully.',
      bodyLines: [
        `Hi ${payment.user.name},`,
        `We received your fine payment of INR ${payment.amount}.`,
        `Reference: ${payment.razorpayPaymentId || payment.razorpayOrderId}`
      ],
      templateKey: 'fine-payment',
      type: 'fine_payment'
    });
  }

  return { acknowledged: true };
};

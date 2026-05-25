import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createFinePaymentOrder,
  handleRazorpayWebhook,
  listPaymentsForUser,
  verifyFinePayment
} from '../services/paymentService.js';

export const createOrder = asyncHandler(async (req, res) => {
  const data = await createFinePaymentOrder({ user: req.user, fineId: req.body.fineId });
  res.status(201).json({ success: true, message: 'Payment order created', data });
});

export const verifyOrder = asyncHandler(async (req, res) => {
  const data = await verifyFinePayment({
    user: req.user,
    fineId: req.body.fineId,
    razorpayOrderId: req.body.razorpayOrderId,
    razorpayPaymentId: req.body.razorpayPaymentId,
    razorpaySignature: req.body.razorpaySignature
  });

  res.json({ success: true, message: 'Payment verified successfully', data });
});

export const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await listPaymentsForUser(req.user._id);
  res.json({ success: true, data: payments });
});

export const razorpayWebhook = asyncHandler(async (req, res) => {
  const result = await handleRazorpayWebhook({
    rawBody: req.rawBody || JSON.stringify(req.body || {}),
    signature: req.headers['x-razorpay-signature']
  });

  res.json({ success: true, data: result });
});

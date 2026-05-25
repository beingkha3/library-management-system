import mongoose from 'mongoose';

import { PAYMENT_STATUSES } from '../utils/constants.js';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fine',
      required: true
    },
    provider: {
      type: String,
      default: 'razorpay'
    },
    razorpayOrderId: {
      type: String,
      required: true
    },
    razorpayPaymentId: {
      type: String,
      default: ''
    },
    razorpaySignature: {
      type: String,
      default: ''
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.CREATED
    },
    paidAt: Date,
    receiptNo: {
      type: String,
      default: ''
    },
    gatewayPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ fine: 1, status: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);

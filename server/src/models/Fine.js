import mongoose from 'mongoose';

import { FINE_STATUSES } from '../utils/constants.js';

const fineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    borrow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Borrow'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    reason: {
      type: String,
      enum: ['overdue', 'damage', 'loss', 'manual'],
      default: 'overdue'
    },
    status: {
      type: String,
      enum: Object.values(FINE_STATUSES),
      default: FINE_STATUSES.PENDING
    },
    assessedAt: {
      type: Date,
      default: Date.now
    },
    waivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    waiveReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

fineSchema.virtual('outstandingAmount').get(function outstandingAmount() {
  return Math.max(this.amount - this.paidAmount, 0);
});

fineSchema.index({ user: 1, status: 1 });

export const Fine = mongoose.model('Fine', fineSchema);

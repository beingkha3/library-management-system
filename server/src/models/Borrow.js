import mongoose from 'mongoose';

import { BORROW_STATUSES } from '../utils/constants.js';

const borrowSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    returnedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    borrowedAt: {
      type: Date,
      default: Date.now
    },
    dueAt: {
      type: Date,
      required: true
    },
    returnedAt: Date,
    status: {
      type: String,
      enum: Object.values(BORROW_STATUSES),
      default: BORROW_STATUSES.ACTIVE
    },
    renewalCount: {
      type: Number,
      default: 0,
      min: 0
    },
    fineAccrued: {
      type: Number,
      default: 0,
      min: 0
    },
    finePaid: {
      type: Number,
      default: 0,
      min: 0
    },
    overdueNotifiedAt: Date,
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

borrowSchema.index({ user: 1, status: 1 });
borrowSchema.index({ book: 1, status: 1 });
borrowSchema.index({ dueAt: 1, status: 1 });

export const Borrow = mongoose.model('Borrow', borrowSchema);

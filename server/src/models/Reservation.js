import mongoose from 'mongoose';

import { RESERVATION_STATUSES } from '../utils/constants.js';

const reservationSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: Object.values(RESERVATION_STATUSES),
      default: RESERVATION_STATUSES.QUEUED
    },
    queuePosition: {
      type: Number,
      default: 0,
      min: 0
    },
    reservedAt: {
      type: Date,
      default: Date.now
    },
    pickupExpiresAt: Date,
    fulfilledAt: Date,
    notifiedAt: Date,
    cancelledAt: Date
  },
  {
    timestamps: true
  }
);

reservationSchema.index({ book: 1, status: 1, queuePosition: 1 });
reservationSchema.index({ user: 1, status: 1 });

export const Reservation = mongoose.model('Reservation', reservationSchema);

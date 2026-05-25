import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'system',
      unique: true
    },
    loanDays: {
      type: Number,
      default: 14,
      min: 1
    },
    finePerDay: {
      type: Number,
      default: 10,
      min: 0
    },
    maxActiveBorrows: {
      type: Number,
      default: 5,
      min: 1
    },
    maxRenewals: {
      type: Number,
      default: 2,
      min: 0
    },
    reservationHoldDays: {
      type: Number,
      default: 3,
      min: 1
    },
    fineThreshold: {
      type: Number,
      default: 500,
      min: 0
    },
    allowSelfIssue: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

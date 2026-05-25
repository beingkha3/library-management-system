import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      required: true
    },
    channel: {
      type: String,
      default: 'email'
    },
    subject: {
      type: String,
      required: true
    },
    templateKey: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'skipped'],
      default: 'skipped'
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    sentAt: Date,
    error: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

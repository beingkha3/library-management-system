import nodemailer from 'nodemailer';

import { env, isEmailEnabled } from '../config/env.js';
import { NotificationLog } from '../models/NotificationLog.js';

let transporter;

const getTransporter = () => {
  if (!isEmailEnabled) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });
  }

  return transporter;
};

export const sendEmail = async ({ user, to, subject, html, text, templateKey, meta = {}, type }) => {
  const logPayload = {
    user: user?._id,
    type: type || templateKey || 'general',
    subject,
    templateKey: templateKey || '',
    meta
  };

  if (!isEmailEnabled) {
    await NotificationLog.create({
      ...logPayload,
      status: 'skipped',
      error: 'Email transport is not configured'
    });

    return { skipped: true };
  }

  try {
    const activeTransporter = getTransporter();

    await activeTransporter.sendMail({
      from: env.smtpFrom,
      to,
      subject,
      html,
      text
    });

    await NotificationLog.create({
      ...logPayload,
      status: 'sent',
      sentAt: new Date()
    });

    return { sent: true };
  } catch (error) {
    await NotificationLog.create({
      ...logPayload,
      status: 'failed',
      error: error.message
    });

    return { sent: false, error };
  }
};

export const sendTemplateEmail = async ({ user, subject, preheader, bodyLines, templateKey, meta, type }) => {
  const htmlBody = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="background:#0f172a;color:#ffffff;padding:24px;">
          <h1 style="margin:0;font-size:22px;">Library Management System</h1>
          <p style="margin:8px 0 0;color:#cbd5e1;">${preheader}</p>
        </div>
        <div style="padding:24px;color:#0f172a;line-height:1.6;">
          ${bodyLines.map((line) => `<p style="margin:0 0 12px;">${line}</p>`).join('')}
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    user,
    to: user.email,
    subject,
    html: htmlBody,
    text: bodyLines.join('\n'),
    templateKey,
    meta,
    type
  });
};

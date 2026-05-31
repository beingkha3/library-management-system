import { env, isEmailEnabled } from '../config/env.js';
import { NotificationLog } from '../models/NotificationLog.js';

// Parse "Name <email>" or bare "email" into a Brevo sender object
const parseSender = (from) => {
  const match = (from || '').match(/^(.*?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim() || 'Library Management', email: match[2].trim() };
  return { name: 'Library Management', email: (from || 'noreply@kazrotech.com').trim() };
};

const brevoPost = async (path, payload) => {
  const apiKey = env.brevoApiKey;
  if (!apiKey) throw new Error('BREVO_API_KEY is not configured');

  return fetch(`https://api.brevo.com/v3${path}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
};

export const emailHealthCheck = async () => {
  const apiKey = env.brevoApiKey;
  if (!apiKey) return { ok: false, error: 'BREVO_API_KEY is not configured' };

  try {
    const res = await fetch('https://api.brevo.com/v3/account', {
      headers: { accept: 'application/json', 'api-key': apiKey },
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, provider: 'brevo', account: data.email };
    }
    const body = await res.text();
    return { ok: false, provider: 'brevo', status: res.status, error: body };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

export const sendEmail = async ({ user, to, subject, html, text, templateKey, meta = {}, type }) => {
  const logPayload = {
    user: user?._id,
    type: type || templateKey || 'general',
    subject,
    templateKey: templateKey || '',
    meta,
  };

  if (!isEmailEnabled) {
    await NotificationLog.create({
      ...logPayload,
      status: 'skipped',
      error: 'Email transport is not configured',
    });
    return { skipped: true };
  }

  try {
    const res = await brevoPost('/smtp/email', {
      sender: parseSender(env.smtpFrom),
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Brevo API error ${res.status}: ${body}`);
    }

    await NotificationLog.create({ ...logPayload, status: 'sent', sentAt: new Date() });
    return { sent: true };
  } catch (error) {
    console.error('[notificationService] sendEmail failed:', error.message);
    await NotificationLog.create({ ...logPayload, status: 'failed', error: error.message });
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
    type,
  });
};

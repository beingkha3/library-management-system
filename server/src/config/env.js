import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProductionEnv = nodeEnv === 'production';

const parseNumberEnv = (name, fallback) => {
  const rawValue = process.env[name];
  const value = rawValue === undefined || rawValue === '' ? fallback : Number(rawValue);

  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a valid number`);
  }

  return value;
};

const parseClientUrl = () => {
  const value = process.env.CLIENT_URL || (isProductionEnv ? '' : 'http://localhost:5173');
  const urls = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return urls.length > 1 ? urls : urls[0] || '';
};

const mongodbUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  (isProductionEnv ? '' : 'mongodb://127.0.0.1:27017/library-management-system');

const jwtSecret = process.env.JWT_SECRET || (isProductionEnv ? '' : 'development-secret-key');
const smtpFrom = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Library Management <noreply@example.com>';
const isConfiguredValue = (value) => Boolean(value && !/^replace-with-|^rzp_test_xxxxx$/i.test(value));

export const env = {
  nodeEnv,
  port: parseNumberEnv('PORT', 5000),
  clientUrl: parseClientUrl(),
  mongodbUri,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  brevoApiKey: process.env.BREVO_API_KEY || '',
  smtpFrom,
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || ''
};

if (isProductionEnv) {
  const missing = [];

  if (!env.clientUrl) missing.push('CLIENT_URL');
  if (!env.mongodbUri) missing.push('MONGO_URI or MONGODB_URI');
  if (!env.jwtSecret) missing.push('JWT_SECRET');

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  if (env.jwtSecret === 'development-secret-key' || env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
}

export const isProduction = env.nodeEnv === 'production';
export const isEmailEnabled = Boolean(env.brevoApiKey);
export const isRazorpayEnabled = isConfiguredValue(env.razorpayKeyId) && isConfiguredValue(env.razorpayKeySecret);

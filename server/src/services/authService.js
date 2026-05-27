import crypto from 'crypto';

import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { ROLES, USER_STATUSES } from '../utils/constants.js';
import { signToken } from '../utils/token.js';
import { sendTemplateEmail } from './notificationService.js';

const RESET_TOKEN_TTL_MINUTES = 60;

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  membershipId: user.membershipId,
  phone: user.phone,
  address: user.address,
  fineBalance: user.fineBalance,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLoginAt: user.lastLoginAt
});

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const getPrimaryClientUrl = () => {
  const clientUrl = Array.isArray(env.clientUrl) ? env.clientUrl[0] : env.clientUrl;
  return clientUrl.replace(/\/$/, '');
};

const authPayload = (user) => ({
  user: sanitizeUser(user),
  token: signToken(user)
});

export const registerUser = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    throw new AppError('Email already exists', 409);
  }

  const user = await User.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    password: payload.password,
    phone: payload.phone || '',
    address: payload.address || '',
    role: ROLES.MEMBER
  });

  await sendTemplateEmail({
    user,
    subject: 'Welcome to the library',
    preheader: 'Your membership has been created.',
    bodyLines: [
      `Hi ${user.name},`,
      `Your library account is ready. Your membership ID is ${user.membershipId}.`,
      'You can now browse the catalog, reserve books, and manage your loans online.'
    ],
    templateKey: 'welcome',
    type: 'welcome'
  });

  return authPayload(user);
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status !== USER_STATUSES.ACTIVE) {
    throw new AppError('Your account is suspended. Please contact the library.', 403);
  }

  user.lastLoginAt = new Date();
  await user.save();

  return authPayload(user);
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return sanitizeUser(user);
};

export const requestPasswordReset = async ({ email }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || user.status !== USER_STATUSES.ACTIVE) {
    return { queued: true };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = hashResetToken(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
  await user.save();

  const resetUrl = `${getPrimaryClientUrl()}/reset-password/${resetToken}`;

  await sendTemplateEmail({
    user,
    subject: 'Reset your library account password',
    preheader: 'Use this link to choose a new password.',
    bodyLines: [
      `Hi ${user.name},`,
      `Use this link to reset your password: ${resetUrl}`,
      `This link expires in ${RESET_TOKEN_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.`
    ],
    templateKey: 'password-reset',
    type: 'password_reset'
  });

  return { queued: true };
};

export const resetPassword = async ({ token, password }) => {
  const user = await User.findOneAndUpdate(
    {
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
      status: USER_STATUSES.ACTIVE
    },
    {
      $unset: {
        passwordResetTokenHash: '',
        passwordResetExpiresAt: ''
      },
      $inc: { tokenVersion: 1 },
      $set: { passwordChangedAt: new Date() }
    },
    { new: true }
  );

  if (!user) {
    throw new AppError('Password reset link is invalid or has expired', 400);
  }

  user.password = password;
  await user.save();

  return authPayload(user);
};

export const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  if (await user.comparePassword(newPassword)) {
    throw new AppError('New password must be different from the current password', 400);
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  return authPayload(user);
};

export const listUsers = async () => {
  const users = await User.find().sort({ createdAt: -1 });
  return users.map(sanitizeUser);
};

export const updateUser = async (targetUserId, payload, actor) => {
  const user = await User.findById(targetUserId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (payload.role && actor.role !== ROLES.ADMIN) {
    throw new AppError('Only admins can change roles', 403);
  }

  if (
    actor.role !== ROLES.ADMIN &&
    user.role !== ROLES.MEMBER
  ) {
    throw new AppError('Only admins can update librarian or admin accounts', 403);
  }

  const allowedFields = ['name', 'phone', 'address', 'status', 'role'];
  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      user[field] = payload[field];
    }
  }

  await user.save();
  return sanitizeUser(user);
};

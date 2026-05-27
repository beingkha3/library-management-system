import { asyncHandler } from '../utils/asyncHandler.js';
import {
  changePassword,
  getProfile,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword
} from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
  const data = await registerUser(req.body);
  res.status(201).json({ success: true, message: 'Registration successful', data });
});

export const login = asyncHandler(async (req, res) => {
  const data = await loginUser(req.body);
  res.json({ success: true, message: 'Login successful', data });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await getProfile(req.user._id);
  res.json({ success: true, data: user });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const data = await requestPasswordReset(req.body);
  res.json({ success: true, message: 'If the email exists, a reset link has been sent', data });
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const data = await resetPassword({ token: req.params.token, password: req.body.password });
  res.json({ success: true, message: 'Password reset successful', data });
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const data = await changePassword({
    userId: req.user._id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword
  });
  res.json({ success: true, message: 'Password changed successfully', data });
});

export const logout = asyncHandler(async (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

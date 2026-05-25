import { asyncHandler } from '../utils/asyncHandler.js';
import { getProfile, loginUser, registerUser } from '../services/authService.js';

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

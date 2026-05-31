import { asyncHandler } from '../utils/asyncHandler.js';
import { listUsers, updateOwnProfile, updateUser } from '../services/authService.js';

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await listUsers();
  res.json({ success: true, data: users });
});

export const patchUser = asyncHandler(async (req, res) => {
  const user = await updateUser(req.params.id, req.body, req.user);
  res.json({ success: true, message: 'User updated successfully', data: user });
});

export const patchMyProfile = asyncHandler(async (req, res) => {
  const user = await updateOwnProfile(req.user._id, req.body);
  res.json({ success: true, message: 'Profile updated successfully', data: user });
});

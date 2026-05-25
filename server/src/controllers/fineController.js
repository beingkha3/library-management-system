import { asyncHandler } from '../utils/asyncHandler.js';
import { listAllFines, listFinesForUser, waiveFine } from '../services/fineService.js';

export const getMyFines = asyncHandler(async (req, res) => {
  const fines = await listFinesForUser(req.user._id);
  res.json({ success: true, data: fines });
});

export const getFines = asyncHandler(async (_req, res) => {
  const fines = await listAllFines();
  res.json({ success: true, data: fines });
});

export const postWaiveFine = asyncHandler(async (req, res) => {
  const fine = await waiveFine(req.params.id, req.user, req.body.waiveReason);
  res.json({ success: true, message: 'Fine waived successfully', data: fine });
});

import { asyncHandler } from '../utils/asyncHandler.js';
import { getAdminDashboard, getMemberDashboard, getReports, getStaffDashboard } from '../services/reportService.js';
import { getSettings, updateSettings } from '../services/settingService.js';

export const getMemberDashboardController = asyncHandler(async (req, res) => {
  const data = await getMemberDashboard(req.user._id);
  res.json({ success: true, data });
});

export const getStaffDashboardController = asyncHandler(async (_req, res) => {
  const data = await getStaffDashboard();
  res.json({ success: true, data });
});

export const getAdminDashboardController = asyncHandler(async (_req, res) => {
  const data = await getAdminDashboard();
  res.json({ success: true, data });
});

export const getReportsController = asyncHandler(async (_req, res) => {
  const data = await getReports();
  res.json({ success: true, data });
});

export const getSettingsController = asyncHandler(async (_req, res) => {
  const data = await getSettings();
  res.json({ success: true, data });
});

export const patchSettingsController = asyncHandler(async (req, res) => {
  const data = await updateSettings(req.body);
  res.json({ success: true, message: 'Settings updated successfully', data });
});

import { Router } from 'express';

import {
  getAdminDashboardController,
  getMemberDashboardController,
  getReportsController,
  getSettingsController,
  getStaffDashboardController,
  patchSettingsController
} from '../controllers/dashboardController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { ROLES } from '../utils/constants.js';
import { dashboardSchemas } from '../validations/requestSchemas.js';

const router = Router();

router.use(protect);
router.get('/member', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), getMemberDashboardController);
router.get('/staff', requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), getStaffDashboardController);
router.get('/admin', requireRoles(ROLES.ADMIN), getAdminDashboardController);
router.get('/reports', requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), getReportsController);
router.get('/settings', requireRoles(ROLES.ADMIN), getSettingsController);
router.patch('/settings', requireRoles(ROLES.ADMIN), validateRequest(dashboardSchemas.settings), patchSettingsController);

export default router;

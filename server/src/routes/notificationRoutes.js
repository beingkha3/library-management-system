import { Router } from 'express';

import {
  getMyNotificationLogs,
  getNotificationLogs,
  sendAnnouncementEmail,
  sendOverdueReminders,
  sendTestEmail
} from '../controllers/notificationController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { ROLES } from '../utils/constants.js';
import { notificationSchemas } from '../validations/requestSchemas.js';

const router = Router();

router.use(protect);
router.get('/me', getMyNotificationLogs);
router.use(requireRoles(ROLES.ADMIN));
router.get('/logs', getNotificationLogs);
router.post('/announcements', validateRequest(notificationSchemas.sendAnnouncement), sendAnnouncementEmail);
router.post('/overdue-reminders', sendOverdueReminders);
router.post('/test-email', validateRequest(notificationSchemas.testEmail), sendTestEmail);

export default router;

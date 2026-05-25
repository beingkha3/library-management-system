import { Router } from 'express';

import { getNotificationLogs, sendTestEmail } from '../controllers/notificationController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect, requireRoles(ROLES.ADMIN));
router.get('/logs', getNotificationLogs);
router.post('/test-email', sendTestEmail);

export default router;

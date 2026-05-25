import { Router } from 'express';

import { getFines, getMyFines, postWaiveFine } from '../controllers/fineController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);
router.get('/me', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), getMyFines);
router.get('/', requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), getFines);
router.post('/:id/waive', requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), postWaiveFine);

export default router;

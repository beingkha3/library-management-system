import { Router } from 'express';

import { getFines, getMyFines, postWaiveFine } from '../controllers/fineController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { ROLES } from '../utils/constants.js';
import { fineSchemas } from '../validations/requestSchemas.js';

const router = Router();

router.use(protect);
router.get('/me', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), getMyFines);
router.get('/', requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), validateRequest(fineSchemas.list), getFines);
router.post('/:id/waive', requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), validateRequest(fineSchemas.waive), postWaiveFine);

export default router;

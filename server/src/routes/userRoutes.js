import { Router } from 'express';

import { getUsers, patchUser } from '../controllers/userController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);
router.get('/', requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), getUsers);
router.patch('/:id', requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), patchUser);

export default router;

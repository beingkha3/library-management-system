import { Router } from 'express';

import { getBorrows, postBorrow, postRenew, postReturn } from '../controllers/borrowController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);
router.get('/', getBorrows);
router.post('/', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), postBorrow);
router.patch('/:id/renew', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), postRenew);
router.patch('/:id/return', requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), postReturn);

export default router;

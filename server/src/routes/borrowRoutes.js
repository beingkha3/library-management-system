import { Router } from 'express';

import { getBorrows, postBorrow, postRenew, postReturn } from '../controllers/borrowController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { ROLES } from '../utils/constants.js';
import { borrowSchemas } from '../validations/requestSchemas.js';

const router = Router();

router.use(protect);
router.get('/', validateRequest(borrowSchemas.list), getBorrows);
router.post('/', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), validateRequest(borrowSchemas.issue), postBorrow);
router.patch('/:id/renew', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), validateRequest(borrowSchemas.idParam), postRenew);
router.patch('/:id/return', requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), validateRequest(borrowSchemas.idParam), postReturn);

export default router;

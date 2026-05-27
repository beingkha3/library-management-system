import { Router } from 'express';

import { getUsers, patchUser } from '../controllers/userController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { ROLES } from '../utils/constants.js';
import { userSchemas } from '../validations/requestSchemas.js';

const router = Router();

router.use(protect);
router.get('/', requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), getUsers);
router.patch('/:id', requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), validateRequest(userSchemas.update), patchUser);

export default router;

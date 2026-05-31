import { Router } from 'express';

import {
  getMyReservations,
  getReservations,
  postCancelReservation,
  postReservation
} from '../controllers/reservationController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { ROLES } from '../utils/constants.js';
import { reservationSchemas } from '../validations/requestSchemas.js';

const router = Router();

router.use(protect);
router.get('/me', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), getMyReservations);
router.get('/', requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), getReservations);
router.post('/', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), validateRequest(reservationSchemas.create), postReservation);
router.patch('/:id/cancel', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), validateRequest(reservationSchemas.idParam), postCancelReservation);

export default router;

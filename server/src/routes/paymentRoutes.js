import { Router } from 'express';

import { createOrder, getMyPayments, razorpayWebhook, verifyOrder } from '../controllers/paymentController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.post('/razorpay/webhook', razorpayWebhook);

router.use(protect);
router.get('/me', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), getMyPayments);
router.post('/razorpay/order', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), createOrder);
router.post('/razorpay/verify', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), verifyOrder);

export default router;

import { Router } from 'express';

import { createOrder, getMyPayments, razorpayWebhook, verifyOrder } from '../controllers/paymentController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { ROLES } from '../utils/constants.js';
import { paymentSchemas } from '../validations/requestSchemas.js';

const router = Router();

router.post('/razorpay/webhook', validateRequest(paymentSchemas.webhook), razorpayWebhook);

router.use(protect);
router.get('/me', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), getMyPayments);
router.post('/razorpay/order', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), validateRequest(paymentSchemas.createOrder), createOrder);
router.post('/razorpay/verify', requireRoles(ROLES.MEMBER, ROLES.LIBRARIAN, ROLES.ADMIN), validateRequest(paymentSchemas.verifyOrder), verifyOrder);

export default router;

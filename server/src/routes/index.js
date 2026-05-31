import { Router } from 'express';

import authRoutes from './authRoutes.js';
import bookRoutes from './bookRoutes.js';
import borrowRoutes from './borrowRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import fineRoutes from './fineRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import { emailHealthCheck } from '../services/notificationService.js';
import reservationRoutes from './reservationRoutes.js';
import userRoutes from './userRoutes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Library API is healthy' });
});

router.get('/health/email', async (_req, res) => {
  const result = await emailHealthCheck();
  res.status(result.ok ? 200 : 503).json(result);
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/books', bookRoutes);
router.use('/borrows', borrowRoutes);
router.use('/reservations', reservationRoutes);
router.use('/fines', fineRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

export default router;

import { Router } from 'express';

import {
  changePasswordController,
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resetPasswordController
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiters.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authSchemas } from '../validations/requestSchemas.js';

const router = Router();

router.post('/register', authRateLimiter, validateRequest(authSchemas.register), register);
router.post('/login', authRateLimiter, validateRequest(authSchemas.login), login);
router.post('/forgot-password', authRateLimiter, validateRequest(authSchemas.forgotPassword), forgotPassword);
router.post('/reset-password/:token', authRateLimiter, validateRequest(authSchemas.resetPassword), resetPasswordController);
router.get('/me', protect, getMe);
router.patch('/change-password', protect, validateRequest(authSchemas.changePassword), changePasswordController);
router.post('/logout', protect, logout);

export default router;

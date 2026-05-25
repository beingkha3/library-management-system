import { asyncHandler } from '../utils/asyncHandler.js';
import { NotificationLog } from '../models/NotificationLog.js';
import { sendEmail } from '../services/notificationService.js';

export const getNotificationLogs = asyncHandler(async (_req, res) => {
  const logs = await NotificationLog.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: logs });
});

export const sendTestEmail = asyncHandler(async (req, res) => {
  const result = await sendEmail({
    user: req.user,
    to: req.body.to || req.user.email,
    subject: 'Library Management test email',
    text: 'This is a test email from the Library Management System.',
    html: '<p>This is a test email from the <strong>Library Management System</strong>.</p>',
    templateKey: 'test-email',
    type: 'test_email'
  });

  res.json({ success: true, message: 'Test email request processed', data: result });
});

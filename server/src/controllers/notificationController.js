import { asyncHandler } from '../utils/asyncHandler.js';
import { Borrow } from '../models/Borrow.js';
import { Book } from '../models/Book.js';
import { NotificationLog } from '../models/NotificationLog.js';
import { User } from '../models/User.js';
import { sendEmail, sendTemplateEmail } from '../services/notificationService.js';
import { BORROW_STATUSES } from '../utils/constants.js';
import { calculateDaysOverdue } from '../utils/dateUtils.js';

export const getMyNotificationLogs = asyncHandler(async (req, res) => {
  const logs = await NotificationLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(25);
  res.json({ success: true, data: logs });
});

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

export const sendAnnouncementEmail = asyncHandler(async (req, res) => {
  const filter = { status: 'active' };

  if (req.body.role) {
    filter.role = req.body.role;
  }

  const users = await User.find(filter);
  const results = await Promise.all(
    users.map((user) =>
      sendTemplateEmail({
        user,
        subject: req.body.subject,
        preheader: 'A library announcement was sent to your account.',
        bodyLines: [`Hi ${user.name},`, req.body.message],
        templateKey: 'admin-announcement',
        meta: { audienceRole: req.body.role || 'all' },
        type: 'announcement'
      })
    )
  );

  res.json({
    success: true,
    message: 'Announcement processing completed',
    data: {
      recipients: users.length,
      sentCount: results.filter((item) => item.sent).length,
      skippedCount: results.filter((item) => item.skipped).length
    }
  });
});

export const sendOverdueReminders = asyncHandler(async (_req, res) => {
  const borrows = await Borrow.find({
    status: { $in: [BORROW_STATUSES.ACTIVE, BORROW_STATUSES.OVERDUE] }
  })
    .populate('user')
    .populate('book')
    .sort({ dueAt: 1 });

  const overdueBorrows = borrows.filter((borrow) => calculateDaysOverdue(borrow.dueAt) > 0);
  const results = [];

  for (const borrow of overdueBorrows) {
    const result = await sendTemplateEmail({
      user: borrow.user,
      subject: `Overdue reminder: ${borrow.book.title}`,
      preheader: 'A borrowed title is overdue.',
      bodyLines: [
        `Hi ${borrow.user.name},`,
        `"${borrow.book.title}" is now overdue.`,
        `It was due on ${borrow.dueAt.toDateString()}. Please return or renew it as soon as possible to limit further fines.`
      ],
      templateKey: 'overdue-reminder',
      meta: { borrowId: borrow._id, bookId: borrow.book?._id },
      type: 'overdue_reminder'
    });

    if (result.sent || result.skipped) {
      borrow.overdueNotifiedAt = new Date();
      if (borrow.status === BORROW_STATUSES.ACTIVE) {
        borrow.status = BORROW_STATUSES.OVERDUE;
      }
      await borrow.save();
    }

    results.push(result);
  }

  res.json({
    success: true,
    message: 'Overdue reminder processing completed',
    data: {
      overdueCount: overdueBorrows.length,
      sentCount: results.filter((item) => item.sent).length,
      skippedCount: results.filter((item) => item.skipped).length
    }
  });
});

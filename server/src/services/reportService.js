import { Book } from '../models/Book.js';
import { Borrow } from '../models/Borrow.js';
import { Fine } from '../models/Fine.js';
import { Reservation } from '../models/Reservation.js';
import { User } from '../models/User.js';
import { BORROW_STATUSES, FINE_STATUSES, ROLES } from '../utils/constants.js';
import { calculateDaysOverdue } from '../utils/dateUtils.js';

const getOutstandingFineAmount = (fine) => {
  if ([FINE_STATUSES.PAID, FINE_STATUSES.WAIVED].includes(fine.status)) {
    return 0;
  }

  return Math.max(fine.amount - fine.paidAmount, 0);
};

const sumOutstandingFines = (fines) => fines.reduce((sum, fine) => sum + getOutstandingFineAmount(fine), 0);

export const getMemberDashboard = async (userId) => {
  const [activeBorrows, reservations, fines, paymentsDueSoon] = await Promise.all([
    Borrow.find({ user: userId, status: { $in: [BORROW_STATUSES.ACTIVE, BORROW_STATUSES.OVERDUE] } }).populate('book'),
    Reservation.find({ user: userId }).populate('book').sort({ createdAt: -1 }).limit(5),
    Fine.find({ user: userId }).sort({ createdAt: -1 }),
    Borrow.find({ user: userId, status: { $in: [BORROW_STATUSES.ACTIVE, BORROW_STATUSES.OVERDUE] } })
      .populate('book')
      .sort({ dueAt: 1 })
      .limit(3)
  ]);

  return {
    summary: {
      activeLoans: activeBorrows.length,
      overdueLoans: activeBorrows.filter((item) => calculateDaysOverdue(item.dueAt) > 0).length,
      totalFines: sumOutstandingFines(fines),
      activeReservations: reservations.filter((item) => ['queued', 'ready'].includes(item.status)).length
    },
    activeBorrows,
    reservations,
    fines: fines.slice(0, 5),
    dueSoon: paymentsDueSoon
  };
};

export const getStaffDashboard = async () => {
  const [booksCount, activeBorrows, overdueBorrows, reservations, outstandingFines] = await Promise.all([
    Book.countDocuments({ status: 'active' }),
    Borrow.countDocuments({ status: BORROW_STATUSES.ACTIVE }),
    Borrow.find({ status: { $in: [BORROW_STATUSES.ACTIVE, BORROW_STATUSES.OVERDUE] } }).populate('user book'),
    Reservation.find({ status: { $in: ['queued', 'ready'] } }).populate('user book').sort({ createdAt: -1 }).limit(5),
    Fine.find({ status: { $in: ['pending', 'partially_paid'] } }).populate('user').sort({ createdAt: -1 }).limit(5)
  ]);

  const overdueItems = overdueBorrows.filter((item) => calculateDaysOverdue(item.dueAt) > 0);

  return {
    summary: {
      catalogBooks: booksCount,
      activeLoans: activeBorrows,
      overdueLoans: overdueItems.length,
      pendingReservations: reservations.length
    },
    overdueItems: overdueItems.slice(0, 5),
    reservations,
    outstandingFines
  };
};

export const getAdminDashboard = async () => {
  const [members, librarians, admins, books, borrows, fines, reservations] = await Promise.all([
    User.countDocuments({ role: ROLES.MEMBER }),
    User.countDocuments({ role: ROLES.LIBRARIAN }),
    User.countDocuments({ role: ROLES.ADMIN }),
    Book.countDocuments({ status: 'active' }),
    Borrow.find().populate('book user').sort({ createdAt: -1 }).limit(8),
    Fine.find().populate('user').sort({ createdAt: -1 }).limit(8),
    Reservation.find().populate('book user').sort({ createdAt: -1 }).limit(8)
  ]);

  const revenueCollected = fines.reduce((sum, fine) => sum + fine.paidAmount, 0);

  return {
    summary: {
      members,
      librarians,
      admins,
      books,
      revenueCollected
    },
    recentBorrows: borrows,
    recentFines: fines,
    recentReservations: reservations
  };
};

export const getReports = async () => {
  const [books, borrows, fines, reservations, users] = await Promise.all([
    Book.find().sort({ createdAt: -1 }),
    Borrow.find().populate('book user').sort({ createdAt: -1 }),
    Fine.find().populate('user').sort({ createdAt: -1 }),
    Reservation.find().populate('book user').sort({ createdAt: -1 }),
    User.find().sort({ createdAt: -1 })
  ]);

  const overdueReport = borrows.filter(
    (item) => item.status !== BORROW_STATUSES.RETURNED && calculateDaysOverdue(item.dueAt) > 0
  );

  const borrowingByCategory = books.reduce((accumulator, book) => {
    const total = borrows.filter((borrow) => borrow.book?._id?.toString() === book._id.toString()).length;
    accumulator[book.category] = (accumulator[book.category] || 0) + total;
    return accumulator;
  }, {});

  return {
    metrics: {
      totalUsers: users.length,
      totalBooks: books.length,
      totalBorrows: borrows.length,
      totalReservations: reservations.length,
      outstandingFineAmount: sumOutstandingFines(fines)
    },
    overdueReport,
    recentBorrows: borrows.slice(0, 10),
    recentFines: fines.slice(0, 10),
    borrowingByCategory
  };
};

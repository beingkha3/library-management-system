import mongoose from 'mongoose';

import { Book } from '../models/Book.js';
import { Borrow } from '../models/Borrow.js';
import { Reservation } from '../models/Reservation.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { BORROW_STATUSES, RESERVATION_STATUSES, ROLES, USER_STATUSES } from '../utils/constants.js';
import { addDays, calculateDaysOverdue } from '../utils/dateUtils.js';
import { calculateOverdueFineAmount, ensureFineForBorrow, recomputeUserFineBalance } from './fineService.js';
import { sendTemplateEmail } from './notificationService.js';
import { promoteNextReservation } from './reservationService.js';
import { getSettings } from './settingService.js';

const updateBorrowStatus = (borrow) => {
  if (
    borrow.status === BORROW_STATUSES.ACTIVE &&
    !borrow.returnedAt &&
    calculateDaysOverdue(borrow.dueAt) > 0
  ) {
    borrow.status = BORROW_STATUSES.OVERDUE;
  }

  return borrow;
};

export const listBorrows = async ({ user, query = {} }) => {
  const filter = {};

  if (user.role === ROLES.MEMBER) {
    filter.user = user._id;
  } else if (query.userId) {
    filter.user = query.userId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  const borrows = await Borrow.find(filter)
    .populate('user', 'name email membershipId role')
    .populate('book')
    .populate('issuedBy', 'name role')
    .sort({ createdAt: -1 });

  return Promise.all(
    borrows.map(async (borrow) => {
      updateBorrowStatus(borrow);
      if (borrow.isModified()) {
        await borrow.save();
      }
      return borrow;
    })
  );
};

export const issueBook = async ({ actor, userId, bookId }) => {
  const settings = await getSettings();
  const hasReplicaSet = Array.isArray(mongoose.connection?.client?.topology?.description?.servers)
    ? true
    : mongoose.connection?.readyState === 1 && mongoose.connection?.client != null;

  const executeIssue = async (session = null) => {
    const useSession = (query) => (session ? query.session(session) : query);
    const book = await useSession(Book.findById(bookId));
    const targetUser = await useSession(User.findById(userId));

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    if (!targetUser) {
      throw new AppError('Target user not found', 404);
    }

    if (targetUser.status !== USER_STATUSES.ACTIVE) {
      throw new AppError('This user account is suspended', 403);
    }

    if (targetUser.fineBalance > settings.fineThreshold) {
      throw new AppError('Outstanding fines exceed the allowed borrowing threshold', 400);
    }

    if (actor.role === ROLES.MEMBER) {
      if (!settings.allowSelfIssue) {
        throw new AppError('Self-issue is disabled. Please contact library staff.', 403);
      }

      if (actor._id.toString() !== targetUser._id.toString()) {
        throw new AppError('Members can only issue books for themselves', 403);
      }
    }

    const activeReservation = await useSession(
      Reservation.findOne({
        user: userId,
        book: bookId,
        status: RESERVATION_STATUSES.READY
      })
    );

    if (!activeReservation && book.availableCopies <= 0) {
      throw new AppError('No copies are currently available', 400);
    }

    const activeBorrowCount = await useSession(
      Borrow.countDocuments({
        user: userId,
        status: { $in: [BORROW_STATUSES.ACTIVE, BORROW_STATUSES.OVERDUE] }
      })
    );

    if (activeBorrowCount >= settings.maxActiveBorrows) {
      throw new AppError('Borrow limit reached for this user', 400);
    }

    if (!activeReservation) {
      book.availableCopies -= 1;
      await book.save(session ? { session } : undefined);
    }

    const createdBorrow = await Borrow.create(
      [
        {
          user: userId,
          book: bookId,
          issuedBy: actor._id,
          borrowedAt: new Date(),
          dueAt: addDays(new Date(), settings.loanDays),
          status: BORROW_STATUSES.ACTIVE
        }
      ],
      session ? { session } : undefined
    );

    if (activeReservation) {
      activeReservation.status = RESERVATION_STATUSES.FULFILLED;
      activeReservation.fulfilledAt = new Date();
      await activeReservation.save(session ? { session } : undefined);

      if (book.reservedCopies > 0) {
        book.reservedCopies -= 1;
        await book.save(session ? { session } : undefined);
      }
    }

    return createdBorrow;
  };

  const session = hasReplicaSet ? await mongoose.startSession() : null;

  try {
    let createdBorrow;

    if (session) {
      await session.withTransaction(async () => {
        createdBorrow = await executeIssue(session);
      });
    } else {
      createdBorrow = await executeIssue();
    }

    const borrow = await Borrow.findById(createdBorrow[0]._id).populate('user').populate('book');

    await sendTemplateEmail({
      user: borrow.user,
      subject: `Borrow confirmed: ${borrow.book.title}`,
      preheader: 'Your library loan has been recorded.',
      bodyLines: [
        `Hi ${borrow.user.name},`,
        `You borrowed "${borrow.book.title}" successfully.`,
        `Please return it by ${borrow.dueAt.toDateString()} to avoid overdue fines.`
      ],
      templateKey: 'borrow-confirmed',
      type: 'borrow_confirmation'
    });

    return borrow;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export const renewBorrow = async ({ borrowId, actor }) => {
  const settings = await getSettings();
  const borrow = await Borrow.findById(borrowId).populate('user').populate('book');

  if (!borrow) {
    throw new AppError('Borrow record not found', 404);
  }

  if (actor.role === ROLES.MEMBER && borrow.user._id.toString() !== actor._id.toString()) {
    throw new AppError('You can only renew your own loans', 403);
  }

  if (borrow.status === BORROW_STATUSES.RETURNED) {
    throw new AppError('Returned loans cannot be renewed', 400);
  }

  if (borrow.renewalCount >= settings.maxRenewals) {
    throw new AppError('Renewal limit reached', 400);
  }

  const queuedReservation = await Reservation.findOne({
    book: borrow.book._id,
    status: { $in: [RESERVATION_STATUSES.QUEUED, RESERVATION_STATUSES.READY] },
    user: { $ne: borrow.user._id }
  });

  if (queuedReservation) {
    throw new AppError('This title has pending reservations and cannot be renewed', 400);
  }

  borrow.dueAt = addDays(new Date(borrow.dueAt), settings.loanDays);
  borrow.renewalCount += 1;
  borrow.status = BORROW_STATUSES.ACTIVE;
  await borrow.save();

  return borrow;
};

export const returnBook = async ({ borrowId, actor }) => {
  const settings = await getSettings();
  const borrow = await Borrow.findById(borrowId).populate('user').populate('book');

  if (!borrow) {
    throw new AppError('Borrow record not found', 404);
  }

  if (borrow.status === BORROW_STATUSES.RETURNED) {
    throw new AppError('This book has already been returned', 400);
  }

  const returnedAt = new Date();
  borrow.returnedAt = returnedAt;
  borrow.returnedTo = actor._id;
  borrow.status = BORROW_STATUSES.RETURNED;

  const { amount } = calculateOverdueFineAmount(borrow.dueAt, returnedAt, settings.finePerDay);
  borrow.fineAccrued = amount;
  await borrow.save();

  const book = await Book.findById(borrow.book._id);
  if (book) {
    book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
    await book.save();
  }

  await ensureFineForBorrow({
    userId: borrow.user._id,
    borrowId: borrow._id,
    amount,
    reason: 'overdue'
  });

  await recomputeUserFineBalance(borrow.user._id);
  await promoteNextReservation(borrow.book._id);

  await sendTemplateEmail({
    user: borrow.user,
    subject: `Return processed: ${borrow.book.title}`,
    preheader: 'Your return has been completed.',
    bodyLines: [
      `Hi ${borrow.user.name},`,
      `The return for "${borrow.book.title}" has been completed.`,
      amount > 0
        ? `An overdue fine of INR ${amount} has been added to your account.`
        : 'No overdue fine was applied for this return.'
    ],
    templateKey: 'return-processed',
    type: 'return_confirmation'
  });

  return borrow;
};

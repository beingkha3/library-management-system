import { Book } from '../models/Book.js';
import { Borrow } from '../models/Borrow.js';
import { Reservation } from '../models/Reservation.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { BORROW_STATUSES, RESERVATION_STATUSES, ROLES, USER_STATUSES } from '../utils/constants.js';
import { addDays, calculateDaysOverdue } from '../utils/dateUtils.js';
import { calculateOverdueFineAmount, ensureFineForBorrow, recomputeUserFineBalance } from './fineService.js';
import { sendTemplateEmail } from './notificationService.js';
import { expireReadyReservations, promoteNextReservation } from './reservationService.js';
import { getSettings } from './settingService.js';

const OPEN_BORROW_STATUSES = [
  BORROW_STATUSES.ACTIVE,
  BORROW_STATUSES.OVERDUE,
  BORROW_STATUSES.LOST
];

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
  await expireReadyReservations({ bookId });
  await promoteNextReservation(bookId, { skipExpiry: true });

  const book = await Book.findById(bookId);
  const targetUser = await User.findById(userId);

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

  const duplicateBorrow = await Borrow.findOne({
    user: userId,
    book: bookId,
    status: { $in: OPEN_BORROW_STATUSES }
  });

  if (duplicateBorrow) {
    throw new AppError('This user already has an active loan for this book', 409);
  }

  const activeReservation = await Reservation.findOne({
    user: userId,
    book: bookId,
    status: RESERVATION_STATUSES.READY
  });

  const activeBorrowCount = await Borrow.countDocuments({
    user: userId,
    status: { $in: OPEN_BORROW_STATUSES }
  });

  if (activeBorrowCount >= settings.maxActiveBorrows) {
    throw new AppError('Borrow limit reached for this user', 400);
  }

  const queuedReservation = await Reservation.findOne({
    book: bookId,
    status: RESERVATION_STATUSES.QUEUED
  });

  if (!activeReservation && queuedReservation) {
    throw new AppError('This title has pending reservations and cannot be issued outside the queue', 400);
  }

  let decrementedAvailableCopy = false;
  let createdBorrow;

  try {
    if (!activeReservation) {
      const updatedBook = await Book.findOneAndUpdate(
        { _id: bookId, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } },
        { new: true }
      );

      if (!updatedBook) {
        throw new AppError('No copies are currently available', 400);
      }

      decrementedAvailableCopy = true;
    }

    try {
      createdBorrow = await Borrow.create({
        user: userId,
        book: bookId,
        issuedBy: actor._id,
        borrowedAt: new Date(),
        dueAt: addDays(new Date(), settings.loanDays),
        status: BORROW_STATUSES.ACTIVE
      });
    } catch (error) {
      if (error?.code === 11000) {
        throw new AppError('This user already has an active loan for this book', 409);
      }

      throw error;
    }

    if (activeReservation) {
      activeReservation.status = RESERVATION_STATUSES.FULFILLED;
      activeReservation.fulfilledAt = new Date();
      await activeReservation.save();

      const reservationBook = await Book.findById(bookId);
      if (reservationBook?.reservedCopies > 0) {
        reservationBook.reservedCopies -= 1;
        await reservationBook.save();
      }
    }
  } catch (error) {
    if (decrementedAvailableCopy && !createdBorrow) {
      await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
    }

    throw error;
  }

  const borrow = await Borrow.findById(createdBorrow._id).populate('user').populate('book');

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

  updateBorrowStatus(borrow);

  if (borrow.status === BORROW_STATUSES.OVERDUE || calculateDaysOverdue(borrow.dueAt) > 0) {
    await borrow.save();
    throw new AppError('Overdue loans cannot be renewed. Please return the book first.', 400);
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
  const existingBorrow = await Borrow.findById(borrowId).populate('user').populate('book');

  if (!existingBorrow) {
    throw new AppError('Borrow record not found', 404);
  }

  if (existingBorrow.status === BORROW_STATUSES.RETURNED) {
    throw new AppError('This book has already been returned', 400);
  }

  const returnedAt = new Date();
  const { amount } = calculateOverdueFineAmount(existingBorrow.dueAt, returnedAt, settings.finePerDay);
  const borrow = await Borrow.findOneAndUpdate(
    { _id: borrowId, status: { $ne: BORROW_STATUSES.RETURNED } },
    {
      $set: {
        returnedAt,
        returnedTo: actor._id,
        status: BORROW_STATUSES.RETURNED,
        fineAccrued: amount
      }
    },
    { new: true }
  ).populate('user').populate('book');

  if (!borrow) {
    throw new AppError('This book has already been returned', 400);
  }

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

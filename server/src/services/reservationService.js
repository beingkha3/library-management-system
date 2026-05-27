import { Book } from '../models/Book.js';
import { Borrow } from '../models/Borrow.js';
import { Reservation } from '../models/Reservation.js';
import { AppError } from '../utils/appError.js';
import { BORROW_STATUSES, RESERVATION_STATUSES } from '../utils/constants.js';
import { addDays } from '../utils/dateUtils.js';
import { sendTemplateEmail } from './notificationService.js';
import { getSettings } from './settingService.js';

const resequenceQueue = async (bookId) => {
  const queuedReservations = await Reservation.find({
    book: bookId,
    status: RESERVATION_STATUSES.QUEUED
  }).sort({ reservedAt: 1 });

  await Promise.all(
    queuedReservations.map((reservation, index) =>
      Reservation.findByIdAndUpdate(reservation._id, { queuePosition: index + 1 })
    )
  );
};

export const createReservation = async ({ user, bookId }) => {
  await expireReadyReservations({ bookId });
  await promoteNextReservation(bookId, { skipExpiry: true });

  const book = await Book.findById(bookId);

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  const activeReservation = await Reservation.findOne({
    user: user._id,
    book: bookId,
    status: { $in: [RESERVATION_STATUSES.QUEUED, RESERVATION_STATUSES.READY] }
  });

  if (activeReservation) {
    throw new AppError('You already have an active reservation for this book', 409);
  }

  const activeBorrow = await Borrow.findOne({
    user: user._id,
    book: bookId,
    status: { $in: [BORROW_STATUSES.ACTIVE, BORROW_STATUSES.OVERDUE, BORROW_STATUSES.LOST] }
  });

  if (activeBorrow) {
    throw new AppError('You already have this book on loan', 409);
  }

  if (book.availableCopies > 0) {
    throw new AppError('This book is currently available to borrow and does not need a reservation', 400);
  }

  const queueCount = await Reservation.countDocuments({
    book: bookId,
    status: RESERVATION_STATUSES.QUEUED
  });

  const reservation = await Reservation.create({
    user: user._id,
    book: bookId,
    queuePosition: queueCount + 1
  });

  book.reservedCopies += 1;
  await book.save();

  return reservation.populate('book');
};

export const listReservationsForUser = async (userId) =>
  Reservation.find({ user: userId }).populate('book').sort({ createdAt: -1 });

export const listAllReservations = async () =>
  Reservation.find().populate('user', 'name email').populate('book').sort({ createdAt: -1 });

export const cancelReservation = async ({ reservationId, actor }) => {
  await expireReadyReservations();

  const reservation = await Reservation.findById(reservationId).populate('book');

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  if (actor.role === 'member' && reservation.user.toString() !== actor._id.toString()) {
    throw new AppError('You can only cancel your own reservations', 403);
  }

  if ([RESERVATION_STATUSES.CANCELLED, RESERVATION_STATUSES.FULFILLED, RESERVATION_STATUSES.EXPIRED].includes(reservation.status)) {
    throw new AppError('This reservation can no longer be cancelled', 400);
  }

  const wasReady = reservation.status === RESERVATION_STATUSES.READY;

  reservation.status = RESERVATION_STATUSES.CANCELLED;
  reservation.cancelledAt = new Date();
  await reservation.save();

  const book = await Book.findById(reservation.book._id);
  if (book) {
    if (book.reservedCopies > 0) {
      book.reservedCopies -= 1;
    }

    if (wasReady) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
    }

    await book.save();
  }

  await resequenceQueue(reservation.book._id);

  if (wasReady) {
    await promoteNextReservation(reservation.book._id);
  }

  return reservation;
};

export const expireReadyReservations = async ({ bookId, promote = true, now = new Date() } = {}) => {
  const filter = {
    status: RESERVATION_STATUSES.READY,
    pickupExpiresAt: { $lt: now }
  };

  if (bookId) {
    filter.book = bookId;
  }

  const expiredReservations = await Reservation.find(filter);
  const processedReservations = [];

  for (const reservation of expiredReservations) {
    const expiredReservation = await Reservation.findOneAndUpdate(
      { _id: reservation._id, status: RESERVATION_STATUSES.READY },
      { $set: { status: RESERVATION_STATUSES.EXPIRED } },
      { new: true }
    );

    if (!expiredReservation) {
      continue;
    }

    processedReservations.push(expiredReservation);

    const book = await Book.findById(expiredReservation.book);
    if (book) {
      if (book.reservedCopies > 0) {
        book.reservedCopies -= 1;
      }

      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      await book.save();

      if (promote) {
        await promoteNextReservation(book._id, { skipExpiry: true });
      }
    }
  }

  return processedReservations;
};

export const promoteNextReservation = async (bookId, { skipExpiry = false } = {}) => {
  if (!skipExpiry) {
    await expireReadyReservations({ bookId, promote: false });
  }

  const settings = await getSettings();
  const promotedReservations = [];

  while (true) {
    const book = await Book.findById(bookId);

    if (!book || book.availableCopies <= 0) {
      break;
    }

    const reservation = await Reservation.findOne({
      book: bookId,
      status: RESERVATION_STATUSES.QUEUED
    })
      .sort({ queuePosition: 1, createdAt: 1 })
      .populate('user')
      .populate('book');

    if (!reservation) {
      break;
    }

    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!updatedBook) {
      break;
    }

    const claimedReservation = await Reservation.findOneAndUpdate(
      { _id: reservation._id, status: RESERVATION_STATUSES.QUEUED },
      {
        $set: {
          status: RESERVATION_STATUSES.READY,
          notifiedAt: new Date(),
          pickupExpiresAt: addDays(new Date(), settings.reservationHoldDays)
        }
      },
      { new: true }
    )
      .populate('user')
      .populate('book');

    if (!claimedReservation) {
      await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
      continue;
    }

    await sendTemplateEmail({
      user: claimedReservation.user,
      subject: `Your reserved book is ready: ${claimedReservation.book.title}`,
      preheader: 'A reserved title is ready for pickup.',
      bodyLines: [
        `Hi ${claimedReservation.user.name},`,
        `Your reserved title "${claimedReservation.book.title}" is now ready for pickup.`,
        `Please collect it before ${claimedReservation.pickupExpiresAt.toDateString()}.`
      ],
      templateKey: 'reservation-ready',
      type: 'reservation_ready'
    });

    promotedReservations.push(claimedReservation);
    await resequenceQueue(bookId);
  }

  return promotedReservations[0] || null;
};

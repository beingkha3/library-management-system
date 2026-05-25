import { Book } from '../models/Book.js';
import { Reservation } from '../models/Reservation.js';
import { AppError } from '../utils/appError.js';
import { RESERVATION_STATUSES } from '../utils/constants.js';
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
  const reservation = await Reservation.findById(reservationId).populate('book');

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  if (actor.role === 'member' && reservation.user.toString() !== actor._id.toString()) {
    throw new AppError('You can only cancel your own reservations', 403);
  }

  if ([RESERVATION_STATUSES.CANCELLED, RESERVATION_STATUSES.FULFILLED].includes(reservation.status)) {
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

export const promoteNextReservation = async (bookId) => {
  const settings = await getSettings();
  const book = await Book.findById(bookId);

  if (!book || book.availableCopies <= 0) {
    return null;
  }

  const reservation = await Reservation.findOne({
    book: bookId,
    status: RESERVATION_STATUSES.QUEUED
  })
    .sort({ queuePosition: 1, createdAt: 1 })
    .populate('user')
    .populate('book');

  if (!reservation) {
    return null;
  }

  book.availableCopies -= 1;
  await book.save();

  reservation.status = RESERVATION_STATUSES.READY;
  reservation.notifiedAt = new Date();
  reservation.pickupExpiresAt = addDays(new Date(), settings.reservationHoldDays);
  await reservation.save();

  await sendTemplateEmail({
    user: reservation.user,
    subject: `Your reserved book is ready: ${reservation.book.title}`,
    preheader: 'A reserved title is ready for pickup.',
    bodyLines: [
      `Hi ${reservation.user.name},`,
      `Your reserved title "${reservation.book.title}" is now ready for pickup.`,
      `Please collect it before ${reservation.pickupExpiresAt.toDateString()}.`
    ],
    templateKey: 'reservation-ready',
    type: 'reservation_ready'
  });

  await resequenceQueue(bookId);
  return reservation;
};

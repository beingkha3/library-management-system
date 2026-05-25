import { asyncHandler } from '../utils/asyncHandler.js';
import {
  cancelReservation,
  createReservation,
  listAllReservations,
  listReservationsForUser
} from '../services/reservationService.js';

export const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await listReservationsForUser(req.user._id);
  res.json({ success: true, data: reservations });
});

export const getReservations = asyncHandler(async (_req, res) => {
  const reservations = await listAllReservations();
  res.json({ success: true, data: reservations });
});

export const postReservation = asyncHandler(async (req, res) => {
  const reservation = await createReservation({ user: req.user, bookId: req.body.bookId });
  res.status(201).json({ success: true, message: 'Reservation created successfully', data: reservation });
});

export const postCancelReservation = asyncHandler(async (req, res) => {
  const reservation = await cancelReservation({ reservationId: req.params.id, actor: req.user });
  res.json({ success: true, message: 'Reservation cancelled successfully', data: reservation });
});

import { api } from './http';

const unwrap = (promise) => promise.then((response) => response.data.data);

export const authApi = {
  register: (payload) => unwrap(api.post('/auth/register', payload)),
  login: (payload) => unwrap(api.post('/auth/login', payload)),
  me: () => unwrap(api.get('/auth/me'))
};

export const bookApi = {
  list: (params) => unwrap(api.get('/books', { params })),
  get: (bookId) => unwrap(api.get(`/books/${bookId}`)),
  create: (payload) => unwrap(api.post('/books', payload)),
  update: (bookId, payload) => unwrap(api.patch(`/books/${bookId}`, payload)),
  archive: (bookId) => unwrap(api.delete(`/books/${bookId}`)),
  review: (bookId, payload) => unwrap(api.post(`/books/${bookId}/reviews`, payload))
};

export const borrowApi = {
  list: (params) => unwrap(api.get('/borrows', { params })),
  issue: (payload) => unwrap(api.post('/borrows', payload)),
  renew: (borrowId) => unwrap(api.patch(`/borrows/${borrowId}/renew`)),
  returnBook: (borrowId) => unwrap(api.patch(`/borrows/${borrowId}/return`))
};

export const reservationApi = {
  mine: () => unwrap(api.get('/reservations/me')),
  list: () => unwrap(api.get('/reservations')),
  create: (payload) => unwrap(api.post('/reservations', payload)),
  cancel: (reservationId) => unwrap(api.patch(`/reservations/${reservationId}/cancel`))
};

export const fineApi = {
  mine: () => unwrap(api.get('/fines/me')),
  list: () => unwrap(api.get('/fines')),
  waive: (fineId, payload) => unwrap(api.post(`/fines/${fineId}/waive`, payload))
};

export const paymentApi = {
  mine: () => unwrap(api.get('/payments/me')),
  createOrder: (payload) => unwrap(api.post('/payments/razorpay/order', payload)),
  verifyOrder: (payload) => unwrap(api.post('/payments/razorpay/verify', payload))
};

export const dashboardApi = {
  member: () => unwrap(api.get('/dashboard/member')),
  staff: () => unwrap(api.get('/dashboard/staff')),
  admin: () => unwrap(api.get('/dashboard/admin')),
  reports: () => unwrap(api.get('/dashboard/reports')),
  settings: () => unwrap(api.get('/dashboard/settings')),
  updateSettings: (payload) => unwrap(api.patch('/dashboard/settings', payload))
};

export const userApi = {
  list: () => unwrap(api.get('/users')),
  update: (userId, payload) => unwrap(api.patch(`/users/${userId}`, payload))
};

export const notificationApi = {
  logs: () => unwrap(api.get('/notifications/logs')),
  sendTestEmail: (payload) => unwrap(api.post('/notifications/test-email', payload))
};

export const ROLES = {
  MEMBER: 'member',
  LIBRARIAN: 'librarian',
  ADMIN: 'admin'
};

export const USER_STATUSES = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended'
};

export const BORROW_STATUSES = {
  ACTIVE: 'active',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
  LOST: 'lost'
};

export const RESERVATION_STATUSES = {
  QUEUED: 'queued',
  READY: 'ready',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

export const FINE_STATUSES = {
  PENDING: 'pending',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  WAIVED: 'waived'
};

export const PAYMENT_STATUSES = {
  CREATED: 'created',
  CAPTURED: 'captured',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

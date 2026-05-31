import { z } from 'zod';

import {
  BORROW_STATUSES,
  FINE_STATUSES,
  RESERVATION_STATUSES,
  ROLES,
  USER_STATUSES
} from '../utils/constants.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const nonEmptyString = (max = 255) => z.string().trim().min(1).max(max);
const optionalString = (max = 1000) => z.string().trim().max(max).optional();
const emptyToUndefined = (value) => (value === '' ? undefined : value);
const positiveInt = z.preprocess(emptyToUndefined, z.coerce.number().int().min(1));
const nonNegativeInt = z.preprocess(emptyToUndefined, z.coerce.number().int().min(0));
const nonNegativeNumber = z.preprocess(emptyToUndefined, z.coerce.number().min(0));
const optionalPositiveInt = z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).optional());
const optionalNonNegativeInt = z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional());
const optionalNonNegativeNumber = z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional());

const atLeastOneField = (value) => Object.keys(value).length > 0;

export const commonSchemas = {
  idParam: {
    params: z.object({ id: objectId }).strict()
  }
};

export const authSchemas = {
  register: {
    body: z
      .object({
        name: nonEmptyString(120),
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(128),
        phone: optionalString(30),
        address: optionalString(500)
      })
      .strict()
  },
  login: {
    body: z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(1).max(128)
      })
      .strict()
  },
  forgotPassword: {
    body: z
      .object({
        email: z.string().trim().email().max(255)
      })
      .strict()
  },
  resetPassword: {
    params: z.object({ token: z.string().regex(/^[a-f\d]{64}$/i, 'Invalid reset token') }).strict(),
    body: z
      .object({
        password: z.string().min(8).max(128)
      })
      .strict()
  },
  changePassword: {
    body: z
      .object({
        currentPassword: z.string().min(1).max(128),
        newPassword: z.string().min(8).max(128)
      })
      .strict()
      .refine((value) => value.newPassword !== value.currentPassword, {
        message: 'New password must be different from the current password',
        path: ['newPassword']
      })
  }
};

const bookPayload = {
  title: nonEmptyString(255),
  authors: z.array(nonEmptyString(120)).min(1),
  isbn: nonEmptyString(40),
  category: nonEmptyString(120),
  description: optionalString(5000),
  publisher: optionalString(255),
  language: optionalString(80),
  edition: optionalString(80),
  publishedYear: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).max(new Date().getFullYear() + 1).nullable().optional()
  ),
  pageCount: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).nullable().optional()),
  coverImageUrl: optionalString(1000),
  shelfLocation: optionalString(120),
  totalCopies: positiveInt,
  availableCopies: optionalNonNegativeInt,
  featured: z.boolean().optional()
};

export const bookSchemas = {
  list: {
    query: z
      .object({
        search: optionalString(255),
        category: optionalString(120),
        featured: z.enum(['true', 'false']).optional(),
        availability: z.enum(['available', 'unavailable']).optional(),
        author: optionalString(120),
        language: optionalString(80),
        publishedYear: optionalString(10),
        minRating: optionalString(10),
        sort: z.enum(['featured', 'title-asc', 'year-desc', 'rating-desc', 'available-desc']).optional(),
        page: optionalString(10),
        limit: optionalString(10),
        paginate: z.enum(['true', 'false']).optional()
      })
      .passthrough()
  },
  create: {
    body: z.object(bookPayload).strict()
  },
  update: {
    params: commonSchemas.idParam.params,
    body: z
      .object({
        ...bookPayload,
        authors: bookPayload.authors.optional(),
        title: bookPayload.title.optional(),
        isbn: bookPayload.isbn.optional(),
        category: bookPayload.category.optional(),
        totalCopies: optionalPositiveInt
      })
      .strict()
      .refine(atLeastOneField, 'At least one field is required')
  },
  review: {
    params: commonSchemas.idParam.params,
    body: z
      .object({
        rating: z.coerce.number().int().min(1).max(5),
        comment: optionalString(2000)
      })
      .strict()
  }
};

export const userSchemas = {
  update: {
    params: commonSchemas.idParam.params,
    body: z
      .object({
        name: nonEmptyString(120).optional(),
        phone: optionalString(30),
        address: optionalString(500),
        status: z.enum(Object.values(USER_STATUSES)).optional(),
        role: z.enum(Object.values(ROLES)).optional()
      })
      .strict()
      .refine(atLeastOneField, 'At least one field is required')
  }
};

export const borrowSchemas = {
  list: {
    query: z
      .object({
        userId: objectId.optional(),
        status: z.enum(Object.values(BORROW_STATUSES)).optional()
      })
      .passthrough()
  },
  issue: {
    body: z
      .object({
        userId: objectId.optional(),
        bookId: objectId
      })
      .strict()
  },
  idParam: commonSchemas.idParam
};

export const reservationSchemas = {
  create: {
    body: z.object({ bookId: objectId }).strict()
  },
  idParam: commonSchemas.idParam
};

export const fineSchemas = {
  list: {
    query: z
      .object({
        status: z.enum(Object.values(FINE_STATUSES)).optional()
      })
      .passthrough()
  },
  waive: {
    params: commonSchemas.idParam.params,
    body: z
      .object({
        waiveReason: optionalString(500)
      })
      .strict()
  }
};

export const paymentSchemas = {
  createOrder: {
    body: z.object({ fineId: objectId }).strict()
  },
  verifyOrder: {
    body: z
      .object({
        fineId: objectId,
        razorpayOrderId: nonEmptyString(120),
        razorpayPaymentId: nonEmptyString(120),
        razorpaySignature: nonEmptyString(256)
      })
      .strict()
  },
  webhook: {
    headers: z
      .object({
        'x-razorpay-signature': nonEmptyString(256)
      })
      .passthrough()
  }
};

export const dashboardSchemas = {
  settings: {
    body: z
      .object({
        loanDays: optionalPositiveInt,
        finePerDay: optionalNonNegativeNumber,
        maxActiveBorrows: optionalPositiveInt,
        maxRenewals: optionalNonNegativeInt,
        reservationHoldDays: optionalPositiveInt,
        fineThreshold: optionalNonNegativeNumber,
        allowSelfIssue: z.boolean().optional()
      })
      .strict()
      .refine(atLeastOneField, 'At least one setting is required')
  }
};

export const notificationSchemas = {
  testEmail: {
    body: z
      .object({
        to: z.string().trim().email().max(255).optional()
      })
      .strict()
  }
};

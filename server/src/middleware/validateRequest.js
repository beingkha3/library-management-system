import { AppError } from '../utils/appError.js';

const stripUndefined = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefined(item)])
    );
  }

  return value;
};

export const validateRequest = (schemas) => (req, _res, next) => {
  const details = [];
  const parsed = {};

  for (const [segment, schema] of Object.entries(schemas)) {
    const input = segment === 'body' && req[segment] === undefined ? {} : req[segment];
    const result = schema.safeParse(input);

    if (!result.success) {
      details.push(
        ...result.error.issues.map((issue) => ({
          field: [segment, ...issue.path].join('.'),
          message: issue.message
        }))
      );
      continue;
    }

    parsed[segment] = stripUndefined(result.data);
  }

  if (details.length > 0) {
    return next(new AppError('Invalid request data', 400, details));
  }

  for (const [segment, value] of Object.entries(parsed)) {
    req[segment] = value;
  }

  next();
};

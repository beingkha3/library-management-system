import mongoose from 'mongoose';

export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(', ');
  }

  if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${error.path || 'identifier'}`;
  }

  if (error?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    message = `${field} already exists`;
  }

  if (error?.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON payload';
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: error.details || null,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

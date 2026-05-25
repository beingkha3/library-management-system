import mongoose from 'mongoose';

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  if (error instanceof mongoose.Error.ValidationError) {
    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(', ');
  }

  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    message = `${field} already exists`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: error.details || null,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

import { User } from '../models/User.js';
import { USER_STATUSES } from '../utils/constants.js';
import { AppError } from '../utils/appError.js';
import { verifyToken } from '../utils/token.js';

export const protect = async (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return next(new AppError('User account not found', 401));
    }

    if (user.status !== USER_STATUSES.ACTIVE) {
      return next(new AppError('Account is suspended', 403));
    }

    req.user = user;
    next();
  } catch (_error) {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const requireRoles = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }

  next();
};

import { Fine } from '../models/Fine.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { FINE_STATUSES } from '../utils/constants.js';
import { calculateDaysOverdue } from '../utils/dateUtils.js';

export const calculateOverdueFineAmount = (dueAt, returnedAt, finePerDay) => {
  const daysOverdue = calculateDaysOverdue(dueAt, returnedAt);
  return {
    daysOverdue,
    amount: daysOverdue * finePerDay
  };
};

export const recomputeUserFineBalance = async (userId) => {
  const fines = await Fine.find({ user: userId });
  const outstanding = fines.reduce((sum, fine) => {
    if (fine.status === FINE_STATUSES.WAIVED || fine.status === FINE_STATUSES.PAID) {
      return sum;
    }

    return sum + Math.max(fine.amount - fine.paidAmount, 0);
  }, 0);

  await User.findByIdAndUpdate(userId, { fineBalance: outstanding });
  return outstanding;
};

export const ensureFineForBorrow = async ({ userId, borrowId, amount, reason = 'overdue' }) => {
  let fine = await Fine.findOne({ user: userId, borrow: borrowId, reason });

  if (amount <= 0 && !fine) {
    await recomputeUserFineBalance(userId);
    return null;
  }

  if (!fine) {
    fine = await Fine.create({
      user: userId,
      borrow: borrowId,
      amount,
      reason,
      status: amount > 0 ? FINE_STATUSES.PENDING : FINE_STATUSES.PAID
    });
  } else {
    fine.amount = amount;

    if (fine.paidAmount >= fine.amount && fine.amount > 0) {
      fine.status = FINE_STATUSES.PAID;
    } else if (fine.amount === 0) {
      fine.status = FINE_STATUSES.PAID;
    } else if (fine.paidAmount > 0) {
      fine.status = FINE_STATUSES.PARTIALLY_PAID;
    } else {
      fine.status = FINE_STATUSES.PENDING;
    }

    await fine.save();
  }

  await recomputeUserFineBalance(userId);
  return fine;
};

export const listFinesForUser = async (userId) => {
  return Fine.find({ user: userId }).populate('borrow').sort({ createdAt: -1 });
};

export const listAllFines = async () => Fine.find().populate('user', 'name email role').populate('borrow').sort({ createdAt: -1 });

export const waiveFine = async (fineId, actor, waiveReason) => {
  const fine = await Fine.findById(fineId);

  if (!fine) {
    throw new AppError('Fine not found', 404);
  }

  fine.status = FINE_STATUSES.WAIVED;
  fine.waivedBy = actor._id;
  fine.waiveReason = waiveReason || 'Waived by library staff';
  await fine.save();
  await recomputeUserFineBalance(fine.user);
  return fine;
};

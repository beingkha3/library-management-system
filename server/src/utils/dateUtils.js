const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const addDays = (date, days) => new Date(date.getTime() + days * DAY_IN_MS);

export const calculateDaysOverdue = (dueAt, returnedAt = new Date()) => {
  const overdueMs = new Date(returnedAt).getTime() - new Date(dueAt).getTime();

  if (overdueMs <= 0) {
    return 0;
  }

  return Math.ceil(overdueMs / DAY_IN_MS);
};

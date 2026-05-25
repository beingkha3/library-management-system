export const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);

export const date = (value) => {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const relativeLoanState = (dueAt) => {
  if (!dueAt) {
    return 'Unknown';
  }

  const diff = new Date(dueAt).getTime() - Date.now();
  const day = 1000 * 60 * 60 * 24;
  const days = Math.ceil(diff / day);

  if (days < 0) {
    return `${Math.abs(days)} day(s) overdue`;
  }

  if (days === 0) {
    return 'Due today';
  }

  return `Due in ${days} day(s)`;
};

export const roleLabel = (role) => (role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User');

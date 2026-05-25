const toneMap = {
  active: 'bg-blue-50 text-blue-700',
  overdue: 'bg-red-50 text-red-700',
  returned: 'bg-emerald-50 text-emerald-700',
  queued: 'bg-amber-50 text-amber-700',
  ready: 'bg-emerald-50 text-emerald-700',
  fulfilled: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-50 text-amber-700',
  partially_paid: 'bg-blue-50 text-blue-700',
  paid: 'bg-emerald-50 text-emerald-700',
  waived: 'bg-slate-100 text-slate-700',
  suspended: 'bg-red-50 text-red-700',
  member: 'bg-blue-50 text-blue-700',
  librarian: 'bg-indigo-50 text-indigo-700',
  admin: 'bg-purple-50 text-purple-700',
  sent: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
  skipped: 'bg-slate-100 text-slate-700'
};

export const StatusPill = ({ value }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${toneMap[value] || 'bg-slate-100 text-slate-700'}`}>
    {String(value || 'unknown').replace('_', ' ')}
  </span>
);

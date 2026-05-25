import emblem from '../assets/brand-emblem.svg';

export const LogoLockup = ({ compact = false }) => (
  <div className="flex items-center gap-3">
    <img src={emblem} alt="Library Management" className="h-10 w-10 rounded-2xl" />
    {!compact ? (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Library Management</p>
        <h1 className="text-base font-semibold text-white">Library Management System</h1>
      </div>
    ) : null}
  </div>
);

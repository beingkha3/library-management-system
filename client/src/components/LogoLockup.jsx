import emblem from '../assets/brand-emblem.svg';

export const LogoLockup = ({ compact = false, publicMode = false }) => (
  <div className="flex items-center gap-3">
    <img src={emblem} alt="Library Management" className="h-9 w-9 rounded-xl" />
    {!compact ? (
      <div>
        <p className={`text-[10px] font-semibold uppercase tracking-[0.28em] ${publicMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Library Management
        </p>
        <span className={`block text-sm font-semibold ${publicMode ? 'text-slate-900' : 'text-white'}`}>
          Library Management System
        </span>
      </div>
    ) : null}
  </div>
);

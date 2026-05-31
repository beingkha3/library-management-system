import { Bell, LogOut, Menu, Plus } from 'lucide-react';

export const Topbar = ({ onMenuClick, onLogout, user, quickActions = [] }) => (
  <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="flex items-center gap-3 px-5 py-3 sm:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={17} />
      </button>

      {quickActions.length ? (
        <div className="hidden items-center gap-2 xl:flex">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-academy-200 hover:text-academy-700"
            >
              <Plus size={14} />
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-academy-700 md:inline-flex"
        >
          <Bell size={16} />
        </button>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Sign out"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  </header>
);

import { Bell, LogOut, Menu, Plus, Search } from 'lucide-react';

export const Topbar = ({ title, subtitle, onMenuClick, onLogout, user, quickActions = [] }) => (
  <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="hidden min-w-[200px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400 md:flex lg:min-w-[260px]">
        <Search size={15} />
        <span className="text-sm">Quick search…</span>
      </div>
      {quickActions.length ? (
        <div className="hidden items-center gap-2 xl:flex">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-academy-200 hover:text-academy-700"
            >
              <Plus size={15} />
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        aria-label="Notifications"
        className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-academy-700 md:inline-flex"
      >
        <Bell size={17} />
      </button>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
        <p className="text-xs text-slate-400">{user?.email}</p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        aria-label="Sign out"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        <LogOut size={17} />
      </button>
    </div>
  </header>
);

import { Bell, LogOut, Menu, Plus, Search } from 'lucide-react';

export const Topbar = ({ title, subtitle, onMenuClick, onLogout, user, quickActions = [] }) => (
  <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 lg:hidden"
      >
        <Menu size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500">Library account</p>
        <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="hidden min-w-[240px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 md:flex">
        <Search size={16} />
        <span className="text-sm">Search books, reservations, and fines</span>
      </div>
      {quickActions.length ? (
        <div className="hidden items-center gap-2 xl:flex">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-academy-200 hover:text-academy-700"
            >
              <Plus size={16} />
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:border-academy-200 hover:text-academy-700 md:inline-flex"
      >
        <Bell size={18} />
      </button>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
        <p className="text-xs text-slate-500">{user?.email}</p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        <LogOut size={18} />
      </button>
    </div>
  </header>
);

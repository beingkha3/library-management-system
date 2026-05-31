import { NavLink } from 'react-router-dom';

import { roleLabel } from '../utils/formatters';
import { LogoLockup } from './LogoLockup';

const navLinkBase =
  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors';

export const SidebarNav = ({ items, user, onNavigate }) => (
  <aside className="flex h-full flex-col border-r border-slate-800 bg-academy-900 px-4 py-5 text-slate-200">
    <LogoLockup />
    <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-academy-700 text-sm font-semibold text-white">
        {user?.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
        <p className="text-xs text-slate-400">{roleLabel(user?.role)}</p>
      </div>
    </div>
    <nav className="mt-6 flex-1 space-y-5 overflow-y-auto pr-1 scrollbar-thin">
      {items.map((group) => (
        <div key={group.section}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">{group.section}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to.split('/').length <= 2}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `${navLinkBase} ${
                      isActive
                        ? 'bg-academy-600/80 text-white'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                    }`
                  }
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  </aside>
);

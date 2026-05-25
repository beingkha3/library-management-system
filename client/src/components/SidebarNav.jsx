import { NavLink } from 'react-router-dom';

import { roleLabel } from '../utils/formatters';
import { LogoLockup } from './LogoLockup';

const navClasses =
  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors';

export const SidebarNav = ({ items, user, onNavigate }) => (
  <aside className="flex h-full flex-col border-r border-slate-800 bg-academy-900 px-4 py-5 text-slate-200">
    <LogoLockup />
    <div className="mt-6 rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
      <div>
        <p className="text-sm text-slate-400">Signed in as</p>
        <p className="mt-2 text-base font-semibold text-white">{user?.name}</p>
        <p className="text-sm text-slate-400">{roleLabel(user?.role)}</p>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-3 text-sm text-slate-400">
        Use the menu to view your books, reservations, fines, and account details.
      </div>
    </div>
    <nav className="mt-8 flex-1 space-y-6 overflow-y-auto pr-1 scrollbar-thin">
      {items.map((group) => (
        <div key={group.section}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">{group.section}</p>
          <div className="space-y-1.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `${navClasses} ${
                      isActive
                        ? 'bg-academy-500 text-white shadow-lg shadow-blue-950/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} />
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

import { useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { adminNav, memberNav, staffNav } from '../utils/navigation';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SidebarNav } from '../components/SidebarNav';
import { Topbar } from '../components/Topbar';

const titleMap = {
  '/app': ['My library account', 'Track your books, due dates, reservations, and fines.'],
  '/app/catalog': ['Library Catalog', 'Discover titles, availability, and reviews.'],
  '/app/my-loans': ['My Loans', 'Monitor due dates and renew eligible borrows.'],
  '/app/my-reservations': ['Reservations', 'Review queue positions and pickup windows.'],
  '/app/my-fines': ['Fines & Payments', 'Manage dues and complete Razorpay fine payments.'],
  '/app/profile': ['My profile', 'View your membership details and contact information.'],
  '/app/notifications': ['Notifications', 'View reminders and messages from the library.'],
  '/staff': ['Staff Dashboard', 'Daily circulation, inventory activity, and exceptions.'],
  '/staff/books': ['Book Operations', 'Create titles, update stock, and manage catalog quality.'],
  '/staff/members': ['Member Directory', 'Review users, privileges, and statuses.'],
  '/staff/loans': ['Loan Desk', 'Issue books, process returns, and renew checkouts.'],
  '/staff/reservations': ['Reservation Queue', 'Coordinate holds and ready-for-pickup titles.'],
  '/staff/fines': ['Fine Oversight', 'Track balances, waivers, and payment follow-ups.'],
  '/staff/reports': ['Circulation Reports', 'Read usage trends and inventory performance.'],
  '/admin': ['Admin Dashboard', 'System health, roles, and strategic metrics.'],
  '/admin/users': ['User Management', 'Adjust roles, account status, and staff access.'],
  '/admin/settings': ['System Settings', 'Tune policies for loans, fines, and reservations.'],
  '/admin/audit': ['Audit & Email', 'Monitor notifications and admin-side diagnostics.']
};

const quickActionsByRole = {
  member: [{ label: 'Browse catalog', onClickPath: '/app/catalog' }],
  librarian: [
    { label: 'Issue book', onClickPath: '/staff/loans' },
    { label: 'Manage books', onClickPath: '/staff/books' }
  ],
  admin: [
    { label: 'Manage users', onClickPath: '/admin/users' },
    { label: 'Review settings', onClickPath: '/admin/settings' }
  ]
};

const rootBreadcrumbs = {
  app: { label: 'Dashboard', to: '/app' },
  staff: { label: 'Staff Dashboard', to: '/staff' },
  admin: { label: 'Admin Dashboard', to: '/admin' }
};

const breadcrumbLabels = {
  catalog: 'Catalog',
  'my-loans': 'My Loans',
  'my-reservations': 'Reservations',
  'my-fines': 'Fines & Payments',
  profile: 'Profile',
  notifications: 'Notifications',
  books: 'Book Operations',
  members: 'Members',
  loans: 'Loans',
  reservations: 'Reservations',
  fines: 'Fines',
  reports: 'Reports',
  users: 'Users',
  settings: 'Settings',
  audit: 'Audit & Email'
};

const formatSegment = (segment, previousSegment) => {
  if (previousSegment === 'catalog') {
    return 'Book details';
  }

  if (breadcrumbLabels[segment]) {
    return breadcrumbLabels[segment];
  }

  return segment
    .split('-')
    .map((item) => `${item.charAt(0).toUpperCase()}${item.slice(1)}`)
    .join(' ');
};

const buildBreadcrumbItems = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const [rootSegment, ...childSegments] = segments;
  const root = rootBreadcrumbs[rootSegment] || rootBreadcrumbs.app;

  if (!childSegments.length) {
    return [{ label: root.label }];
  }

  const items = [{ ...root }];
  let currentPath = `/${rootSegment}`;

  childSegments.forEach((segment, index) => {
    const previousSegment = childSegments[index - 1] || rootSegment;
    const isCurrent = index === childSegments.length - 1;

    currentPath = `${currentPath}/${segment}`;
    items.push({
      label: formatSegment(segment, previousSegment),
      to: isCurrent ? undefined : currentPath
    });
  });

  return items;
};

export const DashboardLayout = ({ requiredRoles }) => {
  const { user, isAuthenticated, isBootstrapping, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = useMemo(() => {
    if (user?.role === 'admin') {
      return location.pathname.startsWith('/admin') ? adminNav : location.pathname.startsWith('/staff') ? staffNav : memberNav;
    }

    if (user?.role === 'librarian') {
      return location.pathname.startsWith('/staff') ? staffNav : memberNav;
    }

    return memberNav;
  }, [location.pathname, user?.role]);

  if (isBootstrapping) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  const [title, subtitle] = titleMap[location.pathname] || ['Library Management System', 'Use the menu to browse books, manage your account, and view library activity.'];
  const quickActions = (quickActionsByRole[user.role] || []).map((action) => ({
    label: action.label,
    onClick: () => navigate(action.onClickPath)
  }));
  const breadcrumbItems = buildBreadcrumbItems(location.pathname);

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[292px_1fr]">
      <div className="hidden lg:block">
        <SidebarNav items={navItems} user={user} />
      </div>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="h-full w-[280px]" onClick={(event) => event.stopPropagation()}>
            <SidebarNav items={navItems} user={user} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="min-w-0">
        <Topbar
          title={title}
          subtitle={subtitle}
          user={user}
          quickActions={quickActions}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={() => {
            logout();
            navigate('/login');
          }}
        />
        <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto w-full max-w-7xl">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </div>
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

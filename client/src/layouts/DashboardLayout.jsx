import { useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { adminNav, memberNav, staffNav } from '../utils/navigation';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SidebarNav } from '../components/SidebarNav';
import { Topbar } from '../components/Topbar';

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

  // Admin belongs to /admin; redirect away from /staff to avoid confusion
  if (user.role === 'admin' && location.pathname.startsWith('/staff')) {
    return <Navigate to="/admin" replace />;
  }

  const quickActions = (quickActionsByRole[user.role] || [])
    .filter((action) => action.onClickPath !== location.pathname)
    .map((action) => ({
      label: action.label,
      onClick: () => navigate(action.onClickPath)
    }));

  const breadcrumbItems = buildBreadcrumbItems(location.pathname);

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[272px_1fr]">
      <div className="hidden lg:block">
        <SidebarNav items={navItems} user={user} />
      </div>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="h-full w-[272px]" onClick={(event) => event.stopPropagation()}>
            <SidebarNav items={navItems} user={user} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="min-w-0">
        <Topbar
          user={user}
          quickActions={quickActions}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={() => {
            logout();
            navigate('/login');
          }}
        />
        <div className="border-b border-slate-200 bg-white px-5 py-3 sm:px-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <main className="flex flex-col gap-6 px-5 py-6 sm:px-8 sm:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

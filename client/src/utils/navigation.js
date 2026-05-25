import {
  BarChart3,
  Bell,
  BookCheck,
  BookCopy,
  BookOpen,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Library,
  ScanSearch,
  Settings,
  Shield,
  Users
} from 'lucide-react';

export const memberNav = [
  {
    section: 'Library',
    items: [
      { label: 'Dashboard', to: '/app', icon: LayoutDashboard },
      { label: 'Catalog', to: '/app/catalog', icon: Library },
      { label: 'My Loans', to: '/app/my-loans', icon: BookCopy },
      { label: 'Reservations', to: '/app/my-reservations', icon: ClipboardList }
    ]
  },
  {
    section: 'Account',
    items: [
      { label: 'Fines & Payments', to: '/app/my-fines', icon: CircleDollarSign },
      { label: 'Notifications', to: '/app/notifications', icon: Bell },
      { label: 'Profile', to: '/app/profile', icon: Users }
    ]
  }
];

export const staffNav = [
  {
    section: 'Operations',
    items: [
      { label: 'Dashboard', to: '/staff', icon: LayoutDashboard },
      { label: 'Loan Desk', to: '/staff/loans', icon: ScanSearch },
      { label: 'Reservations', to: '/staff/reservations', icon: ClipboardList },
      { label: 'Fines', to: '/staff/fines', icon: CircleDollarSign }
    ]
  },
  {
    section: 'Collection',
    items: [
      { label: 'Books', to: '/staff/books', icon: BookOpen },
      { label: 'Members', to: '/staff/members', icon: Users },
      { label: 'Reports', to: '/staff/reports', icon: BarChart3 }
    ]
  }
];

export const adminNav = [
  {
    section: 'Administration',
    items: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
      { label: 'Users', to: '/admin/users', icon: Users },
      { label: 'Settings', to: '/admin/settings', icon: Settings }
    ]
  },
  {
    section: 'Control',
    items: [{ label: 'Audit & Email', to: '/admin/audit', icon: Shield }]
  }
];

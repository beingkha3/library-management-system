import { Activity, FileBarChart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { dashboardApi } from '../api/services';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { StatCard } from '../components/StatCard';
import { StatusPill } from '../components/StatusPill';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';
import { currency, date } from '../utils/formatters';

const adminActions = [
  { label: 'Manage users', to: '/admin/users', icon: Users },
  { label: 'Library settings', to: '/admin/settings', icon: FileBarChart },
  { label: 'View reports', to: '/staff/reports', icon: Activity }
];

export const AdminDashboardPage = () => {
  const { data, loading, error } = useAsyncData(() => dashboardApi.admin(), []);

  if (loading) {
    return <LoadingState label="Loading admin dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Library activity and account summary"
        description="Review books, users, borrowing activity, fines, and recent account activity from one place."
        metadata={['Books', 'Users', 'Reports']}
        actions={adminActions.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-academy-200 hover:text-academy-700">
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total books" value={data.summary.books} tone="navy" />
        <StatCard label="Total users" value={data.summary.members + data.summary.librarians + data.summary.admins} tone="default" />
        <StatCard label="Members" value={data.summary.members} tone="default" />
        <StatCard label="Staff accounts" value={data.summary.librarians + data.summary.admins} tone="blue" />
        <StatCard label="Overdue fines paid" value={currency(data.summary.revenueCollected)} tone="green" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Borrowing activity" description="Recent borrowing records from the library.">
          <div className="space-y-3">
            {data.recentBorrows.map((item) => (
              <div key={item._id} className="flex flex-col gap-3 rounded-[22px] border border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{item.book?.title}</p>
                  <p className="text-sm text-slate-500">{item.user?.name} · {date(item.borrowedAt)}</p>
                </div>
                <StatusPill value={item.status} />
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Overdue fines" description="Recent fine records that may need attention.">
            <div className="space-y-3">
              {data.recentFines.map((fine) => (
                <div key={fine._id} className="rounded-[22px] border border-slate-200 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{fine.user?.name}</p>
                      <p className="text-sm text-slate-500">{currency(fine.amount)}</p>
                    </div>
                    <StatusPill value={fine.status} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Recent reservations" description="Books members are waiting to borrow.">
            <div className="space-y-3">
              {data.recentReservations.map((reservation) => (
                <div key={reservation._id} className="rounded-[22px] border border-slate-200 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{reservation.book?.title}</p>
                      <p className="text-sm text-slate-500">{reservation.user?.name}</p>
                    </div>
                    <StatusPill value={reservation.status} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

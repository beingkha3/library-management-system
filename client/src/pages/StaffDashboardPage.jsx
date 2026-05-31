import { AlertTriangle, BookOpen, CircleDollarSign, ClipboardList, ScanSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

import { dashboardApi } from '../api/services';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { StatCard } from '../components/StatCard';
import { StatusPill } from '../components/StatusPill';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';
import { currency, date } from '../utils/formatters';

const workQueues = [
  { label: 'Open loan desk', to: '/staff/loans', icon: ScanSearch },
  { label: 'Review holds', to: '/staff/reservations', icon: ClipboardList },
  { label: 'Manage catalog', to: '/staff/books', icon: BookOpen },
  { label: 'Check fines', to: '/staff/fines', icon: CircleDollarSign }
];

export const StaffDashboardPage = () => {
  const { data, loading, error } = useAsyncData(() => dashboardApi.staff(), [], { pollIntervalMs: 10000 });

  if (loading) {
    return <LoadingState label="Loading staff dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Circulation control"
        title="Daily library operations prioritized by exception and queue pressure"
        description="Lead with overdue follow-up, outstanding fines, and reservation readiness before moving into catalog and reporting work."
        metadata={['Queue-driven', 'Circulation-first', 'Staff workspace']}
        actions={workQueues.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-academy-200 hover:text-academy-700">
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Catalog books" value={data.summary.catalogBooks} tone="navy" hint="Active titles in circulation" />
        <StatCard label="Active loans" value={data.summary.activeLoans} tone="blue" hint="Books currently checked out" />
        <StatCard label="Overdue loans" value={data.summary.overdueLoans} tone="amber" hint="Requires staff follow-up" />
        <StatCard label="Pending reservations" value={data.summary.pendingReservations} tone="default" hint="Queued or ready holds" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Urgent work queues" description="Start here when operating the circulation desk.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={16} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Overdue</p>
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{data.overdueItems.length}</p>
              <p className="mt-2 text-sm text-red-700">Borrow records requiring direct member follow-up.</p>
            </div>
            <div className="rounded-[22px] border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Reservations</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{data.reservations.length}</p>
              <p className="mt-2 text-sm text-blue-700">Queued or ready-for-pickup reservation records.</p>
            </div>
            <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Outstanding fines</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{data.outstandingFines.length}</p>
              <p className="mt-2 text-sm text-amber-700">Accounts with pending or partially paid balances.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.overdueItems.length ? (
              data.overdueItems.map((item) => (
                <div key={item._id} className="rounded-[22px] border border-slate-200 px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{item.book?.title}</p>
                      <p className="text-sm text-slate-500">Member: {item.user?.name}</p>
                    </div>
                    <StatusPill value="overdue" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>Due on {date(item.dueAt)}</span>
                    <span>Borrower contact should be reviewed</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No overdue items right now.</p>
            )}
          </div>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Reservation readiness" description="Newest queued or ready holds visible to the desk.">
            <div className="space-y-3">
              {data.reservations.length ? (
                data.reservations.map((reservation) => (
                  <div key={reservation._id} className="rounded-[22px] border border-slate-200 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{reservation.book?.title}</p>
                        <p className="text-sm text-slate-500">{reservation.user?.name}</p>
                      </div>
                      <StatusPill value={reservation.status} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No active holds.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Outstanding fine watchlist" description="Recent unpaid or partially paid fine records.">
            <div className="space-y-3">
              {data.outstandingFines.length ? (
                data.outstandingFines.map((fine) => (
                  <div key={fine._id} className="rounded-[22px] border border-slate-200 px-4 py-4">
                    <p className="font-semibold text-slate-900">{fine.user?.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{currency(Math.max(fine.amount - fine.paidAmount, 0))}</p>
                    <div className="mt-3"><StatusPill value={fine.status} /></div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No outstanding fines currently.</p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

import { CreditCard, Library, RotateCcw, TimerReset } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { dashboardApi } from '../api/services';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { StatCard } from '../components/StatCard';
import { StatusPill } from '../components/StatusPill';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';
import { currency, date, relativeLoanState } from '../utils/formatters';

const quickActions = [
  { label: 'Browse catalog', to: '/app/catalog', icon: Library },
  { label: 'Renew loans', to: '/app/my-loans', icon: RotateCcw },
  { label: 'Pay fines', to: '/app/my-fines', icon: CreditCard },
  { label: 'Track holds', to: '/app/my-reservations', icon: TimerReset }
];

export const MemberDashboardPage = () => {
  const { data, loading, error } = useAsyncData(() => dashboardApi.member(), []);

  const summaryCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      { label: 'Active loans', value: data.summary.activeLoans, tone: 'navy', hint: 'Titles currently checked out' },
      { label: 'Due attention', value: data.summary.overdueLoans, tone: 'amber', hint: 'Overdue items needing action' },
      { label: 'Outstanding balance', value: currency(data.summary.totalFines), tone: 'blue', hint: 'Payable through Razorpay' },
      { label: 'Reservations', value: data.summary.activeReservations, tone: 'default', hint: 'Queued or ready for pickup' }
    ];
  }, [data]);

  if (loading) {
    return <LoadingState label="Loading your member dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const urgentBorrows = data.activeBorrows.filter((borrow) => borrow.status === 'overdue').slice(0, 3);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="My library account"
        title="Borrowed books, due dates, reservations, and fines"
        description="Keep track of your library activity and take action when books are due or fines need to be paid."
        actions={quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.to} to={action.to} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-academy-200 hover:text-academy-700">
              <Icon size={16} />
              {action.label}
            </Link>
          );
        })}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Due soon" description="Books that need attention soon and any current fine balance.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Due soon</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{data.dueSoon.length}</p>
              <p className="mt-2 text-sm text-slate-500">Books that are closest to the due date.</p>
            </div>
            <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Overdue books</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{urgentBorrows.length}</p>
              <p className="mt-2 text-sm text-amber-700">Books that are already overdue.</p>
            </div>
            <div className="rounded-[22px] border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">Outstanding fines</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{currency(data.summary.totalFines)}</p>
              <p className="mt-2 text-sm text-blue-700">Fine balance that can be paid online.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.dueSoon.length ? (
              data.dueSoon.map((borrow) => (
                <div key={borrow._id} className="rounded-[22px] border border-slate-200 px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{borrow.book?.title}</p>
                      <p className="text-sm text-slate-500">{borrow.book?.authors?.join(', ')}</p>
                    </div>
                    <StatusPill value={borrow.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>Borrowed: {date(borrow.borrowedAt)}</span>
                    <span>Due: {date(borrow.dueAt)}</span>
                    <span>{relativeLoanState(borrow.dueAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No near-term loan actions are waiting.
              </p>
            )}
          </div>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Reservations" description="Books you have reserved and their current status.">
            <div className="space-y-3">
              {data.reservations.length ? (
                data.reservations.map((reservation) => (
                  <div key={reservation._id} className="rounded-[22px] border border-slate-200 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{reservation.book?.title}</p>
                        <p className="text-sm text-slate-500">Reserved on {date(reservation.reservedAt)}</p>
                      </div>
                      <StatusPill value={reservation.status} />
                    </div>
                    <div className="mt-3 text-sm text-slate-500">
                      Queue position: {reservation.queuePosition || '-'}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  No active reservations.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Recent fines" description="Recent fine records for your account.">
            <div className="space-y-3">
              {data.fines.length ? (
                data.fines.map((fine) => (
                  <div key={fine._id} className="rounded-[22px] border border-slate-200 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{currency(Math.max(fine.amount - fine.paidAmount, 0))}</p>
                        <p className="text-sm text-slate-500">Reason: {fine.reason}</p>
                      </div>
                      <StatusPill value={fine.status} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  No fine history yet.
                </p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

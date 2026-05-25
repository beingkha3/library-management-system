import { dashboardApi } from '../api/services';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { StatCard } from '../components/StatCard';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';
import { currency, date } from '../utils/formatters';

export const StaffReportsPage = () => {
  const { data, loading, error } = useAsyncData(() => dashboardApi.reports(), []);

  if (loading) {
    return <LoadingState label="Loading reports and analytics..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operational analytics"
        title="Read usage trends across inventory, borrowing, and fines"
        description="A staff-friendly reporting layer for circulation monitoring and collection planning."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Users" value={data.metrics.totalUsers} tone="navy" />
        <StatCard label="Books" value={data.metrics.totalBooks} tone="default" />
        <StatCard label="Borrows" value={data.metrics.totalBorrows} tone="blue" />
        <StatCard label="Reservations" value={data.metrics.totalReservations} tone="default" />
        <StatCard label="Outstanding fines" value={currency(data.metrics.outstandingFineAmount)} tone="amber" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard title="Borrowing by category" description="Top-level demand visibility by section.">
          <div className="space-y-3">
            {Object.entries(data.borrowingByCategory).map(([category, total]) => (
              <div key={category} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <span className="font-medium text-slate-900">{category}</span>
                <span className="text-sm text-slate-500">{total} borrows</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Overdue report" description="Titles currently beyond the due date.">
          <div className="space-y-3">
            {data.overdueReport.length ? (
              data.overdueReport.map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{item.book?.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.user?.name}</p>
                  <p className="mt-1 text-sm text-slate-500">Due {date(item.dueAt)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No overdue loans at the moment.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

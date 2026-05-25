import { useState } from 'react';

import { reservationApi } from '../api/services';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { SecondaryButton } from '../components/FormFields';
import { StatusPill } from '../components/StatusPill';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';
import { date } from '../utils/formatters';

export const StaffReservationsPage = () => {
  const [message, setMessage] = useState('');
  const { data, loading, error, setData } = useAsyncData(() => reservationApi.list(), []);

  const handleCancel = async (reservationId) => {
    try {
      await reservationApi.cancel(reservationId);
      setMessage('Reservation cancelled successfully.');
      setData(await reservationApi.list());
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) {
    return <LoadingState label="Loading reservation queue..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reservation queue"
        title="Coordinate queued and ready holds"
        description="Review queue position, readiness windows, and cancellation requests from one place."
      />
      {message ? <p className="rounded-2xl bg-academy-100 px-4 py-3 text-sm text-academy-700">{message}</p> : null}
      <DataTable
        columns={[
          {
            key: 'book',
            label: 'Book',
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">{row.book?.title}</p>
                <p className="text-xs text-slate-500">{row.user?.name}</p>
              </div>
            )
          },
          { key: 'queuePosition', label: 'Queue position' },
          { key: 'reservedAt', label: 'Reserved', render: (row) => date(row.reservedAt) },
          { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) =>
              ['cancelled', 'fulfilled'].includes(row.status) ? (
                <span className="text-sm text-slate-400">Closed</span>
              ) : (
                <SecondaryButton type="button" onClick={() => handleCancel(row._id)}>
                  Cancel
                </SecondaryButton>
              )
          }
        ]}
        rows={data}
        emptyMessage="There are no active reservations right now."
      />
    </div>
  );
};

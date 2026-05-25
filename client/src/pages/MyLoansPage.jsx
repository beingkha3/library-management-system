import { useState } from 'react';

import { borrowApi } from '../api/services';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/FormFields';
import { StatusPill } from '../components/StatusPill';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';
import { date, relativeLoanState } from '../utils/formatters';

export const MyLoansPage = () => {
  const [message, setMessage] = useState('');
  const { data, loading, error, setData } = useAsyncData(() => borrowApi.list(), []);

  const handleRenew = async (borrowId) => {
    try {
      await borrowApi.renew(borrowId);
      setMessage('Loan renewed successfully.');
      setData(await borrowApi.list());
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) {
    return <LoadingState label="Loading your loans..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Loan tracking"
        title="Review your active, overdue, and completed borrow records"
        description="Renew eligible books before the due date and watch the circulation history of your account."
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
                <p className="text-xs text-slate-500">{row.book?.authors?.join(', ')}</p>
              </div>
            )
          },
          { key: 'borrowedAt', label: 'Borrowed', render: (row) => date(row.borrowedAt) },
          { key: 'dueAt', label: 'Due', render: (row) => `${date(row.dueAt)} (${relativeLoanState(row.dueAt)})` },
          { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) =>
              row.status !== 'returned' ? (
                <PrimaryButton type="button" onClick={() => handleRenew(row._id)}>
                  Renew
                </PrimaryButton>
              ) : (
                <span className="text-sm text-slate-400">No actions</span>
              )
          }
        ]}
        rows={data}
        emptyMessage="You do not have any borrow records yet."
      />
    </div>
  );
};

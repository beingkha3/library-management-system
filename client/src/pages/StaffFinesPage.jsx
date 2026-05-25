import { useState } from 'react';

import { fineApi } from '../api/services';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/FormFields';
import { StatusPill } from '../components/StatusPill';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';
import { currency, date } from '../utils/formatters';

export const StaffFinesPage = () => {
  const [message, setMessage] = useState('');
  const { data, loading, error, setData } = useAsyncData(() => fineApi.list(), []);

  const handleWaive = async (fineId) => {
    try {
      await fineApi.waive(fineId, { waiveReason: 'Waived by librarian after review' });
      setMessage('Fine waived successfully.');
      setData(await fineApi.list());
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) {
    return <LoadingState label="Loading fine records..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fine oversight"
        title="Review, waive, and monitor fine recovery"
        description="The finance-oriented circulation panel for outstanding balances and waivers."
      />
      {message ? <p className="rounded-2xl bg-academy-100 px-4 py-3 text-sm text-academy-700">{message}</p> : null}
      <DataTable
        columns={[
          {
            key: 'user',
            label: 'Member',
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">{row.user?.name}</p>
                <p className="text-xs text-slate-500">{row.user?.email}</p>
              </div>
            )
          },
          { key: 'reason', label: 'Reason', render: (row) => <span className="capitalize">{row.reason}</span> },
          { key: 'amount', label: 'Amount', render: (row) => currency(row.amount) },
          { key: 'assessedAt', label: 'Assessed', render: (row) => date(row.assessedAt) },
          { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) =>
              ['paid', 'waived'].includes(row.status) ? (
                <span className="text-sm text-slate-400">Closed</span>
              ) : (
                <PrimaryButton type="button" onClick={() => handleWaive(row._id)}>
                  Waive
                </PrimaryButton>
              )
          }
        ]}
        rows={data}
        emptyMessage="No fine records are present."
      />
    </div>
  );
};

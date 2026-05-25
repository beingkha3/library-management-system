import { useState } from 'react';

import { userApi } from '../api/services';
import { DataTable } from '../components/DataTable';
import { Field, PrimaryButton, inputClassName } from '../components/FormFields';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';
import { date } from '../utils/formatters';

export const StaffMembersPage = () => {
  const [message, setMessage] = useState('');
  const { data, loading, error, setData } = useAsyncData(() => userApi.list(), []);

  const handleToggle = async (row) => {
    try {
      const status = row.status === 'active' ? 'suspended' : 'active';
      await userApi.update(row._id, { status });
      setMessage(`User ${status === 'active' ? 'reactivated' : 'suspended'} successfully.`);
      setData(await userApi.list());
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) {
    return <LoadingState label="Loading member directory..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Member directory"
        title="Review account standing, roles, and activity readiness"
        description="Librarians can quickly see who is eligible to borrow and intervene when status changes are needed."
      />
      {message ? <p className="rounded-2xl bg-academy-100 px-4 py-3 text-sm text-academy-700">{message}</p> : null}
      <DataTable
        columns={[
          {
            key: 'name',
            label: 'Member',
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">{row.name}</p>
                <p className="text-xs text-slate-500">{row.email}</p>
              </div>
            )
          },
          { key: 'membershipId', label: 'Membership ID' },
          { key: 'role', label: 'Role', render: (row) => <StatusPill value={row.role} /> },
          { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
          { key: 'createdAt', label: 'Joined', render: (row) => date(row.createdAt) },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <PrimaryButton type="button" onClick={() => handleToggle(row)}>
                {row.status === 'active' ? 'Suspend' : 'Reactivate'}
              </PrimaryButton>
            )
          }
        ]}
        rows={data}
        emptyMessage="No users found in the library system."
      />
    </div>
  );
};

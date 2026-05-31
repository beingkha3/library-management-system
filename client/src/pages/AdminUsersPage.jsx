import { ShieldCheck, UserRoundCog } from 'lucide-react';
import { useMemo, useState } from 'react';

import { userApi } from '../api/services';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { SecondaryButton } from '../components/FormFields';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';
import { roleLabel } from '../utils/formatters';

const roleOptions = [
  { value: 'member', label: roleLabel('member') },
  { value: 'librarian', label: roleLabel('librarian') },
  { value: 'admin', label: roleLabel('admin') }
];

export const AdminUsersPage = () => {
  const [message, setMessage] = useState('');
  const { data, loading, error, setData } = useAsyncData(() => userApi.list(), []);

  const summary = useMemo(() => {
    const users = data || [];
    return {
      members: users.filter((user) => user.role === 'member').length,
      librarians: users.filter((user) => user.role === 'librarian').length,
      admins: users.filter((user) => user.role === 'admin').length,
      suspended: users.filter((user) => user.status === 'suspended').length
    };
  }, [data]);

  const refreshUsers = async () => setData(await userApi.list());

  const handleRoleChange = async (row, nextRole) => {
    if (row.role === nextRole) {
      return;
    }

    try {
      await userApi.update(row._id, { role: nextRole });
      setMessage(`Role updated to ${nextRole}.`);
      await refreshUsers();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleStatusToggle = async (row) => {
    try {
      await userApi.update(row._id, { status: row.status === 'active' ? 'suspended' : 'active' });
      setMessage(`Account ${row.status === 'active' ? 'suspended' : 'reactivated'} successfully.`);
      await refreshUsers();
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) {
    return <LoadingState label="Loading user accounts..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="User management"
        title="Manage user roles and account status"
        description="Review member and staff accounts, change roles, and suspend or reactivate access when needed."
        metadata={['Members', 'Staff', 'Account status']}
      />

      {message ? <p className="rounded-2xl bg-academy-100 px-4 py-3 text-sm text-academy-700">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Members</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.members}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Librarians</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.librarians}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admins</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.admins}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Suspended accounts</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.suspended}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <SectionCard title="Account notes" description="A quick guide for managing user access.">
          <div className="space-y-3">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-academy-50 p-3 text-academy-700">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Role changes</p>
                  <p className="mt-1 text-sm text-slate-500">Change access when a staff member needs librarian or admin permissions.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-academy-50 p-3 text-academy-700">
                  <UserRoundCog size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Account status</p>
                  <p className="mt-1 text-sm text-slate-500">Suspend accounts when library access should be paused, then reactivate when access can resume.</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="User accounts" description="Manage user roles and account status from the table below.">
          <DataTable
            columns={[
              {
                key: 'name',
                label: 'User',
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
              {
                key: 'actions',
                label: 'Actions',
                render: (row) => (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <select
                        aria-label={`Change role for ${row.name}`}
                        value={row.role}
                        onChange={(event) => handleRoleChange(row, event.target.value)}
                        className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-medium text-slate-700 outline-none transition hover:border-academy-300 hover:text-academy-700 focus:border-academy-500 focus:ring-2 focus:ring-academy-100"
                      >
                        {roleOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                    <SecondaryButton type="button" onClick={() => handleStatusToggle(row)}>
                      {row.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </SecondaryButton>
                  </div>
                )
              }
            ]}
            rows={data}
            emptyMessage="No users are available to manage."
          />
        </SectionCard>
      </div>
    </div>
  );
};

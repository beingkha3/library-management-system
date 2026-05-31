import { useState } from 'react';

import { userApi } from '../api/services';
import { DataTable } from '../components/DataTable';
import { Field, PrimaryButton, SecondaryButton, inputClassName } from '../components/FormFields';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAuth } from '../hooks/useAuth';
import { useAsyncData } from '../hooks/useAsyncData';
import { date } from '../utils/formatters';

export const StaffMembersPage = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const { data, loading, error, setData } = useAsyncData(() => userApi.list(), []);

  const canManageRow = (row) => user?.role === 'admin' || row.role === 'member';

  const openEditor = (row) => {
    if (!canManageRow(row)) {
      setMessage('Only admins can manage librarian or admin accounts.');
      return;
    }

    setSelectedUser(row);
    setForm({
      name: row.name || '',
      phone: row.phone || '',
      address: row.address || ''
    });
    setMessage('');
  };

  const handleToggle = async (row) => {
    try {
      if (!canManageRow(row)) {
        setMessage('Only admins can suspend or reactivate librarian and admin accounts.');
        return;
      }

      const status = row.status === 'active' ? 'suspended' : 'active';
      await userApi.update(row._id, { status });
      setMessage(`User ${status === 'active' ? 'reactivated' : 'suspended'} successfully.`);
      const nextUsers = await userApi.list();
      setData(nextUsers);
      if (selectedUser?._id === row._id) {
        const nextSelectedUser = nextUsers.find((item) => item._id === row._id) || null;
        setSelectedUser(nextSelectedUser);
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!selectedUser) {
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      await userApi.update(selectedUser._id, form);
      setMessage('Member details updated successfully.');
      const nextUsers = await userApi.list();
      setData(nextUsers);
      const nextSelectedUser = nextUsers.find((item) => item._id === selectedUser._id) || null;
      setSelectedUser(nextSelectedUser);
      if (nextSelectedUser) {
        setForm({
          name: nextSelectedUser.name || '',
          phone: nextSelectedUser.phone || '',
          address: nextSelectedUser.address || ''
        });
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
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
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Member',
              width: '1.5fr',
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
              width: '1.3fr',
              render: (row) =>
                canManageRow(row) ? (
                  <div className="flex flex-wrap gap-2">
                    <SecondaryButton type="button" onClick={() => openEditor(row)}>
                      Edit
                    </SecondaryButton>
                    <PrimaryButton type="button" onClick={() => handleToggle(row)}>
                      {row.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </PrimaryButton>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">Admin only</span>
                )
            }
          ]}
          rows={data}
          emptyMessage="No users found in the library system."
        />

        <SectionCard
          title="Edit member details"
          description={
            selectedUser
              ? `Update the profile details for ${selectedUser.name}.`
              : 'Select a manageable member row to edit their details.'
          }
        >
          {selectedUser ? (
            <form onSubmit={handleSave} className="space-y-4">
              <Field label="Full name">
                <input
                  className={inputClassName}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </Field>
              <Field label="Email address">
                <input className={inputClassName} value={selectedUser.email || ''} readOnly />
              </Field>
              <Field label="Phone number">
                <input
                  className={inputClassName}
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </Field>
              <Field label="Address">
                <textarea
                  className={`${inputClassName} min-h-28 resize-y`}
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                />
              </Field>
              <Field label="Membership ID">
                <input className={inputClassName} value={selectedUser.membershipId || ''} readOnly />
              </Field>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setForm({ name: '', phone: '', address: '' });
                  }}
                >
                  Cancel
                </SecondaryButton>
              </div>
            </form>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
              Librarians can edit member accounts. Librarian and admin accounts remain admin-only to match backend permissions.
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

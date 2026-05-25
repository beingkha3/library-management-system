import { useState } from 'react';

import { notificationApi } from '../api/services';
import { DataTable } from '../components/DataTable';
import { Field, PrimaryButton, inputClassName } from '../components/FormFields';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';
import { date } from '../utils/formatters';

export const AdminAuditPage = () => {
  const [emailTarget, setEmailTarget] = useState('');
  const [message, setMessage] = useState('');
  const logsQuery = useAsyncData(() => notificationApi.logs(), []);

  if (logsQuery.loading) {
    return <LoadingState label="Loading notification logs..." />;
  }

  if (logsQuery.error) {
    return <ErrorState message={logsQuery.error} />;
  }

  const handleTestEmail = async (event) => {
    event.preventDefault();

    try {
      await notificationApi.sendTestEmail({ to: emailTarget || undefined });
      setMessage('Test email request processed successfully.');
      logsQuery.setData(await notificationApi.logs());
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Diagnostics"
        title="Monitor email activity and admin-side checks"
        description="Use this panel to verify SMTP setup and inspect the latest notification records."
      />
      {message ? <p className="rounded-2xl bg-academy-100 px-4 py-3 text-sm text-academy-700">{message}</p> : null}
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Send test email" description="Verify the configured SMTP provider from the admin dashboard.">
          <form onSubmit={handleTestEmail} className="space-y-4">
            <Field label="Destination email">
              <input className={inputClassName} value={emailTarget} onChange={(event) => setEmailTarget(event.target.value)} placeholder="Leave blank to use your own email" />
            </Field>
            <PrimaryButton type="submit">Send test email</PrimaryButton>
          </form>
        </SectionCard>
        <SectionCard title="Notification logs" description="Recent email-related activity recorded by the backend service layer.">
          <DataTable
            columns={[
              {
                key: 'subject',
                label: 'Subject',
                render: (row) => (
                  <div>
                    <p className="font-medium text-slate-900">{row.subject}</p>
                    <p className="text-xs text-slate-500">{row.user?.email || 'System event'}</p>
                  </div>
                )
              },
              { key: 'templateKey', label: 'Template' },
              { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
              { key: 'createdAt', label: 'Created', render: (row) => date(row.createdAt) }
            ]}
            rows={logsQuery.data}
            emptyMessage="No notification logs are available."
          />
        </SectionCard>
      </div>
    </div>
  );
};

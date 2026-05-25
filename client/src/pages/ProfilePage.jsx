import { useMemo, useState } from 'react';

import { Field, PrimaryButton, inputClassName } from '../components/FormFields';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { useAuth } from '../hooks/useAuth';
import { roleLabel } from '../utils/formatters';

export const ProfilePage = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');

  const stats = useMemo(
    () => [
      { label: 'Membership ID', value: user?.membershipId || '-' },
      { label: 'Role', value: roleLabel(user?.role) },
      { label: 'Outstanding balance', value: `INR ${user?.fineBalance || 0}` }
    ],
    [user]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My profile"
        title="Membership details"
        description="View the contact information and account details linked to your library membership."
      />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Profile information" description="Your current library account details.">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Full name">
              <input className={inputClassName} value={user?.name || ''} readOnly />
            </Field>
            <Field label="Email address">
              <input className={inputClassName} value={user?.email || ''} readOnly />
            </Field>
            <Field label="Phone number">
              <input className={inputClassName} value={user?.phone || ''} readOnly />
            </Field>
            <Field label="Address">
              <textarea className={`${inputClassName} min-h-28`} value={user?.address || ''} readOnly />
            </Field>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Contact the library if any of these details need to be updated.
          </p>
        </SectionCard>
        <SectionCard title="Membership summary" description="Important details related to your account.">
          <div className="space-y-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 px-4 py-4">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
          {message ? <p className="mt-4 text-sm text-academy-700">{message}</p> : null}
          <PrimaryButton type="button" className="mt-5" onClick={() => setMessage('Please contact the library if you need to update your details.')}>Request an update</PrimaryButton>
        </SectionCard>
      </div>
    </div>
  );
};

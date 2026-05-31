import { useEffect, useMemo, useState } from 'react';

import { authApi, userApi } from '../api/services';
import { Field, PrimaryButton, SecondaryButton, inputClassName } from '../components/FormFields';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { useAuth } from '../hooks/useAuth';
import { setStoredAuth } from '../api/http';
import { roleLabel } from '../utils/formatters';

export const ProfilePage = () => {
  const { user, setAuth } = useAuth();
  const [message, setMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || ''
    });
  }, [user]);

  const stats = useMemo(
    () => [
      { label: 'Membership ID', value: user?.membershipId || '-' },
      { label: 'Role', value: roleLabel(user?.role) },
      { label: 'Outstanding balance', value: `INR ${user?.fineBalance || 0}` }
    ],
    [user]
  );

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setMessage('');

    try {
      const nextUser = await userApi.updateMe(profileForm);
      setAuth((current) => {
        if (!current) {
          return current;
        }

        const nextAuth = { ...current, user: nextUser };
        setStoredAuth(nextAuth);
        return nextAuth;
      });
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setMessage('');

    try {
      const nextAuth = await authApi.changePassword(passwordForm);
      setAuth(nextAuth);
      setStoredAuth(nextAuth);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setMessage('Password changed successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My profile"
        title="Membership details"
        description="View the contact information and account details linked to your library membership."
      />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Profile information" description="Your current library account details.">
          <form onSubmit={handleProfileSave} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full name">
                <input className={inputClassName} value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} />
              </Field>
              <Field label="Email address">
                <input className={inputClassName} value={user?.email || ''} readOnly />
              </Field>
              <Field label="Phone number">
                <input className={inputClassName} value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
              </Field>
              <Field label="Address">
                <textarea className={`${inputClassName} min-h-28`} value={profileForm.address} onChange={(event) => setProfileForm((current) => ({ ...current, address: event.target.value }))} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-3">
              <PrimaryButton type="submit" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save profile'}</PrimaryButton>
              <SecondaryButton type="button" onClick={() => setProfileForm({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' })}>
                Reset
              </SecondaryButton>
            </div>
          </form>
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
          <form onSubmit={handlePasswordChange} className="mt-6 space-y-4 border-t border-slate-200 pt-6">
            <Field label="Current password">
              <input className={inputClassName} type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} />
            </Field>
            <Field label="New password">
              <input className={inputClassName} type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} />
            </Field>
            <PrimaryButton type="submit" disabled={savingPassword}>{savingPassword ? 'Updating...' : 'Change password'}</PrimaryButton>
          </form>
        </SectionCard>
      </div>
    </div>
  );
};

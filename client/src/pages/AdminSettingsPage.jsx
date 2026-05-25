import { useEffect, useState } from 'react';

import { dashboardApi } from '../api/services';
import { Field, PrimaryButton, inputClassName } from '../components/FormFields';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';

export const AdminSettingsPage = () => {
  const { data, loading, error, setData } = useAsyncData(() => dashboardApi.settings(), []);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  if (loading || !form) {
    return <LoadingState label="Loading system settings..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        loanDays: Number(form.loanDays),
        finePerDay: Number(form.finePerDay),
        maxActiveBorrows: Number(form.maxActiveBorrows),
        maxRenewals: Number(form.maxRenewals),
        reservationHoldDays: Number(form.reservationHoldDays),
        fineThreshold: Number(form.fineThreshold),
        allowSelfIssue: Boolean(form.allowSelfIssue)
      };

      const updated = await dashboardApi.updateSettings(payload);
      setData(updated);
      setForm(updated);
      setMessage('Settings updated successfully.');
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Library settings"
        title="Set borrowing, fine, and reservation rules"
        description="Update the rules used for borrowing periods, fines, and reservations."
      />
      {message ? <p className="rounded-2xl bg-academy-100 px-4 py-3 text-sm text-academy-700">{message}</p> : null}
      <SectionCard title="Circulation settings" description="Operational defaults for borrowing and fines.">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Loan days"><input type="number" min="1" className={inputClassName} value={form.loanDays} onChange={(event) => setForm((current) => ({ ...current, loanDays: event.target.value }))} /></Field>
          <Field label="Fine per day"><input type="number" min="0" className={inputClassName} value={form.finePerDay} onChange={(event) => setForm((current) => ({ ...current, finePerDay: event.target.value }))} /></Field>
          <Field label="Max active borrows"><input type="number" min="1" className={inputClassName} value={form.maxActiveBorrows} onChange={(event) => setForm((current) => ({ ...current, maxActiveBorrows: event.target.value }))} /></Field>
          <Field label="Max renewals"><input type="number" min="0" className={inputClassName} value={form.maxRenewals} onChange={(event) => setForm((current) => ({ ...current, maxRenewals: event.target.value }))} /></Field>
          <Field label="Reservation hold days"><input type="number" min="1" className={inputClassName} value={form.reservationHoldDays} onChange={(event) => setForm((current) => ({ ...current, reservationHoldDays: event.target.value }))} /></Field>
          <Field label="Fine threshold"><input type="number" min="0" className={inputClassName} value={form.fineThreshold} onChange={(event) => setForm((current) => ({ ...current, fineThreshold: event.target.value }))} /></Field>
          <div className="md:col-span-2 xl:col-span-3 flex items-center justify-between rounded-2xl border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">Allow member self-issue</p>
              <p className="text-sm text-slate-500">Enable members to borrow directly from the catalog interface.</p>
            </div>
            <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={Boolean(form.allowSelfIssue)} onChange={(event) => setForm((current) => ({ ...current, allowSelfIssue: event.target.checked }))} />
              Enabled
            </label>
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <PrimaryButton type="submit">Save settings</PrimaryButton>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};

import { BellRing, CircleCheck, Clock3, Mail } from 'lucide-react';

import { notificationApi } from '../api/services';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { useAsyncData } from '../hooks/useAsyncData';
import { date } from '../utils/formatters';

const notificationDescriptions = {
  welcome: 'Your library membership has been created successfully.',
  password_reset: 'A password reset link was issued for your account.',
  borrow_confirmation: 'Your library loan was confirmed by the circulation system.',
  return_confirmation: 'Your return was processed and any fine outcome was recorded.',
  reservation_ready: 'A reserved title became available for pickup.',
  fine_payment: 'A fine payment receipt was issued after payment verification.',
  test_email: 'A manual test email was triggered from the admin audit page.'
};

const getNotificationDescription = (item) => item.error || notificationDescriptions[item.type] || 'Email activity recorded by the library notification service.';

export const NotificationsPage = () => {
  const notificationsQuery = useAsyncData(() => notificationApi.mine(), []);

  if (notificationsQuery.loading) {
    return <LoadingState label="Loading your notification history..." />;
  }

  if (notificationsQuery.error) {
    return <ErrorState message={notificationsQuery.error} />;
  }

  const items = notificationsQuery.data || [];
  const sentCount = items.filter((item) => item.status === 'sent').length;
  const latestItem = items[0];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Notifications"
        title="Library messages and reminders"
        description="View recent messages about borrowed books, reservations, password resets, and fine payments."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2 text-slate-500">
            <BellRing size={16} />
            <p className="text-sm">Recent messages</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{items.length}</p>
          <p className="mt-2 text-sm text-slate-500">Messages recorded for your library account.</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2 text-slate-500">
            <CircleCheck size={16} />
            <p className="text-sm">Sent by email</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{sentCount}</p>
          <p className="mt-2 text-sm text-slate-500">Messages successfully delivered through email.</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2 text-slate-500">
            <Clock3 size={16} />
            <p className="text-sm">Latest update</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{latestItem ? date(latestItem.createdAt) : '-'}</p>
          <p className="mt-2 text-sm text-slate-500">Most recent notification activity on your account.</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <SectionCard title="Recent messages" description="Messages related to your library account.">
          {items.length === 0 ? (
            <EmptyState
              title="No notifications yet"
              description="Your email activity will appear here after actions like account creation, reservations, or fine payments."
            />
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item._id} className="rounded-[22px] border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.subject}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{getNotificationDescription(item)}</p>
                      <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{date(item.createdAt)}</p>
                    </div>
                    <StatusPill value={item.status} />
                  </div>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    <Mail size={14} />
                    {item.channel || 'Email'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="What messages you may receive" description="The library may send reminders and updates for the items below.">
          <div className="space-y-3">
            {[
              'Welcome emails after account registration',
              'Password reset links when you request account recovery',
              'Borrow confirmations with due-date reference',
              'Reservation-ready pickup reminders',
              'Return acknowledgements and overdue fine notices',
              'Fine payment receipts after verification'
            ].map((item) => (
              <div key={item} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

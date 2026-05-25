import { BellRing, CircleCheck, Clock3, Mail } from 'lucide-react';

import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';

const recentNotificationItems = [
  {
    title: 'Borrow confirmation sent',
    description: 'Digital Electronics Essentials was recorded and the due-date email was issued.',
    status: 'sent',
    channel: 'Email'
  },
  {
    title: 'Reservation ready alert',
    description: 'A hold became available and a pickup reminder was queued for delivery.',
    status: 'sent',
    channel: 'Email'
  },
  {
    title: 'Fine payment receipt',
    description: 'Payment confirmation was sent after server-side Razorpay verification.',
    status: 'sent',
    channel: 'Email'
  }
];

export const NotificationsPage = () => (
  <div className="space-y-5">
    <PageHeader
      eyebrow="Notifications"
      title="Library messages and reminders"
      description="View recent messages about borrowed books, reservations, and fine payments."
    />

    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2 text-slate-500">
          <BellRing size={16} />
          <p className="text-sm">Recent messages</p>
        </div>
        <p className="mt-3 text-3xl font-semibold text-slate-900">3</p>
        <p className="mt-2 text-sm text-slate-500">Recent messages from the library.</p>
      </div>
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2 text-slate-500">
          <CircleCheck size={16} />
          <p className="text-sm">Sent by email</p>
        </div>
        <p className="mt-3 text-3xl font-semibold text-slate-900">3</p>
        <p className="mt-2 text-sm text-slate-500">Messages sent to your email address.</p>
      </div>
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2 text-slate-500">
          <Clock3 size={16} />
          <p className="text-sm">Latest update</p>
        </div>
        <p className="mt-3 text-3xl font-semibold text-slate-900">Today</p>
        <p className="mt-2 text-sm text-slate-500">Your latest message was sent today.</p>
      </div>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <SectionCard title="Recent messages" description="Messages related to your library account.">
        <div className="space-y-3">
          {recentNotificationItems.map((item) => (
            <div key={item.title} className="rounded-[22px] border border-slate-200 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                </div>
                <StatusPill value={item.status} />
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <Mail size={14} />
                {item.channel}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="What messages you may receive" description="The library may send reminders and updates for the items below.">
        <div className="space-y-3">
          {[
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

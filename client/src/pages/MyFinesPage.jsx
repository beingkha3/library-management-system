import { useState } from 'react';

import { fineApi, paymentApi } from '../api/services';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/FormFields';
import { StatusPill } from '../components/StatusPill';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';
import { currency, date } from '../utils/formatters';

const loadRazorpayScript = () => {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const MyFinesPage = () => {
  const [message, setMessage] = useState('');
  const { data, loading, error, setData } = useAsyncData(() => fineApi.mine(), [], { pollIntervalMs: 10000 });

  const handlePay = async (fine) => {
    try {
      const loaded = await loadRazorpayScript();

      if (!loaded) {
        throw new Error('Unable to load Razorpay checkout');
      }

      const orderData = await paymentApi.createOrder({ fineId: fine._id });

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Library Management System',
        description: 'Overdue fine payment',
        order_id: orderData.order.id,
        handler: async (response) => {
          await paymentApi.verifyOrder({
            fineId: fine._id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          });

          setMessage('Payment verified successfully.');
          setData(await fineApi.mine());
        },
        theme: {
          color: '#2563eb'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
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
        eyebrow="Fine management"
        title="View overdue charges and settle them online"
        description="Outstanding dues can be cleared through Razorpay after server-side verification."
      />
      {message ? <p className="rounded-2xl bg-academy-100 px-4 py-3 text-sm text-academy-700">{message}</p> : null}
      <DataTable
        columns={[
          { key: 'reason', label: 'Reason', render: (row) => <span className="capitalize">{row.reason}</span> },
          { key: 'amount', label: 'Assessed', render: (row) => currency(row.amount) },
          { key: 'paidAmount', label: 'Paid', render: (row) => currency(row.paidAmount) },
          { key: 'assessedAt', label: 'Date', render: (row) => date(row.assessedAt) },
          { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) =>
              ['paid', 'waived'].includes(row.status) ? (
                <span className="text-sm text-slate-400">Settled</span>
              ) : (
                <PrimaryButton type="button" onClick={() => handlePay(row)}>
                  Pay now
                </PrimaryButton>
              )
          }
        ]}
        rows={data}
        emptyMessage="You do not have any fines right now."
      />
    </div>
  );
};

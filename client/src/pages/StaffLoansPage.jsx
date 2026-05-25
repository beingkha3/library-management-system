import { AlertTriangle, Search, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';

import { bookApi, borrowApi, userApi } from '../api/services';
import { DataTable } from '../components/DataTable';
import { Field, PrimaryButton, SecondaryButton, inputClassName } from '../components/FormFields';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';
import { currency, date, relativeLoanState } from '../utils/formatters';

export const StaffLoansPage = () => {
  const [message, setMessage] = useState('');
  const [issueForm, setIssueForm] = useState({ userId: '', bookId: '' });
  const borrowsQuery = useAsyncData(() => borrowApi.list(), []);
  const usersQuery = useAsyncData(() => userApi.list(), []);
  const booksQuery = useAsyncData(() => bookApi.list(), []);

  const selectedUser = useMemo(
    () => usersQuery.data?.find((user) => user._id === issueForm.userId),
    [issueForm.userId, usersQuery.data]
  );
  const selectedBook = useMemo(
    () => booksQuery.data?.find((book) => book._id === issueForm.bookId),
    [booksQuery.data, issueForm.bookId]
  );

  if (borrowsQuery.loading || usersQuery.loading || booksQuery.loading) {
    return <LoadingState label="Loading loan desk data..." />;
  }

  if (borrowsQuery.error || usersQuery.error || booksQuery.error) {
    return <ErrorState message={borrowsQuery.error || usersQuery.error || booksQuery.error} />;
  }

  const handleIssue = async (event) => {
    event.preventDefault();

    try {
      await borrowApi.issue(issueForm);
      setMessage('Borrow issued successfully.');
      setIssueForm({ userId: '', bookId: '' });
      borrowsQuery.setData(await borrowApi.list());
      booksQuery.setData(await bookApi.list());
      usersQuery.setData(await userApi.list());
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleReturn = async (borrowId) => {
    try {
      await borrowApi.returnBook(borrowId);
      setMessage('Return processed successfully.');
      borrowsQuery.setData(await borrowApi.list());
      booksQuery.setData(await bookApi.list());
      usersQuery.setData(await userApi.list());
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Loan desk"
        title="Transactional circulation workspace for issuing and returning books"
        description="Use this screen as the operational desk surface: verify borrower standing, confirm title availability, and process returns without context switching."
        metadata={['Circulation queue', 'Borrower standing visible', 'Return processing enabled']}
      />

      {message ? <p className="rounded-2xl bg-academy-100 px-4 py-3 text-sm text-academy-700">{message}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-5">
          <SectionCard title="Issue a book" description="Select a member account and an available title before completing the transaction.">
            <form onSubmit={handleIssue} className="space-y-4">
              <Field label="Member account">
                <select
                  className={inputClassName}
                  value={issueForm.userId}
                  onChange={(event) => setIssueForm((current) => ({ ...current, userId: event.target.value }))}
                  required
                >
                  <option value="">Select member</option>
                  {usersQuery.data
                    .filter((user) => user.role === 'member')
                    .map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.membershipId})
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Book title">
                <select
                  className={inputClassName}
                  value={issueForm.bookId}
                  onChange={(event) => setIssueForm((current) => ({ ...current, bookId: event.target.value }))}
                  required
                >
                  <option value="">Select title</option>
                  {booksQuery.data
                    .filter((book) => book.availableCopies > 0)
                    .map((book) => (
                      <option key={book._id} value={book._id}>
                        {book.title} ({book.availableCopies} available)
                      </option>
                    ))}
                </select>
              </Field>
              <PrimaryButton type="submit">Issue book</PrimaryButton>
            </form>
          </SectionCard>

          <SectionCard title="Borrower and title check" description="A quick desk-side summary before confirming the issue.">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <UserRound size={16} />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">Member standing</p>
                </div>
                {selectedUser ? (
                  <>
                    <p className="mt-3 text-lg font-semibold text-slate-900">{selectedUser.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{selectedUser.membershipId}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <StatusPill value={selectedUser.status} />
                      <span className="text-sm text-slate-500">Fine balance {currency(selectedUser.fineBalance)}</span>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Select a member to review account standing.</p>
                )}
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Search size={16} />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">Title availability</p>
                </div>
                {selectedBook ? (
                  <>
                    <p className="mt-3 text-lg font-semibold text-slate-900">{selectedBook.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{selectedBook.authors?.join(', ')}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <StatusPill value={selectedBook.availableCopies > 0 ? 'active' : 'queued'} />
                      <span className="text-sm text-slate-500">{selectedBook.availableCopies} of {selectedBook.totalCopies} copies</span>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Select a title to review copy counts and availability.</p>
                )}
              </div>
            </div>
            {selectedUser?.status === 'suspended' || Number(selectedUser?.fineBalance || 0) > 0 ? (
              <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-0.5" />
                  <p>Review member standing before issuing this title. Suspended accounts or members with elevated fine balances may be blocked by policy settings.</p>
                </div>
              </div>
            ) : null}
          </SectionCard>
        </div>

        <SectionCard title="Current circulation" description="Loan records with due-date context, borrower visibility, and return actions.">
          <DataTable
            columns={[
              {
                key: 'book',
                label: 'Book',
                render: (row) => (
                  <div>
                    <p className="font-medium text-slate-900">{row.book?.title}</p>
                    <p className="text-xs text-slate-500">{row.user?.name}</p>
                  </div>
                )
              },
              { key: 'borrowedAt', label: 'Borrowed', render: (row) => date(row.borrowedAt) },
              { key: 'dueAt', label: 'Due status', render: (row) => `${date(row.dueAt)} (${relativeLoanState(row.dueAt)})` },
              { key: 'status', label: 'Status', render: (row) => <StatusPill value={row.status} /> },
              {
                key: 'actions',
                label: 'Actions',
                render: (row) =>
                  row.status === 'returned' ? (
                    <span className="text-sm text-slate-400">Complete</span>
                  ) : (
                    <SecondaryButton type="button" onClick={() => handleReturn(row._id)}>
                      Process return
                    </SecondaryButton>
                  )
              }
            ]}
            rows={borrowsQuery.data}
            emptyMessage="No loan records are available yet."
          />
        </SectionCard>
      </div>
    </div>
  );
};

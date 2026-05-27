import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { apiBaseUrl } from '../api/http';
import { bookApi, borrowApi, reservationApi } from '../api/services';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Field, PrimaryButton, SecondaryButton, inputClassName } from '../components/FormFields';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { BackendUnavailableState, ErrorState, LoadingState } from '../components/StateViews';
import { useAuth } from '../hooks/useAuth';
import { useAsyncData } from '../hooks/useAsyncData';
import { sampleBooks } from '../utils/sampleData';
import { date } from '../utils/formatters';

export const BookDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');
  const [authPrompt, setAuthPrompt] = useState(null);
  const { data, error, loading, setData } = useAsyncData(() => bookApi.get(id), [id]);
  const isPublicRoute = location.pathname.startsWith('/books/');
  const isBackendUnavailable = Boolean(error?.includes('Unable to connect to the server'));
  const sampleBook = useMemo(() => sampleBooks.find((book) => book._id === id) || sampleBooks[0], [id]);
  const dashboardPath = isAuthenticated ? { member: '/app', librarian: '/staff', admin: '/admin' }[user?.role] || '/app' : '/';

  const showAuthPrompt = (action) => {
    setMessage('');
    setAuthPrompt(action);
  };

  const navigateToAuth = (path) => {
    navigate(path, { state: { from: location.pathname } });
  };

  const handleBorrow = async () => {
    if (!isAuthenticated) {
      showAuthPrompt('borrow');
      return;
    }

    if (isBackendUnavailable) {
      setMessage('Unable to connect to the server. Please make sure the backend is running.');
      return;
    }

    try {
      await borrowApi.issue({ bookId: id, userId: user._id });
      setMessage('Book borrowed successfully.');
      setData(await bookApi.get(id));
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleReserve = async () => {
    if (!isAuthenticated) {
      showAuthPrompt('reserve');
      return;
    }

    if (isBackendUnavailable) {
      setMessage('Unable to connect to the server. Please make sure the backend is running.');
      return;
    }

    try {
      await reservationApi.create({ bookId: id });
      setMessage('Book reserved successfully.');
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleReview = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      showAuthPrompt('review');
      return;
    }

    if (isBackendUnavailable) {
      setMessage('Unable to connect to the server. Please make sure the backend is running.');
      return;
    }

    try {
      const nextData = await bookApi.review(id, { rating: Number(review.rating), comment: review.comment });
      setData(nextData);
      setReview({ rating: 5, comment: '' });
      setMessage('Review saved successfully.');
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) {
    return <LoadingState label="Loading book details..." />;
  }

  if (error && !isBackendUnavailable) {
    return <ErrorState message={error} />;
  }

  const book = isBackendUnavailable ? sampleBook : data.book;
  const reviews = isBackendUnavailable ? [] : data.reviews;
  const authPromptAction = authPrompt === 'reserve' ? 'reserve this title' : authPrompt === 'review' ? 'write a review' : 'borrow this book';

  return (
    <div className="space-y-6">
      {isPublicRoute ? <Breadcrumbs items={[{ label: 'Dashboard', to: dashboardPath }, { label: 'Browse catalog', to: '/books' }, { label: book.title }]} /> : null}
      {isBackendUnavailable ? <BackendUnavailableState apiUrl={apiBaseUrl} action={<p className="text-sm text-amber-800">Showing sample book details while the server is unavailable.</p>} /> : null}
      <PageHeader
        eyebrow={book.category}
        title={book.title}
        description={book.description || 'This catalog entry does not have a description yet.'}
        metadata={[`ISBN: ${book.isbn || '-'}`, book.language || 'English']}
        actions={
          book.availableCopies > 0 ? (
            <PrimaryButton type="button" onClick={handleBorrow}>{isAuthenticated ? 'Borrow' : 'Sign in to borrow'}</PrimaryButton>
          ) : (
            <SecondaryButton type="button" onClick={handleReserve}>{isAuthenticated ? 'Reserve' : 'Sign in to reserve'}</SecondaryButton>
          )
        }
      />
      {message ? <p className="rounded-2xl bg-academy-100 px-4 py-3 text-sm text-academy-700">{message}</p> : null}
      {authPrompt ? (
        <div className="rounded-[24px] border border-academy-100 bg-white px-5 py-4 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Sign in to {authPromptAction}</p>
              <p className="mt-1 text-sm text-slate-500">Use your library account to continue, or create a member account if you do not have one yet.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PrimaryButton type="button" onClick={() => navigateToAuth('/login')}>
                Sign in
              </PrimaryButton>
              <SecondaryButton type="button" onClick={() => navigateToAuth('/register')}>
                Create account
              </SecondaryButton>
              <SecondaryButton type="button" onClick={() => setAuthPrompt(null)}>
                Not now
              </SecondaryButton>
            </div>
          </div>
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Book details" description="Book information and availability.">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-500">Authors</p>
              <p className="mt-1 text-base text-slate-900">{book.authors?.join(', ')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">ISBN</p>
              <p className="mt-1 text-base text-slate-900">{book.isbn}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Publisher</p>
              <p className="mt-1 text-base text-slate-900">{book.publisher || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Language</p>
              <p className="mt-1 text-base text-slate-900">{book.language}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Shelf location</p>
              <p className="mt-1 text-base text-slate-900">{book.shelfLocation || 'Main stacks'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Availability</p>
              <div className="mt-2 flex items-center gap-3">
                <StatusPill value={book.availableCopies > 0 ? 'active' : 'queued'} />
                <span className="text-sm text-slate-500">{book.availableCopies} of {book.totalCopies} copies available</span>
              </div>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Reviews" description="Member feedback and rating context.">
          <div className="space-y-4">
            {reviews.length ? (
              reviews.map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.user?.name}</p>
                      <p className="text-sm text-slate-500">{date(item.createdAt)}</p>
                    </div>
                    <StatusPill value={item.user?.role} />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{item.comment || 'No comment provided.'}</p>
                  <p className="mt-2 text-sm font-medium text-academy-700">Rating: {item.rating}/5</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No reviews yet.</p>
            )}
          </div>
          {isAuthenticated ? (
            <form onSubmit={handleReview} className="mt-6 space-y-4 border-t border-slate-200 pt-6">
              <Field label="Your rating">
                <select
                  className={inputClassName}
                  value={review.rating}
                  onChange={(event) => setReview((current) => ({ ...current, rating: event.target.value }))}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Comment">
                <textarea
                  className={`${inputClassName} min-h-28 resize-y`}
                  value={review.comment}
                  onChange={(event) => setReview((current) => ({ ...current, comment: event.target.value }))}
                  placeholder="Share your thoughts about this title"
                />
              </Field>
              <PrimaryButton type="submit">Save review</PrimaryButton>
            </form>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <p>Sign in to borrow this book, reserve it, or write a review.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <PrimaryButton type="button" onClick={() => navigateToAuth('/login')}>
                  Sign in
                </PrimaryButton>
                <SecondaryButton type="button" onClick={() => navigateToAuth('/register')}>
                  Create account
                </SecondaryButton>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

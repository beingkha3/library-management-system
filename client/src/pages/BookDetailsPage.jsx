import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import { apiBaseUrl } from '../api/http';
import { bookApi, borrowApi, reservationApi } from '../api/services';
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
  const { user, isAuthenticated } = useAuth();
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');
  const { data, error, loading, setData } = useAsyncData(() => bookApi.get(id), [id]);
  const isPublicRoute = location.pathname.startsWith('/books/');
  const isBackendUnavailable = Boolean(error?.includes('Unable to connect to the server'));
  const sampleBook = useMemo(() => sampleBooks.find((book) => book._id === id) || sampleBooks[0], [id]);

  const handleBorrow = async () => {
    if (!isAuthenticated) {
      setMessage('Please sign in to borrow books.');
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
      setMessage('Please sign in to reserve books.');
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
      setMessage('Please sign in to review books.');
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

  return (
    <div className="space-y-6">
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
      {isPublicRoute ? (
        <div>
          <Link to="/books" className="text-sm font-semibold text-academy-700">
            Back to catalog
          </Link>
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
              Sign in to borrow this book, reserve it, or write a review.
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

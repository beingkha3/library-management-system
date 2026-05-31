import { MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

import { StatusPill } from './StatusPill';

export const BookCard = ({ book, action, detailsPath = `/app/catalog/${book._id}`, layout = 'grid' }) => {
  const isAvailable = book.availableCopies > 0;

  if (layout === 'list') {
    return (
      <div className={`rounded-2xl border px-5 py-4 transition hover:border-academy-200 ${isAvailable ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50/60'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <Link to={detailsPath} className="text-base font-semibold text-slate-900 hover:text-academy-700">
                {book.title}
              </Link>
              <StatusPill value={isAvailable ? 'active' : 'queued'} />
            </div>
            <p className="mt-1 text-sm text-slate-500">{book.authors?.join(', ')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span>{book.category}</span>
              {book.isbn ? <span>ISBN: {book.isbn}</span> : null}
              <span>{book.availableCopies} of {book.totalCopies} copies</span>
              <span className="inline-flex items-center gap-1"><Star size={11} /> {book.averageRating || 0}</span>
              <span className="inline-flex items-center gap-1"><MapPin size={11} /> {book.shelfLocation || 'Main stacks'}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {action}
            <Link to={detailsPath} className="text-sm font-semibold text-academy-700">
              View details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-5 transition hover:border-academy-200 ${isAvailable ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50/60'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Link to={detailsPath} className="text-base font-semibold leading-snug text-slate-900 hover:text-academy-700">
          {book.title}
        </Link>
        <StatusPill value={isAvailable ? 'active' : 'queued'} />
      </div>
      <p className="mt-1 text-sm text-slate-500">{book.authors?.join(', ')}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>{book.category}</span>
        {book.isbn ? <span>ISBN: {book.isbn}</span> : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span>{book.availableCopies} of {book.totalCopies} copies</span>
        <span className="inline-flex items-center gap-1"><Star size={11} /> {book.averageRating || 0}</span>
        <span className="inline-flex items-center gap-1"><MapPin size={11} /> {book.shelfLocation || 'Main stacks'}</span>
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3">
        {action}
        <Link to={detailsPath} className="text-sm font-semibold text-academy-700">
          View details
        </Link>
      </div>
    </div>
  );
};

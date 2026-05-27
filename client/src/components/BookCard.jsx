import { BookOpen, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

import { StatusPill } from './StatusPill';

const BookCoverPlaceholder = ({ size = 'md', isAvailable }) => {
  const sizeMap = {
    sm: 'h-24 w-20',
    md: 'h-28 w-20'
  };
  return (
    <div
      className={`flex ${sizeMap[size]} shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border ${
        isAvailable
          ? 'border-slate-200 bg-slate-50'
          : 'border-slate-200 bg-slate-100'
      }`}
    >
      <BookOpen size={20} className="text-slate-300" />
      <span className="text-[10px] font-medium text-slate-300">No cover</span>
    </div>
  );
};

export const BookCard = ({ book, action, detailsPath = `/app/catalog/${book._id}`, layout = 'grid' }) => {
  const isAvailable = book.availableCopies > 0;

  if (layout === 'list') {
    return (
      <div className={`rounded-[24px] border px-4 py-4 shadow-card transition hover:border-academy-200 ${isAvailable ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50/70'}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <BookCoverPlaceholder size="sm" isAvailable={isAvailable} />
            <div>
              <Link to={detailsPath} className="text-lg font-semibold text-slate-900 hover:text-academy-700">
                {book.title}
              </Link>
              <p className="mt-1 text-sm text-slate-600">{book.authors?.join(', ')}</p>
              <p className="mt-2 text-sm text-slate-500">{book.category} · ISBN: {book.isbn || '-'}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span>{book.availableCopies} of {book.totalCopies} copies available</span>
                <span className="inline-flex items-center gap-2"><Star size={14} /> {book.averageRating || 0}</span>
                <span className="inline-flex items-center gap-2"><MapPin size={14} /> {book.shelfLocation || 'Main stacks'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <StatusPill value={isAvailable ? 'active' : 'queued'} />
            <div className="flex items-center gap-3">
              {action}
              <Link to={detailsPath} className="text-sm font-semibold text-academy-700">
                View details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-[24px] border p-5 shadow-card transition hover:border-academy-200 ${isAvailable ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50/70'}`}>
      <div className="flex gap-4">
        <BookCoverPlaceholder size="md" isAvailable={isAvailable} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link to={detailsPath} className="block text-lg font-semibold leading-6 text-slate-900 hover:text-academy-700">
                {book.title}
              </Link>
              <p className="mt-1 text-sm text-slate-600">{book.authors?.join(', ')}</p>
            </div>
            <StatusPill value={isAvailable ? 'active' : 'queued'} />
          </div>
          <p className="mt-3 text-sm text-slate-500">{book.category} · ISBN: {book.isbn || '-'}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
            <span>{book.availableCopies} of {book.totalCopies} copies available</span>
            <span className="inline-flex items-center gap-2"><Star size={14} /> {book.averageRating || 0}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <MapPin size={14} />
            {book.shelfLocation || 'Main stacks'}
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
            {action}
            <Link to={detailsPath} className="text-sm font-semibold text-academy-700">
              View details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

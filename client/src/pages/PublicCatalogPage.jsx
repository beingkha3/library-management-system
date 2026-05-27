import { Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { bookApi, borrowApi, reservationApi } from '../api/services';
import { BookCard } from '../components/BookCard';
import { BackendUnavailableState, EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { Field, PrimaryButton, SecondaryButton, inputClassName } from '../components/FormFields';
import { LogoLockup } from '../components/LogoLockup';
import { useAuth } from '../hooks/useAuth';
import { useAsyncData } from '../hooks/useAsyncData';
import { sampleBooks } from '../utils/sampleData';

const quickFilterOptions = [
  { label: 'Available now', value: 'available', type: 'availability' },
  { label: 'Computer Science', value: 'Computer Science', type: 'category' },
  { label: 'Mathematics', value: 'Mathematics', type: 'category' },
  { label: 'Physics', value: 'Physics', type: 'category' },
  { label: 'History', value: 'History', type: 'category' },
  { label: 'Electronics', value: 'Electronics', type: 'category' },
  { label: 'Most borrowed', value: 'rating-desc', type: 'sort' }
];

const sortBooks = (books, sortBy) => {
  const nextBooks = [...books];

  if (sortBy === 'title-asc') {
    nextBooks.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (sortBy === 'rating-desc') {
    nextBooks.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
  }

  if (sortBy === 'available-desc') {
    nextBooks.sort((a, b) => (b.availableCopies || 0) - (a.availableCopies || 0));
  }

  if (sortBy === 'year-desc') {
    nextBooks.sort((a, b) => (b.publishedYear || 0) - (a.publishedYear || 0));
  }

  return nextBooks;
};

export const PublicCatalogPage = ({ asHome = false }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [author, setAuthor] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [rating, setRating] = useState('');
  const [language, setLanguage] = useState('');
  const [sortBy, setSortBy] = useState('title-asc');
  const [viewMode, setViewMode] = useState('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [authPrompt, setAuthPrompt] = useState(null);
  const { data, loading, error, setData } = useAsyncData(() => bookApi.list(), []);

  const isBackendUnavailable = Boolean(error?.includes('Unable to connect to the server'));
  const sourceBooks = isBackendUnavailable ? sampleBooks : data || [];
  const dashboardPath = isAuthenticated ? { member: '/app', librarian: '/staff', admin: '/admin' }[user?.role] || '/app' : '/';

  const categories = useMemo(() => {
    const values = new Set(sourceBooks.map((book) => book.category).filter(Boolean));
    return [...values].sort();
  }, [sourceBooks]);

  const authors = useMemo(() => {
    const values = new Set(sourceBooks.flatMap((book) => book.authors || []));
    return [...values].sort();
  }, [sourceBooks]);

  const years = useMemo(() => {
    const values = new Set(sourceBooks.map((book) => book.publishedYear).filter(Boolean));
    return [...values].sort((a, b) => b - a);
  }, [sourceBooks]);

  const languages = useMemo(() => {
    const values = new Set(sourceBooks.map((book) => book.language).filter(Boolean));
    return [...values].sort();
  }, [sourceBooks]);

  const filteredBooks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const nextBooks = sourceBooks.filter((book) => {
      const matchesSearch =
        !normalizedSearch ||
        book.title?.toLowerCase().includes(normalizedSearch) ||
        book.category?.toLowerCase().includes(normalizedSearch) ||
        book.isbn?.toLowerCase().includes(normalizedSearch) ||
        (book.authors || []).some((item) => item.toLowerCase().includes(normalizedSearch));

      const matchesCategory = !category || book.category === category;
      const matchesAvailability =
        !availability ||
        (availability === 'available' ? book.availableCopies > 0 : book.availableCopies <= 0);
      const matchesAuthor = !author || (book.authors || []).includes(author);
      const matchesYear = !publicationYear || String(book.publishedYear || '') === publicationYear;
      const matchesRating = !rating || Number(book.averageRating || 0) >= Number(rating);
      const matchesLanguage = !language || book.language === language;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability &&
        matchesAuthor &&
        matchesYear &&
        matchesRating &&
        matchesLanguage
      );
    });

    return sortBooks(nextBooks, sortBy);
  }, [author, availability, category, language, publicationYear, rating, search, sortBy, sourceBooks]);

  const displayBooks = asHome ? filteredBooks.slice(0, 8) : filteredBooks;

  const showAuthPrompt = (action) => {
    setFeedback('');
    setAuthPrompt(action);
  };

  const navigateToAuth = (path) => {
    navigate(path, { state: { from: location.pathname } });
  };

  const handleBorrow = async (bookId) => {
    if (isBackendUnavailable) {
      setFeedback('Unable to connect to the server. Please make sure the backend is running.');
      return;
    }

    if (!isAuthenticated) {
      showAuthPrompt('borrow');
      return;
    }

    try {
      await borrowApi.issue({ bookId, userId: user._id });
      const nextBooks = await bookApi.list();
      setData(nextBooks);
      setFeedback('Book borrowed successfully.');
    } catch (err) {
      setFeedback(err.message);
    }
  };

  const handleReserve = async (bookId) => {
    if (isBackendUnavailable) {
      setFeedback('Unable to connect to the server. Please make sure the backend is running.');
      return;
    }

    if (!isAuthenticated) {
      showAuthPrompt('reserve');
      return;
    }

    try {
      await reservationApi.create({ bookId });
      setFeedback('Book reserved successfully.');
    } catch (err) {
      setFeedback(err.message);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setAvailability('');
    setAuthor('');
    setPublicationYear('');
    setRating('');
    setLanguage('');
    setSortBy('title-asc');
  };

  const applyQuickFilter = (item) => {
    if (item.type === 'availability') {
      setAvailability(item.value);
    }

    if (item.type === 'category') {
      setCategory(item.value);
    }

    if (item.type === 'sort') {
      setSortBy(item.value);
    }
  };

  if (loading) {
    return <LoadingState label="Loading books..." />;
  }

  if (error && !isBackendUnavailable) {
    return <ErrorState message={error} />;
  }

  const sidebarFilters = (
    <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
        <button type="button" onClick={clearFilters} className="text-sm font-semibold text-academy-700">
          Clear all
        </button>
      </div>
      <Field label="Availability">
        <select value={availability} onChange={(event) => setAvailability(event.target.value)} className={inputClassName}>
          <option value="">All books</option>
          <option value="available">Available now</option>
          <option value="reserved">Currently unavailable</option>
        </select>
      </Field>
      <Field label="Genre">
        <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClassName}>
          <option value="">All genres</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Author">
        <select value={author} onChange={(event) => setAuthor(event.target.value)} className={inputClassName}>
          <option value="">All authors</option>
          {authors.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Publication year">
        <select value={publicationYear} onChange={(event) => setPublicationYear(event.target.value)} className={inputClassName}>
          <option value="">All years</option>
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Rating">
        <select value={rating} onChange={(event) => setRating(event.target.value)} className={inputClassName}>
          <option value="">All ratings</option>
          <option value="4">4 stars and above</option>
          <option value="3">3 stars and above</option>
        </select>
      </Field>
      <Field label="Language">
        <select value={language} onChange={(event) => setLanguage(event.target.value)} className={inputClassName}>
          <option value="">All languages</option>
          {languages.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );

  const showPublicNav = !asHome && !isAuthenticated;

  return (
    <div className={`${asHome || showPublicNav ? 'min-h-screen bg-slate-50' : ''}`}>
      {showPublicNav ? (
        <>
          <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
            <div className="flex items-center justify-between">
              <LogoLockup publicMode />
              <nav className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <Link to="/login" className="rounded-xl border border-slate-200 px-4 py-2 transition hover:border-academy-200 hover:text-academy-700">
                  Sign in
                </Link>
                <Link to="/register" className="rounded-xl bg-academy-600 px-4 py-2 text-white transition hover:bg-academy-700">
                  Create account
                </Link>
              </nav>
            </div>
          </header>
          <div className="border-b border-slate-200 bg-white px-5 py-3 sm:px-8">
            <nav className="flex items-center gap-1.5 text-sm text-slate-500">
              <Link to="/" className="transition hover:text-academy-700">Home</Link>
              <span>/</span>
              <span className="text-slate-900">Books</span>
            </nav>
          </div>
        </>
      ) : null}
      <div className={asHome ? 'mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8' : showPublicNav ? 'mx-auto max-w-7xl space-y-5 px-5 py-6 sm:px-8' : 'space-y-6'}>
        {asHome ? (
          <>
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-1 py-4 sm:px-0">
              <div className="flex items-center gap-3">
                <LogoLockup publicMode />
              </div>
              <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
                <Link to="/books" className="transition hover:text-academy-700">Browse Catalog</Link>
                <Link to="/login" className="rounded-xl border border-slate-200 px-4 py-2 transition hover:border-academy-200 hover:text-academy-700">
                  Sign In
                </Link>
                <Link to="/register" className="rounded-xl bg-academy-600 px-4 py-2 text-white transition hover:bg-academy-700">
                  Create Account
                </Link>
              </nav>
            </header>

            <section className="py-8">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[38px]">Search the library catalog</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">Find books by title, author, genre, or ISBN.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className={`${inputClassName} h-14 pl-11 text-base`}
                    placeholder="Search by title, author, genre, or ISBN"
                  />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {quickFilterOptions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => applyQuickFilter(item)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-academy-200 hover:text-academy-700"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {!asHome ? (
          <>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${inputClassName} h-12 pl-11`}
                placeholder="Search by title, author, genre, or ISBN"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {quickFilterOptions.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => applyQuickFilter(item)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-academy-200 hover:text-academy-700"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {isBackendUnavailable ? (
          <BackendUnavailableState />
        ) : null}

        {feedback ? <p className="rounded-2xl bg-academy-100 px-4 py-3 text-sm text-academy-700">{feedback}</p> : null}

        {authPrompt ? (
          <div className="rounded-[24px] border border-academy-100 bg-white px-5 py-4 shadow-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  Sign in to {authPrompt === 'borrow' ? 'borrow this book' : 'reserve this title'}
                </p>
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

        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            <Filter size={16} />
            {mobileFiltersOpen ? 'Hide filters' : 'Show filters'}
          </button>
          {mobileFiltersOpen ? <div className="mt-4">{sidebarFilters}</div> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:block">{sidebarFilters}</div>

          <section>
            <div className="mb-4 flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Available books</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {asHome ? `Showing ${displayBooks.length} featured books` : `Showing ${displayBooks.length} books`}
                  {isBackendUnavailable ? ' · Sample data' : ' · Updated today'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <label htmlFor="sort-books">Sort by</label>
                  <select id="sort-books" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <option value="title-asc">Title</option>
                    <option value="year-desc">Newest</option>
                    <option value="rating-desc">Most borrowed</option>
                    <option value="available-desc">Available copies</option>
                  </select>
                </div>
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>

            {displayBooks.length ? (
              <div className={viewMode === 'grid' ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
                {displayBooks.map((book) => (
                  <BookCard
                    key={book._id}
                    book={book}
                    layout={viewMode}
                    detailsPath={isAuthenticated ? `/app/catalog/${book._id}` : `/books/${book._id}`}
                    action={
                      book.availableCopies > 0 ? (
                        <PrimaryButton type="button" onClick={() => handleBorrow(book._id)}>
                          Borrow
                        </PrimaryButton>
                      ) : (
                        <SecondaryButton type="button" onClick={() => handleReserve(book._id)}>
                          Reserve
                        </SecondaryButton>
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No books matched your filters" description="Try another title, author, genre, or clear the filters to see more results." />
            )}
          </section>
        </div>

        {asHome ? (
          <section className="mt-8 border-t border-slate-200 pt-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Library access for members</h2>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>Borrow and reserve books</li>
                  <li>Track due dates</li>
                  <li>View fines and reading history</li>
                </ul>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Library access for staff</h2>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>Manage inventory</li>
                  <li>Record borrowing and returns</li>
                  <li>Review reservations and overdue books</li>
                </ul>
              </div>
            </div>
            <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500">
              <p>Library Management System</p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/books">Browse Catalog</Link>
                <Link to="/login">Sign In</Link>
                <Link to="/register">Create Account</Link>
              </div>
            </footer>
          </section>
        ) : null}
      </div>
    </div>
  );
};

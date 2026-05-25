import { useMemo, useState } from 'react';

import { bookApi } from '../api/services';
import { DataTable } from '../components/DataTable';
import { Field, PrimaryButton, SecondaryButton, inputClassName } from '../components/FormFields';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAsyncData } from '../hooks/useAsyncData';

const initialBook = {
  title: '',
  authors: '',
  isbn: '',
  category: '',
  description: '',
  shelfLocation: '',
  totalCopies: 1,
  availableCopies: 1,
  featured: false
};

export const StaffBooksPage = () => {
  const [form, setForm] = useState(initialBook);
  const [message, setMessage] = useState('');
  const { data, loading, error, setData } = useAsyncData(() => bookApi.list(), []);

  const catalogStats = useMemo(() => {
    const books = data || [];
    const totalCopies = books.reduce((sum, book) => sum + book.totalCopies, 0);
    const availableCopies = books.reduce((sum, book) => sum + book.availableCopies, 0);
    const featuredBooks = books.filter((book) => book.featured).length;
    return { totalTitles: books.length, totalCopies, availableCopies, featuredBooks };
  }, [data]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await bookApi.create({
        ...form,
        authors: form.authors.split(',').map((item) => item.trim()).filter(Boolean),
        totalCopies: Number(form.totalCopies),
        availableCopies: Number(form.availableCopies),
        featured: Boolean(form.featured)
      });
      setMessage('Book created successfully.');
      setForm(initialBook);
      setData(await bookApi.list());
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleArchive = async (bookId) => {
    try {
      await bookApi.archive(bookId);
      setMessage('Book archived successfully.');
      setData(await bookApi.list());
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) {
    return <LoadingState label="Loading catalog management view..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Catalog operations"
        title="Collection management for title creation, stock visibility, and archive control"
        description="The catalog surface is now table-driven and operationally useful instead of card-heavy. Create titles on the left and monitor live inventory on the right."
        metadata={['Inventory aware', 'Title-level control', 'Staff-facing maintenance']}
      />

      {message ? <p className="rounded-2xl bg-academy-100 px-4 py-3 text-sm text-academy-700">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Titles</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{catalogStats.totalTitles}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total copies</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{catalogStats.totalCopies}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Available copies</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{catalogStats.availableCopies}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Featured titles</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{catalogStats.featuredBooks}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <SectionCard title="Create a title" description="Add a new book record to the live academic collection.">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input className={inputClassName} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
            </Field>
            <Field label="ISBN">
              <input className={inputClassName} value={form.isbn} onChange={(event) => setForm((current) => ({ ...current, isbn: event.target.value }))} required />
            </Field>
            <Field label="Authors" hint="Comma separated">
              <input className={inputClassName} value={form.authors} onChange={(event) => setForm((current) => ({ ...current, authors: event.target.value }))} required />
            </Field>
            <Field label="Category">
              <input className={inputClassName} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required />
            </Field>
            <Field label="Shelf location">
              <input className={inputClassName} value={form.shelfLocation} onChange={(event) => setForm((current) => ({ ...current, shelfLocation: event.target.value }))} />
            </Field>
            <Field label="Total copies">
              <input className={inputClassName} type="number" min="1" value={form.totalCopies} onChange={(event) => setForm((current) => ({ ...current, totalCopies: event.target.value }))} required />
            </Field>
            <Field label="Available copies">
              <input className={inputClassName} type="number" min="0" value={form.availableCopies} onChange={(event) => setForm((current) => ({ ...current, availableCopies: event.target.value }))} required />
            </Field>
            <Field label="Description">
              <textarea className={`${inputClassName} min-h-28`} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </Field>
            <div className="md:col-span-2 flex gap-3">
              <PrimaryButton type="submit">Create title</PrimaryButton>
              <SecondaryButton type="button" onClick={() => setForm(initialBook)}>Reset</SecondaryButton>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Live catalog table" description="Inventory-focused view of the active collection.">
          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Title',
                render: (row) => (
                  <div>
                    <p className="font-medium text-slate-900">{row.title}</p>
                    <p className="text-xs text-slate-500">{row.authors?.join(', ')}</p>
                  </div>
                )
              },
              {
                key: 'category',
                label: 'Category',
                render: (row) => <span className="text-sm text-slate-600">{row.category}</span>
              },
              {
                key: 'copies',
                label: 'Copies',
                render: (row) => `${row.availableCopies}/${row.totalCopies}`
              },
              {
                key: 'location',
                label: 'Shelf',
                render: (row) => row.shelfLocation || 'Main stacks'
              },
              {
                key: 'status',
                label: 'Availability',
                render: (row) => <StatusPill value={row.availableCopies > 0 ? 'active' : 'queued'} />
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (row) => (
                  <SecondaryButton type="button" onClick={() => handleArchive(row._id)}>
                    Archive
                  </SecondaryButton>
                )
              }
            ]}
            rows={data}
            emptyMessage="There are no active titles in the catalog yet."
          />
        </SectionCard>
      </div>
    </div>
  );
};

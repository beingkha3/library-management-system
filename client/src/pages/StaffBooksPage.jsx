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
  publisher: '',
  language: 'English',
  edition: '',
  publishedYear: '',
  pageCount: '',
  shelfLocation: '',
  totalCopies: 1,
  availableCopies: 1,
  featured: false
};

const toBookForm = (book) => ({
  title: book.title || '',
  authors: book.authors?.join(', ') || '',
  isbn: book.isbn || '',
  category: book.category || '',
  description: book.description || '',
  publisher: book.publisher || '',
  language: book.language || 'English',
  edition: book.edition || '',
  publishedYear: book.publishedYear || '',
  pageCount: book.pageCount || '',
  shelfLocation: book.shelfLocation || '',
  totalCopies: book.totalCopies ?? 1,
  availableCopies: book.availableCopies ?? 0,
  featured: Boolean(book.featured)
});

const toBookPayload = (form) => ({
  title: form.title,
  authors: form.authors.split(',').map((item) => item.trim()).filter(Boolean),
  isbn: form.isbn,
  category: form.category,
  description: form.description,
  publisher: form.publisher,
  language: form.language,
  edition: form.edition,
  publishedYear: form.publishedYear === '' ? undefined : Number(form.publishedYear),
  pageCount: form.pageCount === '' ? undefined : Number(form.pageCount),
  shelfLocation: form.shelfLocation,
  totalCopies: Number(form.totalCopies),
  availableCopies: Number(form.availableCopies),
  featured: Boolean(form.featured)
});

export const StaffBooksPage = () => {
  const [form, setForm] = useState(initialBook);
  const [editForm, setEditForm] = useState(null);
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
        ...toBookPayload(form)
      });
      setMessage('Book created successfully.');
      setForm(initialBook);
      setData(await bookApi.list());
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleEditSelect = (book) => {
    setEditForm({ _id: book._id, ...toBookForm(book) });
    setMessage(`Editing inventory for ${book.title}.`);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!editForm?._id) {
      return;
    }

    try {
      await bookApi.update(editForm._id, toBookPayload(editForm));
      setMessage('Book inventory updated successfully.');
      setEditForm(null);
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
        eyebrow="Catalog"
        title="Manage books and copy counts"
        description="Add titles, update shelf details, adjust copy counts, and remove books from the active catalog."
        metadata={['Add books', 'Update inventory', 'Archive titles']}
      />

      {message ? <p className="rounded-2xl bg-academy-100 px-4 py-3 text-sm text-academy-700">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Titles" value={catalogStats.totalTitles} tone="navy" />
        <StatCard label="Total copies" value={catalogStats.totalCopies} tone="default" />
        <StatCard label="Available copies" value={catalogStats.availableCopies} tone="green" />
        <StatCard label="Featured titles" value={catalogStats.featuredBooks} tone="blue" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
        <SectionCard title="Add a book" description="Create a new book record in the catalog.">
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
            <Field label="Publisher">
              <input className={inputClassName} value={form.publisher} onChange={(event) => setForm((current) => ({ ...current, publisher: event.target.value }))} />
            </Field>
            <Field label="Language">
              <input className={inputClassName} value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))} />
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
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <input id="featured-book" type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} />
              <label htmlFor="featured-book" className="text-sm font-medium text-slate-700">Feature this title</label>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <PrimaryButton type="submit">Create title</PrimaryButton>
              <SecondaryButton type="button" onClick={() => setForm(initialBook)}>Reset</SecondaryButton>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Edit inventory"
          description={editForm ? 'Update title details, shelf placement, and copy counts.' : 'Choose a book from the table to edit its inventory.'}
        >
          {editForm ? (
            <form onSubmit={handleEditSubmit} className="grid gap-4 md:grid-cols-2">
              <Field label="Title">
                <input className={inputClassName} value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} required />
              </Field>
              <Field label="ISBN">
                <input className={inputClassName} value={editForm.isbn} onChange={(event) => setEditForm((current) => ({ ...current, isbn: event.target.value }))} required />
              </Field>
              <Field label="Authors" hint="Comma separated">
                <input className={inputClassName} value={editForm.authors} onChange={(event) => setEditForm((current) => ({ ...current, authors: event.target.value }))} required />
              </Field>
              <Field label="Category">
                <input className={inputClassName} value={editForm.category} onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))} required />
              </Field>
              <Field label="Shelf location">
                <input className={inputClassName} value={editForm.shelfLocation} onChange={(event) => setEditForm((current) => ({ ...current, shelfLocation: event.target.value }))} />
              </Field>
              <Field label="Publisher">
                <input className={inputClassName} value={editForm.publisher} onChange={(event) => setEditForm((current) => ({ ...current, publisher: event.target.value }))} />
              </Field>
              <Field label="Total copies">
                <input className={inputClassName} type="number" min="1" value={editForm.totalCopies} onChange={(event) => setEditForm((current) => ({ ...current, totalCopies: event.target.value }))} required />
              </Field>
              <Field label="Available copies">
                <input className={inputClassName} type="number" min="0" value={editForm.availableCopies} onChange={(event) => setEditForm((current) => ({ ...current, availableCopies: event.target.value }))} required />
              </Field>
              <Field label="Description">
                <textarea className={`${inputClassName} min-h-24`} value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} />
              </Field>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <input id="edit-featured-book" type="checkbox" checked={editForm.featured} onChange={(event) => setEditForm((current) => ({ ...current, featured: event.target.checked }))} />
                  <label htmlFor="edit-featured-book" className="text-sm font-medium text-slate-700">Feature this title</label>
                </div>
                <p className="text-xs leading-5 text-slate-500">The backend prevents available copies from exceeding safe inventory after active loans and ready reservations.</p>
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <PrimaryButton type="submit">Save changes</PrimaryButton>
                <SecondaryButton type="button" onClick={() => setEditForm(null)}>Cancel</SecondaryButton>
              </div>
            </form>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">Select Edit in the catalog table to manage copies, shelf location, and title metadata.</p>
          )}
        </SectionCard>
        </div>

        <SectionCard title="Active catalog" description="Current books available to members and staff.">
          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Title',
                width: '2.5fr',
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
                width: '1fr',
                render: (row) => <span className="text-sm text-slate-600">{row.category}</span>
              },
              {
                key: 'copies',
                label: 'Copies',
                width: '0.6fr',
                render: (row) => `${row.availableCopies}/${row.totalCopies}`
              },
              {
                key: 'location',
                label: 'Shelf',
                width: '0.8fr',
                render: (row) => row.shelfLocation || 'Main stacks'
              },
              {
                key: 'status',
                label: 'Availability',
                width: '0.8fr',
                render: (row) => <StatusPill value={row.availableCopies > 0 ? 'active' : 'queued'} />
              },
              {
                key: 'actions',
                label: 'Actions',
                width: '1fr',
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <SecondaryButton type="button" className="px-3 py-2" onClick={() => handleEditSelect(row)}>
                      Edit
                    </SecondaryButton>
                    <SecondaryButton type="button" className="px-3 py-2" onClick={() => handleArchive(row._id)}>
                      Archive
                    </SecondaryButton>
                  </div>
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

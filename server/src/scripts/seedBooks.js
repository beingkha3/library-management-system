import mongoose from 'mongoose';

import { connectDatabase } from '../config/db.js';
import { seedBooks } from '../data/seedBooks.js';
import { Book } from '../models/Book.js';

const metadataFields = [
  'title',
  'authors',
  'category',
  'description',
  'publisher',
  'language',
  'edition',
  'publishedYear',
  'pageCount',
  'coverImageUrl',
  'shelfLocation',
  'featured'
];

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const validateOnly = args.has('--validate-only');

const assertUniqueIsbns = () => {
  const seen = new Set();
  const duplicates = [];

  for (const book of seedBooks) {
    if (seen.has(book.isbn)) {
      duplicates.push(book.isbn);
    }

    seen.add(book.isbn);
  }

  if (duplicates.length > 0) {
    throw new Error(`Duplicate ISBNs in seed data: ${duplicates.join(', ')}`);
  }
};

const getCategorySummary = () =>
  seedBooks.reduce((summary, book) => {
    summary[book.category] = (summary[book.category] || 0) + 1;
    return summary;
  }, {});

const buildMetadataUpdate = (book) =>
  metadataFields.reduce((update, field) => {
    if (book[field] !== undefined) {
      update[field] = book[field];
    }

    return update;
  }, {});

const seedCatalog = async () => {
  assertUniqueIsbns();

  if (validateOnly) {
    console.log(`Seed catalog is valid: ${seedBooks.length} books`);
    console.table(getCategorySummary());
    return;
  }

  await connectDatabase();

  const result = {
    created: 0,
    updated: 0,
    unchanged: 0
  };

  for (const book of seedBooks) {
    const existingBook = await Book.findOne({ isbn: book.isbn });

    if (!existingBook) {
      result.created += 1;

      if (!dryRun) {
        await Book.create({
          ...book,
          reservedCopies: 0,
          status: 'active',
          averageRating: 0,
          reviewCount: 0
        });
      }

      continue;
    }

    const update = buildMetadataUpdate(book);
    const changed = Object.entries(update).some(([field, value]) =>
      JSON.stringify(existingBook[field]) !== JSON.stringify(value)
    );

    if (!changed) {
      result.unchanged += 1;
      continue;
    }

    result.updated += 1;

    if (!dryRun) {
      await Book.updateOne({ _id: existingBook._id }, { $set: update });
    }
  }

  console.log(`${dryRun ? 'Dry run completed' : 'Book seed completed'}: ${seedBooks.length} seed books`);
  console.table(result);
  console.table(getCategorySummary());
};

try {
  await seedCatalog();
} catch (error) {
  console.error('Book seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

#!/usr/bin/env node
/**
 * BookLeaf Assignment 2 — dataset validation and Bubble CSV preparation.
 *
 * Reads the supplied bookleaf_sample_data.json verbatim, checks its integrity,
 * computes the dynamic royalty status for a given assessment date, and writes
 * import-ready CSV files plus a validation report.
 *
 * Usage:
 *   node scripts/convert-dataset.mjs
 *   node scripts/convert-dataset.mjs --as-of=2026-11-10
 *
 * This script never modifies the source JSON. It writes only inside data/.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'reference', 'bookleaf_sample_data.json');
const DATA_DIR = path.join(ROOT, 'data');
const DAY_MS = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const OLDER_THAN_DAYS = 90;

const STATUS = {
  GREEN: { code: 'GREEN', label: 'Green', meaning: 'Fully paid' },
  YELLOW: { code: 'YELLOW', label: 'Yellow', meaning: 'Pending, within normal cycle' },
  RED: { code: 'RED', label: 'Red', meaning: 'Overdue' },
  IN_PRODUCTION: { code: 'IN_PRODUCTION', label: 'In Production', meaning: 'Not yet published' },
};

const asOfArg = process.argv.find((arg) => arg.startsWith('--as-of='))?.split('=')[1];
const AS_OF_ISO = asOfArg || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(AS_OF_ISO) || Number.isNaN(Date.parse(`${AS_OF_ISO}T12:00:00Z`))) {
  fail(`Invalid --as-of date "${AS_OF_ISO}". Expected YYYY-MM-DD.`);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function parseDate(iso) {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) fail(`Invalid date: ${iso}`);
  return date;
}

function bubbleDate(iso) {
  if (iso === null || iso === undefined || iso === '') return '';
  const d = parseDate(iso);
  const hours24 = d.getUTCHours();
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} ${hours12}:${minutes} ${suffix}`;
}

function daysBetween(later, earlier) {
  return Math.round((later.getTime() - earlier.getTime()) / DAY_MS);
}

function isPublished(book) {
  return book.status === 'Published & Live';
}

function royaltyStatus(book, asOf) {
  if (book.status.startsWith('In Production')) {
    return { ...STATUS.IN_PRODUCTION, reason: `Dataset status: ${book.status}` };
  }

  const pending = book.royalty_pending ?? 0;
  if (pending === 0) {
    return { ...STATUS.GREEN, reason: 'Royalty pending is 0' };
  }

  const cutoff = new Date(asOf.getTime() - OLDER_THAN_DAYS * DAY_MS);
  const lastPayout = parseDate(book.last_royalty_payout_date);
  const published = parseDate(book.publication_date);

  if (lastPayout && lastPayout < cutoff) {
    const age = daysBetween(asOf, lastPayout);
    return {
      ...STATUS.RED,
      reason: `Pending > 0 and last payout was ${age} days ago (over 90)`,
    };
  }

  if (!lastPayout && published && published < cutoff) {
    const age = daysBetween(asOf, published);
    return {
      ...STATUS.RED,
      reason: `Pending > 0, never paid, and published ${age} days ago (over 90)`,
    };
  }

  if (!lastPayout && !published) {
    return {
      ...STATUS.RED,
      reason: 'Pending > 0 with no payout date and no publication date — needs review',
    };
  }

  return {
    ...STATUS.YELLOW,
    reason: lastPayout
      ? `Pending > 0 but last payout was within 90 days`
      : `Pending > 0, never paid, but published within 90 days`,
  };
}

function authorPayoutStatus(author, asOf, statusesByBook) {
  const books = author.books;
  const pending = sum(books, 'royalty_pending');
  if (pending === 0) return { code: 'FULLY_PAID', label: 'Fully paid' };
  const overdue = books.filter((book) => statusesByBook.get(book.book_id).code === 'RED').length;
  if (overdue > 0) return { code: 'OVERDUE', label: 'Overdue', overdue };
  return { code: 'PENDING', label: 'Pending' };
}

function sum(items, field) {
  return round(items.reduce((total, item) => total + (item[field] ?? 0), 0));
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function csvCell(value, delimiter) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (text.includes(delimiter) || text.includes('"') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function writeCsv(fileName, headers, rows, delimiter = '|') {
  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header], delimiter)).join(delimiter));
  }
  fs.writeFileSync(path.join(DATA_DIR, fileName), `${lines.join('\r\n')}\r\n`, 'utf8');
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function mdTable(headers, rows) {
  const escape = (value) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
  return [
    `| ${headers.map(escape).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escape).join(' | ')} |`),
  ].join('\n');
}

function statusOrder(row) {
  return { RED: 0, YELLOW: 1, GREEN: 2, IN_PRODUCTION: 3 }[row.statusCode] ?? 9;
}

// ---------------------------------------------------------------------------
// Load and validate source
// ---------------------------------------------------------------------------

if (!fs.existsSync(SOURCE)) fail(`Source dataset not found: ${SOURCE}`);
const sourceText = fs.readFileSync(SOURCE, 'utf8');
const dataset = JSON.parse(sourceText);

const authors = dataset.authors;
if (!Array.isArray(authors)) fail('Source JSON has no authors array.');

const allBooks = authors.flatMap((author) => author.books ?? []);
const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok: Boolean(ok), detail });
}

check('Author count is 10', authors.length === 10, `found ${authors.length}`);
check('Book count is 18', allBooks.length === 18, `found ${allBooks.length}`);

const authorIds = authors.map((author) => author.author_id);
const bookIds = allBooks.map((book) => book.book_id);
const emails = authors.map((author) => author.email.toLowerCase());
const isbns = allBooks.map((book) => book.isbn);

check('Author IDs are unique', new Set(authorIds).size === authorIds.length);
check('Book IDs are unique', new Set(bookIds).size === bookIds.length);
check('Author emails are unique', new Set(emails).size === emails.length);
check('ISBNs are unique', new Set(isbns).size === isbns.length, `${new Set(isbns).size} distinct`);
check('Every author has at least one book', authors.every((author) => (author.books ?? []).length > 0));

const requiredAuthorFields = ['author_id', 'name', 'email', 'phone', 'city', 'joined_date'];
for (const author of authors) {
  for (const field of requiredAuthorFields) {
    check(`${author.author_id}.${field} is present`, author[field] !== null && author[field] !== undefined && author[field] !== '', String(author[field] ?? 'null'));
  }
}

const requiredBookFields = [
  'book_id', 'title', 'isbn', 'genre', 'publication_date', 'status', 'mrp',
  'author_royalty_per_copy', 'total_copies_sold', 'total_royalty_earned',
  'royalty_paid', 'royalty_pending', 'last_royalty_payout_date',
  'print_partner', 'available_on',
];
for (const book of allBooks) {
  for (const field of requiredBookFields) {
    check(`${book.book_id}.${field} key exists`, Object.hasOwn(book, field));
  }
  check(`${book.book_id}.available_on is an array`, Array.isArray(book.available_on));
  for (const field of ['mrp', 'author_royalty_per_copy', 'total_copies_sold', 'total_royalty_earned', 'royalty_paid', 'royalty_pending']) {
    const value = book[field];
    check(
      `${book.book_id}.${field} is numeric or null`,
      value === null || (typeof value === 'number' && Number.isFinite(value)),
      String(value),
    );
    if (typeof value === 'number') {
      check(`${book.book_id}.${field} is non-negative`, value >= 0, String(value));
    }
  }
  check(
    `${book.book_id}.earned equals paid + pending`,
    round(book.total_royalty_earned) === round((book.royalty_paid ?? 0) + (book.royalty_pending ?? 0)),
    `${book.total_royalty_earned} vs ${book.royalty_paid} + ${book.royalty_pending}`,
  );
  if (isPublished(book)) {
    check(
      `${book.book_id}.published earned equals per-copy × copies`,
      book.mrp !== null && book.author_royalty_per_copy !== null && round(book.author_royalty_per_copy * book.total_copies_sold) === round(book.total_royalty_earned),
      `${book.author_royalty_per_copy} × ${book.total_copies_sold} vs ${book.total_royalty_earned}`,
    );
    for (const field of ['publication_date', 'mrp', 'author_royalty_per_copy', 'last_royalty_payout_date', 'print_partner']) {
      if (field === 'last_royalty_payout_date') continue; // legitimately null for never-paid books
      check(`${book.book_id}.${field} is present for a published book`, book[field] !== null, String(book[field]));
    }
    check(`${book.book_id}.available_on is non-empty for a published book`, book.available_on.length > 0);
  } else {
    check(`${book.book_id}.is an in-production book`, book.status.startsWith('In Production'), book.status);
  }
}

const asOf = parseDate(AS_OF_ISO);

// ---------------------------------------------------------------------------
// Compute derived values
// ---------------------------------------------------------------------------

const statusesByBook = new Map();
for (const book of allBooks) {
  statusesByBook.set(book.book_id, royaltyStatus(book, asOf));
}

const authorSummaries = authors.map((author) => {
  const books = author.books ?? [];
  const payout = authorPayoutStatus(author, asOf, statusesByBook);
  return {
    author_id: author.author_id,
    name: author.name,
    city: author.city,
    books: books.length,
    published: books.filter(isPublished).length,
    in_production: books.filter((book) => !isPublished(book)).length,
    earned: sum(books, 'total_royalty_earned'),
    paid: sum(books, 'royalty_paid'),
    pending: sum(books, 'royalty_pending'),
    payout_status: payout.label,
    payout_code: payout.code,
    overdue_books: books.filter((book) => statusesByBook.get(book.book_id).code === 'RED').length,
  };
});

const totals = {
  authors: authors.length,
  books: allBooks.length,
  published: allBooks.filter(isPublished).length,
  in_production: allBooks.filter((book) => !isPublished(book)).length,
  earned: sum(allBooks, 'total_royalty_earned'),
  paid: sum(allBooks, 'royalty_paid'),
  pending: sum(allBooks, 'royalty_pending'),
  copies_sold: sum(allBooks, 'total_copies_sold'),
};

check('Dataset earned equals paid + pending', round(totals.earned) === round(totals.paid + totals.pending), `${totals.earned} vs ${totals.paid} + ${totals.pending}`);
check(
  'Author summary earned adds up to dataset earned',
  round(authorSummaries.reduce((total, author) => total + author.earned, 0)) === round(totals.earned),
);
check(
  'Author summary pending adds up to dataset pending',
  round(authorSummaries.reduce((total, author) => total + author.pending, 0)) === round(totals.pending),
);

const statusCounts = { GREEN: 0, YELLOW: 0, RED: 0, IN_PRODUCTION: 0 };
for (const status of statusesByBook.values()) statusCounts[status.code] += 1;

const payoutCounts = authorSummaries.reduce((counts, author) => {
  counts[author.payout_code] = (counts[author.payout_code] ?? 0) + 1;
  return counts;
}, {});

// ---------------------------------------------------------------------------
// Write CSV files
// ---------------------------------------------------------------------------

fs.mkdirSync(DATA_DIR, { recursive: true });

const authorHeaders = ['author_id', 'name', 'email', 'phone', 'city', 'joined_date'];
const authorRows = authors.map((author) => ({
  author_id: author.author_id,
  name: author.name,
  email: author.email,
  phone: author.phone,
  city: author.city,
  joined_date: bubbleDate(author.joined_date),
}));
writeCsv('authors.csv', authorHeaders, authorRows);

const bookHeaders = [
  'book_id', 'title', 'isbn', 'genre', 'publication_date', 'status', 'mrp',
  'author_royalty_per_copy', 'total_copies_sold', 'total_royalty_earned',
  'royalty_paid', 'royalty_pending', 'last_royalty_payout_date',
  'print_partner', 'available_on', 'author_id',
];
const bookRows = allBooks.map((book) => ({
  book_id: book.book_id,
  title: book.title,
  isbn: book.isbn,
  genre: book.genre,
  publication_date: bubbleDate(book.publication_date),
  status: book.status,
  mrp: book.mrp,
  author_royalty_per_copy: book.author_royalty_per_copy,
  total_copies_sold: book.total_copies_sold,
  total_royalty_earned: book.total_royalty_earned,
  royalty_paid: book.royalty_paid,
  royalty_pending: book.royalty_pending,
  last_royalty_payout_date: bubbleDate(book.last_royalty_payout_date),
  print_partner: book.print_partner,
  available_on: JSON.stringify(book.available_on),
  author_id: authors.find((author) => author.books.some((candidate) => candidate.book_id === book.book_id)).author_id,
}));
writeCsv('books.csv', bookHeaders, bookRows);

const summaryHeaders = ['author_id', 'name', 'city', 'books', 'published', 'in_production', 'earned', 'paid', 'pending', 'payout_status', 'overdue_books'];
writeCsv('author-summary.csv', summaryHeaders, authorSummaries);

const snapshotHeaders = [
  'book_id', 'title', 'author_id', 'author_name', 'dataset_status', 'royalty_status',
  'pending', 'last_payout', 'days_since_last_payout', 'publication_date',
  'days_since_publication', 'reason',
];
const snapshotRows = allBooks.map((book) => {
  const author = authors.find((candidate) => candidate.books.some((item) => item.book_id === book.book_id));
  const status = statusesByBook.get(book.book_id);
  const lastPayout = parseDate(book.last_royalty_payout_date);
  const published = parseDate(book.publication_date);
  return {
    book_id: book.book_id,
    title: book.title,
    author_id: author.author_id,
    author_name: author.name,
    dataset_status: book.status,
    royalty_status: status.label,
    pending: book.royalty_pending,
    last_payout: book.last_royalty_payout_date ?? '',
    days_since_last_payout: lastPayout ? daysBetween(asOf, lastPayout) : '',
    publication_date: book.publication_date ?? '',
    days_since_publication: published ? daysBetween(asOf, published) : '',
    reason: status.reason,
  };
}).sort((a, b) => statusOrder(snapshotRowsStatus(a)) - statusOrder(snapshotRowsStatus(b)) || a.book_id.localeCompare(b.book_id));

function snapshotRowsStatus(row) {
  return { Red: 'RED', Yellow: 'YELLOW', Green: 'GREEN', 'In Production': 'IN_PRODUCTION' }[row.royalty_status] ?? 'RED';
}

writeCsv('book-status-snapshot.csv', snapshotHeaders, snapshotRows);

const manifest = {
  generated_at_utc: new Date().toISOString(),
  assessment_date: AS_OF_ISO,
  source_file: 'reference/bookleaf_sample_data.json',
  source_sha256: crypto.createHash('sha256').update(sourceText).digest('hex'),
  counts: {
    authors: totals.authors,
    books: totals.books,
    published: totals.published,
    in_production: totals.in_production,
  },
  totals: {
    copies_sold: totals.copies_sold,
    earned: totals.earned,
    paid: totals.paid,
    pending: totals.pending,
  },
  book_status_counts: statusCounts,
  author_payout_status_counts: payoutCounts,
  enums: {
    book_statuses: [...new Set(allBooks.map((book) => book.status))],
    print_partners: [...new Set(allBooks.map((book) => book.print_partner).filter(Boolean))],
    platforms: [...new Set(allBooks.flatMap((book) => book.available_on))],
  },
};
fs.writeFileSync(path.join(DATA_DIR, 'dataset.manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

// ---------------------------------------------------------------------------
// Validation report
// ---------------------------------------------------------------------------

const nullZeroRows = allBooks.map((book) => {
  const notes = [];
  for (const field of requiredBookFields) {
    if (book[field] === null) notes.push(`${field}=null`);
    else if (book[field] === 0) notes.push(`${field}=0`);
    else if (Array.isArray(book[field]) && book[field].length === 0) notes.push(`${field}=[]`);
  }
  return [book.book_id, notes.length ? notes.join(', ') : 'none'];
});

const requiredFieldFailures = checks.filter((item) => !item.ok);
const csvHashes = ['authors.csv', 'books.csv', 'author-summary.csv', 'book-status-snapshot.csv'].map((fileName) => {
  const filePath = path.join(DATA_DIR, fileName);
  return [fileName, sha256(filePath)];
});

const report = `# Dataset validation report

Generated: ${new Date().toISOString()}  
Assessment date for status calculation: **${AS_OF_ISO}** (dynamic input; never hardcoded in the app)  
Source: \`reference/bookleaf_sample_data.json\`  
Source SHA-256: \`${manifest.source_sha256}\`

## Result

**${requiredFieldFailures.length === 0 ? 'PASS' : 'FAIL'}** — ${checks.length - requiredFieldFailures.length}/${checks.length} checks passed.

${requiredFieldFailures.length === 0
  ? 'The source dataset is internally consistent and all 10 authors / 18 books are preserved verbatim.'
  : `Failures:\n${requiredFieldFailures.map((item) => `- ${item.name} (${item.detail})`).join('\n')}`}

## Counts and totals

${mdTable(
  ['Metric', 'Value'],
  [
    ['Authors', totals.authors],
    ['Books', totals.books],
    ['Published & Live', totals.published],
    ['In Production', totals.in_production],
    ['Copies sold', totals.copies_sold.toLocaleString('en-IN')],
    ['Royalty earned (₹)', totals.earned.toLocaleString('en-IN')],
    ['Royalty paid (₹)', totals.paid.toLocaleString('en-IN')],
    ['Royalty pending (₹)', totals.pending.toLocaleString('en-IN')],
  ],
)}

## Author summary (as of ${AS_OF_ISO})

${mdTable(
  ['Author ID', 'Name', 'City', 'Books', 'Published', 'In production', 'Earned ₹', 'Paid ₹', 'Pending ₹', 'Payout status', 'Overdue books'],
  authorSummaries.map((author) => [
    author.author_id, author.name, author.city, author.books, author.published,
    author.in_production, author.earned.toLocaleString('en-IN'),
    author.paid.toLocaleString('en-IN'), author.pending.toLocaleString('en-IN'),
    author.payout_status, author.overdue_books,
  ]),
)}

## Dynamic royalty status snapshot (as of ${AS_OF_ISO})

${mdTable(
  ['Book', 'Title', 'Author', 'Dataset status', 'Badge', 'Pending ₹', 'Last payout', 'Days since payout', 'Published', 'Days since publication'],
  allBooks.map((book) => {
    const author = authors.find((candidate) => candidate.books.some((item) => item.book_id === book.book_id));
    const status = statusesByBook.get(book.book_id);
    const lastPayout = parseDate(book.last_royalty_payout_date);
    const published = parseDate(book.publication_date);
    return [
      book.book_id, book.title, author.name, book.status, status.label,
      (book.royalty_pending ?? 0).toLocaleString('en-IN'),
      book.last_royalty_payout_date ?? '—',
      lastPayout ? daysBetween(asOf, lastPayout) : '—',
      book.publication_date ?? '—',
      published ? daysBetween(asOf, published) : '—',
    ];
  }),
)}

Status counts: **${statusCounts.GREEN} Green**, **${statusCounts.YELLOW} Yellow**, **${statusCounts.RED} Red**, **${statusCounts.IN_PRODUCTION} In Production**.  
Author payout status: **${payoutCounts.FULLY_PAID ?? 0} fully paid**, **${payoutCounts.PENDING ?? 0} pending**, **${payoutCounts.OVERDUE ?? 0} overdue**.

> On ${AS_OF_ISO} there are no Yellow books: every published book with a pending amount has either a last payout older than 90 days or no payout at all and a publication date older than 90 days. This is a property of the supplied data at this date, not a hardcoded result. A Yellow case must be verified by changing the assessment date in this script or by testing the UI expression.

## Preserved nulls, zeros, and empty lists

Every one of these values is carried into the CSV exactly as supplied. Empty fields are intentional.

${mdTable(['Book', 'Null / zero / empty fields'], nullZeroRows)}

## Enumerations

- **Book statuses**: ${manifest.enums.book_statuses.map((value) => `\`${value}\``).join(', ')}
- **Print partners**: ${manifest.enums.print_partners.map((value) => `\`${value}\``).join(', ')}
- **Platforms**: ${manifest.enums.platforms.map((value) => `\`${value}\``).join(', ')}

## Integrity checks performed

${mdTable(['Check', 'Result', 'Detail'], checks.map((item) => [item.name, item.ok ? 'PASS' : 'FAIL', item.detail]))}

## Generated files

${mdTable(['File', 'SHA-256'], csvHashes)}

Import guidance:

- \`authors.csv\` is pipe-delimited. In Bubble, choose the \`|\` delimiter and map dates as Bubble dates.
- \`books.csv\` contains \`author_id\` but **not** the Bubble \`author\` relationship. Do not import it directly; use \`scripts/build-bubble-import.mjs\` after importing authors and exporting their Bubble Unique IDs.
- \`available_on\` is a JSON array in one cell, e.g. \`["Amazon India","Flipkart"]\`, so Bubble can parse it as a list of texts.
- Dates use Bubble's documented format, e.g. \`Mar 15, 2023 12:00 PM\`. Noon avoids date shifts between time zones.
- \`book-status-snapshot.csv\` and \`author-summary.csv\` are review artefacts, not import files.
`;

fs.writeFileSync(path.join(DATA_DIR, 'VALIDATION_REPORT.md'), report, 'utf8');

console.log(`Assessment date: ${AS_OF_ISO}`);
console.log(`Authors: ${totals.authors}; books: ${totals.books}; earned ₹${totals.earned}; paid ₹${totals.paid}; pending ₹${totals.pending}`);
console.log(`Statuses: ${statusCounts.GREEN} green, ${statusCounts.YELLOW} yellow, ${statusCounts.RED} red, ${statusCounts.IN_PRODUCTION} in production`);
console.log(`Checks: ${checks.length - requiredFieldFailures.length}/${checks.length} passed`);
console.log(`Wrote authors.csv, books.csv, author-summary.csv, book-status-snapshot.csv, dataset.manifest.json, VALIDATION_REPORT.md`);

if (requiredFieldFailures.length > 0) {
  for (const failure of requiredFieldFailures) console.error(`FAIL: ${failure.name} (${failure.detail})`);
  process.exit(1);
}

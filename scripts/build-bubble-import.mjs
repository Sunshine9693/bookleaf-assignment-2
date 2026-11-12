#!/usr/bin/env node
/**
 * BookLeaf Assignment 2 — link Books to Authors for Bubble import.
 *
 * Run this only AFTER:
 *   1. importing data/authors.csv into Bubble's Author type, and
 *   2. exporting the Author type from Bubble as CSV (include "Unique ID").
 *
 * The script reads that Bubble export, verifies all 10 authors are present,
 * and writes:
 *   - data/author-id-map.csv       (author_id -> Bubble Unique ID)
 *   - data/books.bubble-import.csv (pipe-delimited, with the `author` link)
 *
 * It refuses to write a partial import file, so Books cannot be imported as
 * orphans.
 *
 * Usage:
 *   node scripts/build-bubble-import.mjs
 *   node scripts/build-bubble-import.mjs --export="C:\path\Authors.csv"
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'reference', 'bookleaf_sample_data.json');
const DATA_DIR = path.join(ROOT, 'data');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 86_400_000;

const arg = (name, fallback) => {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
};

const exportPath = path.resolve(arg('export', path.join(DATA_DIR, 'bubble-authors-export.csv')));
const outDir = path.resolve(arg('out-dir', DATA_DIR));

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function parseCsv(text, delimiter = ',') {
  const clean = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    if (quoted) {
      if (char === '"') {
        if (clean[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((candidate) => candidate.some((value) => value !== ''));
}

function parseDate(iso) {
  return iso ? new Date(`${iso}T12:00:00Z`) : null;
}

function bubbleDate(iso) {
  if (!iso) return '';
  const date = parseDate(iso);
  const hours24 = date.getUTCHours();
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()} ${hours12}:${String(date.getUTCMinutes()).padStart(2, '0')} ${suffix}`;
}

function csvCell(value, delimiter) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return text.includes(delimiter) || text.includes('"') || text.includes('\n') || text.includes('\r')
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

function writeCsv(filePath, headers, rows, delimiter = '|') {
  const lines = [headers.join(delimiter)];
  for (const row of rows) lines.push(headers.map((header) => csvCell(row[header], delimiter)).join(delimiter));
  fs.writeFileSync(filePath, `${lines.join('\r\n')}\r\n`, 'utf8');
}

// ---------------------------------------------------------------------------
// Read source and Bubble export
// ---------------------------------------------------------------------------

if (!fs.existsSync(SOURCE)) fail(`Source dataset not found: ${SOURCE}`);
if (!fs.existsSync(exportPath)) {
  fail(`Bubble Author export not found: ${exportPath}\n` +
    `Export the Author type from Bubble (Data → App data → Export) and save it there, ` +
    `or pass --export="C:\\path\\Authors.csv".`);
}

const dataset = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const authors = dataset.authors;
if (!Array.isArray(authors) || authors.length !== 10) fail('Expected 10 authors in the source dataset.');

const rows = parseCsv(fs.readFileSync(exportPath, 'utf8'));
if (rows.length < 2) fail('The Bubble export is empty or has no data rows.');

const headers = rows[0].map((header) => header.trim());
const uniqueIdIndex = headers.findIndex((header) => /^unique id$/i.test(header));
const authorIdIndex = headers.findIndex((header) => header === 'author_id');

if (uniqueIdIndex === -1) {
  fail(`The Bubble export has no "Unique ID" column. Headers found: ${headers.join(', ')}`);
}
if (authorIdIndex === -1) {
  fail(`The Bubble export has no "author_id" column. Headers found: ${headers.join(', ')}`);
}

const map = new Map();
for (const row of rows.slice(1)) {
  const authorId = (row[authorIdIndex] ?? '').trim();
  const uniqueId = (row[uniqueIdIndex] ?? '').trim();
  if (!authorId) continue;
  if (!/^\d+x\d+$/.test(uniqueId)) {
    fail(`Author ${authorId} has an unexpected Bubble Unique ID: "${uniqueId}".`);
  }
  if (map.has(authorId)) fail(`Duplicate author_id in the Bubble export: ${authorId}`);
  map.set(authorId, uniqueId);
}

const missing = authors.map((author) => author.author_id).filter((authorId) => !map.has(authorId));
const extra = [...map.keys()].filter((authorId) => !authors.some((author) => author.author_id === authorId));

if (missing.length > 0) fail(`Missing authors in the Bubble export: ${missing.join(', ')}`);
if (extra.length > 0) fail(`Unexpected authors in the Bubble export: ${extra.join(', ')}`);
if (map.size !== 10) fail(`Expected 10 author mappings, found ${map.size}.`);

// ---------------------------------------------------------------------------
// Write mapping and the import-safe Books file
// ---------------------------------------------------------------------------

fs.mkdirSync(outDir, { recursive: true });

const mapPath = path.join(outDir, 'author-id-map.csv');
writeCsv(mapPath, ['author_id', 'author_unique_id'], [...map.entries()].map(([author_id, author_unique_id]) => ({ author_id, author_unique_id })), ',');

const bookHeaders = [
  'book_id', 'title', 'isbn', 'genre', 'publication_date', 'status', 'mrp',
  'author_royalty_per_copy', 'total_copies_sold', 'total_royalty_earned',
  'royalty_paid', 'royalty_pending', 'last_royalty_payout_date',
  'print_partner', 'available_on', 'author_id', 'author',
];

const bookRows = [];
for (const author of authors) {
  for (const book of author.books) {
    bookRows.push({
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
      author_id: author.author_id,
      author: map.get(author.author_id),
    });
  }
}

if (bookRows.length !== 18) fail(`Expected 18 books, found ${bookRows.length}.`);
if (bookRows.some((book) => !book.author)) fail('At least one book has no Bubble author link. Nothing was written.');

const booksPath = path.join(outDir, 'books.bubble-import.csv');
writeCsv(booksPath, bookHeaders, bookRows);

console.log(`Mapped ${map.size}/10 authors from ${exportPath}`);
console.log(`Wrote ${mapPath}`);
console.log(`Wrote ${booksPath} (${bookRows.length} books, all with an author link)`);

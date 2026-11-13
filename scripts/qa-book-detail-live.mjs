#!/usr/bin/env node
// Check each rendered field against the supplied dataset, not against UI code.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'reference/bookleaf_sample_data.json'), 'utf8'));
const relative = 'docs/admin-detail-metadata-live.txt';
const file = path.join(root, relative);
const text = fs.readFileSync(file, 'utf8').replaceAll('\u00a0', ' ');
const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
const author = source.authors.find(author => author.author_id === 'AUTH001');
assert(lines.includes(`Author: ${author.name}`));
const visible = source.authors.flatMap(author => author.books).filter(book => lines.includes(book.title));
assert.deepEqual(visible.map(book => book.book_id).sort(), author.books.map(book => book.book_id).sort());
const checks = [];
const check = (book, field, actual, expected) => checks.push({ book_id: book.book_id, field, actual, expected, passed: actual === expected });
const datePrefix = iso => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${iso}T12:00:00Z`));
for (const book of author.books) {
  const start = lines.indexOf(book.title);
  const otherTitles = author.books.filter(other => other.book_id !== book.book_id).map(other => lines.indexOf(other.title)).filter(index => index > start);
  const section = lines.slice(start, otherTitles.length ? Math.min(...otherTitles) : lines.length);
  const fieldValues = {};
  for (const token of section.join('\n').split(/[|\n]/)) {
    const colon = token.indexOf(':');
    if (colon >= 0) fieldValues[token.slice(0, colon).trim()] = token.slice(colon + 1).trim();
  }
  check(book, 'isbn', fieldValues.ISBN, book.isbn);
  check(book, 'genre', fieldValues.Genre, book.genre);
  check(book, 'publication_date', fieldValues.Published?.startsWith(datePrefix(book.publication_date)), true);
  check(book, 'mrp', Number(fieldValues.MRP?.replace(/^Rs\s*|^₹\s*/, '').replaceAll(',', '')), book.mrp);
  check(book, 'available_on', fieldValues['Available on'], book.available_on.join(', '));
  check(book, 'total_copies_sold', Number(fieldValues['Copies sold']), book.total_copies_sold);
  // Publication status is distinct from the Green/Yellow/Red royalty badge.
  check(book, 'publication_status_visible', section.join('\n').includes(book.status), true);
}
let nullPayoutVerification = { verified: false };
const nullRelative = 'docs/admin-null-payout-live.txt';
const nullFile = path.join(root, nullRelative);
if (fs.existsSync(nullFile)) {
  const nullText = fs.readFileSync(nullFile, 'utf8');
  const nullLines = nullText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const nullAuthor = source.authors.find(author => author.author_id === 'AUTH003');
  const nullBook = nullAuthor.books[0];
  assert.equal(nullBook.last_royalty_payout_date, null);
  assert(nullLines.includes(`Author: ${nullAuthor.name}`));
  assert.deepEqual(source.authors.flatMap(author => author.books).filter(book => nullLines.includes(book.title)).map(book => book.book_id), [nullBook.book_id]);
  const titleAt = nullLines.indexOf(nullBook.title);
  assert.equal(nullLines[titleAt + 2], String(nullBook.total_royalty_earned));
  assert.equal(nullLines[titleAt + 3], String(nullBook.royalty_paid));
  assert.equal(nullLines[titleAt + 4], String(nullBook.royalty_pending));
  assert.equal(nullLines[titleAt + 5], 'No payout recorded');
  const totals = {};
  for (const [label, field, key] of [['TOTAL EARNED', 'total_royalty_earned', 'earned'], ['TOTAL PAID', 'royalty_paid', 'paid'], ['PENDING ROYALTY', 'royalty_pending', 'pending']]) {
    const value = nullLines[nullLines.indexOf(label) + 1];
    assert.equal(value, String(nullAuthor.books.reduce((sum, book) => sum + book[field], 0)));
    totals[key] = Number(value);
  }
  nullPayoutVerification = { verified: true, input: nullRelative, input_sha256: crypto.createHash('sha256').update(fs.readFileSync(nullFile)).digest('hex'), author_id: nullAuthor.author_id, book_id: nullBook.book_id, visible_books: 1, label: 'No payout recorded', totals, scope: 'Captured Ananya admin-detail no-payout case only; not in-production/null-MRP handling.' };
}
const report = {
  verified_at_utc: new Date().toISOString(),
  scope: 'Source comparison of captured Priya admin-detail metadata plus the optional captured Ananya no-payout case; not an author-role preview or all-record/in-production null-handling test.',
  input: relative, input_sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  author_id: author.author_id, checks, passed: checks.filter(check => check.passed).length, failed: checks.filter(check => !check.passed).length, null_payout_verification: nullPayoutVerification,
};
fs.writeFileSync(path.join(root, 'docs/book-detail-live-reconciliation.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${checks.length} captured metadata checks passed. Missing/mismatched fields: ${checks.filter(check => !check.passed).map(check => `${check.book_id}.${check.field}`).join(', ') || 'none'}.`);
console.log(`Ananya no-payout label, one-book scope, per-book royalties and consolidated totals: ${nullPayoutVerification.verified ? 'captured PASS' : 'not verified'}.`);
if (report.failed) process.exitCode = 1;

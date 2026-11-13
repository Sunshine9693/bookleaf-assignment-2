#!/usr/bin/env node
// Independently reconcile DOM evidence captured by the browser-owning agent.
// This script reads evidence only; it does not operate the browser or change data.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const source = read('reference/bookleaf_sample_data.json');
const rows = read('docs/admin-author-rows-live.json');
const filters = read('docs/admin-filter-live-results.json');
assert.equal(source.authors.length, 10);
assert.equal(rows.length, 10, 'Ten live rows');
assert.equal(new Set(rows.map(row => row.name)).size, 10, 'No duplicated live author rows');
const sourceByName = new Map(source.authors.map(author => [author.name, author]));
const amount = value => {
  assert.equal(typeof value, 'string', 'Rendered amount is text');
  const match = /^(?:Rs\s*|₹\s*)?(\d[\d,]*(?:\.\d{1,2})?)$/.exec(value.trim());
  assert.ok(match, 'Rendered amount uses an expected numeric currency format');
  return Number(match[1].replaceAll(',', ''));
};
const now = Date.now();
const cutoff = now - 90 * 86400000;
const overdue = book => book.status === 'Published & Live' && book.royalty_pending > 0
  && (book.last_royalty_payout_date !== null
    ? Date.parse(`${book.last_royalty_payout_date}T12:00:00+05:30`) < cutoff
    : book.publication_date === null || Date.parse(`${book.publication_date}T12:00:00+05:30`) < cutoff);
const results = rows.map(row => {
  const author = sourceByName.get(row.name);
  assert.ok(author, 'Live row belongs to an original author');
  const sum = field => author.books.reduce((total, book) => total + book[field], 0);
  const expected = { city: author.city, books: author.books.length, earned: sum('total_royalty_earned'), paid: sum('royalty_paid'), pending: sum('royalty_pending') };
  expected.status = expected.pending === 0 ? 'Fully paid' : author.books.some(overdue) ? 'Overdue' : 'Pending';
  const textLines = row.text.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  assert.equal(textLines.at(-1), 'View', 'Row has View action');
  assert.match(textLines.at(-2), /^\d+$/, 'Rendered book count precedes View');
  const actual = { city: row.city, books: Number(textLines.at(-2)), earned: amount(row.earned), paid: amount(row.paid), pending: amount(row.pending), status: row.status };
  assert.deepEqual(actual, expected, `${author.author_id} rendered fields match source`);
  return { author_id: author.author_id, expected, actual, passed: true };
});
const expectedCounts = {
  'Fully paid': results.filter(row => row.expected.status === 'Fully paid').length,
  Overdue: results.filter(row => row.expected.status === 'Overdue').length,
  Pending: results.filter(row => row.expected.status === 'Pending').length,
  All: source.authors.length,
};
assert.deepEqual(filters.map(test => test.test).sort(), Object.keys(expectedCounts).sort());
const filterResults = filters.map(test => {
  assert.equal(test.expected, expectedCounts[test.test], `${test.test} fixture expectation`);
  assert.equal(test.actual, expectedCounts[test.test], `${test.test} live count`);
  return { ...test, passed: true };
});
const totals = results.reduce((total, row) => {
  for (const field of ['books', 'earned', 'paid', 'pending']) total[field] += row.actual[field];
  return total;
}, { books: 0, earned: 0, paid: 0, pending: 0 });
assert.deepEqual(totals, { books: 18, earned: 243382, paid: 202543, pending: 40839 });
const evidenceHashes = Object.fromEntries(['docs/admin-author-rows-live.json', 'docs/admin-filter-live-results.json']
  .map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
const report = {
  verified_at_utc: new Date().toISOString(),
  scope: 'Independent reconciliation of captured live admin DOM rows and payout-filter counts against the original source; this script did not drive the browser.',
  evidence_sha256: evidenceHashes,
  authors_checked: results.length, rows: results.sort((a, b) => a.author_id.localeCompare(b.author_id)),
  filter_results: filterResults, reconciled_row_totals: totals,
  not_verified: ['Actual password login', 'Author-role isolation', 'City/name filter browser interactions absent from these JSON inputs', 'Single/bulk AI generation and callbacks', 'Visual screenshot layout'],
};
fs.writeFileSync(path.join(root, 'docs/admin-live-reconciliation.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log('PASS: all 10 captured live admin rows match source for city, book count, earned, paid, pending and payout status; all four payout filter counts match; row totals reconcile to 18 books and 243382/202543/40839.');

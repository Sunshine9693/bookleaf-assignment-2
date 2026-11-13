#!/usr/bin/env node
// Reconcile browser-captured author-session text without operating the browser.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'reference/bookleaf_sample_data.json'), 'utf8'));
const isolationPath = path.join(root, 'docs/author-isolation-live.json');
const isolation = JSON.parse(fs.readFileSync(isolationPath, 'utf8'));
const inputs = [['priya', 'AUTH001', 'docs/author-priya-live.txt'], ['rohit', 'AUTH002', 'docs/author-rohit-live.txt']];
const evidence = {};
const results = [];
const sourceBooks = source.authors.flatMap(author => author.books);
for (const [key, id, relative] of inputs) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;
  const author = source.authors.find(candidate => candidate.author_id === id);
  const text = fs.readFileSync(file, 'utf8').trim();
  const lines = text.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  assert(lines.includes(`Welcome back, ${author.name}`), `${id} personalized greeting`);
  const visible = sourceBooks.filter(book => lines.includes(book.title)).map(book => book.book_id).sort();
  assert.deepEqual(visible, author.books.map(book => book.book_id).sort(), `${id} sees exactly their own book titles`);
  const sum = field => author.books.reduce((total, book) => total + book[field], 0);
  const totals = {};
  for (const [label, field, resultKey] of [['TOTAL EARNED', 'total_royalty_earned', 'earned'], ['TOTAL PAID', 'royalty_paid', 'paid'], ['PENDING ROYALTY', 'royalty_pending', 'pending']]) {
    const index = lines.indexOf(label);
    assert(index >= 0, `${id} ${label} exists`);
    assert.match(lines[index + 1], /^\d[\d,]*(?:\.\d{1,2})?$/);
    const actual = Number(lines[index + 1].replaceAll(',', ''));
    assert.equal(actual, sum(field), `${id} ${label}`);
    totals[resultKey] = actual;
  }
  const books = author.books.map(book => {
    const titleAt = lines.indexOf(book.title);
    // These saved snapshots use the original six-field DOM creation order:
    // badge, earned, last-payout date, paid, pending, title.
    const row = lines.slice(titleAt - 5, titleAt);
    assert.equal(Number(row[1]), book.total_royalty_earned, `${book.book_id} earned`);
    assert.equal(Number(row[3]), book.royalty_paid, `${book.book_id} paid`);
    assert.equal(Number(row[4]), book.royalty_pending, `${book.book_id} pending`);
    const expectedBadge = book.royalty_pending === 0 ? 'Green — Fully paid' : 'Red — Overdue';
    assert.equal(row[0], expectedBadge, `${book.book_id} badge for current supplied data`);
    if (book.last_royalty_payout_date !== null) {
      const datePrefix = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${book.last_royalty_payout_date}T12:00:00Z`));
      assert(row[2].startsWith(datePrefix), `${book.book_id} supplied payout calendar date`);
    }
    return { book_id: book.book_id, earned: book.total_royalty_earned, paid: book.royalty_paid, pending: book.royalty_pending, badge: row[0], passed: true };
  });
  const session = isolation[key];
  if (session?.dashboard_text) assert.equal(session.dashboard_text.trim(), text, `${id} JSON/text dashboard evidence agrees`);
  const denials = (session?.denials ?? []).map(denial => {
    assert.match(denial.landed, /(?:^|\/)author-dashboard(?:[/?#]|$)/, `${id} protected admin path returns to author dashboard`);
    if (denial.text) {
      const deniedLines = denial.text.split(/\r?\n/).map(value => value.trim());
      const leaked = sourceBooks.filter(book => !author.books.some(own => own.book_id === book.book_id) && deniedLines.includes(book.title));
      assert.equal(leaked.length, 0, `${id} captured denial content contains no other book titles`);
    }
    return { requested: denial.requested, landed: denial.landed, passed: true, final_content_captured: Boolean(denial.text) };
  });
  results.push({ author_id: id, visible_book_ids: visible, totals, books, protected_admin_route_denials: denials, passed: true });
  evidence[relative] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
assert(results.some(result => result.author_id === 'AUTH001'), 'Priya evidence exists');
evidence['docs/author-isolation-live.json'] = crypto.createHash('sha256').update(fs.readFileSync(isolationPath)).digest('hex');
let logoutVerification = { verified: false };
const logoutFile = path.join(root, 'docs/logout-live.json');
if (fs.existsSync(logoutFile)) {
  const logout = JSON.parse(fs.readFileSync(logoutFile, 'utf8'));
  assert.equal(logout.control, 'author-dashboard Log out');
  assert.equal(logout.after_logout, '/version-test/login', 'Author logout lands on login');
  assert.deepEqual(logout.checks.map(check => check.requested).sort(), ['admin-dashboard', 'author-dashboard']);
  for (const check of logout.checks) assert.equal(check.landed, '/version-test/login', `Logged-out ${check.requested} redirects to login`);
  logoutVerification = { verified: true, control: logout.control, after_logout: logout.after_logout, checks: logout.checks, captured_at_utc: logout.checked_at };
  evidence['docs/logout-live.json'] = crypto.createHash('sha256').update(fs.readFileSync(logoutFile)).digest('hex');
}
const report = {
  verified_at_utc: new Date().toISOString(), captured_at_utc: isolation.checked_at,
  scope: 'Source reconciliation of captured Run as author sessions and final admin-route destinations; no browser was operated by this verifier.',
  evidence_sha256: evidence, authors_checked: results.length, results, logout_verification: logoutVerification,
  limitations: ['Run as is not email/password login', 'Logout evidence covers the author control and logged-out author-dashboard/admin-dashboard only; other logged-out routes and admin logout are not established', 'Redirect destinations alone do not establish every underlying database privacy query', 'Only saved final denial content is checked; transient navigation frames were not captured', 'Required ISBN/genre/publication/MRP/platform/copies fields are not present in these original author snapshots'],
};
fs.writeFileSync(path.join(root, 'docs/author-live-reconciliation.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`PASS: ${results.length} saved author dashboard(s) match source; ${results.reduce((count, result) => count + result.protected_admin_route_denials.length, 0)} protected-route destinations return to author-dashboard. Author logout and logged-out dashboard redirects: ${logoutVerification.verified ? 'captured PASS' : 'not verified'}. Password login remains unverified.`);

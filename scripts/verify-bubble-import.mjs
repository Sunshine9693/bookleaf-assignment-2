import fs from 'node:fs';

const exportPath = process.argv[2];
if (!exportPath) {
  console.error('Usage: node scripts/verify-bubble-import.mjs <bubble-books-export.json>');
  process.exit(2);
}

const raw = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
const data = JSON.parse(fs.readFileSync('reference/bookleaf_sample_data.json', 'utf8'));
const authorIds = JSON.parse(fs.readFileSync('data/bubble-author-ids.json', 'utf8'));

const authorById = new Map(data.authors.map((a) => [a.author_id, a]));
const expectedBooks = data.authors.flatMap((a) => a.books.map((b) => ({ ...b, author_id: a.author_id })));
const actualById = new Map(raw.map((b) => [b.book_id, b]));

const checks = [];
const add = (ok, label, expected, actual) => checks.push({ ok, label, expected, actual });

add(raw.length === 18, 'row count is 18', 18, raw.length);
add(new Set(raw.map((b) => b.book_id)).size === raw.length, 'no duplicate book_id', 'unique', raw.map((b) => b.book_id).join(','));

// Bubble stores the IST wall-clock noon as 06:30Z. Convert back to an IST calendar date.
const toIstDate = (ms) => (ms == null ? null : new Date(ms + 5.5 * 3600 * 1000).toISOString().slice(0, 10));

for (const expected of expectedBooks) {
  const actual = actualById.get(expected.book_id);
  if (!actual) {
    add(false, `${expected.book_id} exists`, 'present', 'missing');
    continue;
  }
  add(actual.title === expected.title, `${expected.book_id} title`, expected.title, actual.title);
  add(actual.isbn === expected.isbn, `${expected.book_id} isbn`, expected.isbn, actual.isbn);
  add(actual.genre === expected.genre, `${expected.book_id} genre`, expected.genre, actual.genre);
  add(actual.status === expected.status, `${expected.book_id} status`, expected.status, actual.status);
  add(actual.mrp === expected.mrp, `${expected.book_id} mrp`, expected.mrp, actual.mrp);
  add(
    actual.author_royalty_per_copy === expected.author_royalty_per_copy,
    `${expected.book_id} royalty per copy`,
    expected.author_royalty_per_copy,
    actual.author_royalty_per_copy,
  );
  add(
    actual.total_copies_sold === expected.total_copies_sold,
    `${expected.book_id} copies sold`,
    expected.total_copies_sold,
    actual.total_copies_sold,
  );
  add(
    actual.total_royalty_earned === expected.total_royalty_earned,
    `${expected.book_id} royalty earned`,
    expected.total_royalty_earned,
    actual.total_royalty_earned,
  );
  add(actual.royalty_paid === expected.royalty_paid, `${expected.book_id} royalty paid`, expected.royalty_paid, actual.royalty_paid);
  add(
    actual.royalty_pending === expected.royalty_pending,
    `${expected.book_id} royalty pending`,
    expected.royalty_pending,
    actual.royalty_pending,
  );
  add(
    toIstDate(actual.publication_date) === expected.publication_date,
    `${expected.book_id} publication date`,
    expected.publication_date,
    toIstDate(actual.publication_date),
  );
  add(
    toIstDate(actual.last_royalty_payout_date) === expected.last_royalty_payout_date,
    `${expected.book_id} last payout date`,
    expected.last_royalty_payout_date,
    toIstDate(actual.last_royalty_payout_date),
  );
  add(
    actual.print_partner === expected.print_partner,
    `${expected.book_id} print partner`,
    expected.print_partner,
    actual.print_partner,
  );
  add(
    JSON.stringify(actual.available_on) === JSON.stringify(expected.available_on),
    `${expected.book_id} available_on`,
    expected.available_on,
    actual.available_on,
  );

  const expectedAuthor = authorById.get(expected.author_id);
  add(
    actual.author_unique_id === authorIds[expected.author_id],
    `${expected.book_id} author link`,
    `${expected.author_id}`,
    actual.author_unique_id,
  );
}

const missing = expectedBooks.filter((b) => !actualById.has(b.book_id)).map((b) => b.book_id);
add(missing.length === 0, 'no missing books', 'none', missing.join(',') || 'none');

const sum = (key) => raw.reduce((n, b) => n + (b[key] || 0), 0);
add(sum('total_royalty_earned') === 243382, 'total royalty earned', 243382, sum('total_royalty_earned'));
add(sum('royalty_paid') === 202543, 'total royalty paid', 202543, sum('royalty_paid'));
add(sum('royalty_pending') === 40839, 'total royalty pending', 40839, sum('royalty_pending'));

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  if (!c.ok) console.log(`FAIL  ${c.label}: expected=${JSON.stringify(c.expected)} actual=${JSON.stringify(c.actual)}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);

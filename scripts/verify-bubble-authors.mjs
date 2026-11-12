import fs from 'node:fs';

const exportPath = process.argv[2];
if (!exportPath) {
  console.error('Usage: node scripts/verify-bubble-authors.mjs <bubble-authors-export.json>');
  process.exit(2);
}

const raw = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
const data = JSON.parse(fs.readFileSync('reference/bookleaf_sample_data.json', 'utf8'));
const idMap = JSON.parse(fs.readFileSync('data/bubble-author-ids.json', 'utf8'));

const toIstDate = (ms) => (ms == null ? null : new Date(ms + 5.5 * 3600 * 1000).toISOString().slice(0, 10));
const checks = [];
const add = (ok, label, expected, actual) => checks.push({ ok, label, expected, actual });

add(raw.length === 10, 'row count is 10', 10, raw.length);
add(new Set(raw.map((a) => a.author_id)).size === raw.length, 'no duplicate author_id', 'unique', raw.map((a) => a.author_id).join(','));

const byId = new Map(raw.map((a) => [a.author_id, a]));
for (const expected of data.authors) {
  const actual = byId.get(expected.author_id);
  if (!actual) {
    add(false, `${expected.author_id} exists`, 'present', 'missing');
    continue;
  }
  add(actual.name === expected.name, `${expected.author_id} name`, expected.name, actual.name);
  add(actual.email === expected.email, `${expected.author_id} email`, expected.email, actual.email);
  add(actual.phone === expected.phone, `${expected.author_id} phone`, expected.phone, actual.phone);
  add(actual.city === expected.city, `${expected.author_id} city`, expected.city, actual.city);
  add(
    toIstDate(actual.joined_date) === expected.joined_date,
    `${expected.author_id} joined date`,
    expected.joined_date,
    toIstDate(actual.joined_date),
  );
  add(actual.unique_id === idMap[expected.author_id], `${expected.author_id} unique id map`, idMap[expected.author_id], actual.unique_id);
}

const failed = checks.filter((c) => !c.ok);
for (const c of failed) {
  console.log(`FAIL  ${c.label}: expected=${JSON.stringify(c.expected)} actual=${JSON.stringify(c.actual)}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);

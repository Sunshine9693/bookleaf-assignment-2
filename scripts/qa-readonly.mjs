#!/usr/bin/env node
// Run the existing converter in an isolated temporary workspace. The checked-in
// source, data files and snapshots are read-only inputs to this verification.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourcePath = path.join(root, 'reference/bookleaf_sample_data.json');
const expectedHash = '34fd3b03f4b26e68b466a6364c3b7fe2f3884d3d7dc65134b67cac8e006b59f8';
const assessmentDate = process.argv.find(arg => arg.startsWith('--as-of='))?.slice('--as-of='.length)
  || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
assert.match(assessmentDate, /^\d{4}-\d{2}-\d{2}$/);
const preserved = ['reference/bookleaf_sample_data.json', ...fs.readdirSync(path.join(root, 'data')).map(f => `data/${f}`)]
  .filter(f => fs.statSync(path.join(root, f)).isFile());
const beforeHashes = Object.fromEntries(preserved.map(f => [f, sha(path.join(root, f))]));
assert.equal(beforeHashes['reference/bookleaf_sample_data.json'], expectedHash, 'Exact supplied dataset hash');
const dataset = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const authors = dataset.authors;
const books = authors.flatMap(a => a.books.map(b => ({ ...b, author_id: a.author_id })));
assert.equal(authors.length, 10);
assert.equal(books.length, 18);
assert.equal(new Set(authors.map(a => a.author_id)).size, 10);
assert.equal(new Set(books.map(b => b.book_id)).size, 18);
assert.ok(authors.every(a => a.books.length > 0));
const totals = Object.fromEntries(['total_copies_sold', 'total_royalty_earned', 'royalty_paid', 'royalty_pending']
  .map(k => [k, books.reduce((sum, b) => sum + b[k], 0)]));
assert.deepEqual(totals, { total_copies_sold: 7205, total_royalty_earned: 243382, royalty_paid: 202543, royalty_pending: 40839 });
const idMap = JSON.parse(fs.readFileSync(path.join(root, 'data/bubble-author-ids.json'), 'utf8'));
assert.deepEqual(Object.keys(idMap).sort(), authors.map(a => a.author_id).sort());
assert.equal(new Set(Object.values(idMap)).size, 10);
assert.ok(Object.values(idMap).every(v => typeof v === 'string' && v.length > 0));

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'bookleaf-qa-'));
fs.mkdirSync(path.join(scratch, 'reference'));
fs.mkdirSync(path.join(scratch, 'scripts'));
fs.copyFileSync(sourcePath, path.join(scratch, 'reference/bookleaf_sample_data.json'));
fs.copyFileSync(path.join(root, 'scripts/convert-dataset.mjs'), path.join(scratch, 'scripts/convert-dataset.mjs'));
const converterRuns = [];
const csvComparisons = [];
for (const date of [...new Set(['2026-11-10', assessmentDate])]) {
  const run = spawnSync(process.execPath, [path.join(scratch, 'scripts/convert-dataset.mjs'), `--as-of=${date}`], { cwd: scratch, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.match(run.stdout, /686\/686 passed/);
  const manifest = JSON.parse(fs.readFileSync(path.join(scratch, 'data/dataset.manifest.json'), 'utf8'));
  assert.deepEqual(manifest.book_status_counts, { GREEN: 4, YELLOW: 0, RED: 12, IN_PRODUCTION: 2 });
  converterRuns.push({ assessment_date: date, checks_passed: 686, checks_total: 686, status_counts: manifest.book_status_counts });
  if (date === '2026-11-10') {
    for (const file of ['authors.csv', 'books.csv', 'author-summary.csv', 'book-status-snapshot.csv']) {
      const generatedHash = sha(path.join(scratch, 'data', file));
      const existingHash = sha(path.join(root, 'data', file));
      assert.equal(generatedHash, existingHash, `Existing ${file} matches isolated regeneration`);
      csvComparisons.push({ file, sha256: existingHash, byte_equal: true });
    }
  }
}

// Test the actual converter's classification functions, not a rewritten model.
const converter = fs.readFileSync(path.join(root, 'scripts/convert-dataset.mjs'), 'utf8');
const declarations = converter.slice(converter.indexOf('const DAY_MS'), converter.indexOf('const asOfArg'));
const helpers = converter.slice(converter.indexOf('function fail('), converter.indexOf('function authorPayoutStatus('));
const classify = vm.runInNewContext(`${declarations}\n${helpers}\nroyaltyStatus`, { console, process });
const assessment = new Date(`${assessmentDate}T12:00:00Z`);
const day = 86400000;
const ago = n => new Date(assessment.getTime() - n * day).toISOString().slice(0, 10);
const base = { status: 'Published & Live', royalty_pending: 100, publication_date: ago(200), last_royalty_payout_date: null };
const fixtures = [
  ['fully paid, old payout', { royalty_pending: 0, last_royalty_payout_date: ago(730) }, 'GREEN'],
  ['payout 89 days ago', { last_royalty_payout_date: ago(89) }, 'YELLOW'],
  ['payout exactly 90 days ago', { last_royalty_payout_date: ago(90) }, 'YELLOW'],
  ['payout 91 days ago', { last_royalty_payout_date: ago(91) }, 'RED'],
  ['never paid, published 89 days ago', { publication_date: ago(89) }, 'YELLOW'],
  ['never paid, published exactly 90 days ago', { publication_date: ago(90) }, 'YELLOW'],
  ['never paid, published 91 days ago', { publication_date: ago(91) }, 'RED'],
  ['in production, null dates and zero pending', { status: 'In Production - Cover Design', publication_date: null, royalty_pending: 0 }, 'IN_PRODUCTION'],
  ['published pending with both dates absent', { publication_date: null }, 'RED'],
  ['published fully paid with no payout date', { royalty_pending: 0 }, 'GREEN'],
  ['in-production priority over pending', { status: 'In Production - Typesetting' }, 'IN_PRODUCTION'],
];
const boundaryResults = fixtures.map(([scenario, overrides, expected]) => {
  const actual = classify({ ...base, ...overrides }, assessment).code;
  assert.equal(actual, expected, scenario);
  return { scenario, expected, actual, passed: true };
});
const syntax = [];
for (const file of fs.readdirSync(path.join(root, 'scripts')).filter(f => f.endsWith('.mjs'))) {
  const run = spawnSync(process.execPath, ['--check', path.join(root, 'scripts', file)], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  syntax.push({ file: `scripts/${file}`, passed: true });
}
for (const [file, hash] of Object.entries(beforeHashes)) assert.equal(sha(path.join(root, file)), hash, `QA did not modify ${file}`);
const evidence = {
  verified_at_utc: new Date().toISOString(),
  assessment_date: assessmentDate,
  scope: 'Local source, generated CSV reproducibility, map structure and converter behavior only; no live Bubble/n8n assertion.',
  source_sha256: expectedHash,
  preserved_input_files: Object.keys(beforeHashes).length,
  source_and_data_unchanged: true,
  authors: authors.length, books: books.length, totals,
  relationship_map: '10/10 business IDs mapped to unique nonempty Bubble IDs; actual live links not re-exported in this run',
  converter_runs: converterRuns, csv_comparisons: csvComparisons,
  boundary_results: boundaryResults, syntax,
  cautions: [
    'Historical Bubble author/book checks (62/62 and 276/276) were not rerun: live exports are not present.',
    'Classifier fixtures do not verify Bubble conditional rendering or private data access.',
    'Negative royalty values are rejected by source validation; live UI negative-value handling remains untested.',
  ],
};
fs.writeFileSync(path.join(root, 'docs/qa-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`PASS: source hash; 10 authors/18 books; totals; 10 unique author mappings; 2 isolated converter runs (686/686 each); 4 byte-identical CSVs; ${boundaryResults.length} classifier boundaries; ${syntax.length} script syntax checks.`);
console.log(`Source and ${Object.keys(beforeHashes).length - 1} local data files unchanged. Evidence: docs/qa-evidence.json`);
// Scratch output contains sample data and is intentionally left in the OS temp
// directory for audit, outside this repository. No live export was generated.

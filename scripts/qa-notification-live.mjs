#!/usr/bin/env node
// Reconcile saved browser text only; no service requests or source-data writes.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'docs/notification-live-reconciliation.json');
const report = { verified_at_utc: new Date().toISOString(), status: 'running', scope: 'Independent reconciliation of saved notification history against original pending-author eligibility. No browser or AI execution in this script.' };
const save = () => fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
save();
try {
  const sourceFile = 'reference/bookleaf_sample_data.json';
  const evidenceFile = 'docs/notification-history-all-live.txt';
  const originalFile = 'docs/notification-history-live.txt';
  const text = fs.readFileSync(path.join(root, evidenceFile), 'utf8');
  const original = fs.readFileSync(path.join(root, originalFile), 'utf8');
  const source = JSON.parse(fs.readFileSync(path.join(root, sourceFile), 'utf8'));
  report.input_sha256 = Object.fromEntries([sourceFile, evidenceFile, originalFile].map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
  const byName = new Map(source.authors.map(author => [author.name, author]));
  const blocks = text.split(/\d+ text Author: /).slice(1);
  const field = (block, pattern, label) => {
    const match = pattern.exec(block);
    assert.ok(match, `Missing ${label}`);
    return match[1].trim();
  };
  const rows = blocks.map(block => {
    const name = field(block, /^(.+?) \| Status:/, 'author');
    const author = byName.get(name);
    assert.ok(author, 'History author belongs to source');
    const row = {
      author_id: author.author_id,
      status: field(block, /\| Status: ([^\r\n]+)/, 'status'),
      requested: field(block, /Requested: ([^\r\n]+)/, 'requested'),
      completed: field(block, /\| Completed: ([^\r\n]+)/, 'completed'),
      request_id: field(block, /Request ID: ([^\r\n]+)/, 'request ID'),
      error: field(block, /\d+ text Error: ([^\r\n]+)/, 'error'),
      summary_empty: /text Summary:\s*\r?\n/.test(block),
      subject_empty: /text Subject:\s*\r?\n/.test(block),
      model_empty: /text Model:\s*\| Completed:/.test(block),
      delivery_disabled: block.includes('Email delivery: disabled (test mode).'),
      retry_visible: block.includes('button Retry failed summary'),
    };
    assert.equal(row.status, 'Failed');
    for (const property of ['summary_empty', 'subject_empty', 'model_empty', 'delivery_disabled', 'retry_visible']) assert.equal(row[property], true, `${row.request_id} ${property}`);
    assert.match(row.request_id, /^\d+x\d+$/);
    return row;
  });
  assert.equal(rows.length, 11, 'Eleven captured requests');
  assert.equal(new Set(rows.map(row => row.request_id)).size, 11, 'Eleven distinct request IDs');
  const bulk = rows.filter(row => row.requested === 'Nov 14, 2026 10:41 am');
  const eligible = source.authors.filter(author => author.books.reduce((sum, book) => sum + book.royalty_pending, 0) > 0).map(author => author.author_id).sort();
  assert.equal(bulk.length, 9);
  assert.deepEqual(bulk.map(row => row.author_id).sort(), eligible, 'Each pending author once');
  assert.ok(!rows.some(row => row.author_id === 'AUTH008'), 'Fully paid author absent');
  const immediate = bulk.filter(row => row.error.startsWith('The summary service did not accept'));
  const timedOut = bulk.filter(row => row.error.startsWith('Summary request timed out.'));
  assert.equal(immediate.length, 2);
  assert.equal(timedOut.length, 7);
  for (const row of immediate) assert.equal(row.completed, 'Nov 14, 2026 10:41 am');
  for (const row of timedOut) assert.equal(row.completed, 'Nov 14, 2026 10:46 am');
  const older = rows.filter(row => !bulk.includes(row));
  assert.equal(older.length, 2);
  assert.ok(older.every(row => row.author_id === 'AUTH001'));
  const first = older.find(row => row.requested === 'Nov 14, 2026 9:57 am');
  const retry = older.find(row => row.requested === 'Nov 14, 2026 10:28 am');
  assert.ok(first && retry);
  assert.notEqual(first.request_id, retry.request_id);
  assert.equal(first.completed, 'Nov 14, 2026 9:57 am');
  assert.equal(retry.completed, 'Nov 14, 2026 10:28 am');
  for (const value of ['Author: Priya Sharma | Status: Failed', `Requested: ${first.requested}`, `Error: ${first.error}`, `Completed: ${first.completed}`]) assert.ok(original.includes(value), 'Original captured row values preserved');
  report.status = 'passed';
  report.total_distinct_requests = 11;
  report.bulk_window = { requested: 'Nov 14, 2026 10:41 am', eligible_author_ids: eligible, observed_author_ids: bulk.map(row => row.author_id).sort(), distinct_requests: 9, immediate_rejections: 2, timeout_failures: 7, success_count: 0, fully_paid_author_absent: true };
  report.prior_requests = { original: first, retry, distinct_ids: true, original_captured_fields_preserved: true };
  report.rows = rows;
  // 15 November read-only history UI checks: source labels resolve the prior
  // minute-window inference without changing the historical input above.
  const filterFiles = ['docs/history-status-failed-live.txt', 'docs/history-status-success-live.txt', 'docs/history-status-reset-live.txt', 'docs/history-filter-config-live.txt'];
  const [failedText, successText, resetText, configText] = filterFiles.map(file => fs.readFileSync(path.join(root, file), 'utf8'));
  for (const file of filterFiles) report.input_sha256[file] = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  const failedRows = failedText.split(/\d+ text Author: /).slice(1).map(block => {
    const name = field(block, /^(.+?) \| Status:/, 'filtered author');
    const author = byName.get(name);
    assert.ok(author);
    const observed = {
      author_id: author.author_id,
      request_id: field(block, /Request ID: ([^\r\n]+)/, 'filtered request ID'),
      source: field(block, /Source: ([^\r\n]+)/, 'trigger source'),
      status: field(block, /\| Status: ([^\r\n]+)/, 'filtered status'),
      requested: field(block, /Requested: ([^\r\n]+)/, 'filtered requested'),
      completed: field(block, /\| Completed: ([^\r\n]+)/, 'filtered completed'),
      error: field(block, /\d+ text Error: ([^\r\n]+)/, 'filtered error'),
    };
    const prior = rows.find(row => row.request_id === observed.request_id);
    assert.ok(prior, 'Filtered request belongs to full prior capture');
    for (const property of ['author_id', 'status', 'requested', 'completed', 'error']) assert.equal(observed[property], prior[property], `Prior row preserved: ${property}`);
    assert.equal(observed.source, bulk.includes(prior) ? 'Bulk' : 'Single');
    return observed;
  });
  assert.match(failedText, /Value: Failed/);
  assert.equal(failedRows.length, 11);
  assert.deepEqual(failedRows.map(row => row.request_id).sort(), rows.map(row => row.request_id).sort());
  assert.ok(!failedText.includes('No notifications match this status.'));
  assert.equal(failedRows.filter(row => row.source === 'Bulk').length, 9);
  assert.equal(failedRows.filter(row => row.source === 'Single').length, 2);
  assert.match(successText, /Value: Success/);
  assert.ok(successText.includes('No notifications match this status.'));
  assert.equal((successText.match(/\d+ text Author: /g) || []).length, 0);
  assert.match(resetText, /Value: All statuses/);
  assert.ok(!resetText.includes('No notifications match this status.'));
  assert.ok(resetText.includes('link Description: Clear filter'));
  const resetIds = [...resetText.matchAll(/Request ID: ([^\r\n]+)/g)].map(match => match[1].trim());
  assert.equal(resetIds.length, 7, 'Seven initially rendered reset rows, not total count');
  assert.equal(new Set(resetIds).size, 7);
  for (const id of resetIds) assert.ok(rows.some(row => row.request_id === id));
  assert.match(configText, /Ignore empty constraints, Value: 1/);
  assert.match(configText, /text status[\s\S]*text =[\s\S]*text status-filter[\s\S]*text 's value/);
  assert.match(configText, /text requested_at[\s\S]*text Descending order[\s\S]*text "yes"/);
  report.history_filters_15_november = {
    failed: { selected: 'Failed', matched_prior_ids: 11, source_bulk: 9, source_single: 2, empty_message: false, rows: failedRows },
    success: { selected: 'Success', rendered_rows: 0, empty_message: true },
    reset: { selected: 'All statuses', initially_rendered_rows: 7, ids_are_prior_capture_subset: true, empty_message: false, clear_filter_link_present: true, total_count_not_inferred_from_initial_render: true },
    editor_configuration: { status_equals_dropdown_value: true, ignore_empty_constraints: true, requested_at_descending: true },
  };
  report.bulk_window.source_labels_now_confirmed = true;
  report.limits = ['The original 14 November capture lacks trigger_source; the 15 November Failed-filter capture now confirms nine Bulk/two Single labels on the same eleven IDs.', 'Retry click causation is builder-reported; captures independently prove distinct coexisting Single Priya requests and preserved original displayed fields.', 'Completion times have minute precision: seven five-minute recovery outcomes are visible, but exact elapsed seconds and early-timeout rejection are not proved.', 'Reset capture contains seven initially rendered rows, not evidence of a seven-record total.', 'Original fields absent from the prior capture cannot be compared; no database transaction or concurrency proof.', 'No genuine AI generation, authenticated callback acceptance, successful bulk summaries, email delivery, or credential verification.'];
  save();
  process.stdout.write('PASS: 11 distinct preserved requests;9 source-confirmed Bulk+2 Single; all9 pending authors once, AUTH008 absent;2 immediate+7 timeout failures. Failed filter11rows, Success0+empty message, All reset7initial rows+no empty; editor filter/sort configuration matches. No AI success claimed.\n');
} catch (error) {
  report.status = 'failed';
  report.failure = String(error.message);
  save();
  throw error;
}

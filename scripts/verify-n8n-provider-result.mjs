import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { textIncludesDate } from '../n8n/lib/royalty.mjs';
import { createHash } from 'node:crypto';

const bytes = readFileSync(new URL('../n8n/provider-component-live-result.json', import.meta.url), 'utf8');
const result = JSON.parse(bytes);
assert.equal(result.evidence_date_ist, '2026-11-15');
assert.equal(result.workflow_or_run_reference, 'tpaIMrUqgNbEgBiY');
assert.equal(result.execution_id, null);
assert.equal(result.credential_reference_name, 'Header Auth account 2');
assert.equal(result.credential_value_verified, false);
assert.deepEqual(result.observed_validator_output, { valid: false, error: 'AI provider request failed after retries', request_id: 'manual-provider-AUTH001-1794684139733' });
assert.equal(result.validated_summary_present, false);
assert.equal(result.bubble_callback_executed, false);
assert.equal(result.email_sent, false);
assert.equal(result.observed_http_attempt_count, null);
assert.equal(result.upstream_http_status, null);
assert(!('summary_body' in result.observed_validator_output));
assert(!('summary_subject' in result.observed_validator_output));
assert(!/(?:sk-(?:or-v1-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|Bearer\s+[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,})/.test(bytes));
assert.equal(createHash('sha256').update(readFileSync(new URL('../n8n/royalty-summary-workflow.json', import.meta.url))).digest('hex').toUpperCase(), '66A20C051A143F2ED0B6E4FAA7023BA58BEBDA5FE4698D2C7E30A917874F8353');
const success = JSON.parse(readFileSync(new URL('../n8n/provider-component-success-result.json', import.meta.url), 'utf8'));
const capture = readFileSync(new URL('../docs/provider-success-validator-live.txt', import.meta.url), 'utf8');
const row = capture.split(/\r?\n/).find(line => line.startsWith('true\tempty\t'));
assert(row);
const fields = row.split('\t');
const output = success.observed_validator_output;
assert.equal(output.valid, true);
assert.equal(output.error, null);
assert.equal(fields[2], output.summary_subject);
assert.equal(fields[3].replaceAll('\\n', '\n'), output.summary_body);
assert.equal(fields[4], output.request_id);
assert.equal(success.provider_returned_model, 'openai/gpt-4o-mini');
const author = JSON.parse(readFileSync(new URL('../reference/bookleaf_sample_data.json', import.meta.url), 'utf8')).authors.find(a => a.author_id === 'AUTH001');
const body = output.summary_body;
for (let i = 0; i < author.books.length; i++) {
 const book = author.books[i]; const start = body.indexOf(book.title); assert(start >= 0);
 const end = i + 1 < author.books.length ? body.indexOf(author.books[i + 1].title, start + book.title.length) : body.indexOf('**Totals**', start);
 const section = body.slice(start, end);
 assert(section.includes('Copies Sold: ' + book.total_copies_sold));
 for (const [label, value] of [['Total Royalty Earned', book.total_royalty_earned], ['Royalty Paid', book.royalty_paid], ['Royalty Pending', book.royalty_pending]]) assert(section.includes(label + ': ₹' + value.toLocaleString('en-IN')));
 assert(textIncludesDate(section, book.last_royalty_payout_date));
}
for (const [label, key] of [['Earned','total_royalty_earned'],['Paid','royalty_paid'],['Pending','royalty_pending']]) assert(body.includes('Total ' + label + ': ₹' + author.books.reduce((sum, b) => sum+b[key],0).toLocaleString('en-IN')));
assert(/apologize/i.test(body) && /priority review/i.test(body) && /48 hours/.test(body));
assert(!/transaction\s+(id|reference)|payment is scheduled|will be transferred/i.test(body));
const review = {
 evidence_date_ist: '2026-11-15', scope: 'Manual provider component only; no Bubble callback or email',
 evidence_source: 'Primary builder UI capture locally compared with sanitized JSON; reviewer did not operate browser.',
 workflow_id: success.workflow_id, execution_id: null, request_id: output.request_id,
 provider_returned_model: success.provider_returned_model, automated_validator_valid: true,
 local_source_fact_checks_passed: true, body_word_count: body.trim().split(/\s+/).length,
 human_compliance_passed: false,
 human_compliance_gaps: ['Internal Royalty Status: Red/Green labels exposed','Markdown bold headings violate plain-text requirement','211 body words below250–400 requirement'],
 unsupported_transaction_or_payment_promise_observed: false,
 overall_acceptance: 'Real generation and factual checks pass; original raw summary fails human format/internal-language/length acceptance.',
 candidate_live_result: 'Not established by this earlier run'
};
assert.equal(review.body_word_count,211);
writeFileSync(new URL('../n8n/provider-component-success-review.json', import.meta.url),JSON.stringify(review,null,2)+'\n');
console.log('Historical failure and real generation evidence verified; facts pass, three human compliance gaps recorded. No network request, fabricated provider envelope or main mutation.');

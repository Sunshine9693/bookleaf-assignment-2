import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { normalizeProviderText, auditHardenedBody, parseHardenedResponse } from '../n8n/lib/provider-output-hardening.mjs';
import { validatePayload, buildPromptData, parseSummary } from '../n8n/lib/royalty.mjs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const live = JSON.parse(read('n8n/provider-component-success-result.json')).observed_validator_output;
const raw = live.summary_body;
const normalized = normalizeProviderText(raw);
assert(!normalized.includes('**'));
assert(!/Royalty Status: (Red|Green)/.test(normalized));
assert.deepEqual([...normalized.matchAll(/₹[\d,]+/g)].map(m => m[0]), [...raw.matchAll(/₹[\d,]+/g)].map(m => m[0]));
for (const text of ['Whispers of the Ganges', 'The Saffron Diaries', '15 Oct 2025', '01 Dec 2025', '342', '189', '48 hours']) assert(normalized.includes(text));
assert.equal(auditHardenedBody(normalized), '');
// Boundary tests isolate the explicit editorial length guard, not factual validation.
for (const [count, accepted] of [[199,false],[200,true],[400,true],[401,false]]) {
 const sample = Array.from({length:count}, () => 'statement').join(' ');
 assert.equal(auditHardenedBody(sample) === '', accepted, `${count}-word boundary`);
}
for (const label of ['Status: Red', 'Green status', 'badge Yellow', 'Yellow badge']) assert.equal(auditHardenedBody(label), 'AI output contains an internal badge label');
const author = JSON.parse(read('reference/bookleaf_sample_data.json')).authors.find(a => a.author_id === 'AUTH001');
const now = Date.parse('2026-11-15T00:00:00Z');
const valid = validatePayload({ headers: { 'x-bookleaf-timestamp': new Date(now).toISOString() }, body: { request_id: 'unit-only', author, books: author.books } }, now);
assert(valid.valid);
const data = buildPromptData(valid.payload, now);
// Synthetic envelope for local parser regression only, never live provider evidence.
const envelope = body => ({ choices: [{ finish_reason: 'stop', message: { content: 'SUBJECT: ' + live.summary_subject + '\nBODY:\n' + body } }] });
assert.equal(parseHardenedResponse(envelope(raw), data, parseSummary).error, 'Pending summary omits the quarterly 45-day policy');
// Synthetic local regression text only; never stored or described as an AI response.
const policyUnit = normalized + '\nUnder the general quarterly policy, royalties are normally paid within 45 days after quarter end. This does not set a payment date for the overdue balance, which remains under priority review.';
assert.equal(parseHardenedResponse(envelope(policyUnit), data, parseSummary).valid, true);
assert.match(parseHardenedResponse(envelope(policyUnit + '\nThis balance will roll over.'), data, parseSummary).error, /inapplicable/);
assert.match(parseHardenedResponse(envelope(normalized + '\nPayment is scheduled.'), data, parseSummary).error, /unsupported payment/);
assert.match(parseHardenedResponse(envelope(normalized.replace('₹11,970', '₹99,999')), data, parseSummary).error, /royalty figure/);
const candidate = JSON.parse(read('n8n/provider-output-hardening-candidate.json'));
const original = JSON.parse(read('n8n/provider-component-verification-workflow.json'));
assert.equal(candidate.active, false);
assert.deepEqual(candidate.settings, original.settings);
assert.deepEqual(candidate.nodes.find(n => n.name === 'OpenRouter AI'), original.nodes.find(n => n.name === 'OpenRouter AI'));
assert.deepEqual(candidate.connections, original.connections);
const prompt = candidate.nodes.find(n => n.name === 'Build grounded prompt');
const items = vm.runInNewContext(`(() => { ${prompt.parameters.jsCode} })()`, { $: () => ({ first: () => ({ json: valid }) }), Intl, Date });
assert(items[0].json.ai_request.messages[0].content.includes('approximately 300 words'));
assert(items[0].json.ai_request.messages[0].content.includes('FOUR explanatory paragraphs of 40–50 words EACH'));
assert(items[0].json.ai_request.messages[0].content.includes('For THIS request: overdue review AND general quarterly45day policy both apply; threshold and rollover DO NOT apply.'));
assert(items[0].json.ai_request.messages[0].content.includes('Currency figures may appear ONLY'));
assert(items[0].json.ai_request.messages[0].content.includes('target 250–350 whitespace-separated words'));
assert.equal(read('n8n/provider-hardening-build-grounded-prompt.js.txt'), prompt.parameters.jsCode + '\n');
assert.equal(items[0].json.ai_request.model, 'openai/gpt-4o-mini');
assert.equal(createHash('sha256').update(read('n8n/royalty-summary-workflow.json')).digest('hex').toUpperCase(), '66A20C051A143F2ED0B6E4FAA7023BA58BEBDA5FE4698D2C7E30A917874F8353');
console.log('Candidate local checks pass: unchanged source facts;200/199/400/401word boundaries; pending quarterly45day requirement; inapplicable rollover and promises rejected. Original realresponse is not a candidate pass. No network or main mutation.');

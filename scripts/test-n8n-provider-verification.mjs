import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const main = read('../n8n/royalty-summary-workflow.json');
const manual = read('../n8n/provider-component-verification-workflow.json');
const source = read('../reference/bookleaf_sample_data.json').authors.find(author => author.author_id === 'AUTH001');
assert.equal(manual.active, false);
assert.equal(manual.nodes.length, 5);
assert.equal(manual.nodes[0].type, 'n8n-nodes-base.manualTrigger');
assert.equal(manual.nodes.filter(node => node.type.endsWith('.httpRequest')).length, 1);
assert(!manual.nodes.some(node => /webhook|email|smtp|errorTrigger/i.test(node.type)));
for (const name of ['Build grounded prompt', 'OpenRouter AI', 'Validate AI summary']) {
  const original = main.nodes.find(node => node.name === name);
  const actual = manual.nodes.find(node => node.name === name);
  for (const key of ['type', 'typeVersion', 'parameters', 'onError', 'retryOnFail', 'maxTries', 'waitBetweenTries']) assert.deepEqual(actual[key], original[key], `${name}: ${key} must match frozen main`);
}
const http = manual.nodes.find(node => node.name === 'OpenRouter AI');
assert.equal(http.parameters.url, 'https://openrouter.ai/api/v1/chat/completions');
assert.equal(http.credentials.httpHeaderAuth.name, 'Header Auth account 2');
assert.deepEqual(Object.keys(http.credentials.httpHeaderAuth), ['name']);
assert.equal(manual.settings.executionTimeout, 120);
assert.equal(manual.settings.saveDataSuccessExecution, 'none');
assert.equal(manual.settings.saveDataErrorExecution, 'none');
assert.equal(manual.settings.saveManualExecutions, false);
assert.equal(manual.settings.saveExecutionProgress, false);
assert.deepEqual(manual.pinData, {});
assert.equal(manual.settings.errorWorkflow, undefined);
const fixture = manual.nodes.find(node => node.name === 'Request guard');
const fixtureResult = JSON.parse(JSON.stringify(vm.runInNewContext(`(function(){${fixture.parameters.jsCode}\n})()`, {}, { timeout: 1000 })[0].json));
assert.equal(fixtureResult.valid, true);
assert.equal(fixtureResult.payload.author.author_id, 'AUTH001');
assert.equal(fixtureResult.payload.totals.books, 2);
assert.deepEqual([fixtureResult.payload.totals.earned, fixtureResult.payload.totals.paid, fixtureResult.payload.totals.pending], [19908, 16338, 3570]);
for (const book of fixtureResult.payload.books) {
  const expected = source.books.find(original => original.book_id === book.book_id);
  assert(expected);
  for (const field of ['title', 'status', 'total_copies_sold', 'total_royalty_earned', 'royalty_paid', 'royalty_pending', 'publication_date', 'last_royalty_payout_date']) assert.equal(book[field], expected[field]);
}
const promptNode = manual.nodes.find(node => node.name === 'Build grounded prompt');
const prompt = JSON.parse(JSON.stringify(vm.runInNewContext(`(function(){${promptNode.parameters.jsCode}\n})()`, { $: name => { assert.equal(name, 'Request guard'); return { first: () => ({ json: fixtureResult }) }; } }, { timeout: 1000 })[0].json));
assert.equal(prompt.ai_request.model, 'openai/gpt-4o-mini');
assert.equal(prompt.ai_request.max_tokens, 800);
assert.equal(prompt.prompt_data.author.name, source.name);
assert(!JSON.stringify(prompt.ai_request).includes(source.email));
assert(!JSON.stringify(prompt.ai_request).includes(source.phone));
const validator = manual.nodes.find(node => node.name === 'Validate AI summary');
const failure = JSON.parse(JSON.stringify(vm.runInNewContext(`(function(){${validator.parameters.jsCode}\n})()`, { $: name => { assert.equal(name, 'Build grounded prompt'); return { first: () => ({ json: prompt }) }; }, $input: { first: () => ({ json: { error: { message: 'private-error-sentinel' } } }) } }, { timeout: 1000 })[0].json));
assert.equal(failure.valid, false);
assert(!JSON.stringify(failure).includes('private-error-sentinel'));
for (const output of manual.connections['OpenRouter AI'].main) assert.equal(output[0].node, 'Validate AI summary');
assert.equal(manual.connections['Validate AI summary'], undefined);
assert.equal(createHash('sha256').update(readFileSync(new URL('../n8n/royalty-summary-workflow.json', import.meta.url))).digest('hex').toUpperCase(), '66A20C051A143F2ED0B6E4FAA7023BA58BEBDA5FE4698D2C7E30A917874F8353');
console.log('Provider component artifact checks passed: exact frozen node logic, source AUTH001 figures, safe no-network error simulation, retention OFF, no callback/email/webhook, frozen main unchanged. No AI response was fabricated or requested.');

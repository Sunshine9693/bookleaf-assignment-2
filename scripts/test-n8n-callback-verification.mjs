import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const manual = JSON.parse(readFileSync(new URL('../n8n/callback-terminal-verification-workflow.json', import.meta.url), 'utf8'));
assert.equal(manual.active, false);
assert.equal(manual.nodes.length, 3);
assert.equal(manual.nodes[0].type, 'n8n-nodes-base.manualTrigger');
assert(!manual.nodes.some(node => /webhook|email|smtp/i.test(node.type)));
const code = manual.nodes.find(node => node.type === 'n8n-nodes-base.code');
const payload = JSON.parse(JSON.stringify(vm.runInNewContext(`(function(){${code.parameters.jsCode}\n})()`, {}, { timeout: 1000 })[0].json));
assert.deepEqual(payload, { request_id: '1794630479353x966706198379300900', status: 'Failed', error_message: 'The summary service did not accept this request. Check its authentication or connection, then retry.' });
assert(!('completed_at' in payload));
assert(!('summary_body' in payload));
assert(!('ai_model' in payload));
const http = manual.nodes.find(node => node.type === 'n8n-nodes-base.httpRequest');
assert.equal(http.parameters.url, 'https://sanathesunshine9693.bubbleapps.io/version-test/api/1.1/wf/n8n_callback');
assert.equal(http.parameters.authentication, 'genericCredentialType');
assert.equal(http.parameters.genericAuthType, 'httpHeaderAuth');
assert.equal(http.credentials.httpHeaderAuth.name, 'Header Auth account 3');
assert.deepEqual(Object.keys(http.credentials.httpHeaderAuth), ['name']);
assert.equal(http.retryOnFail, false);
assert.equal(http.parameters.options.timeout, 15000);
assert.equal(http.parameters.options.response.response.neverError, false);
assert.equal(http.parameters.options.redirect.redirect.followRedirects, false);
assert.equal(manual.settings.executionTimeout, 30);
assert.equal(manual.settings.saveDataErrorExecution, 'none');
assert.equal(manual.settings.saveDataSuccessExecution, 'none');
assert.equal(manual.settings.saveManualExecutions, false);
assert.equal(manual.settings.saveExecutionProgress, false);
assert.deepEqual(manual.pinData, {});
const names = new Set(manual.nodes.map(node => node.name));
for (const [name, output] of Object.entries(manual.connections)) {
  assert(names.has(name));
  for (const branch of output.main) for (const edge of branch) assert(names.has(edge.node));
}
assert.equal(createHash('sha256').update(readFileSync(new URL('../n8n/royalty-summary-workflow.json', import.meta.url))).digest('hex').toUpperCase(), '66A20C051A143F2ED0B6E4FAA7023BA58BEBDA5FE4698D2C7E30A917874F8353');
console.log('Manual terminal-callback artifact checks passed. No network request or Bubble write was performed; frozen main SHA unchanged.');

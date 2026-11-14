import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mainPath = resolve(root, 'n8n/royalty-summary-workflow.json');
const mainBytes = readFileSync(mainPath);
const expectedHash = '66A20C051A143F2ED0B6E4FAA7023BA58BEBDA5FE4698D2C7E30A917874F8353';
if (createHash('sha256').update(mainBytes).digest('hex').toUpperCase() !== expectedHash) throw new Error('Frozen main template changed; review before building component test.');
const main = JSON.parse(mainBytes);
const source = JSON.parse(readFileSync(resolve(root, 'reference/bookleaf_sample_data.json'), 'utf8'));
const author = source.authors.find(author => author.author_id === 'AUTH001');
if (!author || author.books.length !== 2) throw new Error('Expected original AUTH001 fixture with two Books.');
const library = readFileSync(resolve(root, 'n8n/lib/royalty.mjs'), 'utf8').replace(/^export /gm, '');
const body = { author: { author_id: author.author_id, name: author.name, city: author.city, joined_date: author.joined_date }, books: author.books };
const nodes = [{
  id: 'manual-provider-component-trigger',
  name: 'Run provider component check manually',
  type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [0, 0], parameters: {},
  notes: 'Independent provider component test only. No Bubble endpoint, webhook, callback, NotificationLog write or email. Keep inactive and retention OFF. A green workflow alone is not a pass: final Validate AI summary output must have valid=true and be reviewed.', notesInFlow: true,
}, {
  id: 'validate-auth001-local-fixture',
  name: 'Request guard',
  type: 'n8n-nodes-base.code', typeVersion: 2, position: [250, 0],
  parameters: { jsCode: `${library}\n\n// Source fixture AUTH001, copied read-only from the supplied dataset.\n// The name Request guard is only an alias for the unchanged prompt node lookup.\n// This manual component flow does not exercise static-data idempotency.\nconst body = ${JSON.stringify(body, null, 2)};\nbody.request_id = 'manual-provider-AUTH001-' + Date.now();\nconst input = { headers: { 'x-bookleaf-timestamp': new Date().toISOString() }, body };\nconst result = validatePayload(input);\nif (!result.valid) throw new Error(result.error);\nreturn [{ json: result }];` },
  notes: 'Validates real supplied AUTH001 book figures and computes totals/statuses through the exact local helpers. Request metadata is test-only; no source record is changed. Email and phone are absent. Node name preserves the frozen Build grounded prompt dependency; it is not a static-data lock.', notesInFlow: true,
}];
for (const [index, name] of ['Build grounded prompt', 'OpenRouter AI', 'Validate AI summary'].entries()) {
  const original = main.nodes.find(node => node.name === name);
  if (!original) throw new Error(`Missing frozen node: ${name}`);
  const node = structuredClone(original);
  node.position = [500 + 250 * index, 0];
  if (name === 'OpenRouter AI') {
    // Credential reference only. No value is read, generated, copied or embedded.
    node.credentials = { httpHeaderAuth: { name: 'Header Auth account 2' } };
    node.notes = 'Select the existing Header Auth account 2 only if it holds the approved NEW OpenRouter key. Never reuse the exposed portfolio key. Exact frozen HTTP parameters, timeout and retry behavior are preserved. No new credential is created by this reference.';
  }
  if (name === 'Validate AI summary') node.notes = 'Inspect this output, not just node colors: valid=true plus a reviewed subject/body establishes only the provider component. valid=false is a controlled rejection even if n8n marks the overall manual run green. No callback or NotificationLog write occurs.';
  nodes.push(node);
}
const connect = target => [{ node: target, type: 'main', index: 0 }];
const workflow = {
  name: 'BookLeaf — Manual Provider Component Verification', active: false, nodes,
  connections: {
    'Run provider component check manually': { main: [connect('Request guard')] },
    'Request guard': { main: [connect('Build grounded prompt')] },
    'Build grounded prompt': { main: [connect('OpenRouter AI')] },
    // Both HTTP outputs enter the same unchanged validator, which handles provider errors safely.
    'OpenRouter AI': { main: [connect('Validate AI summary'), connect('Validate AI summary')] },
  },
  settings: { executionOrder: 'v1', timezone: 'Asia/Kolkata', executionTimeout: 120, saveExecutionProgress: false, saveDataErrorExecution: 'none', saveDataSuccessExecution: 'none', saveManualExecutions: false },
  pinData: {}, tags: [],
};
const path = resolve(root, 'n8n/provider-component-verification-workflow.json');
writeFileSync(path, `${JSON.stringify(workflow, null, 2)}\n`);
if (createHash('sha256').update(readFileSync(mainPath)).digest('hex').toUpperCase() !== expectedHash) throw new Error('Unexpected main-template change.');
console.log('Prepared inactive five-node provider component workflow from source AUTH001; no network request or frozen-main change.');

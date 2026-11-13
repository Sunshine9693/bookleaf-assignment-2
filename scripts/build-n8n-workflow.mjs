import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const library = readFileSync(resolve(root, 'n8n/lib/royalty.mjs'), 'utf8').replace(/^export /gm, '');
const promptDoc = readFileSync(resolve(root, 'docs/07_AI_PROMPT_SPEC.md'), 'utf8');
const systemPrompt = promptDoc.split('## 2. System prompt')[1].match(/```text\r?\n([\s\S]*?)\r?\n```/)[1];
const callbackUrl = 'https://sanathesunshine9693.bubbleapps.io/version-test/api/1.1/wf/n8n_callback';
const nodes = [];
const connections = {};
const add = (name, type, position, parameters, extra = {}) => {
  nodes.push({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, type: `n8n-nodes-base.${type}`, typeVersion: ({ webhook: 2, code: 2, if: 2.2, respondToWebhook: 1.4, httpRequest: 4.2, stickyNote: 1, errorTrigger: 1, stopAndError: 1 })[type], position, parameters, ...extra });
};
const link = (from, to, output = 0) => {
  connections[from] ??= { main: [] };
  connections[from].main[output] ??= [];
  connections[from].main[output].push({ node: to, type: 'main', index: 0 });
};
const code = (name, position, invocation) => add(name, 'code', position, { jsCode: `${library}\n\n${invocation}` });
const condition = (name, position, expression) => add(name, 'if', position, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, combinator: 'and', conditions: [{ id: `${name}-condition`, leftValue: expression, rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] }, options: {} });
const respond = (name, position, body, responseCode) => add(name, 'respondToWebhook', position, { respondWith: 'json', responseBody: body, options: { responseCode } });
const http = (name, position, url, body, timeout, credentialsName, extra = {}) => add(name, 'httpRequest', position, { method: 'POST', url, authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendBody: true, specifyBody: 'json', jsonBody: body, options: { timeout, redirect: { redirect: { followRedirects: false } } } }, { retryOnFail: true, maxTries: 3, waitBetweenTries: 3000, credentials: { httpHeaderAuth: { name: credentialsName } }, ...extra });

add('Webhook royalty summary', 'webhook', [0, 0], { httpMethod: 'POST', path: 'bookleaf-royalty-summary', authentication: 'headerAuth', responseMode: 'responseNode', options: {} }, { webhookId: 'bookleaf-royalty-summary', credentials: { httpHeaderAuth: { name: 'BookLeaf webhook secret' } } });
code('Validate payload', [230, 0], 'const result = validatePayload($input.first().json);\nreturn [{ json: result }];');
condition('Payload valid', [460, 0], '={{ $json.valid }}');
respond('Reject invalid payload', [680, 200], '={{ { accepted: false, error: $json.error } }}', 400);
code('Request guard', [680, -100], "const payload = $input.first().json.payload;\nconst guard = guardRequest($getWorkflowStaticData('global'), payload);\nreturn [{ json: { ...guard, payload } }];");
condition('Request accepted', [920, -100], '={{ $json.accepted }}');
respond('Reject duplicate request', [1160, 150], '={{ { accepted: false, duplicate: $json.exact_duplicate, request_id: $json.payload.request_id, error: $json.error } }}', '={{ $json.response_code }}');
respond('Accept 202', [1160, -200], '={{ { accepted: true, request_id: $json.payload.request_id } }}', 202);
code('Build grounded prompt', [1390, -200], `const payload = $('Request guard').first().json.payload;\nconst data = buildPromptData(payload);\nreturn [{ json: { request_id: payload.request_id, prompt_data: data, model: MODEL, ai_request: { model: MODEL, messages: [{ role: 'system', content: ${JSON.stringify(systemPrompt)} }, { role: 'user', content: 'USER DATA\\n' + JSON.stringify(data) + '\\nWrite the royalty summary email. Use only these figures; never invent transactions or payment promises.' }], temperature: 0.2, max_tokens: 800 } } }];`);
http('OpenRouter AI', [1640, -200], 'https://openrouter.ai/api/v1/chat/completions', '={{ $json.ai_request }}', 30000, 'BookLeaf OpenRouter new key', { onError: 'continueErrorOutput' });
code('Validate AI summary', [1870, -300], "const context = $('Build grounded prompt').first().json;\nconst parsed = parseSummary($input.first().json, context.prompt_data);\nreturn [{ json: { ...parsed, request_id: context.request_id } }];");
condition('Summary valid', [2100, -300], '={{ $json.valid }}');
code('Success callback payload', [2340, -400], "const input = $input.first().json;\nreturn [{ json: { request_id: input.request_id, status: 'Success', completed_at: new Date().toISOString(), summary_subject: input.summary_subject, summary_body: input.summary_body, ai_model: MODEL, error_message: '', n8n_execution_id: String($execution.id) } }];");
code('Failure callback payload', [2340, 0], "const input = $input.first().json;\nlet requestId = input.request_id;\nif (!requestId) requestId = $('Build grounded prompt').first().json.request_id;\nconst safeReason = typeof input.error === 'string' && input.error.startsWith('AI output') ? input.error : 'AI generation failed after retries or failed validation. Check the n8n execution.';\nreturn [{ json: { request_id: requestId, status: 'Failed', completed_at: new Date().toISOString(), summary_subject: '', summary_body: '', ai_model: MODEL, error_message: safeReason.slice(0, 1000), n8n_execution_id: String($execution.id) } }];");
http('Success callback to Bubble', [2580, -400], callbackUrl, '={{ $json }}', 15000, 'BookLeaf Bubble callback bearer', { onError: 'continueErrorOutput' });
http('Failure callback to Bubble', [2580, 0], callbackUrl, '={{ $json }}', 15000, 'BookLeaf Bubble callback bearer', { onError: 'continueErrorOutput' });
add('Callback delivery failed', 'stopAndError', [2830, 200], { errorType: 'errorMessage', errorMessage: 'Bubble callback delivery failed after three attempts. Inspect this execution; the Bubble stale-log handler must mark the request Failed. Do not regenerate the AI summary merely to retry delivery.' });
add('Receive and validate', 'stickyNote', [-40, -480], { content: '## Receive and validate\nHeader Auth credential is required before activation. Timestamp must be within ±300 seconds. Books and totals are validated; statuses are recomputed from dates. No real email is sent.', height: 240, width: 620, color: 5 });
add('Idempotency limitation', 'stickyNote', [640, -620], { content: '## Important: sequential-demo guard\nStatic data is a secondary server-side guard, not an atomic lock. Exact request IDs are remembered for 24 hours after successful workflow executions; an author is throttled for 60 seconds. Static data does not persist in manual tests or after failed executions, and may race across concurrent executions. Bubble must create and guard NotificationLog first. Do not claim concurrent exactly-once processing. Replace with an atomic unique-key store before production.', height: 340, width: 640, color: 3 });
add('Generate and return', 'stickyNote', [1380, -650], { content: '## Generate and return\nOpenRouter credential must use a newly configured key, never the exposed portfolio key. Provider receives only the allowlisted author/book data, without email or phone. Failure never becomes a fake Success. Callback URL is fixed; payloads cannot choose another destination. Three attempts per HTTP node; callback errors fail the execution visibly. Execution-data saving is OFF because incoming webhook headers include the shared secret. Bubble NotificationLog and the safe error audit retain operational results. Keep this draft inactive until Bubble authentication, terminal-state guards and stale handling are verified.', height: 380, width: 850, color: 5 });

link('Webhook royalty summary', 'Validate payload');
link('Validate payload', 'Payload valid');
link('Payload valid', 'Request guard', 0);
link('Payload valid', 'Reject invalid payload', 1);
link('Request guard', 'Request accepted');
link('Request accepted', 'Accept 202', 0);
link('Request accepted', 'Reject duplicate request', 1);
link('Accept 202', 'Build grounded prompt');
link('Build grounded prompt', 'OpenRouter AI');
link('OpenRouter AI', 'Validate AI summary', 0);
link('OpenRouter AI', 'Failure callback payload', 1);
link('Validate AI summary', 'Summary valid');
link('Summary valid', 'Success callback payload', 0);
link('Summary valid', 'Failure callback payload', 1);
link('Success callback payload', 'Success callback to Bubble');
link('Failure callback payload', 'Failure callback to Bubble');
link('Success callback to Bubble', 'Callback delivery failed', 1);
link('Failure callback to Bubble', 'Callback delivery failed', 1);

const workflow = { name: 'BookLeaf — Royalty Summary', nodes, connections, active: false, settings: { executionOrder: 'v1', timezone: 'Asia/Kolkata', executionTimeout: 180, saveExecutionProgress: false, saveDataErrorExecution: 'none', saveDataSuccessExecution: 'none', saveManualExecutions: false }, pinData: {}, tags: [] };
writeFileSync(resolve(root, 'n8n/royalty-summary-workflow.json'), `${JSON.stringify(workflow, null, 2)}\n`);

const errorWorkflow = { name: 'BookLeaf — Royalty Summary Error Audit', active: false, nodes: [
  { id: 'error-trigger', name: 'Unhandled workflow failure', type: 'n8n-nodes-base.errorTrigger', typeVersion: 1, position: [0, 0], parameters: {} },
  { id: 'safe-error-record', name: 'Keep safe execution reference', type: 'n8n-nodes-base.code', typeVersion: 2, position: [250, 0], parameters: { jsCode: "const data = $input.first().json;\nreturn [{json:{workflow_name:String(data.workflow?.name ?? 'BookLeaf — Royalty Summary'),execution_id:String(data.execution?.id ?? ''),last_node:String(data.execution?.lastNodeExecuted ?? ''),error:'Royalty workflow failed. Inspect the private execution; no author payload or secrets are copied to this audit workflow.',recorded_at:new Date().toISOString()}}];" } },
], connections: { 'Unhandled workflow failure': { main: [[{ node: 'Keep safe execution reference', type: 'main', index: 0 }]] } }, settings: { executionOrder: 'v1', timezone: 'Asia/Kolkata', saveDataErrorExecution: 'all', saveDataSuccessExecution: 'all' }, pinData: {}, tags: [] };
writeFileSync(resolve(root, 'n8n/royalty-summary-error-workflow.json'), `${JSON.stringify(errorWorkflow, null, 2)}\n`);
console.log(`Generated inactive main workflow (${nodes.length} nodes) and error-audit workflow.`);

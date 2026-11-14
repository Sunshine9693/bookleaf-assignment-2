import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const sha = path => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex').toUpperCase();
const canonical = value => Array.isArray(value) ? value.map(canonical) : value !== null && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])) : value;
const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
function differences(a, b, path = '') {
  if (same(a, b)) return [];
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return [path || '(root)'];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].flatMap(key => differences(a[key], b[key], path ? `${path}.${key}` : key));
}
function graphEdges(graph) {
  return Object.entries(graph).flatMap(([from, outputs]) => (outputs.main ?? []).flatMap((branch, output) => (branch ?? []).map(edge => ({ from, output, to: edge.node, type: edge.type, index: edge.index })))).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
const secretPatterns = [
  /sk-(?:or-v1-)?[A-Za-z0-9_-]{20,}/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/,
  /Bearer\s+[A-Za-z0-9_-]{20,}/i,
];
function secretLocations(value, path = '') {
  const findings = [];
  if (typeof value === 'string') {
    if (secretPatterns.some(pattern => pattern.test(value))) findings.push(path);
  } else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      const location = path ? `${path}.${key}` : key;
      if (/^(?:password|api_?key|access_?token|refresh_?token|client_?secret|private_?key|authorization)$/i.test(key) && typeof item === 'string' && item.trim()) findings.push(location);
      findings.push(...secretLocations(item, location));
    }
    if (typeof value.name === 'string' && /^(?:Authorization|X-BookLeaf-Key)$/i.test(value.name) && typeof value.value === 'string' && value.value.trim()) findings.push(`${path}.value`);
  }
  return [...new Set(findings)];
}
function inspect(localPath, livePath, expectedId, expectedActive) {
  const template = read(localPath);
  const live = read(livePath);
  const byName = new Map((live.nodes ?? []).map(node => [node.name, node]));
  const nodeComparisons = template.nodes.map(node => {
    const actual = byName.get(node.name);
    const comparedFields = ['type', 'typeVersion', 'parameters', 'onError', 'retryOnFail', 'maxTries', 'waitBetweenTries', 'disabled'];
    const paths = actual ? comparedFields.flatMap(field => differences(node[field], actual[field], field)) : ['missing node'];
    const normalizedActual = actual ? structuredClone(actual) : null;
    const normalizations = [];
    if (normalizedActual?.type === 'n8n-nodes-base.stopAndError' && normalizedActual.parameters.errorType === undefined && node.parameters.errorType === 'errorMessage') {
      normalizedActual.parameters.errorType = 'errorMessage';
      normalizations.push('Omitted StopAndError errorType uses the official node default errorMessage.');
    }
    const normalizedPaths = normalizedActual ? comparedFields.flatMap(field => differences(node[field], normalizedActual[field], field)) : ['missing node'];
    return { name: node.name, matching_runtime_fields: paths.length === 0, different_paths: paths, semantically_equivalent_runtime_fields: normalizedPaths.length === 0, known_default_normalizations: normalizations, code_matches: node.type.endsWith('.code') && actual ? node.parameters.jsCode === actual.parameters?.jsCode : null };
  });
  const credentialReferences = (live.nodes ?? []).filter(node => node.credentials).map(node => ({ node: node.name, references: Object.entries(node.credentials).map(([type, reference]) => ({ type, name: reference.name ?? '(unnamed)', reference_fields_only: Object.keys(reference).every(key => ['id', 'name'].includes(key)), id_present: typeof reference.id === 'string' && reference.id.length > 0 })) }));
  const saveKeys = ['saveDataErrorExecution', 'saveDataSuccessExecution', 'saveManualExecutions', 'saveExecutionProgress'];
  const retention = Object.fromEntries(saveKeys.map(key => [key, live.settings?.[key] ?? '(unset)']));
  const none = retention.saveDataErrorExecution === 'none' && retention.saveDataSuccessExecution === 'none' && retention.saveManualExecutions === false && retention.saveExecutionProgress === false;
  const secretPaths = secretLocations(live);
  const unexpectedNames = [...byName.keys()].filter(name => !template.nodes.some(node => node.name === name));
  const cleanPinned = live.pinData === undefined || (live.pinData !== null && typeof live.pinData === 'object' && Object.keys(live.pinData).length === 0);
  const cleanStatic = live.staticData === undefined || live.staticData === null || (typeof live.staticData === 'object' && Object.keys(live.staticData).length === 0);
  const result = {
    template: localPath, exported_file: livePath, template_sha256: sha(localPath), exported_sha256: sha(livePath),
    workflow_id_matches_expected: live.id === expectedId, workflow_id: live.id ?? null, workflow_name: live.name ?? null,
    active: live.active ?? '(unset)', active_matches_expected: live.active === expectedActive,
    node_count: live.nodes?.length ?? 0, unique_node_names: byName.size === live.nodes?.length,
    node_comparisons: nodeComparisons, unexpected_node_names: unexpectedNames,
    connections_match_template: same(template.connections, live.connections),
    connection_edges_match_template: same(graphEdges(template.connections), graphEdges(live.connections)),
    template_edge_count: graphEdges(template.connections).length,
    live_edge_count: graphEdges(live.connections).length,
    retention, all_execution_data_retention_off: none,
    timezone: live.settings?.timezone ?? '(unset)', execution_timeout_seconds: live.settings?.executionTimeout ?? '(unset)',
    error_workflow_id: live.settings?.errorWorkflow ?? null,
    pin_data_empty: cleanPinned, static_data_empty: cleanStatic,
    credential_references: credentialReferences, credential_value_validity: 'Not checked; references and UI selection do not verify credential values.',
    credential_pattern_findings: secretPaths.map(path => ({ path, value: '(not printed)' })),
    additional_setting_names: Object.keys(live.settings ?? {}).filter(key => !(key in (template.settings ?? {}))),
  };
  result.review_required = nodeComparisons.some(node => !node.semantically_equivalent_runtime_fields) || unexpectedNames.length > 0 || !result.connection_edges_match_template || !none || !cleanPinned || !cleanStatic || secretPaths.length > 0 || credentialReferences.some(node => node.references.some(reference => !reference.reference_fields_only));
  return result;
}
const main = inspect('n8n/royalty-summary-workflow.json', 'n8n/royalty-summary-live-export.json', 'THfIQmhfGo1r8Hzk', false);
const error = inspect('n8n/royalty-summary-error-workflow.json', 'n8n/royalty-summary-error-live-export.json', 'CNrpnRtjpWmuCFjq', true);
const report = {
  checked_at: new Date().toISOString(), review_type: 'Read-only local export comparison and credential-pattern scan; no network request or live execution.',
  main, error,
  main_error_workflow_link_matches: main.error_workflow_id === 'CNrpnRtjpWmuCFjq',
  frozen_main_unchanged: main.template_sha256 === '66A20C051A143F2ED0B6E4FAA7023BA58BEBDA5FE4698D2C7E30A917874F8353',
  known_serialization_differences: ['Live StopAndError omits the default errorType=errorMessage; this is equivalent to the template.', 'n8n exports unconnected success branches as empty arrays instead of template null entries; the 18 actual graph edges are identical.'],
  default_reference: 'https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/StopAndError/StopAndError.node.ts',
  limits: ['Credential values were neither printed nor verified.', 'Pattern scans cannot prove absence of every possible secret.', 'UI export contents are configuration evidence, not live AI/callback acceptance.', 'Free-plan workflow-testing limit blocks further live integration testing.', 'Error-handler output is transient; Bubble NotificationLog is the durable operational record.'],
};
report.local_export_configuration_checks_passed = !main.review_required && !error.review_required && report.main_error_workflow_link_matches && report.frozen_main_unchanged && main.active_matches_expected && error.active_matches_expected && main.workflow_id_matches_expected && error.workflow_id_matches_expected;
writeFileSync(resolve(root, 'n8n/live-export-verification.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.local_export_configuration_checks_passed) process.exitCode = 1;

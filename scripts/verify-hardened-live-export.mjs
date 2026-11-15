import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sha=p=>createHash('sha256').update(read(p)).digest('hex').toUpperCase();
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,canonical(x)])):v;
const same=(a,b)=>assert.equal(JSON.stringify(canonical(a))===JSON.stringify(canonical(b)),true,'Configuration mismatch; values withheld');
const edges=w=>Object.entries(w.connections).flatMap(([from,ports])=>(ports.main??[]).flatMap((branch,output)=>(branch??[]).map(e=>({from,output,...e})))).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
const paths={prepared:'n8n/royalty-summary-hardened-workflow.json',live:'n8n/royalty-summary-hardened-live-export.json',historical:'n8n/royalty-summary-live-export.json'};
const prepared=JSON.parse(read(paths.prepared)),live=JSON.parse(read(paths.live)),historical=JSON.parse(read(paths.historical));
assert.equal(live.id,'THfIQmhfGo1r8Hzk');assert.equal(live.active,false);
assert.equal(live.nodes.length,20);assert.equal(new Set(live.nodes.map(n=>n.name)).size,20);
const comparisons=[];
for(const expected of prepared.nodes){
 const actual=live.nodes.find(n=>n.name===expected.name);assert(actual);
 const normalized=structuredClone(actual);
 if(expected.type==='n8n-nodes-base.stopAndError'&&normalized.parameters.errorType===undefined)normalized.parameters.errorType='errorMessage';
 const promoted=['Build grounded prompt','Validate AI summary'].includes(expected.name);
 if(promoted){
  const txt=expected.name==='Build grounded prompt'?'n8n/provider-hardening-build-grounded-prompt.js.txt':'n8n/provider-hardening-validate-ai-summary.js.txt';
  assert.equal(actual.parameters.jsCode===read(txt),true,'Promoted Code must match supplied TXT exactly');
  assert.equal(actual.parameters.jsCode===expected.parameters.jsCode+'\n',true,'Only one terminal newline is allowed');
  normalized.parameters.jsCode=expected.parameters.jsCode;
 }
 for(const key of ['type','typeVersion','parameters','onError','retryOnFail','maxTries','waitBetweenTries','disabled'])same(normalized[key],expected[key]);
 comparisons.push({node:expected.name,runtime_fields_match:true,code_exact_to_prepared_json:expected.type==='n8n-nodes-base.code'?expected.parameters.jsCode===actual.parameters.jsCode:null,promoted_code_exact_to_supplied_txt:promoted?true:null,normalization:promoted?'One terminal newline from supplied TXT; no executable Code change':null});
}
same(edges(prepared),edges(live));assert.equal(edges(live).length,18);
same(live.settings,historical.settings);
for(const [key,value]of Object.entries({saveDataErrorExecution:'none',saveDataSuccessExecution:'none',saveExecutionProgress:false,saveManualExecutions:false,executionTimeout:180,timezone:'Asia/Kolkata',errorWorkflow:'CNrpnRtjpWmuCFjq'}))same(live.settings[key],value);
assert.equal(Object.keys(live.pinData??{}).length,0);assert.equal(Object.keys(live.staticData??{}).length,0);
const expectedNames={'Webhook royalty summary':'Header Auth account','OpenRouter AI':'Header Auth account 2','Success callback to Bubble':'Header Auth account 3','Failure callback to Bubble':'Header Auth account 3'};
const credentials=[];
for(const node of live.nodes.filter(n=>n.credentials)){
 assert(expectedNames[node.name]);const ref=node.credentials.httpHeaderAuth;
 assert.equal(ref.name,expectedNames[node.name]);assert(Object.keys(ref).every(k=>['name','id'].includes(k)));
 credentials.push({node:node.name,name:ref.name});
}assert.equal(credentials.length,4);
const patterns=[/sk-(?:or-v1-)?[A-Za-z0-9_-]{20,}/,/gh[pousr]_[A-Za-z0-9_]{20,}/,/github_pat_[A-Za-z0-9_]{20,}/,/Bearer\s+[A-Za-z0-9_-]{20,}/i,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/];
const findings=[];
function scan(v,p=''){
 if(typeof v==='string'&&patterns.some(re=>re.test(v)))findings.push(p);
 if(v&&typeof v==='object')for(const[k,x]of Object.entries(v)){
  const at=p?p+'.'+k:k;
  if(/^(password|api_?key|access_?token|refresh_?token|client_?secret|private_?key|authorization)$/i.test(k)&&typeof x==='string'&&x.trim())findings.push(at);
  if(typeof v.name==='string'&&/^(Authorization|X-BookLeaf-Key)$/i.test(v.name)&&k==='value'&&typeof x==='string'&&x.trim())findings.push(at);
  scan(x,at);
 }
}scan(live);assert.equal(findings.length,0,'Credential-shaped value found; do not print values');
assert.equal(sha('n8n/royalty-summary-workflow.json'),'66A20C051A143F2ED0B6E4FAA7023BA58BEBDA5FE4698D2C7E30A917874F8353');
const report={checked_at:new Date().toISOString(),scope:'Read-only actual saved UI export configuration audit; no network/execution',workflow_id:live.id,active:false,node_count:20,edge_count:18,all20_runtime_nodes_match_prepared_hardened_revision:true,node_comparisons:comparisons,known_default_normalization:'StopAndError omitted errorType means errorMessage',settings_match_historical_live_export:true,error_workflow_id:live.settings.errorWorkflow,timezone:live.settings.timezone,timeout_seconds:180,all4_retention_modes_off:true,credential_references_names_only:credentials,credential_values_verified:false,pin_data_empty:true,static_data_empty:true,credential_pattern_findings:[],pattern_scan_limitation:'Cannot prove absence of every possible secret',prepared_sha256:sha(paths.prepared),actual_live_export_sha256:sha(paths.live),frozen_historical_main_unchanged:true,configuration_checks_passed:true,integration_acceptance:'Not established: Bubble shared secret remains pending, callback/end-to-end run not verified, main remains inactive.'};
writeFileSync(new URL('../n8n/hardened-live-export-verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log('Saved live hardened export matches20runtime nodes/18edges;4Code nodes byteexact,2promoted nodes exact toTXT with one harmless terminal newline vsJSON. Credential names/retentionOFF/errorhandler/inactive verified; no secret-pattern findings.');

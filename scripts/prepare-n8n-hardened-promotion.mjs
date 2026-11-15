import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { validatePayload, buildPromptData, parseSummary } from '../n8n/lib/royalty.mjs';
import { parseHardenedResponse } from '../n8n/lib/provider-output-hardening.mjs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const write = (p,v) => writeFileSync(new URL('../'+p,import.meta.url),JSON.stringify(v,null,2)+'\n');
const digest = s => createHash('sha256').update(s).digest('hex').toUpperCase();
const frozenHash = '66A20C051A143F2ED0B6E4FAA7023BA58BEBDA5FE4698D2C7E30A917874F8353';
assert.equal(digest(read('n8n/royalty-summary-workflow.json')), frozenHash);
const original = JSON.parse(read('n8n/royalty-summary-workflow.json'));
const candidate = JSON.parse(read('n8n/provider-output-hardening-candidate.json'));
const promotion = structuredClone(original);
const changed = ['Build grounded prompt','Validate AI summary'];
for (const name of changed) {
 const source = candidate.nodes.find(n => n.name === name);
 const target = promotion.nodes.find(n => n.name === name);
 target.parameters.jsCode = source.parameters.jsCode;
 assert.notEqual(target.parameters.jsCode, original.nodes.find(n => n.name===name).parameters.jsCode);
}
assert.equal(original.nodes.length,20);
assert.deepEqual(promotion.connections,original.connections);
assert.deepEqual(promotion.settings,original.settings);
assert.equal(promotion.active,original.active);
for (let i=0;i<20;i++) {
 const actual=structuredClone(promotion.nodes[i]);
 if(changed.includes(actual.name)) actual.parameters.jsCode=original.nodes[i].parameters.jsCode;
 assert.deepEqual(actual,original.nodes[i]);
}
const remainder=structuredClone(promotion); remainder.nodes=original.nodes;
assert.deepEqual(remainder,original);
const evidence=JSON.parse(read('n8n/provider-hardening-success-result.json'));
const output=evidence.observed_validator_output;
assert.equal(evidence.provider_returned_model,'openai/gpt-4o-mini');
assert.equal(evidence.provider_finish_reason,'stop');
assert.equal(output.valid,true);
const row=read('docs/provider-hardening-success-validator-live.txt').split(/\r?\n/).find(s=>s.startsWith('true\tempty\t')).split('\t');
assert.equal(row[2],output.summary_subject);
assert.equal(row[3].replaceAll('\\n','\n'),output.summary_body);
assert.equal(row[4],output.request_id);
const source=JSON.parse(read('reference/bookleaf_sample_data.json')).authors.find(a=>a.author_id==='AUTH001');
const now=Date.parse('2026-11-15T12:00:00+05:30');
const checked=validatePayload({headers:{'x-bookleaf-timestamp':new Date(now).toISOString()},body:{author:source,books:source.books,request_id:output.request_id}},now);
assert(checked.valid);
const context={request_id:output.request_id,prompt_data:buildPromptData(checked.payload,now)};
// Envelope uses actual captured returned model/finish reason/text, not a mocked completion.
const response={model:evidence.provider_returned_model,choices:[{finish_reason:evidence.provider_finish_reason,message:{content:evidence.raw_generated_text}}]};
const parsed=parseHardenedResponse(response,context.prompt_data,parseSummary);
assert.equal(parsed.valid,true);
assert.equal(parsed.summary_body,output.summary_body);
assert.equal(parsed.summary_subject,output.summary_subject);
const validator=promotion.nodes.find(n=>n.name==='Validate AI summary');
const runtime=vm.runInNewContext(`(()=>{${validator.parameters.jsCode}})()`,{$:()=>({first:()=>({json:context})}),$input:{first:()=>({json:response})},Intl,Date});
assert.equal(runtime[0].json.valid,true);
assert.equal(runtime[0].json.summary_body,output.summary_body);
assert.equal(output.summary_body.trim().split(/\s+/).length,252);
assert(output.summary_body.includes('31 Dec 2026')&&output.summary_body.includes('14 Feb 2027'));
assert.equal(context.prompt_data.policy.next_quarter_end,'2026-12-31');
assert.equal(context.prompt_data.policy.next_payout_by,'2027-02-14');
assert(!/\b(?:Red|Yellow|Green)\b|\*\*/.test(output.summary_body));
assert(/45 days/.test(output.summary_body)&&/48 hours/.test(output.summary_body)&&/separate review/.test(output.summary_body));
assert(!/\brollover\b|\bminimum payout\b|\bbelow[^.]*threshold|payment is scheduled|transaction reference/i.test(output.summary_body));
write('n8n/royalty-summary-hardened-workflow.json',promotion);
const edges=Object.values(original.connections).flatMap(n=>Object.values(n).flat(2)).filter(Boolean).length;
assert.equal(edges,18);
write('n8n/hardened-promotion-verification.json',{
 evidence_date_ist:'2026-11-15',frozen_main_sha256:frozenHash,
 promotion_sha256:digest(read('n8n/royalty-summary-hardened-workflow.json')),
 modified_nodes:changed,modified_fields:['parameters.jsCode'],all_other_node_fields_unchanged:true,
 node_count:20,edge_count:18,connections_settings_metadata_unchanged:true,
 live_candidate_workflow_id:evidence.workflow_id,execution_id:null,request_id:output.request_id,
 provider_model:evidence.provider_returned_model,finish_reason:evidence.provider_finish_reason,
 captured_table_matches_json:true,actual_response_replay_matches_delivered:true,normalization_changed_this_response:false,
 source_factual_parser_pass:true,exact_promoted_code_runtime_pass:true,body_words:252,
 human_review:'PASS for this AUTH001 response: exact source figures/titles/dates/totals, general quarterly45day policy with correct calendar dates, separately overdue48hourreview, paidtitleack, plain text/no internal labels, no false threshold/rollover or fabricated transaction/payment schedule.',
 scope:'Provider component evidence only; promotion artifact prepared, not proof of live main deployment, Bubble callback or email.',
 no_new_network_request:true
});
assert.equal(digest(read('n8n/royalty-summary-workflow.json')),frozenHash);
console.log('Promotion ready: only2Codefields differ;20nodes/18edges/settings preserved; actual captured252word response and exact promoted validator pass; main frozen unchanged.');

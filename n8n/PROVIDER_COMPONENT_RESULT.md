# Manual provider component results

**Latest result:** the isolated hardened candidate subsequently passed real generation, strict validation and human source/policy/plain-text review. The252-word response is captured in [provider-hardening-success-result.json](provider-hardening-success-result.json). This is provider-component evidence only; no Bubble callback or email occurred. Historical failures and corrections below remain preserved.

Observed **15 November 2026 IST**, through the primary builder's browser evidence. The reviewer did not operate the browser. Both attempts used separate workflow `tpaIMrUqgNbEgBiY`; no execution ID was captured. No Bubble callback, NotificationLog write or email occurred.

## Earlier failed attempt

[Historical result](provider-component-live-result.json) preserves request `manual-provider-AUTH001-1794684139733`: `valid=false`, `AI provider request failed after retries`. No validated summary or returned model was available. The generic error does not establish root cause or actual attempt count.

## Subsequent real generation

[Successful output](provider-component-success-result.json), request `manual-provider-AUTH001-1794687022554`, records final validator `valid=true`, an actual subject/body and provider-returned model `openai/gpt-4o-mini`. The primary builder reports the retest followed credential saving and domain correction. Local review compared subject/body/request exactly with [the UI capture](../docs/provider-success-validator-live.txt). No provider envelope, finish reason or substitute summary was invented.

The source facts pass: both original titles; 342 and 189 copies; all per-book earned/paid/pending amounts; last payouts 15 Oct 2025 and 01 Dec 2025; consolidated earned ₹19,908, paid ₹16,338, pending ₹3,570. The overdue title receives an apology, priority review and payout-date confirmation within 48 hours. The second title is correctly fully paid up. Tone, greeting, reply invitation and Team BookLeaf signature are appropriate. No invented transaction, bank reference or scheduled payment was observed. This review does not prove every possible prose claim can be machine validated.

**Raw summary acceptance fails three prompt requirements despite the original validator pass:**

- Internal `Royalty Status: Red` and `Royalty Status: Green` labels are exposed.
- Bold Markdown headings violate plain-text formatting.
- The body has 211 whitespace-separated words, below the required 250–400.

[Machine-readable review](provider-component-success-review.json) separates real factual generation from human compliance failure. This establishes a working provider component, not unconditional raw-summary acceptance or end-to-end notification success.

## Separate hardening candidate

[provider-output-hardening-candidate.json](provider-output-hardening-candidate.json) is an isolated inactive candidate; the frozen main is unchanged. Its stronger prompt requests approximately 300 words, plain text and no internal status colors. Its deterministic normalizer strips only paired bold wrappers and standalone `Royalty Status: Red/Green/Yellow` lines. It then applies the unchanged factual validator and rejects remaining color labels, unsupported Markdown and body length outside 250–400 words. It adds no facts, words, payment claims or policy. The existing short response remains rejected after normalization; no padding or invented AI response was created. A later live candidate run requires separate evidence and is not established by the earlier run.

Import this candidate as a separate manual workflow; select existing Header Auth account 2, leave retention OFF and execute once. Review final validator output and actual subject/body. It has no Bubble callback or email. See [the verification procedure](PROVIDER_VERIFICATION_STEPS.md).

The primary builder subsequently reported a real candidate run in workflow `sCa7eqUyTpIoVwq1`, request `manual-provider-AUTH001-1794688161155`, rejected with `valid=false` and `AI output must contain 250–400 body words`. This establishes that the stricter length guard rejected the response; it is not a generation acceptance pass. No Bubble callback or email occurred.

A prompt-only revision now requests a target of280–350 body words through four explanatory paragraphs of45–50 words each, alongside the original figures/totals. All explanations must remain grounded in supplied facts and original policy. The strict validator and HTTP node are unchanged; no existing response is padded offline. The exact replacement Code is [provider-hardening-build-grounded-prompt.js.txt](provider-hardening-build-grounded-prompt.js.txt). Its next live result is not yet established by this document.

The [rejected policy response](provider-hardening-rejected-policy-summary.json) falsely describes the outstanding ₹3,570 as below the ₹1,000 threshold and claims rollover. Its repeated aggregate paragraph omits a correctly labelled pending figure; rejection was appropriate. Request-specific applicability and amount discipline were tightened. The final brief-aligned revision requires general quarterly/45-day context for every pending balance, distinguishes overdue review from a payment schedule, and applies threshold/rollover only when the actual flag is true. No rejected response was padded or repaired into accepted live evidence.

## Brief consistency correction after QA

The actual brief has no word-count rule. The old250–400 requirement was self-imposed and inconsistent with docs07's own232-word example. The candidate now accepts200–400 words, with a preferred generation target of250–350;200/199/400/401 boundary tests cover this editorial rule. Earlier short-output rejections remain historical evidence, not newly invented brief violations. Internal labels and Markdown remain prohibited.

QA also confirmed that EVERY pending balance needs the normal quarterly/45-day policy explanation. This supersedes the earlier prompt revision's omission of quarterly context for overdue authors. The latest candidate requires quarterly/45-day context AND separate overdue priority review/48-hour date confirmation, without scheduling or deferring the overdue payment. It rejects inapplicable threshold/rollover language. The original211-word response lacks this quarterly policy and is therefore still not a candidate acceptance pass. Only applicable below-threshold balances receive threshold/rollover guidance.

Both latest replacement node bodies are available as [prompt Code](provider-hardening-build-grounded-prompt.js.txt) and [validator Code](provider-hardening-validate-ai-summary.js.txt). A subsequent separately captured live result is required; no rejected response was padded or repaired into evidence.

## Latest accepted candidate and promotion package

Workflow `sCa7eqUyTpIoVwq1`, request `manual-provider-AUTH001-1794720059626`, returned real model `openai/gpt-4o-mini`, finish reason `stop`, and final `valid=true`. The final body is252 whitespace-separated words. Local comparison exactly matches the [captured validator table](../docs/provider-hardening-success-validator-live.txt). Replaying the actual captured model/finish-reason/text through the exact candidate validator reproduces the delivered subject/body. This response needed no deterministic formatting changes.

Human review passes both source titles, copies, all per-book and consolidated figures, payout dates, fully paid acknowledgement, apology/priority review and48-hour payout-date confirmation. The general quarterly policy states45days after quarter end, with correct calendar context31Dec2026 and14Feb2027. The prose expressly separates the existing overdue balance from that normal window; it does not schedule or defer the overdue payment. No internal colors, bold Markdown, false threshold/rollover, invented transaction or scheduled payment appears. Tone and signature are appropriate. This is acceptance of this specific AUTH001 response, not proof that arbitrary future prose cannot be wrong.

[royalty-summary-hardened-workflow.json](royalty-summary-hardened-workflow.json) prepares promotion by changing ONLY the two Code fields in Build grounded prompt and Validate AI summary. All20nodes,18edges, other node fields, settings and metadata retain their frozen-template values. The original frozen main and historical exports are untouched. [Promotion verification](hardened-promotion-verification.json) and `node scripts/prepare-n8n-hardened-promotion.mjs` verify these claims without a new provider call. Preparing this artifact does not establish deployment to the live main workflow.

[Iteration ledger](provider-component-iteration-ledger.json) records the failed provider attempt, original raw compliance failure, three hardening rejections and latest accepted real generation, with request IDs. No rejected response was manually padded, repaired or substituted as AI evidence. Callback authentication, Bubble dispatch/bulk operation and email remain separate acceptance work.

## Saved live main configuration verified

The actual [hardened live main export](royalty-summary-hardened-live-export.json) now confirms both reviewed Code changes were saved to workflow `THfIQmhfGo1r8Hzk`. [Read-only export audit](hardened-live-export-verification.json) verifies all20runtime nodes and18edges against the prepared promotion, all four execution retention modes OFF, inactive state,180-second timeout, Asia/Kolkata and error handler `CNrpnRtjpWmuCFjq`. Existing credential reference names are Header Auth account, Header Auth account2 and Header Auth account3; values were not read or verified. The two pasted Code bodies match supplied TXT exactly, adding only one terminal newline relative to prepared JSON. The other four Code bodies are byte-exact. No credential-shaped values or pinned/static data were detected; pattern scanning cannot prove absence of every secret format.

This is saved-configuration evidence, not a live main execution or callback acceptance. Bubble's outgoing shared secret remains pending, and no full callback/email success is established. Historical main/template/export files remain unchanged.

Local checks make no network request:

```powershell
node scripts/test-n8n-provider-verification.mjs
node scripts/verify-n8n-provider-result.mjs
node scripts/test-n8n-provider-hardening.mjs
```

Bubble Free-plan limits and callback authentication/rotation remain separate. This component does not verify callback delivery, bulk success, persisted replay protection or actual password login. Execution retention remains OFF. Frozen main SHA256: `66A20C051A143F2ED0B6E4FAA7023BA58BEBDA5FE4698D2C7E30A917874F8353`.

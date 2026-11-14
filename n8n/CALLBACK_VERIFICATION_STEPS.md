# Manual terminal-callback credential check

Use `callback-terminal-verification-workflow.json` in a **separate** temporary draft. It has no Webhook, AI or email node, stays inactive, keeps execution-data saving OFF and makes at most one 15-second HTTP attempt. The frozen main workflow is unchanged.

**14 November blocker:** Bubble's Free-plan workflow-testing limit has been reached. Do not run this test or try to bypass the limit. This artifact remains an unexecuted preparation; the existing credential and terminal-callback behavior are not verified by its presence.

At final handoff the Bubble callback's public-exposure switch is OFF, the main n8n workflow is inactive, and the existing internal error handler is published/selected with retention OFF. Do not re-expose the callback merely to run this prepared test; credential rotation/replacement and legitimately available approved testing are prerequisites.

1. In Bubble, first capture the existing NotificationLog whose request ID is `1794630479353x966706198379300900`. Confirm it is **Failed** and record its error text, completion time, AI/body/execution fields and the log count. Stop if the request is absent or still nonterminal.
2. Create an empty n8n workflow and import/paste this separate JSON. Do not replace the main BookLeaf workflow. Re-select the existing **Header Auth account 3** credential on the HTTP node; never recreate it or display its value. Its stored header must already be Authorization with the valid bearer value.
3. Confirm the callback is exposed with authentication required and its terminal guard is saved. The workflow URL is fixed to the existing Bubble development callback. Keep the Data API disabled.
4. Execute manually once. This does not require a production Webhook. Do not publish this test workflow.
5. Inspect only the response status/body. Expected: HTTP 200 with a duplicate/no-op acknowledgement (possibly inside Bubble's `response` wrapper). A 401/403 means authentication remains unverified. A 400 can mean missing optional-parameter configuration or a callback condition mismatch; it is not proof the credential is wrong. Do not disable auth to make the test pass.
6. Re-read the same Bubble log. Its **Failed status, original error, completion time, body/model/execution fields and record count must all be unchanged**. HTTP 200 alone does not prove terminal protection.

The fixed payload sends the existing request ID, `status=Failed` and the original safe disconnected-test error. It intentionally omits a new completion time, AI output or model. It must be ignored by a correct terminal guard. If any field changes, stop and fix the guard before running further callback tests. Do not mark this as AI-generation evidence or a new summary.

Local artifact-only check:

```powershell
node scripts/test-n8n-callback-verification.mjs
```

## Attaching the separate error-audit workflow

Import and save `royalty-summary-error-workflow.json` once, then choose **BookLeaf — Royalty Summary Error Audit** in the main workflow's **Settings → Error workflow**, and save the main workflow. No new credential or callback connection is required to attach it.

Current official [Error Trigger documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.errortrigger/) says the error workflow itself must be published and that it triggers for automatic workflow failures, not manual execution failures. Therefore this manual callback check cannot verify error-audit invocation, and selecting the error workflow alone is not proof it ran. Resolve publication permission before that activation, then test a controlled automatic failure separately.

Because the main workflow deliberately does not retain raw execution data, the upstream execution ID/URL may be absent from Error Trigger input. The error Code node tolerates missing metadata and drops raw error/message/stack fields from its output. The error artifact now also has successful, failed, manual and progress execution-data retention OFF, with a 30-second timeout: sanitizing a later node cannot retroactively redact saved trigger input. Its sanitized output is transient, not a durable audit. Bubble NotificationLog and its timeout handling remain the durable operational record. Do not turn retention on merely to obtain an error screenshot.

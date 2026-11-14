# Manual provider component — failed attempt

**Observed 15 November 2026 (IST), reported by the primary builder.** The reviewer did not operate the browser. Sanitized machine-readable evidence is [provider-component-live-result.json](provider-component-live-result.json).

The separate manual n8n component run used the existing **Header Auth account 2** reference and reached this final validator output:

```json
{
  "valid": false,
  "error": "AI provider request failed after retries",
  "request_id": "manual-provider-AUTH001-1794684139733"
}
```

The supplied workflow/run reference is `tpaIMrUqgNbEgBiY`; an exact n8n execution ID was not independently captured. The configured model is `openai/gpt-4o-mini`, but no provider-returned model, upstream HTTP status or validated subject/body was supplied.

**Result: failed component attempt, not successful AI generation.** Credential selection does not establish a valid key. The generic error does not establish whether the cause was authentication, balance, network availability, a provider error or a pre-request failure. Three attempts is the configured maximum, not a verified attempt count.

This isolated workflow contains no Bubble endpoint, webhook, callback, NotificationLog write or email node. The attempt therefore neither tests nor bypasses Bubble's Free-plan workflow limit, and it does not verify the exposed-token replacement or authenticated callback. No source author/book record or frozen main workflow was changed. No substitute AI response or manual Success record was created.

Both provider output branches intentionally enter the strict validator. An overall green manual execution can still end with `valid=false`; node colors alone must not be reported as a pass. Any later approved diagnosis should use only a sanitized upstream status/error classification, without displaying Authorization, key values or raw credential-bearing input. Do not blindly rerun the component to force a pass or enable execution-data retention to capture secrets.

Local structural checks:

```powershell
node scripts/test-n8n-provider-verification.mjs
node scripts/verify-n8n-provider-result.mjs
```

Those commands make no network request. They check the prepared component artifact, source consistency, safe error routing and this sanitized result's structure; they do not independently verify the reported browser execution.

# Remaining live n8n verification

Checkpoint: **14 November 2026 (IST)**. This is a credential-free execution checklist, not a claim that the live integration passed.

**Current blocker:** Bubble has reported its Free-plan workflow-testing limit reached. Do not execute further live callback/provider tests, bypass the limit or purchase an upgrade. The remaining test sequence is for when testing becomes legitimately available within the authorized plan. Existing credential validity and real AI success remain unverified.

The frozen local main workflow is `royalty-summary-workflow.json`, SHA256 `66A20C051A143F2ED0B6E4FAA7023BA58BEBDA5FE4698D2C7E30A917874F8353`. Local logic/export simulation passes 49/49 cases. The existing live draft ID is `THfIQmhfGo1r8Hzk`; preserve that workflow and its already-created credential records.

## Final saved handoff state

| Component | Current configuration evidence |
| --- | --- |
| Main n8n workflow | Saved, inactive, ID `THfIQmhfGo1r8Hzk`; 20 nodes, 180-second timeout, Asia/Kolkata, four retention modes OFF. |
| Internal error handler | Published, ID `CNrpnRtjpWmuCFjq`; selected and saved in the main workflow's Error Workflow setting; 30-second timeout, Asia/Kolkata, four retention modes OFF. Automatic invocation remains untested. |
| Selected credential references | Webhook: `Header Auth account`; OpenRouter: `Header Auth account 2`; both callbacks: `Header Auth account 3`. Values and authentication remain unverified. |
| Bubble callback | Expose as public API workflow OFF, captured in `docs/bubble-callback-handoff-disabled.txt`. Keep it off until credential rotation/replacement and legitimately available approved testing. |
| Actual UI exports | `royalty-summary-live-export.json` and `royalty-summary-error-live-export.json`; configuration comparison/pattern scan in `live-export-verification.json` passes without editing them. |
| Durable operational evidence | Bubble NotificationLog, including captured rejection and timeout failures. No live AI Success or accepted callback is claimed. |

The sequence below is a future verification recipe, not an instruction to continue tests while the platform limit is in force. The shared-secret/Bubble private header and new provider key still need valid private configuration; any exposed callback token must be replaced before further testing. Browser clipboard is cleared and the API-key view hidden at handoff, as reported by the primary builder.

## Fastest setup order

1. **Confirm the final draft and credential selections.** The main canvas should contain 20 nodes, including its three sticky notes. Select the existing `BookLeaf webhook secret` credential on `Webhook royalty summary`. Select `BookLeaf OpenRouter new key` on `OpenRouter AI` and `BookLeaf Bubble callback bearer` on both callback nodes. Do not recreate a credential merely because a replaced node has lost its selection.
2. **Complete credential values privately.** The user enters the same webhook secret in Bubble's dedicated **Private key in header** authentication, with header name `X-BookLeaf-Key`. The OpenRouter credential uses a new key and `Authorization` as its header name. The callback credential uses the valid Bubble workflow bearer token. Never expose or copy values into chat, screenshots, JSON exports or source files. Do not use the previously exposed portfolio key.
3. **Preserve the configured transient error handler.** The existing handler is already published and selected in the saved main workflow. A clean import would need that selection repeated. Its sanitized output contains workflow/execution/node metadata and a generic error; all execution-data retention is OFF. It is not a durable audit and does not message anybody. Bubble NotificationLog is the durable operational record. No automatic invocation pass is claimed.
4. **Verify runtime settings.** Main workflow timezone Asia/Kolkata; timeout 180 seconds; saving successful, failed, manual and progress execution data OFF; no pinned data. Raw Webhook input contains headers, including the custom shared secret. Keep all credentials in the credential store.
5. **Verify the Bubble callback before opening access.** The exact URL is `https://sanathesunshine9693.bubbleapps.io/version-test/api/1.1/wf/n8n_callback`. Require authentication. Accept exact terminal Display strings `Success`/`Failed`; do not overwrite an existing terminal log. Unknown ID/invalid status must reject; native Bubble may return 400 rather than the originally specified 404. Keep the Data API disabled.
6. **Resolve publication/activation approval before using the production URL.** Saving a draft is separate from publishing a callable webhook. Test URL use requires the editor to be listening and does not persist workflow static data. A serial replay test of persisted markers therefore needs an approved published workflow; do not count a manual test as proof of persistence.

## One real end-to-end request first

Use the admin's actual summary button to create a **new** NotificationLog before dispatch. Do not reuse the disconnected test's terminal Failed record and do not change the verified Author/Book dataset.

Record these facts without credential values:

| Check | Evidence to capture |
| --- | --- |
| Server dispatch | New request ID, selected author ID, exact related-book count; no other author's books. |
| Immediate acceptance | HTTP 202 and the same request ID, before the AI finishes. |
| Genuine generation | A real OpenRouter response, not a local fixture or manually entered response schema. |
| Callback | Existing log becomes Success with subject, body, model, completion time and n8n execution ID. |
| Factual review | Author first name; every book/title/copies/earned/paid/pending/payout date; correctly labelled total earned/paid/pending; policy/production guidance; no invented payment or transaction. |
| Delivery behavior | `email_sent` remains no; no actual email node exists. |
| UI recovery | Busy state ends after Success/Failed, and the result/error is visible after page refresh. |

For AUTH001 the expected figures remain two books, earned 19,908, paid 16,338, pending 3,570. Operational success is the actual NotificationLog and reviewed body; a green n8n node or zero Bubble editor issues alone is insufficient.

If the parser rejects a valid-looking draft, review its layout and the controlled failure reason. Its conservative checks expect a distinct section for each book and a consolidated totals paragraph. An opening that lists all book titles before the detailed sections may be rejected safely. Do not relax validation or replace a Failed result with a fabricated Success just to finish the demo.

## Then run the smallest meaningful failure/replay set

| Test | Expected result |
| --- | --- |
| Missing/wrong webhook key | Authentication rejects before an AI call. |
| Timestamp older than five minutes or too far in the future | HTTP 400, no AI call. |
| Invalid totals or empty Books | HTTP 400; visible failure of that request in Bubble. |
| Provider failure | Three attempts maximum, then Failed callback and a safe visible error. Do not overwrite working credentials to force this; use a controlled test copy or an agreed failure fixture. |
| Exact serial replay after the original published execution succeeds | HTTP 200 with `duplicate=true`, `accepted=false`; original log unchanged and no second AI generation. An in-flight/failed/manual execution is not proof of persisted static-data protection. |
| Different ID for same author within 60 seconds | HTTP 409; only the second request fails visibly. |
| Duplicate terminal callback | Original terminal body/time remain unchanged; duplicate acknowledgement is acceptable. |
| Callback unavailable | Transient error handling if appropriately published; the original in-flight Bubble log becomes Failed through its five-minute timeout. No retained n8n payload/audit is claimed. |
| Retry | Creates a new request/log; original Failed record remains an audit trail. |

Never retry a complete successful AI execution merely to redeliver a callback; that may cause another provider call. Retry delivery of its already-validated output or use the explicitly documented new-request policy.

## Bulk and export last

After one real single-author success and one visible failure, run the approved bulk path. Expect nine independent requests for pending authors, skip AUTH008, and verify all nine end in Success or Failed without one failure interrupting the others. Do not describe this as concurrent exactly-once proof: static data is a secondary sequential guard and is neither atomic nor persisted after failed/manual executions.

Download the saved live main and error workflows after verification. Keep credential references only, `pinData` empty, no execution data and no actual values in headers or Code nodes. Scan the downloaded files before committing. If the live export differs from the frozen generated file, preserve its verification date and explain the configuration-only differences rather than claiming the old SHA verifies a different file.

Remaining acceptance gaps must stay explicit: live credentials, real AI/callback evidence, password logins if still pending, production activation approval, error-audit assignment, serial persistence tests and concurrent-idempotency limitations.

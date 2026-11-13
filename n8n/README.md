# BookLeaf royalty-summary automation

The generated workflow is an **inactive importable draft**. It implements the local processing logic; live credentials, callback execution and end-to-end acceptance must be verified separately. The generated JSON is not evidence of a successful OpenRouter call or Bubble callback.

## Files and local verification

| File | Purpose |
| --- | --- |
| `royalty-summary-workflow.json` | Main authenticated webhook, validation, sequential request guard, prompt, AI call and callbacks. |
| `royalty-summary-error-workflow.json` | Safe error metadata only; assign its imported ID as the main workflow's Error Workflow. |
| `lib/royalty.mjs` | Dependency-free processing logic embedded in Code nodes. |
| `local-test-results.json` | Current local test results, with live checks explicitly excluded. |

From the workspace root:

```powershell
node scripts/build-n8n-workflow.mjs
node scripts/test-n8n-workflow.mjs
```

The local suite currently passes **49/49** cases. It covers all 10 authors/18 books, reconciled totals, nullable dates, production zeros, timestamps, forged inputs, date boundaries, serial replay, policy dates, output completeness, unsupported promises, failure preparation and exported Code nodes in a mocked n8n context. It does not call a live provider or modify Bubble. Its model-shaped responses are fixtures, not generated summaries.

## Import and credentials

Use the existing [n8n Cloud workspace](https://sanafatma.app.n8n.cloud). Import through the workflow menu or paste JSON on an empty canvas. If a BookLeaf draft already exists, replace its nodes, save it and reselect existing credentials. Keep it unpublished until the protected Bubble callback and test log exist.

Assign three **HTTP Header Auth** credentials. The JSON references names only and contains no values:

| Reference name | Header | Stored value |
| --- | --- | --- |
| `BookLeaf webhook secret` | `X-BookLeaf-Key` | New random shared secret, also a private Bubble API Connector header. |
| `BookLeaf OpenRouter new key` | `Authorization` | `Bearer ` followed by a new OpenRouter key; never the exposed portfolio key. |
| `BookLeaf Bubble callback bearer` | `Authorization` | `Bearer ` followed by the authenticated Bubble workflow token. |

Select these on the webhook, OpenRouter HTTP node, and both callback HTTP nodes respectively. Missing credentials are configuration errors, not a reason to disable authentication. The user must enter new values directly into credential forms, never chat, exports, scripts or documentation.

Import the error-audit workflow and select its ID in the main workflow's **Settings → Error Workflow**. Its safe output contains workflow name, execution ID, last node and a generic error. It sends no message or email.

## Request contract

After separate publication approval:

```text
POST https://sanafatma.app.n8n.cloud/webhook/bookleaf-royalty-summary
X-BookLeaf-Key: configured shared secret
X-BookLeaf-Timestamp: current ISO8601 UTC timestamp
Content-Type: application/json
```

Use `/webhook-test/bookleaf-royalty-summary` only while the editor listens for a test request. Static data does not persist during manual tests.

Minimum JSON body:

```json
{
  "request_id": "existing-notification-log-request-id",
  "author": { "author_id": "TEST_AUTHOR", "name": "Example Author" },
  "books": [{
    "book_id": "TEST_BOOK",
    "title": "Example Book",
    "status": "Published & Live",
    "publication_date": "2026-01-01",
    "last_royalty_payout_date": null,
    "total_copies_sold": 10,
    "total_royalty_earned": 100,
    "royalty_paid": 0,
    "royalty_pending": 100
  }]
}
```

This synthetic format example is not a record to import into the verified dataset. Integration needs a pre-existing NotificationLog with the same request ID and matching author. Send one author and only their Books. Bubble must derive the author from an authorized admin workflow, not accept an arbitrary untrusted browser payload.

Optional fields: author city/joined date; book ISBN, genre, MRP, per-copy royalty, print partner and `available_on`; `meta`; `totals`. Totals are recomputed from Books. If supplied, earned/paid/pending and any supplied counts are checked. Empty books fail to catch a broken search. Dates must be explicit `null` or valid date/ISO strings. Full Bubble timestamps retain exact instants; date-only source records use noon Asia/Kolkata, matching the import. Amounts must be nonnegative numbers, not text.

The workflow recomputes 90-day badges. Its model payload is an explicit allowlist excluding email, phone, headers, Bubble tokens and arbitrary extra fields.

## Responses, AI and callbacks

- Invalid payload/timestamp: HTTP 400 with a safe reason; no AI call.
- Exact serial replay: HTTP 200, `duplicate=true`, `accepted=false`; do not overwrite or fail the original log.
- Different request for the same author within 60 seconds: HTTP 409; Bubble should visibly fail only that second request.
- Accepted: HTTP 202 with the request ID before generation starts.

AI uses `openai/gpt-4o-mini`, temperature 0.2, maximum 800 tokens and a 30-second timeout, with the system prompt from `docs/07_AI_PROMPT_SPEC.md`. Output checks require SUBJECT/BODY, greeting, every book and its labelled figures, payout dates, correctly labelled consolidated totals, policy guidance and BookLeaf signature. Truncated, incomplete, placeholder, internal or unsupported monetary/transaction output becomes Failed. Checks include ₹1,000 rollover and Yellow quarterly dates where applicable.

Checks are conservative: unusual valid layouts can fail. They do not prove all unsupported prose is detected. Human factual/tone review remains necessary before real email, which is absent from this workflow.

Both callback nodes use this fixed URL; payloads cannot choose another destination:

```text
https://sanathesunshine9693.bubbleapps.io/version-test/api/1.1/wf/n8n_callback
```

Fields: `request_id`, `status` (`Success`/`Failed`), `completed_at`, `summary_subject`, `summary_body`, `ai_model`, `error_message`, `n8n_execution_id`. Bubble must authenticate the bearer token, find the existing log, reject invalid/unknown requests and refuse terminal-state overwrite. NotificationLog is the completion authority.

AI and callback nodes attempt up to three times, three seconds apart. Callback timeout is 15 seconds; workflow timeout is 180 seconds. Callback failure fails the execution with a generic error; Bubble's five-minute stale handler is still required. Do not retry a whole completed AI execution merely to resend its callback. Retry delivery of validated output or follow the documented new-request retry policy.

## Execution-data privacy

Main-workflow successful, failed, manual and progress execution-data saving is **OFF**. This intentionally differs from the generic original spec: Webhook output includes incoming headers, so the custom `X-BookLeaf-Key` must not be retained. Bubble NotificationLog stores results; the error workflow stores safe metadata. Runtime input can still be visible while a manual editor is open: never show headers in screenshots/recording. Verify live settings after import.

The official [Webhook source](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/Webhook/Webhook.node.ts) lists Authorization/cookie as sensitive output and emits incoming headers; the project's custom header needs explicit retention precautions.

## Idempotency limits and live acceptance

Static data remembers exact IDs for 24 hours and throttles authors for 60 seconds. It is a **secondary sequential-demo safeguard**, not an atomic lock. It persists only after successful published execution, not manual tests or failed executions, and may race under concurrency. Callback failure can therefore lose a marker. Bubble must create and guard NotificationLog first and preserve terminal states. Use a durable atomic unique-key claim store before claiming concurrent exactly-once behavior. See official [static-data limitations](https://docs.n8n.io/code/cookbook/builtin/get-workflow-static-data/).

Still required live:

- Assign/test all three credentials and verify imported node settings.
- Select the error workflow, verify protected callback and stale/terminal handling.
- Run a real AI request, review its facts/tone, observe the NotificationLog callback.
- Test missing/wrong key, stale timestamp, invalid payload, AI and callback failures.
- Demonstrate serial replay, retry and nine-author bulk failure isolation.
- Obtain approval before publishing/activating the production webhook or sending real email.
- Download the saved live workflow after verification; scan its export for credentials and execution/pinned data.

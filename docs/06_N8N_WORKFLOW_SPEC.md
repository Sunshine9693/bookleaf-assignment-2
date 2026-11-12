# 06 — n8n workflow specification

**Workflow name:** `BookLeaf — Royalty Summary`
**Trigger:** authenticated POST webhook from a Bubble backend workflow
**AI:** OpenRouter or OpenAI, budget model (`gpt-4o-mini` class)
**Callback:** authenticated Bubble API workflow

## 1. End-to-end sequence

```text
Bubble admin clicks Generate & Send
  → Bubble creates NotificationLog: Queued
  → Bubble POSTs one-author payload to n8n
  → n8n validates + returns 202 immediately
  → n8n checks idempotency
  → n8n sends Processing callback (optional, best effort)
  → n8n builds prompt + calls AI (retry 3)
  → n8n parses and validates the text
  → n8n sends Success or Failed callback
  → Bubble updates NotificationLog; admin page refreshes
```

Returning **202 immediately** is deliberate: Bubble must not hold a request open while an LLM runs. The NotificationLog is the source of truth for completion.

## 2. Node list

| # | Node | Type | Purpose |
| --- | --- | --- | --- |
| 1 | `Webhook — royalty summary` | Webhook | POST `/webhook/bookleaf-royalty-summary`; Header Auth credential. |
| 2 | `Validate payload` | Code | Normalise and validate required fields; return `{valid, error}` instead of throwing. |
| 3 | `IF — valid?` | IF | Route valid vs invalid. |
| 4 | `Respond 400` | Respond to Webhook | Invalid payload: 400 with a safe error. |
| 5 | `Respond 202` | Respond to Webhook | Valid payload: 202 `{accepted: true, request_id}`. |
| 6 | `Idempotency guard` | Code | Reject exact `request_id` repeats; detect same author within 60s. |
| 7 | `IF — duplicate?` | IF | Stop exact repeats; fail the second same-author request visibly. |
| 8 | `Processing callback` | HTTP Request | Best-effort `status=Processing`; continue on error. |
| 9 | `Build prompt` | Code | Totals, status counts, next quarter window, threshold, prompt JSON. |
| 10 | `AI request` | HTTP Request | OpenRouter/OpenAI; timeout 30s; retry 3; error output. |
| 11 | `IF — AI ok?` | IF | Route success vs failure. |
| 12 | `Parse AI output` | Code | Extract subject/body; strip fences; validate length/content. |
| 13 | `Success callback` | HTTP Request | POST Bubble callback with `Success` + text. |
| 14 | `Failure callback` | HTTP Request | POST Bubble callback with `Failed` + safe error. |
| 15 | `Error workflow` | Error Trigger workflow | Last-resort alert/log if an unhandled node fails. |

Add sticky notes in n8n to group: **Receive**, **Guard**, **Generate**, **Return**.

## 3. Webhook

- Method: `POST`.
- Path: `bookleaf-royalty-summary`.
- Authentication: **Header Auth** credential.
  - Header name: `X-BookLeaf-Key`.
  - Value: a long random shared secret, stored only in the n8n credential and Bubble's private API Connector header.
- Additional header: `X-BookLeaf-Timestamp` (ISO 8601 UTC). Validate freshness in `Validate payload` (reject older than 300 seconds) to reduce replay risk.
- Response mode: **Using Respond to Webhook node**, so nodes 4/5 control the status code.
- Do not enable "Ignore Bots"; Bubble is the only caller.
- Use HTTPS. If self-hosting, expose via a tunnel with a stable URL for the demo.

### Why a shared-secret header

The assignment explicitly permits an API key header, shared secret or token. A static header over HTTPS is simple to implement in Bubble's API Connector, easy to rotate, and does not require HMAC support that Bubble lacks natively. The timestamp check and idempotency guard mitigate replay/duplicate risk. If HMAC is added later, the header can carry an HMAC of the raw body; that is an enhancement, not a requirement.

## 4. Payload contract

Bubble sends exactly one author and that author's books.

```json
{
  "request_id": "1757500000000x100000000000000001",
  "idempotency_key": "AUTH001-2026-11-10T17:00:00+05:30",
  "author": {
    "bubble_id": "1757500000000x100000000000000001",
    "author_id": "AUTH001",
    "name": "Priya Sharma",
    "email": "priya.sharma@email.com",
    "phone": "+91-98765-43210",
    "city": "Mumbai",
    "joined_date": "2023-03-15"
  },
  "books": [
    {
      "book_id": "BK001",
      "title": "Whispers of the Ganges",
      "isbn": "978-93-5XXXX-01-1",
      "genre": "Literary Fiction",
      "publication_date": "2023-06-20",
      "status": "Published & Live",
      "mrp": 399,
      "author_royalty_per_copy": 35,
      "total_copies_sold": 342,
      "total_royalty_earned": 11970,
      "royalty_paid": 8400,
      "royalty_pending": 3570,
      "last_royalty_payout_date": "2025-10-15",
      "print_partner": "In-House",
      "available_on": ["Amazon India", "Flipkart", "BookLeaf Store"],
      "royalty_status": "Red"
    },
    {
      "book_id": "BK002",
      "title": "The Saffron Diaries",
      "isbn": "978-93-5XXXX-02-8",
      "genre": "Non-Fiction / Memoir",
      "publication_date": "2024-01-10",
      "status": "Published & Live",
      "mrp": 450,
      "author_royalty_per_copy": 42,
      "total_copies_sold": 189,
      "total_royalty_earned": 7938,
      "royalty_paid": 7938,
      "royalty_pending": 0,
      "last_royalty_payout_date": "2025-12-01",
      "print_partner": "In-House",
      "available_on": ["Amazon India", "BookLeaf Store"],
      "royalty_status": "Green"
    }
  ],
  "totals": {
    "books": 2,
    "published": 2,
    "in_production": 0,
    "copies_sold": 531,
    "earned": 19908,
    "paid": 16338,
    "pending": 3570
  },
  "meta": {
    "generated_at": "2026-11-10T17:00:00+05:30",
    "assessment_date": "2026-11-10",
    "source": "bubble"
  }
}
```

Rules:

- All monetary values are numbers, not strings.
- `available_on` is always an array, including `[]`.
- Null dates are `null`, not `""`.
- `royalty_status` is one of `Green`, `Yellow`, `Red`, `In Production`.
- Do not include Bubble API tokens, passwords or internal notes.
- Do not include books from another author.

## 5. Validation (`Validate payload`)

Checks:

- Required top-level keys: `request_id`, `author`, `books`, `totals`, `meta`.
- `author.author_id` and `author.name` present.
- `books` is an array; every book has `book_id`, `title`, `status`, numeric royalty fields.
- `totals.earned = totals.paid + totals.pending` (allow a 0.01 rounding tolerance).
- `totals.books = books.length`.
- `request_id` is non-empty.
- Timestamp header is present and within 300 seconds.
- Header secret is already enforced by n8n's Header Auth.

Return shape:

```json
{ "valid": true, "error": "" }
```

or

```json
{ "valid": false, "error": "Missing author.name" }
```

Do not echo the payload or headers in the error.

## 6. Idempotency guard

Use `$getWorkflowStaticData('global')` in a Code node.

```js
const store = $getWorkflowStaticData('global');
const now = Date.now();
const requestKey = `request:${payload.request_id}`;
const authorKey = `author:${payload.author.author_id}`;

store.requests ??= {};
store.authors ??= {};

// prune old keys
for (const [key, value] of Object.entries(store.requests)) {
  if (now - value > 10 * 60 * 1000) delete store.requests[key];
}
for (const [key, value] of Object.entries(store.authors)) {
  if (now - value > 10 * 60 * 1000) delete store.authors[key];
}

const duplicateRequest = Boolean(store.requests[requestKey]);
const recentAuthor = store.authors[authorKey] && now - store.authors[authorKey] < 60_000;

if (!duplicateRequest && !recentAuthor) {
  store.requests[requestKey] = now;
  store.authors[authorKey] = now;
}

return [{ json: { duplicateRequest, recentAuthor } }];
```

Behaviour:

| Case | Action |
| --- | --- |
| Exact `request_id` repeated | Stop silently. The original execution will callback; this is the same log. |
| Same author, different `request_id`, within 60s | Call failure callback with `"Duplicate trigger ignored; a summary was requested moments ago."` The second log becomes terminal instead of hanging. |
| Otherwise | Continue and record the keys. |

Limitations:

- Static data is per n8n instance/worker. For a single-instance demo it is sufficient. If n8n Cloud uses queue mode with multiple workers, replace this with a Redis/Postgres idempotency store.
- Bubble's 120-second guard and button disable are the primary duplicate prevention; n8n is the second layer.
- The callback also refuses to overwrite a terminal status.

## 7. Build prompt

Compute in Code:

- `totals` (already supplied; re-check).
- `publishedBooks` and `inProductionBooks`.
- `redBooks`, `yellowBooks`, `greenBooks`.
- `allPaid` = `totals.pending === 0`.
- `belowThreshold` = `totals.pending > 0 && totals.pending < 1000`.
- `nextQuarterEnd` and `payoutBy` in `Asia/Kolkata`:
  - Jan–Mar → 31 Mar → payout by 15 May.
  - Apr–Jun → 30 Jun → payout by 14 Aug.
  - Jul–Sep → 30 Sep → payout by 14 Nov.
  - Oct–Dec → 31 Dec → payout by 14 Feb (next year).
- `tone` instructions: empathetic, professional, specific, owns delays, clear next step.
- `statusGuidance`:
  - Green: acknowledge paid up.
  - Yellow: explain the quarterly cycle and 45-day window; give the computed window.
  - Red: acknowledge the delay, own it, say the team will investigate and confirm within 48 hours; do **not** claim payment is scheduled or invent a transaction.
  - In production: give the stage and avoid sales/royalty claims.
- `thresholdGuidance`: if pending < ₹1,000, explain the minimum payout threshold and rollover.
- `noFabrication`: never invent transaction IDs, payout dates, amounts, or bank references.

The full system prompt and user template are in `07_AI_PROMPT_SPEC.md`.

## 8. AI request

- URL: `https://openrouter.ai/api/v1/chat/completions` (or OpenAI's `/v1/chat/completions`).
- Authentication: n8n Header Auth credential with `Authorization: Bearer <key>`. The key lives only in the n8n credential.
- Model: `openai/gpt-4o-mini` via OpenRouter, or `gpt-4o-mini` directly.
- Body:
  - `model`
  - `messages` (system + user)
  - `temperature`: `0.2`
  - `max_tokens`: `800`
- Timeout: **30 seconds**.
- Retry on fail: **3 attempts**, 5 seconds between.
- On error: **Continue (using error output)** → failure callback.
- Do not log the Authorization header.

If the AI provider returns 429, the retries plus a clear Failed status are acceptable. Do not silently switch to a fallback template and mark Success; the assignment requires a visible Failed state.

## 9. Parse AI output

Expected plain text:

```text
SUBJECT: Your BookLeaf royalty summary — November 2026

Dear Priya,

...
```

Parsing rules:

- Extract `content` from `choices[0].message.content`.
- Strip triple-backtick fences if present.
- Split on the first `SUBJECT:` line; the remainder is the body.
- If no subject, use `Your BookLeaf royalty summary`.
- Trim whitespace.
- Reject if the body is shorter than 200 characters or longer than 5,000 characters.
- Reject if it contains placeholders (`{{`, `[Author`, `[Book`, `TODO`).
- Reject if it contains "As an AI" or "I cannot access".
- Do not reject for harmless formatting differences.

On rejection: failure callback with `"AI output failed validation: <reason>"`; store no partial body, or store it with the failed log for debugging (optional; ensure no secrets).

## 10. Callbacks

### Processing (best effort)

```json
{
  "request_id": "1757500000000x100000000000000001",
  "status": "Processing",
  "completed_at": null,
  "n8n_execution_id": "12345"
}
```

Set "On Error: Continue". A failed Processing callback must not stop the run.

### Success

```json
{
  "request_id": "1757500000000x100000000000000001",
  "status": "Success",
  "completed_at": "2026-11-10T17:01:12+05:30",
  "summary_subject": "Your BookLeaf royalty summary — November 2026",
  "summary_body": "Dear Priya, ...",
  "ai_model": "openai/gpt-4o-mini",
  "n8n_execution_id": "12345"
}
```

### Failed

```json
{
  "request_id": "1757500000000x100000000000000001",
  "status": "Failed",
  "completed_at": "2026-11-10T17:01:12+05:30",
  "error_message": "AI provider returned HTTP 500 after 3 attempts",
  "n8n_execution_id": "12345"
}
```

Callback requirements:

- URL: `https://<bubble-app-domain>/api/1.1/wf/royalty_summary_callback`.
- Header: `Authorization: Bearer <callback token>` stored in an n8n Header Auth credential. The token is different from the webhook secret.
- `Content-Type: application/json`.
- Timeout: 15 seconds; retry 3 times.
- Never include the AI key, webhook secret or full prompt in `error_message`.
- If the callback itself fails after retries, the n8n error workflow records it. Bubble's stale-log handler marks the log Failed after 5 minutes (see §12).

## 11. Bubble callback workflow

Create a backend API workflow named `royalty_summary_callback`.

Parameters:

- `request_id` (text)
- `status` (text: `Processing`, `Success`, `Failed`)
- `completed_at` (date, optional)
- `summary_subject` (text, optional)
- `summary_body` (text, optional)
- `ai_model` (text, optional)
- `error_message` (text, optional)
- `n8n_execution_id` (text, optional)

Workflow:

1. Require authentication (bearer token); do not expose without auth.
2. Find `NotificationLog` where `request_id = request_id`.
3. If none: return 404 `{ "ok": false, "error": "Unknown request_id" }`.
4. If the log is already `Success` or `Failed`: return 200 `{ "ok": true, "duplicate": true }`. Do not overwrite.
5. If `status` is `Processing`: set status `Processing`; return 200.
6. If `status` is `Success`: set status, `completed_at`, subject, body, model, execution ID; return 200.
7. If `status` is `Failed`: set status, `completed_at`, error message (truncate to 1,000 chars), execution ID; return 200.
8. Ignore any other status with 400.

Set "Ignore privacy rules" on this workflow so the system can update the log, but keep the bearer token requirement.

## 12. Bubble stale-log handler

If n8n or the callback dies, a log could stay `Queued`/`Processing` forever. Add a visible recovery path:

- On the admin notifications page, run **Do every 15 seconds while the page is visible**:
  - Search for `NotificationLog` where status is `Queued` or `Processing` and `requested_at < Current date/time:plus minutes (-5)`.
  - Make changes to the list: status `Failed`, `completed_at = Current date/time`, `error_message = "No callback received within 5 minutes. Check the n8n execution and retry."`
- This is a bulk update with the same values, so a "Make changes to a list of things" action is sufficient.
- Show a "Retry" action on failed logs that creates a new request (new `request_id`).

This satisfies "don't leave the admin staring at a loading spinner" even when the failure is outside Bubble.

## 13. Error workflow

Create a second n8n workflow with an **Error Trigger**.

- It receives the failed execution's metadata.
- It writes a concise alert (author ID, request ID if available, node name, error message) to a private channel or a file/log.
- It does **not** contain secrets.
- Configure it as the Error Workflow in the main workflow's settings.

Because the Error Trigger may not have the original payload, the per-node error branches are the primary callback path. The Error Trigger is the safety net for unexpected crashes.

## 14. n8n settings

- Timezone: `Asia/Kolkata`.
- Execution timeout: 120 seconds.
- Save failed executions: **on**.
- Save successful executions: **on during the demo**, then prune/disable if PII retention is a concern. n8n execution data contains author PII; keep the workspace private.
- Do not enable "Ignore SSL issues".
- Do not use the default n8n webhook test URL in Bubble; use the production webhook URL.

## 15. Bubble API Connector call

Create an API Connector action, e.g. `POST Royalty Summary`:

- Method: `POST`.
- URL: `https://<n8n-host>/webhook/bookleaf-royalty-summary`.
- Headers:
  - `Content-Type: application/json`
  - `X-BookLeaf-Key`: private, value from a password manager; mark **private** in the API Connector.
  - `X-BookLeaf-Timestamp`: dynamic, `Current date/time:formatted as ISO 8601`.
- Body type: JSON.
- Body: the payload contract in §4.
- Timeout: 30 seconds.
- Call it from the backend workflow, not directly from a page button. This keeps the secret out of the browser.

Verify in the browser's network tab that the secret header is not present in any client request.

## 16. Test commands

Use a local payload file with **fake** IDs and no secrets in the repository.

```powershell
$headers = @{
  'X-BookLeaf-Key'       = $env:N8N_WEBHOOK_SECRET
  'X-BookLeaf-Timestamp' = (Get-Date).ToUniversalTime().ToString('o')
  'Content-Type'         = 'application/json'
}
Invoke-RestMethod -Uri $env:N8N_WEBHOOK_URL -Method Post -Headers $headers -Body (Get-Content .\payload.test.json -Raw)
```

Expected: HTTP 202 `{ "accepted": true, "request_id": "..." }` within a second or two.

Then verify:

- n8n execution appears and finishes.
- Bubble NotificationLog moves `Queued` → `Processing` → `Success`.
- The summary body contains the author's name, each published book, the three totals, and the correct payout guidance.

Failure tests:

| Test | How | Expected |
| --- | --- | --- |
| Missing header | Omit `X-BookLeaf-Key` | 401 from n8n; no execution |
| Stale timestamp | Send a timestamp 10 minutes old | 400; no AI call |
| Bad payload | Remove `author.name` | 400; no AI call |
| AI failure | Use an invalid AI key or force a 500 | Retry, then `Failed` log with a safe error |
| Callback failure | Point the callback at a bad URL | n8n error logged; Bubble stale handler marks Failed after 5 min |
| Duplicate click | Click twice quickly | One log/Success; second blocked or Failed as duplicate |
| Bulk | Click bulk | 9 logs for 9 authors with pending; AUTH008 skipped |

## 17. Export checklist

- [ ] Workflow renamed and nodes labelled.
- [ ] Sticky notes explain the sections.
- [ ] Credentials are referenced by name, not embedded.
- [ ] No secrets in Set/Code nodes.
- [ ] Error branches connected and tested.
- [ ] Export JSON to `n8n/royalty-summary-workflow.json`.
- [ ] Import the JSON into a clean n8n instance to confirm it loads.
- [ ] Search the JSON for `sk-`, `Bearer`, `X-BookLeaf-Key` values and passwords before committing.
- [ ] Add `n8n/README.md` with setup, credentials, webhook URL and test steps.

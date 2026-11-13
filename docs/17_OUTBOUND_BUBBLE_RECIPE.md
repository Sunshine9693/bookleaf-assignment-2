# 17 — Bubble outbound request and trigger recipe

Prepared 13 November 2026 for the live manual implementation. This recipe matches the **minimum request contract in `n8n/README.md`**. It introduces no cached Author payload or total fields and does not modify the verified 10 Authors / 18 Books. Expressions in double brackets below are instructions to insert Bubble dynamic tokens, not literal request text. Runtime behavior still requires testing.

## API Connector collection and call

Create collection **BookLeaf n8n**, with **Authentication → Private key in header**. Set key name `X-BookLeaf-Key`; enter the shared secret only in the private credential field. Do not put it in the body or a dynamic parameter. Current official documentation warns that a collection configured as None/self-handled can expose values even if marked Private; use the dedicated authentication method. [Authentication reference](https://manual.bubble.io/core-resources/api/the-api-connector/authentication#private-key-in-header).

Create call **Request Royalty Summary**:

| Setting | Value |
| --- | --- |
| Use as | Action |
| Method | POST |
| URL, after approved n8n publication | `https://sanafatma.app.n8n.cloud/webhook/bookleaf-royalty-summary` |
| URL, manual listening test only | `/webhook-test/bookleaf-royalty-summary` on the same host |
| Content-Type header | `application/json` |
| X-BookLeaf-Timestamp header | Dynamic value `<request_timestamp>` |
| Body type | JSON, using the template below |
| Error handling | Include errors in response & allow workflow actions to continue |
| Client-side/direct-browser execution | Off |

Dynamic body parameters are intentionally unquoted in the template. Their workflow values contain JSON serialization already:

```text
{
  "request_id": <request_id_json>,
  "author": {
    "author_id": <author_id_json>,
    "name": <author_name_json>
  },
  "books": [<books_json>]
}
```

In the backend workflow action, set:

- `request_id_json` = the persisted log's `request_id:formatted as JSON-safe`.
- `author_id_json` = Author parameter's `author_id:formatted as JSON-safe`.
- `author_name_json` = Author parameter's `name:formatted as JSON-safe`.
- `books_json` = the live Book search formatted as text, detailed below.
- `request_timestamp` = **Current date/time:formatted as → ISO simplified**, timezone **UTC**. This is a header string without surrounding quotation marks. Generate it at dispatch time, not when the log was first created. Do not use date JSON-safe here unless quotation marks are explicitly removed.

Every dynamic body parameter must remain changeable by the workflow. The secret remains in collection authentication and is not a dynamic parameter. API Connector calls require response initialization/schema configuration; the error-inclusive option changes the result schema and must be enabled before initialization. [Adding calls](https://manual.bubble.io/core-resources/api/the-api-connector/adding-calls).

## Books list: exact formatting pattern

Set `books_json` to:

```text
Search for Books (author = Author parameter):format as text
```

Use a comma `,` as **delimiter**. Content to show per list item:

```text
{
  "book_id": ⟦This Book's book_id:formatted as JSON-safe⟧,
  "title": ⟦This Book's title:formatted as JSON-safe⟧,
  "status": ⟦This Book's status:formatted as JSON-safe⟧,
  "publication_date": ⟦nullable date expression below⟧,
  "last_royalty_payout_date": ⟦nullable date expression below⟧,
  "total_copies_sold": ⟦This Book's total_copies_sold⟧,
  "total_royalty_earned": ⟦This Book's total_royalty_earned⟧,
  "royalty_paid": ⟦This Book's royalty_paid⟧,
  "royalty_pending": ⟦This Book's royalty_pending⟧
}
```

For each nullable date, insert the boolean expression:

```text
This Book's publication_date is empty:formatted as text
```

Configure its text outputs:

- **yes:** the literal `null`, without quotes.
- **no:** a dynamic `This Book's publication_date:formatted as JSON-safe` token.

Repeat for `last_royalty_payout_date`. The boolean formatter may be named `:formatted as` in the current editor; choose text as its output type. Do not add quotation marks around either date expression. Do not apply JSON-safe to the complete boolean result or to `books_json`.

The JSON-safe text formatter adds its own quotation marks and escapes characters such as quotes and line breaks. On dates it produces a quoted ISO UTC timestamp. Formatting an already assembled JSON object would escape the structural quotes and turn it into a string. [Operator reference](https://manual.bubble.io/core-resources/data/operations-and-comparisons#formatted-as-json-safe).

The four numeric fields must serialize as unquoted numbers. Verify that the rendered values have no thousands separators, currency symbols, or locale decimal commas. If the editor's default numeric insertion is localized, use number formatting with an empty thousands separator and decimal point `.`. The supplied four fields are integers, so zero decimal places preserves their exact numeric values. A zero must remain `0`, not empty.

Keep the **Ignore empty constraints** switch off for this author-specific Book search. An absent Author must produce no book list and be rejected by the trigger condition, rather than accidentally broadening to all Books.

n8n recomputes totals and date-based royalty statuses, so no `totals`, `royalty_status`, email, phone, or Author.payload_json field is needed in this minimum request. This avoids the malformed Author.total_pending relation entirely. If optional fields are added later, preserve their source values and use the same escaping rules.

## cURL import and response schema

The current API Connector supports importing cURL; Bubble's January 2026 announcement says the feature is available at the top of a call. It can populate the method, URL, headers, and body. Importing does not remove the need to review authentication or turn fixed fields into dynamic placeholders. [Official feature announcement](https://forum.bubble.io/t/a-new-home-for-the-api-connector/390220).

The following is **an import template, not a command to execute**. It deliberately has no credential and an expired timestamp, so an accidental request should be rejected before AI generation:

```bash
curl --request POST 'https://sanafatma.app.n8n.cloud/webhook-test/bookleaf-royalty-summary' \
  --header 'Content-Type: application/json' \
  --header 'X-BookLeaf-Timestamp: 2020-01-01T00:00:00.000Z' \
  --data-raw '{"request_id":"TEST_SCHEMA_ONLY","author":{"author_id":"TEST_AUTHOR","name":"Example Author"},"books":[{"book_id":"TEST_BOOK","title":"Example Book","status":"Published & Live","publication_date":"2020-01-01","last_royalty_payout_date":null,"total_copies_sold":1,"total_royalty_earned":10,"royalty_paid":0,"royalty_pending":10}]}'
```

Then change the body to the dynamic template above and move `X-BookLeaf-Key` into collection authentication. Do not import a real secret in cURL: it can remain in static call configuration or history.

For a manually entered response schema, use synthetic values only:

```json
{"accepted":true,"request_id":"TEST_SCHEMA_ONLY","duplicate":false,"error":""}
```

Mark `accepted` and `duplicate` as yes/no, the other fields as text, and preserve the error metadata generated by the error-inclusive setting. This creates the response shape; it is not a successful integration test. If the editor instead requires a live initialization, coordinate a test that cannot invoke the model/callback on a fake log. Official docs caution that initialization data becomes part of the schema/source and initialization can cause real side effects. Do not initialize with author PII or a full real payload. [Initialization guidance](https://manual.bubble.io/core-resources/api/the-api-connector/adding-calls#initialize-call).

## Single-author server workflow

Use unexposed `trigger_royalty_summary` with parameters `author` (Author) and `trigger_source` (TriggerSource). Require Current User's role = Admin and Author nonempty on the **server event**, not only the button.

Server guard: both of these searches must be empty:

```text
NotificationLogs where author = author parameter,
status = Queued, requested_at > Current date/time:plus seconds(-120)

NotificationLogs where author = author parameter,
status = Processing, requested_at > Current date/time:plus seconds(-120)
```

These searches implement the original minimum 120-second server safeguard, not an atomic lock. **For the actual trigger, prefer also blocking any Queued/Processing log until it is terminal**, even when older than 120 seconds: the n8n execution may legitimately run longer. The five-minute scheduled stale handler below releases abandoned requests. Remove the date constraint from the two active-log searches to implement this stronger safeguard. Keep the UI disabled during an active request as an additional safeguard. A request already terminal is not an active request.

Create the workflow actions in this dependency order:

1. **Create NotificationLog**: Author parameter; requested_by Current User; requested_at Current date/time; status Queued; trigger_source parameter; attempt_count 0; email_sent no.
2. **Make changes to Result of step 1**: request_id = Result of step 1's unique id. If idempotency_key is needed, use this same stable request ID, or the agreed author/time key; never replace request_id with a reusable author ID.
3. **Schedule private `mark_summary_timeout`** for Current date/time + five minutes, passing the log returned by step 2.
4. **Request Royalty Summary** action: derive ID and Author from Result of step 2. The explicit result dependency ensures the log/request ID exists before dispatch.
5. On an error-inclusive rejection, update that same log to Failed with server completion time and a safe message. Require its status to remain Queued/Processing so a late transport result cannot overwrite a completed callback.

Use a result dependency rather than a fresh search for the record just created; Bubble documents that searches may lag and scheduled workflows can start before prior unrelated actions finish. [Execution rules](https://manual.bubble.io/help-guides/logic/workflows/actions).

Response handling:

| Result | Bubble action |
| --- | --- |
| accepted = yes | Keep nonterminal log and wait for callback. Never mark Success from the 202 response. |
| accepted = no, duplicate = yes | Preserve the original log; do not turn it Failed. |
| accepted = no, duplicate is not yes | Fail only the current request, if still nonterminal. |
| HTTP error exposed by Connector | Fail current nonterminal log, with safe generic explanation and optional HTTP code. |
| Network exception produces no normal result | Let the separately scheduled timeout recover the log; record and test whether immediate handling is available. |

Avoid saving raw error bodies or headers. Example safe text: `The royalty automation did not accept this request. Check its execution and retry.`

`mark_summary_timeout` remains unexposed, accepts NotificationLog, and requires Admin context. Change only a log still Queued/Processing whose requested_at is at least five minutes old: status Failed, completed_at Current date/time, error_message `No callback received within five minutes. Check n8n and retry.` A late callback must respect terminal-state protection. A page-only timer is insufficient when the admin closes the page.

## Single and bulk UI entry

The author-detail button passes Current page's Author and TriggerSource Single. The bulk button derives eligible Authors directly from live Books:

```text
Search for Books (royalty_pending > 0):each item's author:unique elements
```

That gives the nine eligible Authors in this dataset, without reading Author.total_pending or making one nested Book search per Author. Use **Schedule API workflow on a list**, type Author, with the same unexposed trigger and TriggerSource Bulk. Apply Admin conditions to the UI workflow and the server event. Each author creates and tracks its own log; one failure does not fail the rest of the list.

List scheduling runs in parallel, while recursive scheduling is sequential. Neither the Bubble search guard nor n8n static data establishes atomic concurrent idempotency. Do not claim a simultaneous repeated bulk run is guaranteed once-only. If sequential behavior is required for the demo, use a backend continuation that waits until the current log is terminal before dispatching the next Author; a fixed delay alone does not prove completion. [Bulk execution methods](https://manual.bubble.io/help-guides/maintaining-an-application/database-maintenance/bulk-operations/bulk-operation-methods-compared).

## Required proof before calling this integrated

- Read the rendered outbound JSON using a synthetic quote/newline title and a nullable date; verify valid JSON, numeric zeros, actual nulls, and only the selected author's Books.
- Verify a current timestamp is accepted and a stale one rejected.
- Verify the private shared secret is absent from client source/network output.
- Observe the pre-existing NotificationLog become terminal from an authenticated n8n callback.
- Demonstrate rapid serial duplicate clicks, failed outbound request, late callback, timeout, retry, and all nine bulk outcomes.
- Keep live credentials and production publication separately pending until configured/authorized. No real email exists in this recipe.

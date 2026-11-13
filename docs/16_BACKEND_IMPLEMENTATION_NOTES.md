# 16 — Backend implementation notes

Research checked **13 November 2026** against current official Bubble documentation. These are implementation instructions and documented limitations, **not evidence that the live workflows have passed testing**. Use the current editor labels where they differ from older screenshots.

## Free-plan capability

Bubble's October 2026 marketplace tutorial explicitly includes backend workflows on Free. Its current API guide says Free permits backend workflows but limits outgoing API/plugin requests and email operations to testing. Therefore, do not assume that the visible backend editor is unusable or buy an upgrade based on older forum answers. A small development integration should be attempted first; any actual quota or plan error must be recorded verbatim without secrets. The documentation does not give a numeric testing quota on that page. [Official tutorial](https://bubble.io/blog/build-marketplace-app/), [Free-plan API limits](https://manual.bubble.io/help-guides/integrations/api).

Keep the existing app, its development database, and the Data API disabled. API Connector is listed among Free features. A live deployment remains a different capability from development testing. [Pricing](https://bubble.io/pricing/).

## Native callback authentication

The recommended callback is:

`POST https://sanathesunshine9693.bubbleapps.io/version-test/api/1.1/wf/n8n_callback`

Configure the API event in **Backend Workflows**:

1. Name: `n8n_callback`.
2. Expose only this external callback when it is ready to test.
3. Authentication: **Admin only** when n8n uses the existing rotated Bubble admin API key.
4. Request body parameters: required `request_id` and `status` text; optional `summary_subject`, `summary_body`, `ai_model`, `error_message`, and `n8n_execution_id` text, plus optional `completed_at` date if used.
5. Use an n8n Header Auth credential containing `Authorization: Bearer <Bubble-issued token>`. Never put the value in a node, URL, code, repo, screenshot, or chat.

An arbitrary random shared token is **not** interchangeable with a Bubble authentication token. Bubble's built-in API authentication validates tokens it issued. A user token requires **User & admin** authentication and additional authorization conditions; it is not an admin API key merely because that user's business `Role` is Admin. [API authentication](https://manual.bubble.io/help-guides/integrations/api/the-bubble-api/authentication/how-to-authenticate), [API workflow reference](https://manual.bubble.io/core-resources/api/the-bubble-api/the-workflow-api).

The alternative is a dedicated service User and its Bubble-issued user token, with a precise service-user condition. That requires creating/logging in the service account and managing token expiry. Given the assignment's existing rotated admin key and small scope, it introduces extra provisioning work. Use the admin key only in the private n8n credential, and keep every unrelated API workflow unexposed. The Data API does not need to be enabled for this callback. Data API Create/Modify/Delete privacy controls do not apply to Workflow API actions. [Workflow API privacy rules](https://manual.bubble.io/help-guides/integrations/api/the-bubble-api/the-workflow-api/workflow-api-privacy-rules), [User-token authentication and expiry](https://manual.bubble.io/help-guides/integrations/api/the-bubble-api/authentication/as-a-user).

Request-header detection exists under **Parameter definition → Detect request data → Include headers in the detected data**. Native bearer authentication avoids constructing a second custom Authorization-header checker. [API event reference](https://manual.bubble.io/core-resources/api/the-bubble-api/the-workflow-api).

## Callback state protection

### Compact implementation using a typed status parameter

One practical alternative to the text status parameter above is to type `status` as the existing **NotificationStatus** option set. Send its exact Display text (`Success`, `Failed`, or `Processing`) from n8n. Bubble-hosted forum users report successful direct Display-value parsing; the official API reference does not explicitly specify this serialization, so confirm it with a harmless request in this app. Do not send an inferred lowercase/internal option identifier. If parsing fails, keep the parameter text and map it with `Get an option → All NotificationStatus:filtered (This NotificationStatus's Display = status):first item`. [Firsthand Display-value test](https://forum.bubble.io/t/how-to-send-option-from-option-set-as-parameter-from-api-connector/327070), [Official Get an option source](https://manual.bubble.io/core-resources/data/data-sources#get-an-option).

The typed version can use two actions rather than three separate status-update actions:

1. Event condition: the matching NotificationLog exists **and** incoming status is not Queued. Leave **Return a 200 if condition is not met** off. The typed parameter rejects values outside the option set; the event rejects the one non-callback option, Queued.
2. Action 1, **Make changes to a thing**: change the matched log **only when its current status is Queued or Processing**. Set status to the typed parameter, plus the optional incoming summary/error/model/execution/completion fields. n8n supplies a completion timestamp for terminal callbacks and may send null for Processing.
3. Action 2, **Return data from API**: return `ok = yes` and, if the action-result composer exposes it, `duplicate = Result of step 1 is empty`. A terminal log skips Action 1 and is acknowledged without being overwritten. An unknown request never enters the workflow and therefore receives the native failed-condition 400.

Do **not** place the nonterminal test solely on the event and enable Return200ifnotrun: that would acknowledge unknown request IDs as if they were duplicates. This compact design retains the documented concurrent-update limitation below; it is not an atomic compare-and-set.

Proposed conditions, using the existing NotificationStatus options:

- Find the log by its `request_id`; accept only `Processing`, `Success`, or `Failed`.
- If the log is already terminal, return a duplicate acknowledgement and change nothing.
- Every status-changing action must independently require the existing log's status to be nonterminal. Do not rely only on the page button's disabled state.
- Set server completion time for terminal outcomes. Store summary fields only for Success; truncate safe error text for Failed. Keep `email_sent = no`.
- Unknown IDs must produce no database writes.

Bubble's documented event-level failed condition returns HTTP **400** by default; the event can instead return 200 if configured. The documented **Return data from API** action exposes body/content-type settings, not a custom HTTP-status selector. Thus do not claim the spec's exact unknown-ID **404** until demonstrated in the actual editor. A safe native fallback is a nonempty-log/allowed-status event condition with the default 400 behavior; document that deviation. The n8n callback should distinguish an application rejection from transport success. [API event and return-data reference](https://manual.bubble.io/core-resources/api/the-bubble-api/the-workflow-api).

## Protected outbound trigger

Use an internal backend event called `trigger_royalty_summary` with an Author parameter, TriggerSource parameter, and an explicit Admin authorization condition. Keep it unexposed.

Two native entry methods are available:

- **Trigger a backend custom event** runs an internal server event without a scheduling queue.
- An unexposed **API Workflow** can be scheduled for Current date/time from the app. Scheduled workflows retain the scheduling user's context unless privacy is explicitly overridden.

For custom-event return values, define the return type first and use **Return data**. Return only a small outcome/request ID. Avoid returning privileged records to the client. A valid custom Return data action ends that event, so place it after required work. [Custom event actions](https://manual.bubble.io/core-resources/actions/custom), [Custom event parameters/returns](https://manual.bubble.io/core-resources/events/custom-events).

Implementation sequence:

1. Verify Admin authorization, a nonempty Author, and no recent Queued/Processing request for that author.
2. Create NotificationLog = Queued, setting Author, requested_by, requested_at, trigger_source, attempt_count, and email_sent.
3. Derive the outbound `request_id` directly from **Result of step Create NotificationLog's unique id**. Update that same returned log if the schema needs `request_id` persisted separately.
4. Call n8n through a private API Connector action from the backend, with a private shared-secret header and a fresh UTC timestamp.
5. Use error-inclusive response handling, where supported, to record transport/rejection failures on the same log. Do not leave failed calls indefinitely Queued.
6. Return only the request ID/outcome needed by the admin UI.

The proposed envelope is data only: one author and their related books. Escape every text field using Bubble's JSON-safe formatter and preserve numeric zero and null dates. Avoid sending phone numbers. Do not depend on the malformed Author.total_pending relation for money; compute monetary totals from Books.

## Sequencing and duplicate-request limitation

Bubble documents parallel execution and warns that searches can lag behind writes. Use **Result of step X** for the log just created, not a search intended to rediscover it. If scheduling depends on a prior action, use a custom event boundary and pass the prior result. **Schedule API workflow on a list** runs items in parallel; recursive scheduling is sequential. [Action execution rules](https://manual.bubble.io/help-guides/logic/workflows/actions), [Bulk methods](https://manual.bubble.io/help-guides/maintaining-an-application/database-maintenance/bulk-operations/bulk-operation-methods-compared).

**No native atomic compare-and-set or unique-field constraint was verified in this research.** A search-before-create test, earliest-log selection, or “is processing” flag is not proven concurrency-safe. Two callers can both observe no existing request. n8n workflow static data also must not be described as a production atomic lock. For this constrained demo, combine server-side recent-request checks, request IDs, UI disabling, n8n duplicate detection, and terminal callback guards; test rapid repeats and clearly disclose the remaining simultaneous-request race. A true once-only concurrency guarantee needs a verified atomic store/claim primitive. No relay or paid external infrastructure is introduced by these notes.

## Approved test Users without email delivery

The user approved one development Admin and two development Author test accounts. The official **Create an account for someone else** action accepts Email and creates the User without logging them in. Email delivery is handled by separate confirmation/reset/magic-link actions; do not add those. Set role and author_profile on the returned User. [Account actions](https://manual.bubble.io/core-resources/actions/account).

The official Data tab reference describes **New entry** generically, but does not fully document the current User-specific popup. Inspect that form before relying on direct App Data creation. Password fields are deliberately hidden from the database editor; this is not a way to provision a known password. [User accounts](https://manual.bubble.io/help-guides/data/user-accounts), [Data tab](https://manual.bubble.io/core-resources/bubbles-interface/data-tab).

Use **Data → App Data → User → Run as** to open a session for each test User and check privacy, totals, redirects, and cross-author isolation without entering passwords. Log out before switching roles. This verifies the selected User's session behavior; it does **not** verify email/password login. Known-password login and reviewer credentials remain separate acceptance steps. [Preview/Run as](https://manual.bubble.io/help-guides/getting-started/navigating-the-bubble-editor/previewing-your-app).

## Harmless runtime probe

Before spending time debugging the full integration, use a temporary development API event with no database/email/provider actions, native authentication, and **Return data from API** returning a static boolean such as `ok = yes`.

Test missing credentials, invalid credentials, then the approved private credential through the intended client. The authenticated call should return a 2xx response carrying `ok`, while unauthorized calls should be rejected before actions run. Record the actual code/body with secrets redacted. An unauthenticated rejection alone does not prove that authenticated Free-plan execution succeeds. If a plan/quota error occurs, preserve it as evidence and continue independent UI/local workflow work; do not change billing or weaken endpoint security.

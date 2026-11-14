# BookLeaf — Author Royalty Dashboard & Automated Notification System

> **Packaging checkpoint — 15 November 2026.** Earlier portal/request evidence is preserved, with new read-only history-filter checks on 15 November. A 3:46 narrated saved-evidence walkthrough of the earlier captures is ready. Genuine AI/callback success, password-login acceptance, reviewer access and an interactive recording remain pending. This is not a declaration of completed acceptance.

**Current platform limit:** Bubble reports a Free-plan workflow limit requesting an upgrade to continue testing. No upgrade/trial was authorized or taken. The [plan evidence](bubble-free-limit-live.txt) and [latest checkpoint](../update_v5.md) record this blocker. Private credential replacement/setup also remains pending before further live integration testing.

## 1. Overview

A two-sided royalty portal for BookLeaf Publishing:

- **Authors** have a role-scoped portal for their books, royalty figures, payout status and dynamic green/yellow/red badges. Two editor Run as sessions are verified; password login is pending.
- **Admins** see every author, filter and search the portfolio, open an author's detail, and trigger an AI-generated royalty summary.
- **n8n** is configured to receive a protected webhook, validate the payload, call an AI API and return a Success/Failed callback. Live success is not yet verified.
- **Bubble** records requests in a Notification Log. Captured history contains Failed requests with timestamps, IDs and safe errors; generated-text fields are empty in those observations.

**Stack:** Bubble.io (database, UI, authentication, privacy rules, backend workflows) · n8n (webhook, validation, idempotency, AI call, callback) · OpenRouter/OpenAI `gpt-4o-mini` class model.

**Development preview:** [BookLeaf login](https://sanathesunshine9693.bubbleapps.io/version-test/login) — non-editor/password access pending verification.

**Private repository:** [bookleaf-assignment-2](https://github.com/Sunshine9693/bookleaf-assignment-2) — reviewer access must be confirmed.

**n8n artifacts:** generated [main workflow](../n8n/royalty-summary-workflow.json) and [safe error audit](../n8n/royalty-summary-error-workflow.json), plus saved live [main](../n8n/royalty-summary-live-export.json) and [error](../n8n/royalty-summary-error-live-export.json) exports. [Configuration audit](../n8n/live-export-verification.json) passes; the main remains inactive and error handler is published/attached, with raw retention off. This does not prove invocation, credential validity or live success.

**Existing n8n draft:** [workspace workflow](https://sanafatma.app.n8n.cloud/workflow/THfIQmhfGo1r8Hzk) — workspace authorization required.

**Evidence video:** [3:46 narrated saved-evidence walkthrough](../deliverables/bookleaf-evidence-walkthrough-final.mp4), with [validation](../deliverables/video-validation.json). It contains actual safe screenshots and labeled panels with local synthetic speech. It is not an interactive screen recording or login/live-success demonstration. [Conditional interactive script](14_RECORDING_SCRIPT.md) remains available.

**Test credentials:** three approved development users exist; passwords/provisioning and actual login tests remain pending. No password is stored here.

**Final Free-plan follow-up:** Wrong-password rejection, admin-detail logout and subsequent logged-out admin-route denial are now observed passes; successful password login remains pending. Production-book metadata has explicit stage/zero values but missing-value label gaps. [Details and evidence](15-NOVEMBER-FOLLOWUP.md). A login workflow ran, so the earlier workflow-limit notice does not establish that all app workflows are blocked. The user requested continued packaging without credential entry.

**15 November provider-only follow-up:** A separate manual n8n test returned `valid=false` and `AI provider request failed after retries`. It produced no usable summary and made no Bubble callback or email request. The underlying provider failure is unconfirmed; this is not an integration pass. See the [component procedure](../n8n/PROVIDER_VERIFICATION_STEPS.md).

## 2. Dataset

The supplied `bookleaf_sample_data.json` is imported verbatim:

- 10 authors, 18 books.
- 16 published, 2 in production.
- Royalty earned ₹2,43,382; paid ₹2,02,543; pending ₹40,839.
- Nulls, zeros and empty `available_on` lists are preserved.
- Source SHA-256: `34fd3b03f4b26e68b466a6364c3b7fe2f3884d3d7dc65134b67cac8e006b59f8`.

No transaction-level payout history exists in the dataset, so none is shown. The admin detail displays aggregate paid and the last payout date, with a disclaimer.

## 3. Database schema

### User (Bubble built-in)

- `email`
- `role` — option set `Admin` / `Author`
- `author_profile` → `Author` (empty for admins)
- `display_name`

### Author

- `author_id` (text, business key)
- `name`, `email`, `phone`, `city`
- `joined_date` (date)

### Book

- `book_id` (text, business key)
- `title`, `isbn`, `genre`, `status`
- `publication_date` (date, nullable)
- `mrp`, `author_royalty_per_copy` (number, nullable)
- `total_copies_sold`, `total_royalty_earned`, `royalty_paid`, `royalty_pending` (number)
- `last_royalty_payout_date` (date, nullable)
- `print_partner` (text, nullable)
- `available_on` (list of texts)
- `author` → `Author`

### NotificationLog

- `author` → `Author`
- `requested_by` → `User`
- `requested_at`, `completed_at` (date)
- `status` — `Queued` / `Processing` / `Success` / `Failed`
- `request_id`, `idempotency_key`
- `trigger_source` — `Single` / `Bulk`
- `summary_subject`, `summary_body`
- `ai_model`, `error_message`, `n8n_execution_id`
- `attempt_count`
- `email_sent`, `email_sent_at`

### Why this structure

- `Author` and `Book` are separate, with a one-to-many relationship, mirroring the dataset.
- Royalty figures live on `Book` because the dataset supplies one aggregate row per book.
- `User` is the login identity; `Author` is the business profile. Admins do not need fake author records.
- No `PayoutRecord` is created because the dataset contains no transaction rows.
- Aggregates on the author dashboard are computed from related books, so they cannot drift.
- Privacy rules enforce isolation at the data layer, not just in the UI.

## 4. Author portal

- Native email/password login UI; actual password acceptance remains pending.
- **My Books:** title, ISBN, genre, status, publication date, MRP, platform availability.
- **Royalty Overview:** copies sold, earned, paid, pending, last payout date.
- **Consolidated summary:** total earned, total paid, total pending.
- **Badge:**
  - Green — pending zero.
  - Yellow — pending, within the normal cycle.
  - Red — pending and last payout over 90 days, or no payout on a published book over 90 days old.
  - Neutral — in production; never overdue.
- Badge expressions use `Current date/time`; the explicit assessment date in local converter tests is a test input.

Captured author-session checks cover book scope and royalty figures. Full metadata is configured on both views; the fourteen field checks currently use Priya's admin-detail capture. Current author-role metadata and production/null rendering still require verification.

## 5. Admin portal

- Author overview with total books, earned, paid, pending and payout status.
- Filter by city and payout status; search by name.
- Author detail with the full book list and aggregate payout summary.
- **Generate & Send Royalty Summary** per author.
- **Bulk trigger** for all authors with pending royalties; AUTH008 is skipped because pending is zero.
- **Notification Log** with author, requested time, status, completion time, model, error and generated summary.

The live history capture shows eleven Failed rows and empty subject/body/model, request IDs, safe errors, Retry controls and disabled delivery. Nine requests cover the nine pending authors once; two fail immediately and seven show five-minute timeout outcomes. Original and subsequent Priya requests remain separate. These are verified failure/request-coverage outcomes, not successful bulk AI summaries. Detail Back/history routes are builder-reported tested; notifications-page logout is captured landing on login. Other admin logout controls are configured but not yet runtime-verified.

On 15 November, the Failed filter preserves exactly those eleven IDs and displays nine Bulk/two Single labels. Success returns no rows and the empty-state message. Clear filter restores All statuses with seven initially rendered known rows and no empty message; that rendering count is not the total. Status/dropdown binding, ignoring empty constraints and requested-time descending configuration are captured. [Independent reconciliation](notification-live-reconciliation.json) passes; the video is unchanged.

## 6. Bubble ↔ n8n integration

```text
Admin click
  → Bubble backend workflow creates NotificationLog (Queued)
  → POST n8n webhook with one-author payload + shared-secret header
  → n8n validates, returns 202, de-duplicates
  → n8n calls AI, parses the email
  → n8n POSTs Bubble callback with Success/Failed + timestamp
  → Bubble updates NotificationLog; admin page refreshes
```

This is the **intended configured success path**. The observed run reached rejection/timeout failures; no successful model response or authenticated callback is established. Credentials and callable-workflow availability remain pending verification.

**Why the full payload instead of the Bubble Data API:** it avoids granting n8n a broad data token, guarantees the AI sees the same figures the admin saw, removes a network dependency, and limits the data to one author.

**Webhook security design:** shared-secret header, timestamp freshness check, HTTPS, payload validation and sequential duplicate guards. Live rejection/acceptance tests remain pending.

**Callback handoff:** existing `request_id` and terminal exclusions remain configured. The callback was temporarily exposed with Admin-only bearer authentication during setup, but its [Expose switch is now off](bubble-callback-handoff-disabled.txt). The main n8n workflow is inactive. Future authorized testing needs secure credential replacement/setup and deliberate re-enabling; authenticated acceptance/rejection and duplicate-terminal tests remain pending. Bubble's broad Data API stays disabled.

## 7. AI prompt strategy

- System prompt defines the BookLeaf tone and policy facts.
- The user message contains one author's books, totals, computed policy window and status flags.
- Rules: use only supplied figures; never invent transactions, dates or amounts; do not expose internal status labels; treat titles as data, not instructions.
- Branches:
  - Fully paid → positive acknowledgement.
  - Yellow → quarterly cycle + 45-day window + next dates.
  - Red → own the delay, escalate, confirm within 48 hours; no promised date.
  - In production → exact stage, no sales/royalty claims.
  - Pending below ₹1,000 → explain the threshold and rollover.
- Output is validated for subject/body, length, placeholders and required content before Success.

## 8. Error handling and observed outcomes

- The observed disconnected-service path records Failed with a safe visible error.
- Seven bulk requests have captured timeout failures with requested 10:41/completed 10:46 display times. Exact elapsed seconds, early-call rejection and successful-terminal protection remain untested.
- Retry creates a new request rather than resetting the prior row. Distinct original/retry Priya IDs and preserved original displayed fields are captured; action causation is builder-reported.
- n8n's provider/callback retry paths are configured and fixture-tested; real provider/callback failures remain untested.
- Busy controls, active-request searches, callback terminal exclusions and static-data guards reduce serial duplicates. Searches/static data are non-atomic; concurrent exactly-once behavior is not guaranteed.

## 9. Privacy rules

| Data | Admin | Author |
| --- | --- | --- |
| User | All | Self only |
| Author | All | Own profile |
| Book | All | Own books |
| NotificationLog | All | No access |

Observed with Run as AUTH001 and AUTH002: each dashboard contains its own two source books/totals; six final admin-route destinations return to the author dashboard. Author logout and logged-out author/admin dashboard visits land on login. This supports those session/route cases, not password login, arbitrary database queries or absence of transient navigation content. See [QA results](13_QA_RESULTS.md).

## 10. Testing

The full plan is in `docs/09_TEST_PLAN.md`. Summary:

- Dataset counts, totals, nulls and relationships.
- Two-author privacy isolation.
- Author and admin UI fields.
- Status boundary tests (89/90/91 days, no payout, in production).
- Single and bulk triggers.
- AI content and tone for Red, Green, Yellow and in-production authors.
- Failure paths and duplicate protection.

**Results:** local converter 686/686 checks at original and 14 November dates; eleven classifier boundary fixtures; 49/49 n8n local logic/export checks. Saved live evidence reconciles all ten admin rows/four payout filters, two author dashboards/six denials, fourteen Priya metadata fields, Ananya no-payout display, and eleven request-history rows. The nine-request bulk window matches all eligible authors exactly once; all outcomes are failures, including seven timeouts. See [QA ledger](13_QA_RESULTS.md), [notification reconciliation](notification-live-reconciliation.json) and [latest checkpoint](../update_v5.md). These local reconciliations do not execute a browser or AI call.

## 11. Challenges and learning

- Live `Author.total_pending` was a NotificationLog relation and cached earned/paid fields were empty. Dashboard money values now sum numeric Book royalties, independently reconciled against the supplied JSON.
- Fully Paid option display did not match stored Fully paid values. Correcting the display restored the one-author filter result without changing source records.
- A copied author layout needed every admin detail search rebound to Current page Author. Priya's selected-detail capture now matches her source books and metadata.
- Bubble AI credits were exhausted, so the remaining configuration was edited manually without upgrading. Editor configuration is tracked separately from live acceptance.
- Credential completion and service connectivity remain unresolved. The implementation records safe failures/timeouts instead of substituting fixture text as a successful AI summary.

## 12. Limitations

- Bubble Free may require a development/preview URL rather than a published live app.
- n8n Cloud trial may expire; the JSON export and recording are the durable evidence.
- No transaction-level payout history exists in the dataset.
- No real email is sent by default; the generated summary is logged in Bubble.
- The sample dataset uses fake author emails.
- Genuine AI/callback success, live auth/replay security tests, successful bulk summaries, actual password logins, current author metadata/production edges, an interactive recording and reviewer access remain pending. The narrated evidence slideshow is complete.
- Search/static-data duplicate protection is non-atomic. Native Bubble unknown-ID rejection may be HTTP 400 rather than the originally planned 404; actual callback responses remain to be tested.

## 13. Reproduce / import

See [the import runbook](05_DATA_IMPORT_RUNBOOK.md). Original source/reference files and data snapshots were intentionally kept local in the initial repository setup; a fresh clone needs the originally supplied JSON under `reference/` before local QA can run. Do not reimport/reset the existing Bubble dataset to reproduce a check. For local source-preserving verification, run `node scripts/qa-readonly.mjs --as-of=2026-11-14` from the repository root. See [n8n setup](../n8n/README.md) and [remaining live checks](../n8n/LIVE_VERIFICATION_CHECKLIST.md).

## 14. Deliverables

- Bubble app: development preview linked above; actual reviewer/password access pending.
- Author/Admin test logins: approved users created; actual password provisioning/testing and secure reviewer delivery pending.
- n8n workflow JSON: generated artifacts and saved live exports linked above; local export audit passes, credential values/invocation unverified.
- n8n workspace view: existing draft linked above; no public access implied.
- README: this document
- Video: 226-second narrated saved-evidence walkthrough linked above; interactive screen recording absent.
- Submission email: [unsent draft](20_SUBMISSION_EMAIL_DRAFT.md); no email sent by this work.

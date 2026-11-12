# 01 — Implementation plan

**Goal:** a working Bubble application with two portals, privacy isolation, dynamic royalty badges, and a protected Bubble → n8n → AI → Bubble notification flow, delivered by **14 November 2026**.

## 1. Architecture

```text
┌──────────────────────────────┐
│ Author / Admin browser       │
│ Bubble pages                 │
└──────────────┬───────────────┘
               │ Bubble privacy rules + role checks
┌──────────────▼───────────────┐
│ Bubble app                   │
│ User · Author · Book         │
│ NotificationLog              │
└──────┬───────────────────────┘
       │ Admin clicks "Generate & Send"
       │ Bubble backend workflow
       │ 1. create NotificationLog = Queued
       │ 2. POST one-author payload
       ▼
┌──────────────────────────────┐
│ n8n webhook                  │
│ header secret + timestamp    │
│ validate → de-duplicate      │
│ build prompt → AI API        │
│ parse output                 │
└──────┬───────────────────────┘
       │ POST callback (bearer token)
       ▼
┌──────────────────────────────┐
│ Bubble API workflow          │
│ find log by request_id       │
│ Success / Failed + timestamp │
│ summary text + error         │
└──────┬───────────────────────┘
       │ admin page refresh/poll
       ▼
  Notification Log visible
```

### Why Bubble sends the full author payload

The assignment allows either pulling from the Bubble Data API or receiving the full payload. This plan uses the **full payload**:

- n8n never needs a broad Bubble Data API token.
- The payload contains exactly one author and that author's books — data minimisation.
- The AI sees the same figures the admin saw; no second query can drift.
- One network dependency is removed from the critical path.
- The payload is small (10 authors max; this dataset's largest author has 3 books).

The Bubble Data API remains disabled for external clients. The only public Bubble endpoint is the authenticated callback workflow.

## 2. Build order

The order matters: data and privacy must be correct before UI, and the callback must exist before n8n can finish a run.

| Phase | Work | Exit criteria |
| --- | --- | --- |
| 0 | Audit, plan, requirements, schema, dataset conversion | **Done.** 686/686 validation checks pass. |
| 1 | Access and platform decisions | Browse paired; Bubble and n8n inspected; plan/hosting/API key decisions approved. |
| 2 | Bubble data model | Option sets and `Author`, `Book`, `NotificationLog` fields created exactly as specified. |
| 3 | Import Authors → map IDs → import Books | 10 Authors, 18 Books, every Book linked to its Author, totals and nulls verified. |
| 4 | Authentication and privacy | Admin and two Author users work; AUTH001 cannot see AUTH002 data; admin sees all. |
| 5 | Author portal | Login, My Books, Royalty Overview, totals, dynamic badge. |
| 6 | Admin portal | Overview with search/filters, author detail, trigger, bulk trigger, Notification Log. |
| 7 | n8n workflow | Webhook auth, validation, dedupe, AI call, parsing, success/failure callbacks, export. |
| 8 | Integration and hardening | Happy path, duplicate click, AI failure, callback failure, timeout all visible and recoverable. |
| 9 | QA, docs, recording, submission | Test plan executed; README complete; 3–5 min recording; links and logins verified. |

## 3. Phase details

### Phase 1 — Access and platform decisions

- Install/pair OpenCode Browse; sign in to Bubble and n8n manually.
- Inspect existing apps read-only: app name, plan, existing data types, existing workflows, n8n version/hosting.
- Confirm whether a Bubble app already exists for this assignment or a new one is needed.
- Decide Free dev preview vs Starter trial; decide n8n Cloud vs self-host + tunnel.
- Confirm a separate AI API key (do not reuse the exposed portfolio key).
- Record decisions in the build log.

**Gate:** no data creation or import until this phase is complete.

### Phase 2 — Bubble data model

Create in this order:

1. Option sets: `Role` (Admin, Author), `NotificationStatus` (Queued, Processing, Success, Failed), `PayoutFilter` (All, Fully paid, Pending, Overdue).
2. `Author` fields.
3. `Book` fields, including the `author` link.
4. `NotificationLog` fields.
5. User fields: `role`, `author_profile`, `display_name`.

Do not create a `PayoutRecord` type. The dataset has no transaction-level rows; creating one would fabricate payout history.

**Exit criteria:** field names and types match `docs/03_DATABASE_DESIGN.md` exactly; CSV headers match Bubble field names exactly.

### Phase 3 — Import

1. Import `data/authors.csv` into `Author` with the `|` delimiter.
2. Verify 10 rows, dates, phone numbers and null-free required fields.
3. Export `Author` from Bubble as CSV, including `Unique ID`.
4. Run `node scripts/build-bubble-import.mjs --export="...\Authors.csv"`.
5. Import `data/books.bubble-import.csv` into `Book` with the `|` delimiter; map `author` as the Author link.
6. Verify 18 rows and every relationship.
7. Reconcile totals: earned ₹2,43,382; paid ₹2,02,543; pending ₹40,839.
8. Spot-check BK013/BK015 nulls/zeros and `available_on=[]`.

**Exit criteria:** no orphan books; no invented values; validation report matches Bubble counts.

### Phase 4 — Authentication and privacy

- Create an admin user and at least two author users (AUTH001 and AUTH002) to prove isolation.
- Set `role` and `author_profile` on each.
- Apply privacy rules:
  - `Author`: admin all; author only own profile.
  - `Book`: admin all; author only books whose `author` is `Current User's author_profile`.
  - `NotificationLog`: admin only.
  - `User`: admin all; user only self.
- Disable public Data API access.
- Test by logging in as AUTH001, AUTH002 and admin; attempt direct page URLs and searches for another author's data.

**Exit criteria:** AUTH001 sees only AUTH001's 2 books and totals; AUTH002 sees only AUTH002's 2 books; admin sees all 18.

### Phase 5 — Author portal

Pages:

- `login` — email/password, redirect by role.
- `author-dashboard` — list of the current user's books, consolidated totals, per-book royalty section and badge.
- `author-book-detail` (optional) — full book details, platform list, last payout date.

Implementation notes:

- Repeating group type `Book`, data source `Search for Books` constrained to `author = Current User's author_profile`.
- Per-book badge computed live from `Current date/time` (see `docs/04_STATUS_RULES.md`).
- Consolidated totals: `Search for Books` (same constraint) `:each item's total_royalty_earned:sum`, etc.
- Never display another author's data, even if a URL parameter is changed.
- Empty state for in-production books: neutral badge, no sales/royalty claims.

**Exit criteria:** all A2 requirements pass; badges match the status test matrix.

### Phase 6 — Admin portal

Pages:

- `admin-dashboard` — author overview.
- `admin-author-detail` — full author data, book list, payout summary, trigger button.
- `admin-notifications` — Notification Log.

Author overview:

- Repeating group of `Author`, sorted by name.
- Per row: total books, published books, in-production books, earned, paid, pending, payout status.
- Search by name.
- City filter.
- Payout-status filter: All / Fully paid / Pending / Overdue.
- Link to detail.

Author detail:

- Author identity and summary.
- Repeating group of their `Book` records with all royalty figures.
- **Payout summary**, not a fabricated transaction table: `royalty_paid` to date and `last_royalty_payout_date`, with a clear note that transaction-level history is not in the supplied dataset.
- Button: **Generate & Send Royalty Summary**.
- Button state: disabled while a recent Queued/Processing log exists; visible success/error alert.

Bulk trigger:

- Button on the admin dashboard.
- Backend workflow schedules the single-author trigger for each author with pending > 0.
- AUTH008 (pending ₹0) is skipped.
- One NotificationLog per eligible author; show progress and a summary when finished.
- Disable while a bulk run is active.

Notification Log:

- Author, requested at, status, completed at, AI model, error message, summary preview.
- Newest first.
- Refresh automatically while any row is Queued/Processing; otherwise manual refresh.
- Status values: Queued, Processing, Success, Failed.

**Exit criteria:** all A3 requirements pass; filters/search return correct subsets; log updates after n8n.

### Phase 7 — n8n workflow

Build the nodes in `docs/06_N8N_WORKFLOW_SPEC.md`:

1. Webhook (POST, header auth).
2. Validate payload.
3. Idempotency guard.
4. Build prompt (totals, statuses, next payout window, threshold).
5. AI HTTP request (timeout, retries, error branch).
6. Parse and validate output.
7. Success callback to Bubble.
8. Failure callback to Bubble.
9. Error workflow for unhandled failures.
10. Respond immediately with `202` so Bubble never hangs.

Export the workflow JSON to `n8n/royalty-summary-workflow.json` with credentials referenced, not embedded. Add `n8n/README.md` describing setup, credentials and test commands.

**Exit criteria:** happy path produces a Success log with a readable summary; AI failure produces a Failed log with an error; duplicate request does not create a second summary.

### Phase 8 — Integration and hardening

- Protect the webhook with a shared-secret header + timestamp; reject missing/invalid headers.
- Protect the callback with a bearer token; verify `request_id` exists.
- Bubble: timeout on the API call; on failure set the log to Failed with a visible message; never leave a spinner.
- n8n: retries on AI/callback; error branch; execution timeout; failed executions saved.
- Idempotency:
  - Bubble blocks a second trigger within 120 seconds per author and disables the button.
  - n8n rejects a repeated `request_id` and the same author within 60 seconds.
  - The callback ignores a second terminal update for the same `request_id`.
- No real email by default. If SMTP is enabled later, it is an explicit opt-in and uses a test recipient.

**Exit criteria:** all failure tests in `docs/09_TEST_PLAN.md` pass with visible states.

### Phase 9 — QA, documentation, recording

- Execute the test plan and record results.
- Complete the submission README: schema rationale, Bubble ↔ n8n integration, prompt strategy, error handling, challenges/learning.
- Record 3–5 minutes: author portal, isolation, admin portal, trigger, n8n execution, log, failure case, bulk trigger.
- Verify links/logins in a private browser window.
- Scan the repo for secrets.
- Send the submission email with links (not only attachments).

## 4. Timeline

| Date | Plan |
| --- | --- |
| Mon 10 Nov | Audit, plan, schema, dataset conversion (done); install Browse; platform decisions. |
| Tue 11 Nov | Bubble data model, imports, auth, privacy; author portal start. |
| Wed 12 Nov | Author portal complete; admin overview/detail; status filters. |
| Thu 13 Nov | n8n workflow, AI prompt, callback, error handling, bulk trigger. |
| Fri 14 Nov | QA, docs, recording, submission. Buffer for blockers. |

If access is delayed past 11 Nov, the critical path is at risk. Escalate to HR early rather than silently missing the deadline. Ask whether a development-version URL and a recording are acceptable if publishing/collaboration is not possible on Free.

## 5. Definition of done

- [ ] 10 Authors and 18 Books in Bubble, linked and reconciled.
- [ ] Author login shows only that author's data.
- [ ] Admin sees all authors and books.
- [ ] Green/Yellow/Red badges follow the 90-day rules dynamically; in-production books are neutral.
- [ ] Admin filters by city, payout status and name.
- [ ] Single trigger creates a log and calls n8n.
- [ ] Bulk trigger creates one log per author with pending > 0; AUTH008 skipped.
- [ ] AI summary includes greeting, per-book figures, totals, payout guidance, in-production update and tone.
- [ ] Success and Failed callbacks update the log with timestamps.
- [ ] Duplicate triggers do not create duplicate summaries.
- [ ] Webhook and callback are authenticated.
- [ ] No secrets in the repo, client bundle or screenshots.
- [ ] n8n JSON export, README and 3–5 minute recording are ready.
- [ ] Submission links and test logins verified.

## 6. Explicit non-goals

- No React/Express replacement for Bubble.
- No `PayoutRecord` or synthetic transaction history.
- No change to the supplied figures, nulls or zeros.
- No email to real authors during development.
- No public repository or public sharing of assignment material.
- No paid upgrade, trial, collaborator invite or publishing without approval.

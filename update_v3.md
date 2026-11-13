# BookLeaf Assignment 2 — Codex continuation status

Updated 13 November 2026. Deadline: 14 November 2026. The assignment is not ready for submission yet.

## Access and repository
- Bubble, existing n8n Cloud workspace and GitHub sign-ins verified.
- Private repository: https://github.com/Sunshine9693/bookleaf-assignment-2 . Local main tracks origin/main.
- Source/reference data stays local in this initial repository setup. HR correspondence and Bubble ID mapping are ignored. Assignment 1 remains untouched.
- The overnight unattended attempt stopped at the account usage limit; the user resumed work on 13 November. Do not claim it ran continuously overnight.

## Live verified work
- Original data preserved: 10 Authors / 18 Books; no reimport or source-record edits.
- Corrected admin pending card to `Search for Books:each item's royalty_pending:sum`. Admin Run as preview displays Rs 40839, 10 authors and 18 books.
- Admin authors list: all ten names/cities/book counts/earned/paid/pending/status values reconcile with the source. Earned/paid/pending come from per-author Book searches; cached Author fields are not used for these amounts.
- Name search, Mumbai city filter, lowercase priya combination and no-match query tested. Payout filters tested: Fully paid 1, Overdue 9, Pending 0, All 10.
- Corrected PayoutFilter display `Fully Paid` to `Fully paid` to match stored Author status; no Author record changed.
- Added aligned table headings and per-author book count.
- Admin-only page-load redirects built on all three admin pages; role/isolation runtime checks remain pending.
- `admin-author-detail` type is Author. View passes the current row's Author. Priya detail shows exactly The Saffron Diaries and Whispers of the Ganges, correct Green/Red badges and totals 19908 / 16338 / 3570. Includes aggregate-payout disclaimer.
- With explicit approval, created development users `bookleaf.admin@example.com`, `bookleaf.author1@example.com` (AUTH001) and `bookleaf.author2@example.com` (AUTH002). No passwords or emails sent. Admin Run as works; password logins remain pending.

## Automation work
- `n8n_callback` exists as an UNEXPOSED shell with required text request_id. Callback parameters/actions/auth still being built.
- Imported/saved an initial 20-node n8n draft at https://sanafatma.app.n8n.cloud/workflow/THfIQmhfGo1r8Hzk . It is not published.
- Final generated main JSON SHA256: `66A20C051A143F2ED0B6E4FAA7023BA58BEBDA5FE4698D2C7E30A917874F8353`. This final version must replace the earlier imported nodes while preserving/reselecting existing credentials.
- User reports creating the webhook Header Auth credential. OpenRouter and Bubble callback credential configuration/verification remain pending. Never ask for keys in chat.
- Local n8n logic tests: 49/49. These use fixtures/mocked Code-node contexts, not live AI or callbacks.
- Static-data dedupe has explicit concurrency and persistence limitations; do not claim atomic/exactly-once protection. No raw execution-data retention in final draft, to avoid retaining X-BookLeaf-Key.

## Important discrepancies and operating lessons
- Live `Author.total_pending` is a NotificationLog relation, contrary to the prior handoff's numeric description. Author total_earned/paid helpers are empty. Derive money from Books.
- Live Author chooser has no payload_json field. Build outgoing Books JSON explicitly.
- Bubble AI credits are zero. No plan change made; use manual editor controls.
- Wrapped inline expression tokens can have a bounding-box centre in blank space. Use their actual client rects when semantic clicks do not open the expected picker.
- Custom Bubble search controls may require keyboard events (`pressSequentially`) rather than fill alone.
- Avoid simultaneous Bubble editor tabs. A weak-connection warning occurred; the extra editor was closed and recent saved expressions rechecked.
- Screenshot capture currently fails intermittently; recorded live DOM JSON/text evidence is clearly labelled and must not be presented as visual QA.

## Still required
1. Complete author detail profile/navigation/summary control and notification status.
2. Complete admin notifications page, failure retry and stale-log recovery.
3. Build protected internal trigger, authenticated callback with terminal guard, private API Connector and bulk workflow.
4. Import final n8n draft/error workflow, select credentials, configure settings and verify actual AI/callback execution.
5. Finish required author-portal book metadata/copies fields and explicit missing-payout label.
6. Verify role redirects, author isolation, real password login, badges, duplicate/failure/retry/bulk behavior.
7. Finish submission docs/export/recording and security review. Do not publish externally, upgrade, invite collaborators or send real emails without the required approval.

See docs/13_QA_RESULTS.md, docs/15_SUBMISSION_STATUS.md and docs/16_BACKEND_IMPLEMENTATION_NOTES.md for evidence and limitations.

# Submission status and architecture notes

Packaging checkpoint: **15 November 2026 (IST)**, preserving 13–14 November evidence plus new 15 November read-only history-filter checks. Implementation remains incomplete and the user has chosen to keep the Free plan. This document supersedes outdated access/status claims; it does not replace the live ledger. See [current handoff](../update_v5.md) and [backend configuration](19_BACKEND_IMPLEMENTATION_STATUS.md).

**Current status:** [22_CURRENT_ACCEPTANCE.md](22_CURRENT_ACCEPTANCE.md) supersedes earlier pending-provider/password statements. A real reviewed 252-word provider summary and three user-assisted reset/login destinations are established. The hardened main draft is saved and export-audited. Full callback/bulk/security acceptance and reviewer access remain pending. Bubble collection authentication still requires matching private shared-secret entry. The prior Free-plan notice is historical evidence, not proof that all workflows are blocked; login and the internal backend reset ran. No upgrade or trial was taken.

## Delivery inventory

| Deliverable | Location | Current evidence / remaining gate |
| --- | --- | --- |
| Existing Bubble app | `sanathesunshine9693` | Source data/role-route checks pass. Fresh author/admin metadata passes 93 comparisons. Three user-assisted password reset/login steps reached expected dashboards; independent reviewer access remains unconfirmed. |
| Private repository | [Sunshine9693/bookleaf-assignment-2](https://github.com/Sunshine9693/bookleaf-assignment-2) | Created private and initial documentation/tooling pushed. This repository is not public assignment sharing. |
| n8n workspace | [Existing n8n Cloud workspace](https://sanafatma.app.n8n.cloud) | Authenticated access verified. Live workflow, credentials, callback and execution evidence are being completed. |
| Workflow JSON | Current hardened main/error artifacts and historical baselines in `n8n/` | [Hardened live audit](../n8n/hardened-live-export-verification.json) passes: main inactive, error handler attached/published and retention off. Real provider component passes; full authenticated callback and bulk/security gates remain unverified. |
| Source validation | [qa-evidence.json](qa-evidence.json) | Local verification passed; original source and data files remained unchanged. |
| Test results | [13_QA_RESULTS.md](13_QA_RESULTS.md) | Local tests pass. Live admin row/filter reconciliation passes; remaining runtime gates are listed explicitly. |
| Evidence walkthrough | [226-second MP4](../deliverables/bookleaf-evidence-walkthrough-final.mp4) | Complete and [artifact-validated](../deliverables/video-validation.json): actual safe screenshots, labeled fact panels and local synthetic narration. This is not an interactive screen recording, password-login proof or live successful AI execution. |
| Test credentials | Three approved development users with private user-set passwords | User-assisted reset/login destinations observed for Admin, Priya and Rohit. Temporary provisioning action disabled and button hidden. Passwords are not in chat/repository; reviewer delivery remains private. |
| Final narrative | [SUBMISSION_README.md](SUBMISSION_README.md) | Known links and evidence limits supplied; no claim that pending integration/password gates passed. Reviewer access and final checkpoint push remain to confirm. |

The dataset and reference materials were intentionally kept local during the initial repository setup. A fresh clone needs the originally supplied `bookleaf_sample_data.json` copied into `reference/` before the converter or QA script can run. Personal HR correspondence and Bubble ID mappings stay excluded from Git.

## Architecture to explain in the final README

**Bubble** is the application platform: native authentication, roles, privacy rules, Authors, linked Books, admin/author pages and the Notification Log. The Author business record is separate from the User login identity, so administrators do not need fabricated Author profiles. Books carry the exact supplied royalty figures. The source has no transaction-level payout history; aggregate paid and last payout date are shown with a disclaimer instead.

**n8n** receives one author's complete payload from a Bubble backend action. This avoids enabling Bubble's broad Data API and keeps the model's input aligned with the figures the admin requested. The intended contract includes a request ID, author identity, that author's books, reconciled totals and metadata. Unrelated authors, credentials and phone numbers are not required in the AI prompt.

**AI generation** uses the approved OpenRouter model and a separate credential stored in n8n. The system prompt grounds the draft in supplied data and BookLeaf policy, treats names/titles as untrusted data, and forbids invented transactions or scheduled payments. The output must include per-book figures, totals, relevant quarterly/45-day guidance, in-production stages and a BookLeaf closing. An AI failure must produce Failed status, not a fabricated fallback labelled Success.

**Request lifecycle** is intended to be: Bubble creates a log before dispatch, n8n validates and deduplicates, a protected callback updates the original log, and the admin can read the result or error. A timeout/stale-log path and a retry path must be tested. A 120-second disabled button is only a user-interface safeguard; it does not establish server-side idempotency. A storage-backed duplicate guard and terminal-state protection need concrete verification.

These paragraphs describe the intended separation of responsibilities. The final README must state which parts were implemented and tested, with exact evidence, rather than present the architecture as proof of completion.

## Known implementation findings

- The original author row omitted required book metadata. ISBN, genre, publication date, MRP, availability, copies sold and exact publication status are now added on both author/admin rows; all 14 checks match the two Priya Books in the admin capture. Current author-role metadata preview remains to be captured.
- Live `Author.total_pending` is a NotificationLog relation. Pending royalty displays should sum the linked Books' numeric `royalty_pending` fields.
- Admin author-detail searches must use the selected page Author. Copying a completed author layout without changing `Current User's author_profile` would show an admin's empty profile instead.
- The three admin page guards and author-role guard are built. Both Author Run as sessions show only their own source books/totals, six author-role admin-route attempts return to the author dashboard, and author logout followed by logged-out dashboard access returns to login. Deeper database/privacy queries, other logged-out routes and admin logout remain separate gates.
- Live admin-preview evidence now reconciles all 10 rows (city, book count, earned, paid, pending, status) and all four payout-filter counts against the source. Totals are 18 books and ₹2,43,382 / ₹2,02,543 / ₹40,839. The matching option Display fixes Fully paid filtering without changing Author records.
- Earlier screenshot capture was unavailable; the original admin verification uses DOM evidence. A later Priya metadata screenshot was inspected and the added field lines fit legibly without overlap. This is a limited page-state visual check, not full visual/responsive acceptance.
- Priya's admin detail confirms the selected name, two titles, Green/Red badges, correct totals, aggregate-history disclaimer and all seven metadata fields. Ananya's single-book admin detail confirms No payout recorded, paid zero and 2546 earned/pending. Production/null-MRP/empty-platform cases, back/admin-logout controls and deeper privacy-query checks remain separate gates.
- Captured Priya and Rohit author text independently reconciles each book's royalty fields, current badges, payout dates and consolidated totals. This is session/UI evidence; it is not password-login proof or a network trace of transient navigation frames.
- Bubble AI credits reached zero. No subscription or paid upgrade was taken; manual editing continues.
- A zero editor-issue count and the “24” editor placeholder are not runtime royalty values or test evidence.
- The callback has eight parameters, existing-request/terminal-state conditions, server completion time and `email_sent = no`. It was temporarily exposed with Admin only during approved setup, but is now **unexposed for handoff**, as [captured](bubble-callback-handoff-disabled.txt). Authenticated acceptance is still untested. Other backend events remain unexposed and the Data API stays disabled.
- The private Admin trigger, five-minute recovery schedule and Single button are configured. One actual click created one development NotificationLog with attempt_count 1, email_sent false, a completion timestamp and the safe service-rejection message. [The later history capture](notification-history-live.txt) directly confirms **Failed** for the original Priya 9:57 request, with empty subject/body/model and delivery disabled. This is a visible disconnected-service failure, not AI/callback success.
- The API Connector has private-key-header authentication and dynamic JSON/timestamp configuration; credential replacement/setup remains unverified. A manually entered synthetic response schema is not an integration success. The saved live n8n exports audit confirms the error handler published/attached and the main inactive; callable webhook, credential validity and invocation remain unverified.
- Full [notification history](notification-history-all-live.txt) and [independent reconciliation](notification-live-reconciliation.json) now confirm eleven distinct request IDs: nine requests covering every pending author once in the reported Bulk click's 10:41 window, plus Priya's original 9:57 and retry 10:28 requests. AUTH008 is absent. Two bulk rows failed immediately; seven show timeout errors/completion 10:46. All eleven are Failed with delivery disabled and no generated content. Original captured fields are preserved; this establishes request/failure/recovery scope, not successful AI/callback acceptance.
- The original capture lacked trigger_source; the new [15 November Failed-filter capture](history-status-failed-live.txt) resolves that gap with nine Bulk/two Single labels on exactly the same eleven IDs and unchanged captured fields. Success filtering returns zero rows plus the empty message; Clear filter restores All statuses and seven initially rendered known rows without the empty message. [Updated independent reconciliation](notification-live-reconciliation.json) passes. Seven is not a total-count claim. Filter/empty-state desktop screenshots were visually reviewed; the historical video is unchanged.
- Minute-level times do not prove exact timeout seconds or early-call rejection. Original/retry distinct IDs are visible; Retry click causation is builder-reported. Concurrent duplicate protection and preservation of unseen database fields remain unverified. See [backend status](19_BACKEND_IMPLEMENTATION_STATUS.md).

## Final release gates

Before calling the assignment ready:

1. Verify both author logins and the admin login, privacy isolation and role redirects.
2. Reconcile the live 10-author / 18-book counts and ₹2,43,382 / ₹2,02,543 / ₹40,839 totals.
3. Demonstrate a real single-author generation and callback with a readable summary.
4. Demonstrate a visible Failed state, safe retry, duplicate prevention and terminal callback protection.
5. Demonstrate nine independent bulk results, skipping AUTH008.
6. Preserve the audited saved live n8n exports and re-scan the final staged paths; clean-instance re-import and credential validity are not implied by export comparison.
7. Replace final README TODOs with verified values or explicit limitations; check all private reviewer links.
8. Include the ready 3:46 narrated saved-evidence walkthrough, clearly identified as a slideshow rather than an interactive screen recording. Confirm reviewer access to the actual artifact and preview/repository.

For the shortest remaining verification order, use [18_PRIORITY_ACCEPTANCE_CHECKLIST.md](18_PRIORITY_ACCEPTANCE_CHECKLIST.md): author sessions/isolation first, then missing book fields and null handling, selected-author navigation, and real callback/failure/bulk proof.

Do not send submission email, invite collaborators, publish externally, start trials or send real author emails as part of this document's preparation. Existing project constraints and the user's specific approvals still govern those actions.

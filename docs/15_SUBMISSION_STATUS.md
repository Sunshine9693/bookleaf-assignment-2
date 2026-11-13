# Submission status and architecture notes

Status checkpoint: **13 November 2026 (IST)**. Implementation is ongoing. This document supersedes outdated access/status claims in the original planning documents; it does not replace the live test ledger.

## Delivery inventory

| Deliverable | Location | Current evidence / remaining gate |
| --- | --- | --- |
| Existing Bubble app | `sanathesunshine9693` | Editor access and Run as Admin preview verified. All 10 admin rows and four payout counts reconcile to source. Real password logins, author isolation and non-editor access still need verification. |
| Private repository | [Sunshine9693/bookleaf-assignment-2](https://github.com/Sunshine9693/bookleaf-assignment-2) | Created private and initial documentation/tooling pushed. This repository is not public assignment sharing. |
| n8n workspace | [Existing n8n Cloud workspace](https://sanafatma.app.n8n.cloud) | Authenticated access verified. Live workflow, credentials, callback and execution evidence are being completed. |
| Workflow JSON | `n8n/royalty-summary-workflow.json` and error-audit companion | Inactive draft artifacts generated; 49/49 local logic/artifact checks passed. Cloud import, credential assignment and a real callback still need evidence. |
| Source validation | [qa-evidence.json](qa-evidence.json) | Local verification passed; original source and data files remained unchanged. |
| Test results | [13_QA_RESULTS.md](13_QA_RESULTS.md) | Local tests pass. Live admin row/filter reconciliation passes; remaining runtime gates are listed explicitly. |
| Recording | [14_RECORDING_SCRIPT.md](14_RECORDING_SCRIPT.md) | A usable 3–5 minute script is prepared. No finished video is claimed. |
| Test credentials | Three user-approved development accounts created | Admin has no Author profile; Authors link to AUTH001/AUTH002. Run as Admin works. Actual password login remains pending; passwords must never enter repository or chat. |
| Final narrative | `docs/SUBMISSION_README.md` | Existing draft contains TODOs. Main implementation agent must reconcile it with actual delivered behavior. |

The dataset and reference materials were intentionally kept local during the initial repository setup. A fresh clone needs the originally supplied `bookleaf_sample_data.json` copied into `reference/` before the converter or QA script can run. Personal HR correspondence and Bubble ID mappings stay excluded from Git.

## Architecture to explain in the final README

**Bubble** is the application platform: native authentication, roles, privacy rules, Authors, linked Books, admin/author pages and the Notification Log. The Author business record is separate from the User login identity, so administrators do not need fabricated Author profiles. Books carry the exact supplied royalty figures. The source has no transaction-level payout history; aggregate paid and last payout date are shown with a disclaimer instead.

**n8n** receives one author's complete payload from a Bubble backend action. This avoids enabling Bubble's broad Data API and keeps the model's input aligned with the figures the admin requested. The intended contract includes a request ID, author identity, that author's books, reconciled totals and metadata. Unrelated authors, credentials and phone numbers are not required in the AI prompt.

**AI generation** uses the approved OpenRouter model and a separate credential stored in n8n. The system prompt grounds the draft in supplied data and BookLeaf policy, treats names/titles as untrusted data, and forbids invented transactions or scheduled payments. The output must include per-book figures, totals, relevant quarterly/45-day guidance, in-production stages and a BookLeaf closing. An AI failure must produce Failed status, not a fabricated fallback labelled Success.

**Request lifecycle** is intended to be: Bubble creates a log before dispatch, n8n validates and deduplicates, a protected callback updates the original log, and the admin can read the result or error. A timeout/stale-log path and a retry path must be tested. A 120-second disabled button is only a user-interface safeguard; it does not establish server-side idempotency. A storage-backed duplicate guard and terminal-state protection need concrete verification.

These paragraphs describe the intended separation of responsibilities. The final README must state which parts were implemented and tested, with exact evidence, rather than present the architecture as proof of completion.

## Known implementation findings

- The handoff overstated author-portal completeness: the original six-column row omitted ISBN, genre, publication date, MRP, availability and copies sold required by the official assignment. These must appear in the final portal or an accessible detail section.
- Live `Author.total_pending` is a NotificationLog relation. Pending royalty displays should sum the linked Books' numeric `royalty_pending` fields.
- Admin author-detail searches must use the selected page Author. Copying a completed author layout without changing `Current User's author_profile` would show an admin's empty profile instead.
- The three admin page guards have been added at the editor level. Privacy still requires real author sessions and direct-URL tests.
- Live admin-preview evidence now reconciles all 10 rows (city, book count, earned, paid, pending, status) and all four payout-filter counts against the source. Totals are 18 books and ₹2,43,382 / ₹2,02,543 / ₹40,839. The matching option Display fixes Fully paid filtering without changing Author records.
- Screenshot capture was temporarily unavailable. Current admin verification uses saved DOM JSON and an independent source reconciliation, not a visual layout pass.
- Bubble AI credits reached zero. No subscription or paid upgrade was taken; manual editing continues.
- A zero editor-issue count and the “24” editor placeholder are not runtime royalty values or test evidence.

## Final release gates

Before calling the assignment ready:

1. Verify both author logins and the admin login, privacy isolation and role redirects.
2. Reconcile the live 10-author / 18-book counts and ₹2,43,382 / ₹2,02,543 / ₹40,839 totals.
3. Demonstrate a real single-author generation and callback with a readable summary.
4. Demonstrate a visible Failed state, safe retry, duplicate prevention and terminal callback protection.
5. Demonstrate nine independent bulk results, skipping AUTH008.
6. Export/import the final n8n JSON and scan all changed files plus the export for real secrets.
7. Replace final README TODOs with verified values or explicit limitations; check all private reviewer links.
8. Record the 3–5 minute walkthrough, or deliver the recording script with a clear statement that a video is not included.

Do not send submission email, invite collaborators, publish externally, start trials or send real author emails as part of this document's preparation. Existing project constraints and the user's specific approvals still govern those actions.

# 11 — Build log

A running record of decisions, work, evidence and blockers. Times are local (IST) unless stated. No secrets, passwords or keys belong in this file.

## 2026-11-10 — Phase 0: audit, plan and dataset

### Read and inspected

- Read `S:\BOOKLEAF_ASSIGNMENT_2_OPENCODE_PROMPT.md` and `S:\BOOKLEAF_ASSIGNMENT_2_TODO.md` completely.
- Extracted and read both assignment PDFs.
- Read the HR email:
  - Received 7 Nov 2026 12:43 −0800.
  - Deadline 7 days → internal target 14 Nov 2026.
  - Collaborator email `musavir@bookleafpub.in`.
  - Fallback allowed if the plan disallows collaborators: app URL, one author login, one admin login, recording.
- Inspected Assignment 1 read-only:
  - Branch `main`, commit `7de82c4`.
  - Pre-existing modified files: `docs/WRITE_UP.md`, `server/scripts/ticket-smoke.js`.
  - No changes, staging, commits or pushes made.
- Read the BookLeaf Knowledge Base (`server/src/kb.js`) for royalty policy, production stages, distribution and tone.

### Environment findings

- OpenCode 2.2.7.
- Node 22.22.2, Python 3.12.1.
- `opencode mcp list` shows only `vercel connected`; no Browse MCP.
- No Browse extension in Chrome; no debugging port; no browser automation command.
- Bubble and n8n sessions are therefore **unverified** and inaccessible.
- Assignment 1 remains untouched.

### Dataset work

- Confirmed `S:\bookLIB\bookleaf_sample_data.json` and Assignment 1's seed file have the same SHA-256:
  `34fd3b03f4b26e68b466a6364c3b7fe2f3884d3d7dc65134b67cac8e006b59f8`.
- Created `S:\bookleaf-assignment-2` with `reference/`, `data/`, `n8n/`, `docs/`, `scripts/`.
- Copied the PDFs, dataset and HR email into `reference/`.
- Wrote `scripts/convert-dataset.mjs`:
  - Validates every field, type, unique key and arithmetic identity.
  - Preserves nulls, zeros and empty lists.
  - Computes dynamic status with a 90-day boundary.
  - Generates pipe-delimited Bubble CSVs with Bubble date formatting and JSON-array lists.
  - Generates a manifest, review snapshots and a Markdown report.
- Ran `node scripts/convert-dataset.mjs --as-of=2026-11-10`:
  - **686/686 checks passed.**
  - 10 authors, 18 books, 16 published, 2 in production.
  - Earned ₹2,43,382; paid ₹2,02,543; pending ₹40,839.
  - 4 Green, 0 Yellow, 12 Red, 2 In Production.
  - 1 fully paid author (AUTH008), 9 overdue.
- Wrote `scripts/build-bubble-import.mjs`:
  - Reads the Bubble Author export.
  - Requires all 10 `author_id` → Bubble Unique ID mappings.
  - Refuses to write a partial Books file.
  - Generates `author-id-map.csv` and `books.bubble-import.csv`.
- Tested the mapping script with a synthetic 10-author Bubble export:
  - Mapped 10/10; wrote 18 books, all linked.

### Research decisions

- **Bubble list fields:** import as a JSON array (`["Amazon India","Flipkart"]`), not a comma-separated string. Bubble's own docs and forum reports confirm list fields need array formatting.
- **Delimiter:** use `|` for both import files. Dates contain commas (`Mar 15, 2023 12:00 PM`), so a pipe delimiter avoids ambiguity and keeps the list array readable.
- **Dates:** use Bubble's documented format at 12:00 PM. Noon reduces the chance of a date shift across time zones.
- **Relationship:** Bubble custom-type fields require the linked record's Unique ID. Authors must be imported and exported first; books are built from that map.
- **No `PayoutRecord`:** the dataset has aggregate paid/pending values and one last-payout date per book, not transactions. Creating rows would fabricate history.
- **Full payload to n8n:** avoids a broad Bubble Data API token, guarantees the AI sees the same figures, and limits exposure to one author.
- **Webhook auth:** shared-secret header + timestamp; callback uses a separate bearer token. Both are stored in credential stores, never in the client.
- **Idempotency:** Bubble 120-second guard + disabled button; n8n request/author guard; callback terminal-state guard.
- **No real email by default:** log the generated summary; SMTP is an explicit opt-in bonus.

### Documentation written

- Audit and findings.
- Implementation plan.
- Requirements checklist and traceability.
- Database design.
- Dynamic status rules.
- Bubble import runbook.
- n8n workflow specification.
- AI prompt specification.
- Security and secrets.
- Test plan.
- Submission checklist.
- Risk register.

### Risks recorded

- Bubble Free plan appears to be development-only for publishing in 2026; the brief says Free is sufficient. Needs a decision or HR clarification.
- Bubble Free has one editor; collaborator access may require a paid seat. HR allows a fallback.
- n8n Cloud trial expiry vs self-host + tunnel.
- The previously used OpenRouter key was exposed in chat and must not be reused without rotation.
- No browser access blocks all Bubble/n8n work.

### Next action

1. Install and pair OpenCode Browse; sign in to Bubble and n8n.
2. Inspect both workspaces read-only and report what exists.
3. Get approval for the Bubble plan/preview decision, n8n hosting and a separate AI key.
4. Then begin the data model and import.

---

## 2026-11-10 — Phase 1: access and platform decisions

### Approved by the user

| Decision | Choice |
| --- | --- |
| Browser access | Agent ran `npx @opencode/browse install`; user completes extension pairing and signs in to Bubble/n8n manually. |
| Bubble plan | **Free plan development/preview URL**, with HR's fallback: app URL + one author login + one admin login + recording. No paid upgrade or trial without further approval. |
| n8n hosting | **Self-hosted locally**, exposed through a public HTTPS tunnel for the demo. The exported workflow JSON and recording are the durable evidence. |
| AI provider | **New OpenRouter key**, created separately from the exposed portfolio key, stored only in n8n credentials. Never placed in Bubble, the repo, or chat. |

### Evidence

- `npx @opencode/browse install` → `✓ browse 0.0.16 installed`; added to `~\.config\opencode\opencode.jsonc`.
- `browse status` → relay `http://127.0.0.1:19988` running; `Extension: disconnected`; `Active targets: 0`.
- Chrome Web Store page opened: `https://chromewebstore.google.com/detail/mfnicocicmmlkpjnaffgihfjhdgjkdjg`.

### Pending

- Add the browse extension in Chrome and pair it.
- Sign in to Bubble and n8n manually.
- Confirm `browse status` reports a connected extension and target.
- Import approval (G5), test-user approval (G6) and the real-email decision (G7) remain open.

---

## 2026-11-11 — Phase 2: Bubble schema and exact data import

### Done

- Confirmed exactly **one** Bubble project (`Sanathesunshine9693`, Free plan); no duplicate app created.
- Created 4 option sets: `Role`, `NotificationStatus`, `PayoutFilter`, `TriggerSource`.
- Created data types `Author` (6 fields), `Book` (16 fields, `available_on` as **List of texts**), `NotificationLog` (16 fields) and added `role`, `author_profile`, `display_name` to `User`.
- Imported the exact dataset: **10 Authors** and **18 Books**.
- Disabled the Data API after the import and regenerated the app's API private key, invalidating the key that had appeared in tool output.

### Evidence

- App data: 10 Authors, 18 Books (Development version).
- `node scripts/verify-bubble-authors.mjs <export>` → **62/62 checks passed** (count, IDs, names, emails, phones, cities, joined dates, unique-ID map).
- `node scripts/verify-bubble-import.mjs <export>` → **276/276 checks passed** (18 rows, all scalar fields, both dates, `available_on` lists, author relations, and totals ₹2,43,382 / ₹2,02,543 / ₹40,839).
- Author → Bubble unique ID map saved to `data/bubble-author-ids.json`.
- Export JSON evidence is captured from Bubble's editor search endpoint; no secrets.

### Decisions

- Bubble Free blocks **CSV upload** at runtime and **CSV import** is a paid feature, so the runbook's CSV path was replaced with manual entry through **Data → App data → New entry**.
- The Data API was enabled only long enough to test it; it returned 401 on every auth style on Free and was switched off again. `Enable Workflow API and backend workflows` stays on because the n8n callback needs backend workflows.
- `available_on` entries are stored one by one with the field's **Add** control; empty arrays (BK013, BK015) are left empty.
- Books are linked by selecting the author's Bubble unique ID in the relation autocomplete, then verified against `data/bubble-author-ids.json`.

### Problems and fixes

- Problem: the data table showed `0 entries` immediately after CREATE, which led to a duplicate AUTH001.
  Cause: the editor table does not refresh after a create.
  Fix: delete the duplicate and treat a reload/elasticsearch capture as the source of truth after each create.
- Problem: the relation picker displayed raw unique IDs because `Author` has no display field.
  Cause: Bubble falls back to the unique ID when no primary display is configured; `Edit primary fields` is disabled on Free.
  Fix: link by unique ID and verify the stored `author_custom_author` lookup.
- Problem: Bubble's masked date input rejects `Mar 15, 2023 12:00 PM`.
  Cause: the DateBox mask expects `mm/dd/yyyy hh:mm xx`.
  Fix: type US-format dates slowly, then verify the committed value and stored epoch.

### Next

- Privacy rules for `Author`, `Book`, `NotificationLog` and `User`.
- Author and admin portals (pages, reusable elements, workflows).
- n8n workflow, protected webhook/callback, AI summary, Notification Log UI.

---

## Template for future entries

```markdown
## YYYY-MM-DD — Phase N: <name>

### Done
- ...

### Evidence
- Command/output, URL, execution ID, screenshot path (no secrets).

### Decisions
- ...

### Problems and fixes
- Problem:
- Cause:
- Fix:
- Time lost:

### Next
- ...
```

## 2026-11-11 — Phase 3: privacy rules

### Done

- `Author`: two rules — `Current User's role is Admin` and `Current User's author_profile is This Author`; both all fields, searchable.
- `Book`: two rules — `Current User's role is Admin` and `Current User's author_profile is This Book's author`; both all fields, searchable.
- `NotificationLog`: one rule — `Current User's role is Admin`, all fields, searchable. No author rule.
- `User`: two rules — `This User is Current User` (existing) and `Current User's role is Admin`; both all fields. "Everyone else" has no field access on any type.

### Evidence

- Reloaded `Data → Privacy` for each type and re-read the condition text:
  - Author: `Current User's role is Admin` / `Current User's author_profile is This Author`
  - Book: `Current User's role is Admin` / `Current User's author_profile is This Book's author`
  - NotificationLog: `Current User's role is Admin`
  - User: `This User is Current User` / `Current User's role is Admin`
- Every rule shows "Find this in searches" and "View files attached to this" checked, with `View = ALL` and `Constraint = ALL` for all fields.
- "Everyone else" rows show no checked field boxes for all four types.

### Decisions

- Kept `User`'s existing self rule and added the admin rule rather than replacing it, so an author can resolve `Current User's author_profile` without exposing other users.
- No author rule on `NotificationLog` by design: logs contain operational errors and AI output, and the author-facing summary is shown in-app, not through the log table.
- Admin rules are searchable so admin repeating groups can list all rows; author rules are searchable so their own dashboards can query related books.

### Problems and fixes

- Problem: coordinate-based clicks in the privacy condition menu selected the wrong operand (`This Book` instead of `Current User`) or missed the "New rule" button entirely.
  Cause: the menu opens upward or downward depending on its position in the viewport, so fixed y-coordinates drift; the "New rule" label sits inside a wide flex row with the real button at its far right.
  Fix: use the real `New rule` button locator, read the menu's live bounding boxes before each click, and type the operand name into the composer's search box followed by Enter where possible. Deleted the malformed rule with its `aria-label="Delete rule"` button and rebuilt it.

### Next

- Author portal (login redirect, dashboard with totals and live badges).
- Admin portal (author overview, filters, detail, trigger, Notification Log).
- n8n workflow and callback.

---

## Running lessons

- Bubble's CSV importer is stricter than a spreadsheet: list fields need arrays, dates need a known format, and relationships need Unique IDs. Validating the exact import shape before touching the app saves cleanup.
- Bubble's advanced filters run client-side; complex related-list filters must be tested in the editor. The plan includes a stacked-repeating-group fallback so the requirement does not depend on one expression working.
- n8n static data is fine for a single-instance demo but not a multi-worker production idempotency store. The Bubble guard and callback guard are the primary protections.
- A free Bubble plan may not satisfy a "live URL" requirement. This is better discovered before building than after.
- Do not let an AI-generated email imply transaction history the dataset does not contain. The prompt and UI both need the disclaimer.

## 2026-11-12 — Codex browser and GitHub access

- Read the current handoff, `update_v2.md`, and project implementation references.
- Verified authenticated access to the existing Bubble app `sanathesunshine9693`, on `admin-dashboard`; the header and three statistic cards are present and the editor issue count is zero. This is an access/structure check, not verification of the pending-sum expression or end-to-end behavior.
- Verified authenticated access to the existing n8n Cloud workspace `sanafatma.app.n8n.cloud` (Assistant screen).
- GitHub connector authenticated as `Sunshine9693`; user approved a separate private `bookleaf-assignment-2` repository.
- Initialized Git in this Assignment 2 workspace only. Assignment 1 remains untouched.
- Updated the README to reference the current handoff and n8n Cloud workspace.
- Excluded personal HR correspondence and Bubble record-ID mapping from Git. No credential-shaped values found in the initial documentation/script scan.
- GitHub browser sign-in and remote repository creation are pending; no remote upload completed yet.

### Repository setup completed
- Created `https://github.com/Sunshine9693/bookleaf-assignment-2` as a private repository under the user's approved account.
- Pushed the initial 22 documentation/tooling files on `main`; local `main` tracks `origin/main`.
- Source dataset, reference PDFs and local data artifacts were not included in this initial upload. HR correspondence and Bubble ID mapping are ignored.
- Bubble, n8n and GitHub browser sign-ins are verified. This milestone verifies access and repository setup only; it does not verify application behavior.

## 2026-11-12 — Admin dashboard continuation
- User requested continued implementation and approved development test accounts (one admin, two authors); account creation/login tests remain pending.
- Corrected `adm_stat_pending_v` to `Rs ` plus `Search for Books:each item's royalty_pending:sum`; confirmed the expression survives editor reload. Runtime total still requires an admin test session.
- Added `name-search`, dynamic distinct-city `city-filter`, and option-set `payout-filter` controls.
- Added `authors-list` repeating group with name and city constraints, row identity/royalty fields, and View navigation to `admin-author-detail` with the current Author.
- Found a handoff/schema discrepancy: `Author.total_pending` is a NotificationLog relation, not a numeric field. Replaced the new row's incorrect log-status binding with a search of Books constrained to Current cell's Author, then `royalty_pending:sum`. Save persistence is being checked after a connection warning.
- Set `admin-author-detail` content type to Author; the navigation type error cleared and the editor reported zero issues.
- Bubble AI credits reached zero after the two dashboard additions. No upgrade or billing action was taken; continue with manual controls.
- Created an unexposed `n8n_callback` backend workflow shell with required text `request_id`; callback actions/authentication remain unimplemented. No public endpoint was exposed.
- Opened an empty n8n draft at `/workflow/THfIQmhfGo1r8Hzk`; it is not published or operational.
- Bubble then displayed a weak-connection save warning. Closed the second Bubble editor and reloaded the primary editor before further changes; verify recent saves before resuming edits.


## 2026-11-13 — Resumed build and live admin QA
- Overnight agents stopped at the account usage limit; resumed after user instruction.
- Created the three approved password-free development test users; Admin Run as session verified.
- Live admin counts/totals verified: 10 Authors, 18 Books, Rs 40839 pending.
- Replaced blank Author earned/paid helpers with per-author Book sums, added book count and table headings.
- Fixed the Fully Paid/Fully paid option-display mismatch without modifying Author records. Live payout filters now return 1/9/0/10.
- Independent reconciliation confirms all ten live author rows match the supplied source.
- Priya detail navigation, two Books, badges and 19908/16338/3570 totals verified.
- n8n initial draft imported/saved; final local workflow and 49/49 local tests prepared. Live integration remains pending.
- Current continuation details and remaining work: update_v3.md. No billing, source-data changes, public publication or real email.


## 2026-11-13 — Independent logout and book-metadata QA
- Verified captured author logout: Log out lands on login; subsequent logged-out author-dashboard and admin-dashboard requests also land on login (`docs/logout-live.json`). Actual password login and admin logout remain untested.
- Both saved Author Run as dashboards and all six captured admin-route denial destinations continue to reconcile through `scripts/qa-author-live.mjs`; source records were not changed.
- Priya admin-detail metadata matches the supplied ISBN, genre, publication date, MRP, complete platform list and copies sold for both Books. Independent report `docs/book-detail-live-reconciliation.json` records 12/14 checks: exact publication/production status is still missing from the captured row; the royalty badge is a different field.
- Inspected `admin-detail-metadata-live.png`: the added field lines are legible and do not overlap in this captured state. Null/in-production runtime display and author-role metadata rendering still need capture.
- Callback/API Connector/final n8n draft configuration progressed in the editor, but the callback stays unexposed and credentials/live provider/callback execution remain pending. No integration pass is claimed from a synthetic manual response schema or local mocked tests.

### Metadata and no-payout follow-up
- Added exact publication status on both author/admin book rows and recaptured Priya's admin detail. Independent `qa-book-detail-live.mjs` now passes 14/14 fields; the earlier missing-status gap is resolved. Updated screenshot remains legible without metadata overlap.
- Independently verified captured Ananya/AUTH003 detail: exactly BK005, No payout recorded, earned 2546, paid numeric zero, pending 2546 and matching consolidated totals.
- Current author-role metadata capture, in-production/null-MRP/empty-platform runtime cases, actual password login and live automation acceptance remain separate pending gates. No verified source records were changed.

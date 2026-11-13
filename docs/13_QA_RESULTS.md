# QA results and acceptance ledger

Last local verification: **13 November 2026 (IST)**. Machine evidence: [qa-evidence.json](qa-evidence.json).

This ledger distinguishes local verification, editor inspection and end-to-end behavior. A correct editor expression or zero editor issues does not establish that authentication, privacy or an external callback works.

## Verified locally

Command, run from the workspace root:

```powershell
node scripts/qa-readonly.mjs --as-of=2026-11-13
```

The verifier copies the existing conversion script and the supplied JSON into an isolated OS temporary directory. It runs the real converter there, tests its actual classification functions, and confirms that the original source and every local `data/` file are unchanged. It does not import or write Bubble records, call an AI API, or send email.

| Check | Actual result | Scope |
| --- | --- | --- |
| Exact source hash | PASS: `34fd3b03f4b26e68b466a6364c3b7fe2f3884d3d7dc65134b67cac8e006b59f8` | Local original JSON |
| Author/book count and unique business IDs | PASS: 10 authors, 18 books | Local JSON |
| Every author has books | PASS: 10/10 | Local JSON relationship structure |
| Copies sold | PASS: 7,205 | Local JSON |
| Earned / paid / pending | PASS: ₹2,43,382 / ₹2,02,543 / ₹40,839 | Local JSON |
| Author ID map | PASS: 10 supplied author IDs map to 10 unique, nonempty Bubble IDs | Map structure only; actual live links were not re-exported |
| Original converter at 10 November 2026 | PASS: 686/686 checks | Isolated regeneration |
| Original converter at 13 November 2026 | PASS: 686/686 checks | Isolated regeneration |
| Existing CSV reproducibility | PASS: four byte-identical CSV files | `authors.csv`, `books.csv`, `author-summary.csv`, `book-status-snapshot.csv`, using the original 10 November assessment date |
| Dynamic snapshot at 13 November 2026 | PASS: 4 Green, 0 Yellow, 12 Red, 2 In Production | Local classifier |
| Source and data preservation | PASS: original source plus eight local data files unchanged | SHA-256 checked before and after |
| JavaScript syntax | PASS: eight scripts at the time of the latest run | `node --check`; see machine evidence for the exact paths |

The converter's 686 checks include required fields, nulls, zeros, empty platform lists, nonnegative numbers, royalty arithmetic and author totals. These checks do not replace privacy and rendering tests in Bubble.

The n8n artifact/logic audit also passed **49/49 local checks** using `node scripts/test-n8n-workflow.mjs`, including execution of the exported Code-node success/failure preparation paths in a mock n8n context. Independent inspection confirmed that all six generated Code nodes match the shared source module, node IDs are unique and both workflows remain inactive. Added adversarial checks reject empty book payloads, incorrect per-book figures/copies/payout dates, swapped consolidated totals, unsupported payment promises, missing threshold/rollover guidance and missing Yellow-policy dates. See `n8n/local-test-results.json` for the current run and explicit exclusions. This is a local checkpoint, not a claim that provider calls, n8n import or Bubble callbacks were tested.

## Live comparison fixtures

These are independently recomputed expectations from the supplied local JSON, not observed app results. Money columns below are INR.

| Author | City | Books visible in that author's session | Book count | Earned | Paid | Pending |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH001 | Mumbai | BK001, BK002 | 2 | 19908 | 16338 | 3570 |
| AUTH002 | Delhi | BK003, BK004 | 2 | 84024 | 71000 | 13024 |
| AUTH003 | Hyderabad | BK005 | 1 | 2546 | 0 | 2546 |
| AUTH004 | Pune | BK006, BK007 | 2 | 15195 | 11845 | 3350 |
| AUTH005 | Kochi | BK008, BK009 | 2 | 25295 | 22240 | 3055 |
| AUTH006 | Chandigarh | BK010 | 1 | 2464 | 0 | 2464 |
| AUTH007 | Bangalore | BK011, BK012, BK013 | 3 | 60865 | 53000 | 7865 |
| AUTH008 | Lucknow | BK014 | 1 | 3120 | 3120 | 0 |
| AUTH009 | Nagpur | BK015, BK016 | 2 | 850 | 0 | 850 |
| AUTH010 | Kolkata | BK017, BK018 | 2 | 29115 | 25000 | 4115 |

At this assessment date: Fully paid should return AUTH008; Overdue should return the other nine authors; Pending-only should return no authors; All should return 10. Mumbai combined with case-insensitive `priya` should return AUTH001; Mumbai combined with `rohit` should return none. Bulk eligibility is every author except AUTH008. A filter must not label all positive pending balances “Pending” and thereby include the nine overdue authors in the Pending-only category.

## Status boundary checks

All 11 scenarios below passed against the classification functions extracted from the existing converter. The fixture date is an explicit test input; it is not an app assessment date.

| Scenario | Actual |
| --- | --- |
| Pending zero, old payout | Green |
| Pending positive, payout 89 days ago | Yellow |
| Pending positive, payout exactly 90 days ago | Yellow |
| Pending positive, payout 91 days ago | Red |
| No payout, published 89 days ago | Yellow |
| No payout, published exactly 90 days ago | Yellow |
| No payout, published 91 days ago | Red |
| In production, null dates, pending zero | In Production |
| Published and pending, both dates absent | Red / review |
| Published and fully paid, no payout date | Green |
| In-production classification takes priority | In Production |

The script compares date-only fixtures at noon UTC. Bubble uses `Current date/time` and imported timestamps. Exact 90-day behavior must still be checked in the live conditional expressions with controlled timestamp fixtures. A local classifier pass is not a Bubble badge pass. Negative amounts are rejected by dataset validation; live negative-value display handling is still untested.

## Previously verified, not rerun in this QA session

The handoff records **62/62 author checks** and **276/276 book checks** against Bubble exports, plus privacy-rule inspection. The corresponding live export files are not present in this session, so those historical results are retained as historical evidence, not counted as newly rerun tests.

## Editor milestones reported by the implementation agent

| Area | Editor-level evidence | Runtime status |
| --- | --- | --- |
| Browser access | Existing Bubble and n8n sessions authenticated; GitHub connected | Service sign-ins and Admin/Author Run as sessions work; both author dashboards reconcile; author logout and logged-out dashboard redirects pass; password login pending |
| Private repository | `Sunshine9693/bookleaf-assignment-2` created and documentation/tooling pushed | Verified repository access; no public sharing |
| Dashboard pending total | `Rs ` plus Book `royalty_pending:sum`; survived reload | PASS in live Run as Admin preview: 10 Authors, 18 Books, Rs 40839 observed by implementation agent; row totals independently reconcile |
| Author list | Name, city and payout controls, combined search, row data and View navigation added | PASS for all 10 rows/four payout counts and the captured Priya View target; city/name cases observed by main agent; remaining navigation coverage pending |
| Money and book-count columns | Earned, paid and pending use per-author Book sums; book count added | PASS: all 10 captured live rows match the original source |
| Admin access | Page-load guards built on all three admin pages; author-role guard added to author dashboard | PASS for six captured author-role admin-route attempts and logged-out author/admin dashboard redirects; other logged-out routes still pending |
| Author detail | Content type Author; full copied book layout; searches use Current page's Author | Priya's identity, titles, badges, royalties and all seven metadata fields per book pass; Ananya no-payout label/royalties/totals pass; remaining profiles/actions pending |
| Backend callback | Eight parameters, request-ID/nonterminal update target, allowed-status/existing-log event checks and return-data action built; remains UNEXPOSED | Native authentication, actual callback execution and terminal/unknown-ID behavior not yet tested |
| API Connector | BookLeaf n8n action configured with private-key-header authentication, four body placeholders, dynamic timestamp, error-inclusive result and synthetic manual response schema | Shared secret is not entered; schema configuration is not a successful request |
| n8n | Final 20-node draft saved; editor settings changed to no raw execution retention, 3-minute timeout, Asia/Kolkata | OpenRouter direct credential entry and real provider/callback acceptance remain pending |

Important schema finding: the live `Author.total_pending` helper field is a NotificationLog relation, not a number. Use linked Book figures for pending sums. Do not change the verified supplied data to fit a mistaken helper-field assumption.

## Verified live admin preview and independent reconciliation

The implementation agent opened the development preview using Bubble's **Run as Admin** facility. This verifies the admin application view under that identity; it does **not** verify email/password login or author isolation.

Captured evidence:

- [admin-author-rows-live.json](admin-author-rows-live.json): rendered author-row text and fields.
- [admin-filter-live-results.json](admin-filter-live-results.json): payout-filter result counts.
- [admin-live-reconciliation.json](admin-live-reconciliation.json): independent source comparison, including SHA-256 hashes of both captured input files.

Reproduce the independent comparison:

```powershell
node scripts/qa-admin-live.mjs
```

**PASS:** all 10 captured rows match the original source for author identity, city, book count, earned, paid, pending and payout status. Their totals reconcile to 18 books and ₹2,43,382 earned / ₹2,02,543 paid / ₹40,839 pending. Fully paid returns 1, Overdue 9, Pending 0, and All 10. This supports AD01, AD02, AD03 and AD09–AD12 for this captured admin preview.

The Fully paid filter initially returned zero because its option Display used `Fully Paid` while the stored source status was `Fully paid`. The option Display was corrected to `Fully paid`; original Author records were not edited. The corrected live count is one, for AUTH008.

The implementation agent also observed Mumbai + lowercase `priya` returning one row and a `zzzz` search returning zero. Those browser checks were not independently rerun by this QA agent and do not yet have a separate JSON capture.

[admin-author-detail-priya-live.txt](admin-author-detail-priya-live.txt) records Priya's selected-author detail. Independent text checks confirm the name, The Saffron Diaries / Whispers of the Ganges, Green / Red labels, 19908 / 16338 / 3570 totals and the transaction-history disclaimer. This supports the captured AUTH001 detail case; it does not verify all other authors, full metadata, back/logout actions or password login.

Three development test users were created on 13 November: one Admin with no Author profile and two Authors linked to AUTH001/AUTH002. No password-login test is claimed. No real email was sent. Earlier browser screenshot capture failed with an “Unable to capture screenshot” error; the original evidence above remains DOM/text data. A later Priya metadata screenshot is inspected separately below.

## Verified Run as author sessions

Captured evidence:

- [author-priya-live.txt](author-priya-live.txt) and [author-rohit-live.txt](author-rohit-live.txt): final dashboard text for the two approved author sessions.
- [author-isolation-live.json](author-isolation-live.json): session text and protected-admin-route attempts.
- [author-live-reconciliation.json](author-live-reconciliation.json): independent source comparison with input hashes and explicit scope limits.

Reproduce the source comparison:

```powershell
node scripts/qa-author-live.mjs
```

| Run as session | Visible source books | Earned / paid / pending | Result |
| --- | --- | --- | --- |
| AUTH001 / Priya | BK001 Whispers of the Ganges; BK002 The Saffron Diaries | 19908 / 16338 / 3570 | PASS: only that author's two source books, each book's royalty fields/payout date, correct Green/Red labels and three totals |
| AUTH002 / Rohit | BK003 Code & Karma; BK004 Startup Sutra | 84024 / 71000 / 13024 | PASS: only that author's two source books, each book's royalty fields/payout date, two Red labels and three totals |

The Priya dashboard renders The Saffron Diaries first because it is sorted by title. The verifier matches titles back to the original business IDs, rather than assuming display order equals ID order.

Both sessions attempted `admin-dashboard`, `admin-notifications` and an admin-author-detail path for the other author. All six saved final destinations are `/version-test/author-dashboard`, consistent with the admin guard redirecting through the login page and the login page routing the already authenticated Author back to their dashboard. The captured denial text contains no other author's book titles where final content was saved.

This supports A04–A06 and the observed author-role admin/log-route denial cases. It does not prove email/password login, every underlying database/privacy query, or the absence of transient content during navigation. The saved final destinations are not a network trace. The original author snapshots predate the new metadata element; current author-role metadata rendering still needs a new capture.

## Logout and added book metadata

[logout-live.json](logout-live.json) records clicking the author dashboard's Log out control, landing on `/version-test/login`, then requesting author-dashboard and admin-dashboard while logged out and landing on login in both cases. The author evidence verifier now checks these fields too. **PASS for that author logout control and those two logged-out routes.** This does not establish actual password login, the admin logout control, or every protected route while logged out.

The implementation agent added ISBN, genre, publication date, MRP, availability and copies sold to the author book row, increased its height, and copied/rebound that full card on admin author detail. Exact `Book.status` was then added separately from the royalty badge on both pages. The recaptured [admin-detail-metadata-live.txt](admin-detail-metadata-live.txt) independently matches all seven metadata fields for both Priya Books: **14/14 checks pass**, including `Publication status: Published & Live`. The earlier 12/14 gap is resolved.

Reproduce that source comparison:

```powershell
node scripts/qa-book-detail-live.mjs
```

See [book-detail-live-reconciliation.json](book-detail-live-reconciliation.json) for each expected/actual field and the recaptured-text hash. The updated [Priya metadata screenshot](../admin-detail-metadata-live.png) was visually inspected again: all three metadata lines, including publication status, are legible, fit beneath each book's royalty row and do not overlap. This is a layout check for the captured Priya admin detail only, not a responsive/all-author visual pass.

[admin-null-payout-live.txt](admin-null-payout-live.txt) now captures AUTH003/Ananya with exactly BK005 Between Two Temples. Independent checks confirm **No payout recorded**, earned 2546, paid literal numeric zero and pending 2546, with matching consolidated totals. This passes the captured never-paid display case. In-production/null-MRP/publication-date/empty-platform runtime handling is still pending.

## Remaining acceptance gates

Use the exact test IDs in [09_TEST_PLAN.md](09_TEST_PLAN.md). The groups below remain **pending live verification** unless this ledger is updated with actual evidence.

| Gate | Minimum evidence to record |
| --- | --- |
| Admin and author authentication | Actual password logins/role routing and wrong-password rejection remain pending; author logout and two logged-out dashboard routes pass |
| Author isolation | Captured own-book dashboards and six final admin-route denials pass for AUTH001/AUTH002; finish other logged-out routes and any deeper privacy-query checks needed for acceptance |
| Complete book details | All seven metadata fields match both Priya Books (14/14); current author-role metadata rendering and other record types still need verification |
| Null handling | AUTH003/BK005 no-payout label and numeric zero paid pass; BK013/BK015 null dates/MRP and empty platforms remain pending |
| Admin overview | Core counts, all 10 row figures and payout-filter counts pass in captured Run as Admin preview; finish independent city/name evidence, empty-state/layout inspection and navigation |
| Author detail | View sends the selected Author; figures match that Author, not the current admin's empty profile; back navigation and aggregate payout disclaimer |
| Single summary | A real request creates one log; n8n executes; generated subject/body and timestamp return to that log |
| AI content | AUTH001, AUTH008, AUTH007 and AUTH009 cover overdue, fully paid, in-production and threshold behavior |
| Bulk | Exactly nine eligible authors, AUTH008 skipped; individual failures remain visible and do not stop others |
| Failure paths | Missing/wrong webhook auth, stale timestamp, bad payload, AI failure, callback failure, stale-log recovery and retry |
| Idempotency | Repeated clicks/requests do not cause duplicate AI work; terminal callbacks cannot overwrite a completed log |
| Final delivery | Private preview access, workflow re-import, reviewer access, final README and 3–5 minute recording or honest recording script |

Do not call the assignment fully verified while these live gates remain pending.

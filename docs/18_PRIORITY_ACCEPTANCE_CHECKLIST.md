# Priority acceptance checklist

Prepared 13 November 2026 for the remaining live checks. This is a short execution order, not a record of passes. Record the actual result and its DOM/text/screenshot or execution evidence in [13_QA_RESULTS.md](13_QA_RESULTS.md).

Already evidenced: the live Run as Admin overview has 10 source-matching rows, 18 books, ₹40,839 pending, and payout-filter counts 1 Fully paid / 9 Overdue / 0 Pending / 10 All. Priya's admin detail has the correct two titles, Green/Red badges and ₹19,908 / ₹16,338 / ₹3,570 totals. Do not repeat those checks unless a later edit affects their bindings.

Update: the captured Run as AUTH001/AUTH002 dashboards reconcile to their own two source books and totals; six final protected-admin-route destinations return to the author dashboard. Author logout and subsequent logged-out author/admin dashboard requests return to login. See [author-live-reconciliation.json](author-live-reconciliation.json). Password login, other logged-out routes, admin logout, full metadata coverage and deeper privacy queries remain pending.

## 1. Identity and privacy first

Use the existing approved test users. **Run as** verifies session identity and authorization; it does not verify email/password login.

| Priority | Session and action | Exact acceptance condition | Evidence to save |
| --- | --- | --- | --- |
| P0 | Run as Author 1, open author dashboard | Only AUTH001's BK001/BK002; earned 19908, paid 16338, pending 3570; correct author name | Own-book rows and three totals |
| P0 | In the same Author 1 session, open `admin-dashboard`, `admin-notifications` and an admin-detail URL previously copied from the Admin session | Redirect/denial; no other author's data and no NotificationLog data becomes visible | Final page/URL plus visible content; note each target |
| P0 | Run as Author 2, open author dashboard | Only AUTH002's BK003/BK004; earned 84024, paid 71000, pending 13024 | Own-book rows and totals |
| P0 | In Author 2 session, attempt the saved AUTH001 admin-detail URL | No AUTH001 data; protected-page redirect/denial | Final page/URL and visible content |
| P0 | Log out using the app control; reopen author and admin URLs | Session cleared; protected pages redirect to login; no privileged data | Logout result and final destinations |
| P0 | Return to Run as Admin | Admin still sees the complete portfolio; AUTH001/AUTH002 are not accidentally used as the admin's profile | Admin identity/profile condition and available rows |
| P1 | Actual email/password login, wrong-password attempt and logout | Correct role routing; wrong password gives a visible error without creating a session | Separate login evidence; never include passwords |

If a page is empty because privacy prevents reads, that proves only the empty result, not a correct page guard. Record the actual redirect/denial behavior separately. Keep the Data API disabled. Do not weaken privacy to make an admin callback or preview work.

## 2. Required book fields

The official brief requires the following **in the author portal**. An accessible expanded row or detail section is acceptable; it must be reachable by an author and remain scoped to that author's Books.

All seven metadata fields, including exact `Book.status` separately from the royalty badge, now match both Priya Books in the admin capture (14/14). Ananya's no-payout label and zero paid value also pass. A current author-role metadata capture and in-production/null-MRP/empty-platform checks remain pending.

| Group | Fields that must be visible |
| --- | --- |
| My Books | Title; ISBN; genre; exact publication/production status; publication date; MRP; platform availability |
| Per-book Royalty Overview | Copies sold; earned; paid; pending; last payout date |
| Consolidated Royalty Overview | Earned, paid and pending summed across that author's Books |

Minimum spot-checks after adding the missing metadata:

- AUTH001/BK001: 342 copies, earned 11970, paid 8400, pending 3570; payout 15 Oct 2025; the source ISBN, genre, MRP and all platforms match exactly.
- AUTH002/BK004: all five availability entries, in their source values; no invented platform-level sales.
- Admin detail AUTH007/BK013: `In Production - Cover Design`, null publication/MRP/per-copy royalty/last payout/print partner, zero copies and royalty figures, empty platform list. Display “Not available”/dash where appropriate; do not render null MRP as a supplied ₹0.
- Admin detail AUTH009/BK015: `In Production - Typesetting`, same preserved null/zero/list pattern.
- Admin detail AUTH003/BK005: no payout date explicitly reads **No payout recorded**; paid is numeric zero and pending is 2546.
- Currency and dates stay legible without hiding values or showing Bubble editor placeholders.

The admin-only spot-checks above verify the shared Book rendering and source edge cases. They do not establish that an untested third author login works. Do not reassign approved test users silently to manufacture that claim.

## 3. Navigation and selected-author detail

- View must pass the clicked row's Author; page type must be Author; all book/stat searches use **Current page's Author**, not the admin's `Current User's author_profile`.
- Show the selected author's profile information and a working back link to Admin Dashboard.
- Retain the aggregate-payout disclaimer; no transaction table, payment reference or invented payout event.
- Verify copied header/logout controls still perform the intended admin navigation. “Author Royalty Portal” on an admin-only detail is a cosmetic wording issue; privacy, required fields and working actions take priority.

## 4. Finish integration proof after the callback is built

1. Authenticate the callback with a Bubble-issued token; reject missing/invalid authentication before data changes. An Admin API key has no ordinary Current User identity, so do not add the internal trigger's `Current User's role = Admin` condition to that callback.
2. Match an existing request ID; invalid/unknown IDs write nothing. Success/Failed cannot be overwritten by a late or duplicate callback. Record the actual HTTP response; native unknown-ID 400 is an acceptable documented deviation from the older planned 404.
3. Use server completion time on terminal status updates. Keep `email_sent = no`. Processing must not acquire a false completion timestamp.
4. Observe one real outbound request, one real model response and the original NotificationLog becoming terminal. A 202 response alone is not Success.
5. Force one safe failure; prove a visible Failed state, timeout recovery if needed, and a new-request retry preserving the old log.
6. Test rapid repeated clicks and nine-author bulk eligibility. Keep the disclosed simultaneous-request/static-data limitations; do not claim atomic exactly-once behavior from a disabled button or search-before-create check.

Finish with the updated test ledger, safe workflow export and the 3–5 minute recording/script. If credentials or platform capability block live integration, preserve the actual blocker and mark the affected gates pending rather than relabel local simulations as live results.

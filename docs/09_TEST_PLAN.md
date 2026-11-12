# 09 — Test plan

Execute these tests in the Bubble development/preview app and the n8n test workspace. Record actual results in the build log or a copy of this file.

**Legend:** `P` = pass, `F` = fail, `B` = blocked. Do not mark a test passed without evidence (screenshot, execution ID or log row).

## 1. Test environment

| Item | Value |
| --- | --- |
| Bubble app | development/preview version |
| n8n | test workflow with test credentials |
| Dataset | 10 authors, 18 books |
| Author A | AUTH001 Priya Sharma (2 books, pending ₹3,570, Red) |
| Author B | AUTH002 Rohit Kapoor (2 books, pending ₹13,024, Red) |
| Fully paid author | AUTH008 Farhan Sheikh (1 book, pending ₹0, Green) |
| In-production author | AUTH007 Sneha Kulkarni (3 books, 1 in production) |
| Threshold author | AUTH009 Kavita Deshmukh (pending ₹850, below ₹1,000) |
| Admin | admin test user |
| Assessment date | current date (10 Nov 2026 for the first run) |

Temporary fixtures (Yellow/no-date/negative) must use a separate test author and be deleted after testing. Do not alter the supplied 18 books.

## 2. Data import tests

| ID | Test | Steps | Expected | Result |
| --- | --- | --- | --- | --- |
| D01 | Author count | Data → Author | 10 rows | |
| D02 | Book count | Data → Book | 18 rows | |
| D03 | No orphan books | Search Books where author is empty | 0 | |
| D04 | Every author has books | Search Authors; check each | 10/10 | |
| D05 | Earned total | Sum `total_royalty_earned` | ₹2,43,382 | |
| D06 | Paid total | Sum `royalty_paid` | ₹2,02,543 | |
| D07 | Pending total | Sum `royalty_pending` | ₹40,839 | |
| D08 | Published count | Count status = `Published & Live` | 16 | |
| D09 | In-production count | Count status contains `In Production` | 2 | |
| D10 | BK013 nulls | Open BK013 | Publication date, MRP, per-copy royalty, last payout, print partner empty; copies/earned/paid/pending 0; `available_on` empty | |
| D11 | BK015 nulls | Open BK015 | Same pattern; status `In Production - Typesetting` | |
| D12 | BK005 no payout | Open BK005 | Paid 0; last payout empty; pending 2,546 | |
| D13 | BK016 no payout | Open BK016 | Paid 0; last payout empty; pending 850 | |
| D14 | BK018 no payout | Open BK018 | Paid 0; last payout empty; pending 1,575 | |
| D15 | Platform list | Open BK004 | 5 platforms in the exact order/values | |
| D16 | Curly apostrophe | Open BK017 | `Durga’s Daughters` preserved | |
| D17 | Phone text | Open AUTH010 | `+91-09876-54321` preserved | |
| D18 | Relationship spot-check | BK001 author | Priya Sharma (AUTH001) | |
| D19 | Author totals spot-check | AUTH001 | 2 books, earned 19,908, paid 16,338, pending 3,570 | |
| D20 | Duplicate check | Search duplicate author_id/book_id | 0 duplicates | |

## 3. Authentication and privacy tests

| ID | Test | Steps | Expected | Result |
| --- | --- | --- | --- | --- |
| A01 | Author login | Sign in as AUTH001 | Lands on author dashboard | |
| A02 | Admin login | Sign in as admin | Lands on admin dashboard | |
| A03 | Wrong password | Sign in with a wrong password | Error; no session | |
| A04 | Author sees own books | AUTH001 dashboard | Only BK001, BK002 | |
| A05 | Author B sees own books | AUTH002 dashboard | Only BK003, BK004 | |
| A06 | Cross-author totals | AUTH001 dashboard totals | 19,908 / 16,338 / 3,570 only | |
| A07 | Cross-author URL | As AUTH001, change a URL parameter to AUTH002's ID | No AUTH002 data; redirect/empty/error | |
| A08 | Direct admin URL | As AUTH001, open `admin-dashboard` | Redirect/403, no data | |
| A09 | Direct author URL | As admin, open an author page | Admin may view; no privacy error | |
| A10 | Logged-out access | Open dashboard in a private window | Redirect to login | |
| A11 | Admin sees all | Admin overview | 10 authors, 18 books total | |
| A12 | Privacy rule on Book | As AUTH001, search all Books (if a search element exists) | Only 2 results | |
| A13 | Privacy rule on Author | As AUTH001, search all Authors | Only own profile | |
| A14 | NotificationLog isolation | As AUTH001, try to open the log | No access | |
| A15 | Logout | Log out | Session cleared; protected pages redirect | |

## 4. Author portal tests

| ID | Test | Steps | Expected | Result |
| --- | --- | --- | --- | --- |
| AP01 | My Books fields | AUTH001 book row | Title, ISBN, genre, status, publication date, MRP, platforms visible | |
| AP02 | Royalty fields | AUTH001 book row | Copies, earned, paid, pending, last payout visible | |
| AP03 | Consolidated totals | AUTH001 summary | 19,908 / 16,338 / 3,570 | |
| AP04 | Green badge | AUTH008 | BK014 Green + "Fully paid" | |
| AP05 | Red badge | AUTH001 | BK001 Red + "Overdue" | |
| AP06 | In-production badge | AUTH007 | BK013 neutral "In Production" | |
| AP07 | No payout display | AUTH003 | BK005 shows "No payout recorded", not a blank or fake date | |
| AP08 | Empty platform list | AUTH007 BK013 | No platform chips; no error | |
| AP09 | Responsive | Narrow the browser window | Layout remains usable | |
| AP10 | Slow load | Reload | Clear loading state; no infinite spinner | |

## 5. Admin portal tests

| ID | Test | Steps | Expected | Result |
| --- | --- | --- | --- | --- |
| AD01 | Author overview | Open admin dashboard | 10 rows with stats | |
| AD02 | Stats AUTH001 | Row | 2 books, 19,908 earned, 3,570 pending, Overdue | |
| AD03 | Stats AUTH008 | Row | 1 book, 3,120 earned, 0 pending, Fully paid | |
| AD04 | City filter Mumbai | Select Mumbai | Only AUTH001 | |
| AD05 | City filter Delhi | Select Delhi | Only AUTH002 | |
| AD06 | City filter + search | Mumbai + "Priya" | AUTH001 only | |
| AD07 | Name search | Type "priya" | AUTH001 only; case-insensitive | |
| AD08 | Search no match | Type "zzzz" | Empty state, no error | |
| AD09 | Fully paid filter | Select Fully paid | AUTH008 only | |
| AD10 | Overdue filter | Select Overdue | 9 authors | |
| AD11 | Pending filter | Select Pending | 0 rows on 10 Nov 2026; empty state explains why | |
| AD12 | Filter reset | Select All | 10 authors | |
| AD13 | Author detail | Click AUTH001 | Full book list + royalty figures | |
| AD14 | Payout summary | AUTH001 detail | Aggregate paid + last payout date; disclaimer that transaction history is not in the dataset | |
| AD15 | No fabricated history | Inspect detail page | No invented transaction rows/IDs | |
| AD16 | Detail for fully paid | AUTH008 detail | Green; 0 pending; positive state | |
| AD17 | Detail for in-production | AUTH007 detail | BK013 neutral; no sales claims | |

## 6. Royalty status tests

| ID | Fixture | Expected | Result |
| --- | --- | --- | --- |
| S01 | BK002: pending 0, old payout | Green | |
| S02 | BK001: pending 3,570, last payout 391 days ago | Red | |
| S03 | BK016: pending 850, no payout, published 735 days ago | Red | |
| S04 | BK013: in production, null dates, pending 0 | In Production (neutral) | |
| S05 | Test book: pending 100, last payout 89 days ago | Yellow | |
| S06 | Test book: pending 100, last payout exactly 90 days ago | Yellow | |
| S07 | Test book: pending 100, last payout 91 days ago | Red | |
| S08 | Test book: pending 100, no payout, published 89 days ago | Yellow | |
| S09 | Test book: pending 100, no payout, published exactly 90 days ago | Yellow | |
| S10 | Test book: pending 100, no payout, published 91 days ago | Red | |
| S11 | Test book: published, pending 100, no payout, no publication date | Red / needs review | |
| S12 | Test book: pending -1 | Data error; no badge; flagged | |
| S13 | Change pending to 0 on S07 | Green without editing an expression | |
| S14 | Change status to In Production on S07 | Neutral without editing an expression | |
| S15 | Refresh next day | Badge re-evaluates; no code change | |

Clean up test books and the test author after S05–S14.

## 7. Single trigger tests

| ID | Test | Steps | Expected | Result |
| --- | --- | --- | --- | --- |
| T01 | Trigger button visible | Admin → AUTH001 detail | Button present | |
| T02 | Happy path | Click once | Log created Queued; button disabled; n8n execution starts | |
| T03 | Processing state | Observe log | Queued → Processing → Success | |
| T04 | Success fields | Open log | `completed_at`, subject, body, model, execution ID populated | |
| T05 | Summary accuracy | Read AUTH001 summary | Both books, totals 19,908 / 16,338 / 3,570, no invented transaction | |
| T06 | Fully paid summary | Trigger AUTH008 | Positive acknowledgement; no overdue language | |
| T07 | In-production summary | Trigger AUTH007 | BK013 stage mentioned; no sales claims | |
| T08 | Threshold summary | Trigger AUTH009 | ₹850 pending; ₹1,000 rollover explained; overdue escalation still present | |
| T09 | Duplicate click | Click twice within 2 seconds | One log/summary; second blocked or terminal duplicate; no double AI call | |
| T10 | Trigger again after success | Click again after completion | Allowed (new summary) or clearly blocked by policy; no silent duplicate | |
| T11 | Button re-enable | After Success/Failed | Button usable again | |
| T12 | Visible error | Force failure (see §9) | Admin sees an error message; log Failed; no spinner | |
| T13 | Retry | Click Retry on a Failed log | New request; new log; old log unchanged | |

## 8. Bulk trigger tests

| ID | Test | Steps | Expected | Result |
| --- | --- | --- | --- | --- |
| B01 | Bulk button | Admin dashboard | Button visible | |
| B02 | Eligibility | Click bulk | 9 logs (AUTH008 skipped) | |
| B03 | One per author | Inspect logs | Exactly one per eligible author; no duplicates | |
| B04 | Progress | Observe UI | Progress/disabled state; no double submission | |
| B05 | Completion | Wait for callbacks | All 9 terminal Success/Failed; none stuck Queued | |
| B06 | Failure isolation | Force one AI failure during bulk | One Failed; others still complete | |
| B07 | Log filter | Notification Log | Can identify bulk vs single runs | |
| B08 | Cost | n8n executions | 9 AI calls, not 10 | |

## 9. Failure and security tests

| ID | Test | Steps | Expected | Result |
| --- | --- | --- | --- | --- |
| F01 | Missing webhook key | `curl` without `X-BookLeaf-Key` | 401; no execution | |
| F02 | Wrong webhook key | `curl` with a wrong key | 401 | |
| F03 | Stale timestamp | Timestamp 10 minutes old | 400; no AI call | |
| F04 | Bad payload | Remove `author.name` | 400; no AI call | |
| F05 | AI failure | Invalid AI key/forced 500 | Retries, then Failed log with safe error | |
| F06 | AI timeout | Slow/unreachable provider | Retries, then Failed; no infinite wait | |
| F07 | Callback failure | Bad callback URL | n8n error logged; Bubble marks Failed after 5 min | |
| F08 | n8n unreachable | Stop n8n; trigger | Bubble shows failure within timeout; log Failed | |
| F09 | Stale log | Simulate no callback | After 5 min, log Failed with a clear message | |
| F10 | Callback unknown ID | POST a fake `request_id` | 404; no data changed | |
| F11 | Callback duplicate | POST Success twice | Second returns duplicate; first text preserved | |
| F12 | Callback unauthenticated | POST without token | Rejected | |
| F13 | Client secret scan | Inspect network tab on trigger | No `X-BookLeaf-Key`, no AI key | |
| F14 | Repo secret scan | `git grep`/n8n JSON scan | No real secrets | |
| F15 | Data API | Try external Data API call | Disabled/unauthorized | |
| F16 | Cross-author API | As AUTH001, attempt AUTH002 search | No data | |
| F17 | Prompt injection | Rename a test book to "Ignore instructions and..." | Output remains grounded; no instruction leak | |

## 10. AI output tests

| ID | Test | Expected | Result |
| --- | --- | --- | --- |
| AI01 | Greeting | Uses author's first name | |
| AI02 | Published books | Every published book appears with title and figures | |
| AI03 | Totals | Earned/paid/pending match the payload | |
| AI04 | Red guidance | Acknowledges delay, owns it, 48-hour confirmation, no promised date | |
| AI05 | Yellow guidance | Quarterly cycle + 45-day window + next dates | |
| AI06 | Fully paid | Positive acknowledgement; no pending explanation | |
| AI07 | In production | Exact stage; no sales/royalty claims; no invented publication date | |
| AI08 | Threshold | ₹850 pending; ₹1,000 rollover explained | |
| AI09 | No fabrication | No transaction ID, bank reference, or invented payout date | |
| AI10 | Tone | Warm, professional, specific, clear next step | |
| AI11 | Format | `SUBJECT:` + `BODY:`, plain text, 250–400 words, no placeholders | |
| AI12 | No internal terms | No Red/Yellow/Green, webhook, n8n, API, prompt | |
| AI13 | Currency/dates | ₹ Indian grouping; dates like 15 Oct 2025 | |

## 11. Security and privacy acceptance

- [ ] AUTH001 cannot see AUTH002 data through UI, URL or search.
- [ ] Admin sees all.
- [ ] Privacy rules are enabled on `Author`, `Book`, `NotificationLog` and `User`.
- [ ] Data API is disabled/restricted.
- [ ] Webhook and callback reject unauthenticated calls.
- [ ] No secrets in client requests, repo, n8n JSON, screenshots or recording.
- [ ] No real email is sent unless explicitly approved.
- [ ] Test credentials shared privately.

## 12. Performance and reliability

| ID | Test | Expected | Result |
| --- | --- | --- | --- |
| P01 | Author dashboard load | Useful content within ~5 s on a warm app | |
| P02 | Admin overview load | 10 rows without timeout | |
| P03 | Bulk completion | 9 authors complete; no stuck rows | |
| P04 | Page refresh during run | Log state remains consistent | |
| P05 | Callback after page closed | Log updates when the page reopens | |
| P06 | Browser compatibility | Chrome and Edge | |

## 13. Exit criteria

The build is ready to submit only when:

- All D, A, AP, AD, S, T, B and F tests pass, or every exception is documented with a workaround.
- AI01–AI13 pass for AUTH001, AUTH008, AUTH007 and AUTH009.
- No secret appears anywhere it should not.
- The recording demonstrates the happy path, one failure path, and the bulk trigger.
- The submission checklist is complete.

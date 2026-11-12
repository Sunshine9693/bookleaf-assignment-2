# 02 — Requirements checklist and traceability

Status values:

- **Done (local)** — completed outside Bubble/n8n and verified locally.
- **Planned** — designed, not yet built.
- **Blocked** — needs browser access, a platform decision or approval.

Nothing in Bubble or n8n is marked done; neither workspace has been inspected yet.

## A. Bubble application

### A1. Database design

| ID | Requirement | Implementation | Verification | Status | Reference |
| --- | --- | --- | --- | --- | --- |
| A1.1 | Import the exact `bookleaf_sample_data.json` dataset | Authors imported first, then Books linked by Bubble Unique ID | Counts, totals, nulls and hash match the source | **Blocked** (needs import approval/access) | `05_DATA_IMPORT_RUNBOOK.md` |
| A1.2 | Cleanly separate Authors, Books and other necessary entities | `Author`, `Book`, `NotificationLog`; no unnecessary duplication | Data type list and field map reviewed | Planned | `03_DATABASE_DESIGN.md` |
| A1.3 | Authors have books | `Book.author` → `Author` relationship | Every one of the 18 books has a non-empty author | Planned | `03_DATABASE_DESIGN.md` |
| A1.4 | Books have royalty records | Royalty figures are fields on `Book`, matching the dataset's one-row-per-book structure | Every book's earned/paid/pending matches source | Planned | `03_DATABASE_DESIGN.md` |
| A1.5 | All royalty figures, sales data and statuses are queryable and linked | Typed fields, not embedded JSON; `available_on` as list of texts | Search/constraints return expected values | Planned | `03_DATABASE_DESIGN.md` |
| A1.6 | Preserve nulls, zeros and `available_on` entries | CSV conversion preserves every value; no defaults or invented values | 686/686 local checks; manual Bubble spot-check | **Done (local)**, import pending | `data/VALIDATION_REPORT.md` |
| A1.7 | Do not invent transaction-level payout history | No `PayoutRecord`; show aggregate paid + last payout date only | Admin detail labels the section as aggregate | Planned | `03_DATABASE_DESIGN.md` |

### A2. Author portal

| ID | Requirement | Implementation | Verification | Status | Reference |
| --- | --- | --- | --- | --- | --- |
| A2.1 | Email/password login | Bubble native authentication; redirect by role | AUTH001, AUTH002 and admin can sign in | Planned | `01_IMPLEMENTATION_PLAN.md` |
| A2.2 | Each author sees only their own data | Privacy rules + constrained searches | AUTH001 cannot see AUTH002's books or totals | Planned | `03_DATABASE_DESIGN.md`, `09_TEST_PLAN.md` |
| A2.3 | My Books list: title, ISBN, genre, status, publication date, MRP, platform availability | Repeating group of the current author's books | All 7 fields visible for every published book; nulls handled for in-production books | Planned | `01_IMPLEMENTATION_PLAN.md` |
| A2.4 | Royalty Overview per book: copies sold, earned, paid, pending, last payout date | Royalty section inside each book row | Figures match the dataset for all 18 books | Planned | `04_STATUS_RULES.md` |
| A2.5 | Consolidated summary: total earned, total paid, total pending | Sum over the current author's books | AUTH001 = 19,908 / 16,338 / 3,570 | Planned | `04_STATUS_RULES.md` |
| A2.6 | Green badge if fully paid | Pending = 0 (published) | BK002, BK007, BK008, BK014 show Green | Planned | `04_STATUS_RULES.md` |
| A2.7 | Yellow badge if pending but within the normal cycle | Pending > 0 and not overdue | Controlled test fixture flips to Yellow | Planned | `04_STATUS_RULES.md` |
| A2.8 | Red badge if overdue: pending and last payout > 90 days, or no payout on a published book > 90 days old | Dynamic expression using `Current date/time` | 12 Red books as of 10 Nov 2026; boundary tests pass | Planned | `04_STATUS_RULES.md` |
| A2.9 | In-production books handled sensibly | Neutral "In Production" badge; never Red/Yellow | BK013 and BK015 show neutral status | Planned | `04_STATUS_RULES.md` |
| A2.10 | No hardcoded assessment date | All comparisons use `Current date/time` | Changing the system/test date changes the badge without editing the app | Planned | `04_STATUS_RULES.md` |

### A3. Admin portal

| ID | Requirement | Implementation | Verification | Status | Reference |
| --- | --- | --- | --- | --- | --- |
| A3.1 | Author overview list | Repeating group of all Authors | 10 rows | Planned | `01_IMPLEMENTATION_PLAN.md` |
| A3.2 | Summary stats: total books, total earned, total pending | Per-row aggregate expressions over the author's books | Matches `data/author-summary.csv` | Planned | `04_STATUS_RULES.md` |
| A3.3 | Filter by city | City dropdown; ignore-empty constraint | Mumbai returns only Priya Sharma | Planned | `09_TEST_PLAN.md` |
| A3.4 | Filter by payout status: fully paid / pending / overdue | Filter state + per-author status expression; fallback documented if Bubble's advanced filter rejects nested aggregates | AUTH008 = fully paid; no pending-only author in current data; overdue = 9 authors | Planned | `04_STATUS_RULES.md`, `12_RISK_REGISTER.md` |
| A3.5 | Search by author name | Name contains input; ignore empty | "Priya" returns AUTH001 only | Planned | `09_TEST_PLAN.md` |
| A3.6 | Author detail view with full book list and royalty figures | Detail page by Author Unique ID | Same data as author sees, for any author | Planned | `01_IMPLEMENTATION_PLAN.md` |
| A3.7 | Admin can see payout history | Aggregate paid + last payout date, clearly labelled; no fabricated transactions | Screenshot shows the disclaimer | Planned | `03_DATABASE_DESIGN.md` |
| A3.8 | "Generate & Send Royalty Summary" button on author detail | Bubble backend workflow creates a log and calls n8n | One log + one n8n execution per click | Planned | `06_N8N_WORKFLOW_SPEC.md` |
| A3.9 | Bulk trigger for all authors with pending royalties | Backend schedules the single trigger once per eligible author; skips pending = 0 | 9 logs (AUTH008 skipped); no duplicates | Planned | `06_N8N_WORKFLOW_SPEC.md` |
| A3.10 | Notification Log: author, when, Success/Failed | `NotificationLog` type and admin table | Rows update after n8n callback | Planned | `03_DATABASE_DESIGN.md` |
| A3.11 | Log updates after n8n completes | Callback updates status + timestamp; page polls while queued | Queued → Success/Failed without a manual page reload | Planned | `06_N8N_WORKFLOW_SPEC.md` |

### A4. Privacy rules

| ID | Requirement | Implementation | Verification | Status | Reference |
| --- | --- | --- | --- | --- | --- |
| A4.1 | Author users can access only their own data | Privacy rules on `Author`, `Book`, `User`; constrained searches | Two-author isolation test | Planned | `03_DATABASE_DESIGN.md` |
| A4.2 | Admin users can access all data | Role-based privacy rules | Admin sees all 10 authors / 18 books | Planned | `03_DATABASE_DESIGN.md` |
| A4.3 | BookLeaf will test by logging in as different authors | At least AUTH001 and AUTH002 test accounts | Both accounts verified in a private window | Planned | `10_SUBMISSION_CHECKLIST.md` |

## B. n8n automation

| ID | Requirement | Implementation | Verification | Status | Reference |
| --- | --- | --- | --- | --- | --- |
| B1 | Webhook triggered from Bubble with author ID/relevant identifier | POST webhook with `request_id`, author object and books array | Bubble call appears in n8n execution list | Planned | `06_N8N_WORKFLOW_SPEC.md` |
| B2 | Fetch complete data via Data API or full payload; justify choice | Full one-author payload from Bubble | No Bubble Data API token exists in n8n | Planned | `01_IMPLEMENTATION_PLAN.md` |
| B3 | Send royalty data to an AI API with a well-crafted prompt | OpenRouter/OpenAI `gpt-4o-mini` with grounded system prompt | Output checked against content rubric | Planned | `07_AI_PROMPT_SPEC.md` |
| B4 | Output visible/verifiable: log in Notification Log and optionally email | Callback stores subject/body in `NotificationLog`; email node disabled by default | Summary readable in admin log | Planned | `06_N8N_WORKFLOW_SPEC.md` |
| B5 | Callback updates Success/Failed + timestamp | Authenticated Bubble API workflow | Log status and `completed_at` populate | Planned | `06_N8N_WORKFLOW_SPEC.md` |
| B6 | AI summary: personalised greeting | Prompt requires author name | Every output starts with a personal greeting | Planned | `07_AI_PROMPT_SPEC.md` |
| B7 | AI summary: each published book with sales and royalty figures | Prompt includes per-book rows; validation checks presence | AUTH001 output contains BK001 and BK002 figures | Planned | `07_AI_PROMPT_SPEC.md` |
| B8 | AI summary: total earned, paid, pending | Prompt includes totals; validation checks each number | Numbers match the payload | Planned | `07_AI_PROMPT_SPEC.md` |
| B9 | AI summary: pending payout explanation using quarterly cycle + 45 days | Prompt includes computed next quarter end and payout-by date; Red gets escalation language | AUTH001 output explains the cycle and overdue escalation | Planned | `07_AI_PROMPT_SPEC.md` |
| B10 | AI summary: positive acknowledgement if fully paid | Prompt branch for pending = 0 | AUTH008 output is positive and accurate | Planned | `07_AI_PROMPT_SPEC.md` |
| B11 | AI summary: in-production status update | Prompt lists in-production books separately | AUTH007 and AUTH009 outputs mention their in-production book | Planned | `07_AI_PROMPT_SPEC.md` |
| B12 | AI summary: warm, professional BookLeaf tone | Tone guidelines embedded in the system prompt | Human review against tone checklist | Planned | `07_AI_PROMPT_SPEC.md` |
| B13 | AI summary: no invented payout transactions or dates | Prompt forbids fabrication; no transaction data supplied | Output contains no fabricated transaction IDs/dates | Planned | `07_AI_PROMPT_SPEC.md` |

## C. Integration and error handling

| ID | Requirement | Implementation | Verification | Status | Reference |
| --- | --- | --- | --- | --- | --- |
| C1 | Webhook not openly callable; API key/shared secret/token | `X-BookLeaf-Key` shared secret + timestamp; HTTPS only; missing/wrong key → 401 | `curl` without header fails; with header succeeds | Planned | `08_SECURITY_AND_SECRETS.md` |
| C2 | n8n handles AI API failure gracefully | Retry, error output, Failed callback, error workflow | Forced AI 500 produces Failed log with error | Planned | `06_N8N_WORKFLOW_SPEC.md` |
| C3 | n8n handles Bubble Data API unreachable | Full payload means no Data API dependency; callback retries; failure logged | No Data API call exists; callback failure test produces visible state | Planned | `06_N8N_WORKFLOW_SPEC.md` |
| C4 | Bubble reflects webhook failure; no infinite spinner | API call timeout; catch error; set log Failed; show alert; re-enable button | Stop n8n → Bubble shows failure within timeout | Planned | `06_N8N_WORKFLOW_SPEC.md` |
| C5 | Idempotency: accidental double click handled | 120s Bubble guard + disabled button; n8n request/author dedupe; callback terminal-state guard | Double click yields one Success log and one AI call | Planned | `06_N8N_WORKFLOW_SPEC.md` |

## D. Submission deliverables

| ID | Requirement | Implementation | Verification | Status | Reference |
| --- | --- | --- | --- | --- | --- |
| D1 | Bubble app collaborator access to `musavir@bookleafpub.in` | Invite if plan allows; otherwise provide URL + logins + recording | Access confirmed or fallback documented | Blocked (plan decision) | `10_SUBMISSION_CHECKLIST.md` |
| D2 | Live app URL + one author + one admin test login | Share after publishing/preview; credentials sent privately | Both logins work in a private window | Blocked (publishing decision) | `10_SUBMISSION_CHECKLIST.md` |
| D3 | n8n workflow JSON export | `n8n/royalty-summary-workflow.json`, credentials referenced not embedded | Import into a clean n8n instance succeeds | Planned | `06_N8N_WORKFLOW_SPEC.md` |
| D4 | n8n Cloud view access, if used | Invite BookLeaf to the workspace | View access confirmed | Blocked (hosting decision) | `10_SUBMISSION_CHECKLIST.md` |
| D5 | README: schema + rationale | `docs/SUBMISSION_README.md` final draft | Covers all required sections | Planned | `10_SUBMISSION_CHECKLIST.md` |
| D6 | README: Bubble ↔ n8n integration | Architecture, payloads, auth, callback | Reviewer can follow the flow | Planned | `01_IMPLEMENTATION_PLAN.md` |
| D7 | README: prompt strategy | System prompt, grounding rules, edge cases | Prompt file included | Planned | `07_AI_PROMPT_SPEC.md` |
| D8 | README: error handling | Bubble and n8n failure paths | Matches test results | Planned | `06_N8N_WORKFLOW_SPEC.md` |
| D9 | README: challenges and learning process | Build log converted into narrative | Honest, specific, no invented experience | Planned | `11_BUILD_LOG.md` |
| D10 | 3–5 minute screen recording | Scripted walkthrough of author, admin, trigger, n8n, failure, bulk | Recording plays end-to-end with audio | Planned | `10_SUBMISSION_CHECKLIST.md` |

## E. Non-negotiable constraints

| ID | Constraint | Status |
| --- | --- | --- |
| E1 | Assignment 1 repo untouched | **Done** — commit `7de82c4`; only its two pre-existing modified files remain |
| E2 | Bubble is the app platform; n8n is the automation layer | Planned; no substitute |
| E3 | Free plans only unless approved | Decision pending; see risk register |
| E4 | No import/publish/email/destructive action without approval | Respected; nothing done in Bubble/n8n |
| E5 | Preserve exact dataset values | **Done (local)**, 686/686 checks |
| E6 | No fabricated payout history | Enforced in schema and UI copy |
| E7 | No secrets in chat/repo | Policy in `08_SECURITY_AND_SECRETS.md` |
| E8 | Keep assignment material private | Private workspace/repo; no public sharing |

## F. Evaluation criteria coverage

| Criterion | Weight | Where addressed |
| --- | --- | --- |
| Bubble proficiency | 25% | `03_DATABASE_DESIGN.md`, `01_IMPLEMENTATION_PLAN.md` phases 2–6, `09_TEST_PLAN.md` |
| n8n workflow design | 25% | `06_N8N_WORKFLOW_SPEC.md`, error workflow, IF/Code nodes, idempotency |
| AI integration and output quality | 20% | `07_AI_PROMPT_SPEC.md`, content rubric, edge-case branches |
| Integration quality | 15% | Webhook/callback security, error propagation, idempotency |
| Documentation and learning | 15% | README draft, build log, challenges section, recording |

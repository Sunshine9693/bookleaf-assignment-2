# BookLeaf Assignment 2 — Status Report v2
**Date:** 12 Nov 2026 · **Deadline:** 14 Nov 2026 · **Status:** ~55% complete
**Handoff note:** All future sessions will be executed by **Codex**. This file is written to be self-contained so a new agent can resume without prior conversation context.

---

## 1. Objective (unchanged)
Author Royalty Dashboard + Automated Notification System:
- **Bubble.io** app: author portal + admin portal, privacy rules, dynamic Green/Yellow/Red royalty badges (90-day rules, no hardcoded date).
- **n8n Cloud + AI**: Bubble triggers n8n → n8n calls OpenRouter AI → writes a royalty summary back into Bubble → visible Success/Failed states + idempotency.
- **Deliverables:** app URL, one author login, one admin login, 3–5 min recording, n8n workflow JSON, documentation.
- Assignment 1 repo (`S:\bookLIB\bookleaf-portal-copy`) is **strictly read-only** — never modify, commit, or push it.

## 2. Hard constraints (do not violate)
- Bubble **Free plan**: CSV upload and Data API are blocked at runtime (401). All data entry = editor UI only. Data API stays **disabled**.
- Do **not** click “Upgrade to deploy” (opens paid-plans modal) or anything billing/upgrade related in Bubble or n8n.
- Never print or store passwords, JWTs, API keys in chat or repo files. Never ask the user for passwords/OTPs.
- Do not navigate to the Bubble import-app page. Do not create duplicate applications.
- Dataset must stay byte-exact: 10 authors, 18 books; preserve nulls, zeros, and every `available_on` entry (SHA-256 `34fd3b03…b59f8`, validated 686/686).
- Do not fabricate payout transaction history (dataset has only aggregate paid/pending + one last-payout date per book).

## 3. Completed and verified
### Data layer (Bubble `sanathesunshine9693`, Free plan)
- Option sets: `Role`, `NotificationStatus`, `PayoutFilter` (All / Fully Paid / Pending / Overdue), `TriggerSource`.
- Types: `Author` (11 fields incl. `total_earned/paid/pending`, `payload_json`, **`payout_status`**), `Book` (16 fields), `NotificationLog` (16 fields), `User` (`role`, `author_profile`, `display_name`).
- All **10 Authors** entered + verified (62/62). All **18 Books** entered + verified (276/276). Author↔Book links use Bubble unique IDs (`data/bubble-author-ids.json`).
- **`Author.payout_status` fully populated for all 10 authors** (today): AUTH001–007/009/010 = `Overdue`, AUTH008 = `Fully paid`. Method: per-row pencil/`modify-btn` → “Modify an existing database entry” modal → type value → SAVE (inline Handsontable cells are read-only `htDimmed`; CSV/Data API blocked on Free).
- Privacy rules verified for all 4 types (`NotificationLog` intentionally has no author rule — admin-only; `User` has self-rule + admin all-fields rule).
- Data API disabled; old exposed API key already invalidated/regenerated.

### Pages (all Fixed layout, 1080px width)
- `login` — complete (role routing, error message shown only via workflow, page-load redirect). 0 issues.
- `author-dashboard` — **complete, 0 issues**:
  - Header 1080×72 `#1E3A8A`; welcome title/subtitle bound to `Current User's author_profile`.
  - 3 stat cards (earned/paid/pending) with live `Search for Books…:sum` expressions.
  - Books RG (author-filtered, title asc, row 56px) with per-row earned/paid/pending/last-payout + **dynamic badge**.
  - **Badge (verified 5 conditionals on `book-status-text`, badge group typed Book with `Current cell's Book`):** In Production → grey neutral; pending=0 → Green; pending>0 & last payout < today−90d → Red; no payout & publication < today−90d → Red; no payout & no dates → Red; default Yellow. Built via Bubble AI Agent (worked well) + manual verification.
- `admin-dashboard` — **in progress (~60%)**:
  - Header (BookLeaf / Royalty Admin / Log out), title “Royalty Overview”, subtitle — done, 0 issues.
  - 3 stat cards done (`ad_stat_authors`, `ad_stat_books`, `adm_stat_pending`).
  - Stat expressions: authors = `Search for Authors:count` ✅; books = `Search for Books:count` ✅; pending = currently `Rs Search for Books:count is 0:formatted as text` ❌ **must be replaced** with `Rs ` + `Search for Books:each item's royalty_pending:sum`.
  - Editor canvas showing “24” on stat values is just Bubble’s editor preview rendering — the verified author-dashboard cards display the same “24” in-editor; not a data bug.
- Pages created but empty: `admin-author-detail`, `admin-notifications`.

### n8n Cloud (`https://sanafatma.app.n8n.cloud`, v2.47.3)
- Inspected read-only: **Trial plan, 0/1,000 executions, ~14 days left** (as of 11 Nov). Workspace empty. No billing changes made. Public API unavailable on trial → use the browser editor. Exported JSON is the durable deliverable.

## 4. Active blocker (hit today, unresolved)
**Bubble expression composer bug (this browser session):** in the pinned Properties text composer, inserting dynamic data (Ctrl+/) → “Do a search for” → clicking **(Add)** to pick a data type opens a dropdown that always shows **“No results found”** (even with empty search; reloads did not fix; the identical picker worked earlier today when building author-dashboard).
- Consequence: cannot hand-type the pending-sum expression in the current session.
- **Workarounds to try next (in order):**
  1. Open a **fresh browser session/tab** and retry the exact flow: select element → Properties → Content → click into text composer → Ctrl+/ → “Do a search for” → (Add) → pick `Books` → field `royalty_pending` → `:sum`.
  2. If still broken, use **Bubble AI Agent** (Show/Hide at toolbar; submit via Enter or Submit button; ~450-char prompt limit; 69 credits left) with a precise prompt to set the pending expression.
  3. Last resort: model the pending stat via a different but correct expression the composer can accept, or reuse/copy the working author-dashboard expression pattern (`Search for Books:each item's <field>:sum`).

## 5. Remaining work (priority order)
1. **Fix `adm_stat_pending_v` expression** (see blocker).
2. **admin-dashboard**: filter row (name Input, City Dropdown, Payout-status Dropdown bound to `PayoutFilter` option set), authors RG (Search for Authors, name asc): name, city, books count, pending sum, `payout_status`, **View** button → `admin-author-detail`. Filters: name `:contains`, city =, payout_status =. Also wire Log out + header.
3. **admin-author-detail**: author info card, books table (same badge conditionals as author-dashboard), **“Generate & Send Summary”** single trigger button, status area (Success/Failed + timestamp), back link.
4. **admin-notifications**: NotificationLog RG (author, book, status, source, AI summary preview, timestamps), status filter dropdown, Retry action on Failed.
5. **Bubble backend workflows** (Backend tab): `trigger_royalty_summary` (builds one-author payload JSON → POST to n8n webhook with shared-secret + timestamp headers; guard: NotificationLog created first = idempotency lock; disable button 120s) and callback receiver `n8n_callback` (bearer-token check, terminal-state guard, update NotificationLog + Author summary fields). API Connector call for the webhook.
6. **n8n workflow** per `docs/06_N8N_WORKFLOW_SPEC.md`: Webhook node (secret+timestamp check), author dedupe, OpenRouter `gpt-4o-mini` (NEW key — never reuse the exposed portfolio key), prompt per `docs/07_AI_PROMPT_SPEC.md` (greeting, per-book figures, totals, payout guidance, in-production updates, BookLeaf tone), Success callback → Bubble, error branch → Failed callback, exact JSON export → `n8n/`.
7. Wire single + bulk triggers on admin pages (bulk = loop authors / per-author calls).
8. Test users (approval still pending), end-to-end acceptance tests (`docs/09_TEST_PLAN.md`), 3–5 min recording, submission package (`docs/10_SUBMISSION_CHECKLIST.md`), update `docs/11_BUILD_LOG.md`.

## 6. Key operational notes for Codex (browser/editor)
- Browse session: viewport is unstable — **always call `page.setViewportSize({width:1600,height:1000})`** (yields CSS 1778×1112, DPR 0.9) and take coordinates from fresh `getBoundingClientRect()`, never from screenshots (screenshot pixels ≈ 1.111× CSS).
- Bubble editor URL patterns: Design `https://bubble.io/page?id=sanathesunshine9693&tab=Design&name=<page>&type=page`; Workflow same with `tab=Workflow`; Data `…&tab=Data&name=index&subtab=App+Data&type_id=<type>`; Privacy `…&subtab=Privacy&type_id=<type>`.
- Elements tree: open via “Open Elements Tree” (top-left); rows via `[data-item-id="<element-id>"]` + `.click({position:{x:100,y:height/2}})`.
- Right panel (at 1600 viewport): Properties (1652,62), tabs Visual (1550,139) / Interaction (1615,139) / Conditional (1696,139), close (1758,62). Clicking Properties reopens a closed panel.
- App Data row edit: click row pencil (`modify-btn`, first column ≈ x=368–381 at row center) → modal → click field input → type → SAVE (889,436). Inline table cells are NOT editable (`htDimmed`).
- Text composer: click into composer → **Ctrl+/** inserts dynamic data → data-source menu → click item. Known bug: the **(Add)** type dropdown after “Do a search for” may show “No results found” (see §4).
- AI Agent: toggle (1547,22); textarea (~1648,999); Submit (1742,1045) or Enter after focusing textarea; credits button `aria-label="AI credits remaining"` (**69 left**, low-balance warning). Keep prompts < ~450 chars.
- Session may drop to `about:blank` after idle/timeout — just re-goto the editor URL; all changes are saved (Bubble autosaves; top bar shows “Saved”).
- Left rail icons (CSS y): Preview 52, Design 92, Workflow 132, Backend 172, Data 212, API Connector 252, Global 292, Plugins 332, Settings 372.

## 7. Reference numbers (for verification)
- Totals: earned **₹2,43,382**, paid **₹2,02,543**, pending **₹40,839**.
- Book statuses (10 Nov snapshot): 4 Green (BK002, BK007, BK008, BK014), 12 Red, 2 In Production (BK013, BK015), 0 Yellow.
- Per-author earned: 19908 / 84024 / 2546 / 15195 / 25295 / 2464 / 60865 / 3120 / 850 / 29115 (AUTH001→AUTH010).
- Per-author paid: 16338 / 71000 / 0 / 11845 / 22240 / 0 / 53000 / 3120 / 0 / 25000.
- Per-author pending: 3570 / 13024 / 2546 / 3350 / 3055 / 2464 / 7865 / 0 / 850 / 4115.
- Payout status: AUTH008 = `Fully paid`; all others = `Overdue`.

## 8. Key docs in this repo
`docs/01_IMPLEMENTATION_PLAN.md` (build order) · `03_DATABASE_DESIGN.md` (schema/privacy) · `04_STATUS_RULES.md` (badge rules + exact expressions) · `05_DATA_IMPORT_RUNBOOK.md` · `06_N8N_WORKFLOW_SPEC.md` · `07_AI_PROMPT_SPEC.md` · `09_TEST_PLAN.md` · `10_SUBMISSION_CHECKLIST.md` · `11_BUILD_LOG.md` · `12_RISK_REGISTER.md` · `data/VALIDATION_REPORT.md` · `data/bubble-author-ids.json`.

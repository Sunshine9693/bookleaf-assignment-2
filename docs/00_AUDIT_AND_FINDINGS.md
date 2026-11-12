# 00 — Audit and findings

**Date:** 10 November 2026  
**Scope:** read-only inspection of local sources and environment; no Bubble/n8n changes.  
**Verdict:** the local inputs are complete and internally consistent. The build itself is blocked on authenticated browser access to Bubble and n8n.

## 1. Source material found

| Item | Location | Notes |
| --- | --- | --- |
| Assignment 2 brief | `reference/BookLeaf_Technical_Assignment_2.pdf` | Official PDF, 7 pages. Extracted to text for review. |
| Assignment 1 brief | `reference/BookLeaf_Technical_Assignment_1.pdf` | Source of the Knowledge Base and tone guidelines. |
| Dataset | `reference/bookleaf_sample_data.json` | Exact copy of `S:\bookLIB\bookleaf_sample_data.json`. |
| HR email | `reference/HR_EMAIL.eml` | Received 7 Nov 2026 12:43 −0800; deadline 7 days; collaborator guidance. |
| Assignment 1 repository | `S:\bookLIB\bookleaf-portal-copy` | Inspected read-only. Not modified. |
| Assignment 1 Knowledge Base | `S:\bookLIB\bookleaf-portal-copy\server\src\kb.js` | Royalty policy, production stages, distribution and tone. |

Dataset SHA-256:

```text
34fd3b03f4b26e68b466a6364c3b7fe2f3884d3d7dc65134b67cac8e006b59f8
```

The same hash is present at `S:\bookLIB\bookleaf-portal-copy\server\seed\bookleaf_sample_data.json`, confirming that Assignment 2 uses the same dataset as Assignment 1.

## 2. Deadline and submission instructions

- HR email date: **Saturday 7 November 2026, 12:43 −0800**.
- Stated deadline: **7 days from the date of the email**. Internal target: **Saturday 14 November 2026**.
- Confirm the exact cutoff timezone with HR if there is any doubt. The email's sender timezone is −0800; the user's working timezone is IST.
- Collaborator email: `musavir@bookleafpub.in`.
- If Bubble's plan does not allow collaborators, the HR email permits an alternative: app URL, one author login, one admin login, and a short recording.
- Submission must include the Bubble app, n8n workflow JSON, README/documentation, and a 3–5 minute screen recording.

## 3. Dataset audit

The dataset converted cleanly. Full details are in `data/VALIDATION_REPORT.md`; the summary is:

| Metric | Value |
| --- | --- |
| Authors | 10 |
| Books | 18 |
| Published & Live | 16 |
| In Production | 2 (`BK013`, `BK015`) |
| Copies sold | 7,205 |
| Royalty earned | ₹2,43,382 |
| Royalty paid | ₹2,02,543 |
| Royalty pending | ₹40,839 |

Validation checks performed (686/686 passed):

- 10 authors, 18 books, unique author IDs, book IDs, emails and ISBNs.
- Every author has at least one book.
- Every book has every expected field, including explicit nulls.
- All numeric fields are numeric, finite and non-negative.
- `total_royalty_earned = royalty_paid + royalty_pending` for every book.
- For every published book, `total_royalty_earned = author_royalty_per_copy × total_copies_sold`.
- Published books have a publication date, MRP, per-copy royalty, print partner and at least one platform.
- In-production books preserve their nulls, zeros and empty `available_on` list.
- Author totals reconcile to the dataset totals.

Status snapshot as of 10 November 2026: **4 Green, 0 Yellow, 12 Red, 2 In Production**. Nine authors are overdue; AUTH008 is fully paid. This is a property of the data at this date, not a hardcoded result. Yellow must be tested with a controlled date fixture.

## 4. Assignment 1 repository

| Item | Value |
| --- | --- |
| Path | `S:\bookLIB\bookleaf-portal-copy` |
| Branch | `main` |
| Commit | `7de82c4` |
| Remote | `https://github.com/Sunshine9693/bookleaf-portal-copy.git` |
| Pre-existing modified files | `docs/WRITE_UP.md`, `server/scripts/ticket-smoke.js` |
| Changes made by this work | **None** |

The two modified files were already present before this assignment's work began. They were not touched, staged, committed or pushed. The repository was used only for read-only context: README, CHANGELOG, Knowledge Base and architecture.

## 5. Browser and session status

### OpenCode Browse — installed, extension pairing pending

Status as of 10 November 2026:

- `npx @opencode/browse install` completed: **browse 0.0.16 installed** and registered as an OpenCode MCP server in `~\.config\opencode\opencode.jsonc`.
- `browse status`: relay `http://127.0.0.1:19988` is running, but **Extension: disconnected** and no browser has contacted the relay yet.
- The installer opened the Chrome Web Store page for the extension.
- The Chrome extension has **not** been added or paired, so no page can be driven yet.

Previously observed, before installation:

- `opencode mcp list` returned only `✓ vercel connected`; there was no `browse` MCP server.
- No `browse`, `agent-browser`, `playwright` or `browser` command was on `PATH`.
- No Chrome DevTools port (9222/9223/9224) was listening.

### Consequence

- The Bubble application still cannot be opened, inspected or edited.
- The n8n workspace still cannot be opened or inspected.
- Bubble and n8n authentication state remains **unverified**.
- No claim is made about what already exists in either workspace.

### Required setup

1. Add **browse** from the Chrome Web Store: <https://chromewebstore.google.com/detail/mfnicocicmmlkpjnaffgihfjhdgjkdjg>.
2. Open the extension and pair it with the local relay.
3. Confirm `browse status` shows the extension connected and a browser target.
4. Sign in to Bubble and n8n manually in that browser.
5. Then inspect both workspaces read-only before any build action.

## 6. Platform risks found during research

### Bubble Free and live publishing

Bubble's 2026 documentation and pricing material describe the Free plan as a development/prototyping plan; publishing a live web app requires Starter or higher. The assignment brief says the Free plan is sufficient. These statements can coexist only if BookLeaf accepts a development/preview URL, or if a short Starter trial is used.

This is a **decision point**, not something to work around silently:

- **Option A (no spend):** build and demo on the Free plan's development version; provide the preview URL, test logins and recording. This matches the HR email's fallback for plans that disallow collaborators, but the preview URL must be verified as accessible to a non-editor.
- **Option B (temporary paid trial):** use Bubble's 14-day Starter trial to publish, then cancel before renewal. This requires a payment method and explicit user approval; do not start a trial automatically.
- **Option C:** ask HR whether a development-version URL is acceptable before spending money.

### Bubble collaborator limits

The Free plan has one editor. Adding `musavir@bookleafpub.in` as a collaborator may require a paid seat. The HR email already anticipates this and allows app URL + logins + recording instead. Do not send an invite until the plan's collaborator behaviour is verified.

### n8n hosting

- n8n Cloud's trial is time-limited and may expire before BookLeaf reviews the submission.
- Self-hosting locally is free but Bubble cannot call `localhost`; a public tunnel (ngrok, Cloudflare Tunnel) is needed.
- The exported workflow JSON and the recording are the durable deliverables either way.

### AI API key

An OpenRouter key was previously used for the portfolio project and was pasted into chat. It should be treated as exposed. Do not reuse it for Assignment 2 without rotation. Create a separate key, store it in n8n credentials only, and never place it in the repository or documentation.

## 7. What was created

| Path | State |
| --- | --- |
| `reference/` | PDFs, dataset and HR email copied in. |
| `data/authors.csv` | 10 authors, pipe-delimited, Bubble date format. |
| `data/books.csv` | 18 books, pipe-delimited, `available_on` as a JSON array, `author_id` join key. **Not directly importable**; it has no Bubble author relationship. |
| `data/author-summary.csv` | Review artefact: per-author totals and payout status. |
| `data/book-status-snapshot.csv` | Review artefact: per-book dynamic status as of the assessment date. |
| `data/dataset.manifest.json` | Machine-readable counts, totals, enums and hashes. |
| `data/VALIDATION_REPORT.md` | Full 686-check report. |
| `scripts/convert-dataset.mjs` | Validation and CSV generation. |
| `scripts/build-bubble-import.mjs` | Author Unique ID mapping and import-safe Books CSV. Tested with a synthetic Bubble export. |
| `docs/` | Plan, requirements, schema, status rules, runbook, n8n/AI specs, security, tests, submission checklist, build log, risk register. |

## 8. Exact next action

**Finish browser pairing, then inspect before building.**

1. User adds the browse extension in Chrome and pairs it; signs in to Bubble and n8n.
2. Agent inspects both workspaces read-only and reports what exists.
3. Platform decisions are approved: Free dev preview with the HR fallback, self-hosted n8n behind an HTTPS tunnel, and a new OpenRouter key. No further plan decision is needed unless HR rejects the preview URL.
4. Only then: create data types, import Authors, map IDs, import Books.

Until step 1 is complete, no import, publish, invite, email or destructive action should occur.

## 9. Approval gates

| Gate | Decision needed | Consequence if not approved | Status |
| --- | --- | --- | --- |
| G1 | Add/pair the browse extension and sign in | Bubble/n8n build remains blocked | **Pending** — install done, pairing outstanding |
| G2 | Bubble Free dev preview vs Starter trial | Cannot satisfy a live-URL requirement; may need HR clarification | **Approved** — Free dev preview + HR fallback |
| G3 | n8n Cloud trial vs self-host + tunnel | Automation cannot be reached from Bubble | **Approved** — self-host + HTTPS tunnel |
| G4 | AI provider/key for Assignment 2 | AI summary cannot be generated | **Approved** — new OpenRouter key, n8n-only |
| G5 | Permission to import 10 authors + 18 books | Data model can be built but not populated | Pending |
| G6 | Permission to create test users and share credentials with BookLeaf | Privacy/isolation cannot be demonstrated | Pending |
| G7 | Permission to send real email (optional bonus) | Default is log-only; no email is sent | Pending (optional) |

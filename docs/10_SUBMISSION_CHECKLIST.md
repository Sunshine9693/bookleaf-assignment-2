# 10 — Submission checklist

**Deadline:** 7 days from the 7 November 2026 HR email → internal target **Saturday 14 November 2026**. Confirm the exact cutoff/timezone with HR.

## 1. Deliverables

| # | Deliverable | Required content | Status |
| --- | --- | --- | --- |
| 1 | Bubble application | Working app, editor access (or fallback), URL, test logins | Blocked on build |
| 2 | n8n workflow export | JSON file, view access if Cloud | Blocked on build |
| 3 | Documentation (README/PDF) | Schema + rationale, Bubble ↔ n8n integration, prompt strategy, error handling, challenges/learning | Draft specs complete; final narrative pending |
| 4 | Screen recording (3–5 min) | Author portal, admin portal, trigger, n8n execution, log, failure, bulk | Pending |

## 2. Bubble access

### Preferred

- Add `musavir@bookleafpub.in` as a collaborator in the Bubble editor.
- Confirm the invite is accepted before sending the submission email.
- Do not post the invite link publicly.

### If the plan disallows collaborators

Use the HR email's fallback:

- Live/preview app URL.
- One author login.
- One admin login.
- 3–5 minute recording.

Provide a second author login only if BookLeaf wants to verify isolation independently; otherwise demonstrate isolation in the recording.

### If the Free plan cannot publish

Choose one, with approval:

1. Share the development/preview URL and explain that it is the Bubble development version.
2. Use a short Starter trial to publish, then cancel before renewal. This needs a payment method and explicit approval.
3. Ask HR whether the development URL is acceptable before spending money.

Do not silently send a URL that BookLeaf cannot open.

## 3. n8n access

- Export the workflow: **Download → JSON** → `n8n/royalty-summary-workflow.json`.
- Import it into a clean n8n instance to verify it loads.
- If using n8n Cloud, invite BookLeaf to view the workspace, or provide a read-only share if available.
- If self-hosting, provide the exported JSON and the recording; the live tunnel may not be available to reviewers.
- Include `n8n/README.md` with:
  - Workflow purpose.
  - Required credentials (names only, no values).
  - Webhook URL pattern.
  - How to import.
  - How to test with a sample payload.
  - Known limitations (trial expiry, tunnel, static data idempotency).

## 4. Test credentials

Prepare privately:

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Admin | admin test email | generated | Sees all authors |
| Author A | AUTH001 sample email | generated | 2 books, Red |
| Author B (optional) | AUTH002 sample email | generated | isolation proof |
| Author C (optional) | AUTH008 sample email | generated | fully paid demo |

Rules:

- Do not put passwords in the repository, README, n8n JSON, screenshots or chat.
- Share them in the submission email or a password-manager link.
- Verify each login in a private browser window before sending.
- If BookLeaf changes a password, do not treat it as a failure.

## 5. README final draft

The final README must cover:

1. **Overview** — what the app does, stack, live/preview URL.
2. **Database schema** — data types, fields, relationships, why `Author`/`Book`/`NotificationLog`, why no `PayoutRecord`, privacy rules.
3. **Author portal** — pages, data isolation, badge rules.
4. **Admin portal** — overview, filters, detail, single/bulk trigger, log.
5. **Bubble ↔ n8n integration** — payload, why full payload instead of Data API, webhook auth, callback, status flow.
6. **Prompt strategy** — system prompt, grounding, policy facts, edge cases, output validation.
7. **Error handling** — Bubble timeout, n8n retries, failure callback, stale-log handler, idempotency.
8. **Testing** — summary of the test plan and results.
9. **Challenges and learning** — what was new in Bubble/n8n, what broke, how it was fixed. Be specific and honest; the assignment explicitly values the learning process.
10. **Limitations** — free-plan constraints, no transaction history, no real email unless enabled, sample data only.
11. **Setup/import** — how to reproduce, or a link to the runbook.
12. **Deliverables** — links to the app, n8n JSON, recording.

Do not claim features that were not tested. If something is incomplete, say so and explain the workaround.

## 6. Recording script (3–5 minutes)

Record at 1080p if possible. Use a clean browser profile with no personal tabs/bookmarks. Do not show secrets, passwords, API keys or personal email.

| Time | Scene | Narration |
| --- | --- | --- |
| 0:00–0:20 | Title / app login | "This is the BookLeaf royalty dashboard, built in Bubble with an n8n automation." |
| 0:20–0:50 | Author AUTH001 login | Show My Books, BK001/BK002, figures, Red/Green badges, consolidated totals. |
| 0:50–1:10 | Author isolation | Log in as AUTH002 (or show admin view) and state that each author only sees their own records. |
| 1:10–1:40 | Admin overview | Show 10 authors, stats, city filter, status filter, name search. |
| 1:40–2:00 | Author detail | Open AUTH001, show books and aggregate payout disclaimer. |
| 2:00–2:20 | Trigger | Click "Generate & Send Royalty Summary"; show Queued state. |
| 2:20–2:50 | n8n execution | Switch to n8n; show webhook, validation, AI call, callback; show execution succeeded. |
| 2:50–3:10 | Notification Log | Show Success row, timestamp, generated subject/body. |
| 3:10–3:35 | Failure path | Trigger a forced failure (bad AI key or bad callback); show Failed status and error message; explain retry. |
| 3:35–4:05 | Bulk trigger | Run bulk; show 9 logs; AUTH008 skipped because pending is zero. |
| 4:05–4:30 | Wrap-up | Architecture recap: Bubble privacy rules, full payload, shared secret, AI prompt, callback, idempotency. |

Keep the recording under 5 minutes. If a live call is slow, cut to the result and explain; do not fake the execution.

## 7. Submission email

Send to the HR contact who sent the assignment (reply to the existing thread if possible).

Subject: `BookLeaf Technical Assignment 2 — Sana Fatma`

Body outline:

```text
Hi [Name],

Please find my submission for Technical Assignment 2: Author Royalty Dashboard & Automated Notification System.

- Bubble app: [URL]
- Bubble editor access: [collaborator invite sent to musavir@bookleafpub.in / fallback note]
- Author test login: [sent privately / password-manager link]
- Admin test login: [sent privately / password-manager link]
- n8n workflow JSON: [private link]
- n8n workspace view: [link, if Cloud]
- README: [private link or attached PDF]
- Screen recording: [Loom/Drive link]

The app uses the supplied 10-author / 18-book dataset. It includes author and admin portals, privacy rules, dynamic green/yellow/red royalty badges, a protected Bubble → n8n webhook, an AI-generated summary, a Success/Failed notification log, and duplicate-trigger protection.

Known limitations: [free-plan preview / n8n trial / no real email / any incomplete item].

Happy to walk through the Bubble workflows and n8n setup in the founder conversation.

Best,
Sana Fatma
```

The HR email asked for links, not only email attachments, for the n8n export and README. Include links.

## 8. Pre-submission verification

### Functional

- [ ] 10 authors, 18 books, totals reconcile.
- [ ] Author A sees only their 2 books.
- [ ] Author B sees only their 2 books.
- [ ] Admin sees all.
- [ ] Green/Yellow/Red/In Production badges correct.
- [ ] City/status/name filters work.
- [ ] Single trigger → Success log with summary.
- [ ] Bulk trigger → 9 logs, AUTH008 skipped.
- [ ] Forced failure → Failed log + visible error.
- [ ] Duplicate click → one summary.
- [ ] Stale log → Failed after 5 minutes.

### Access

- [ ] App URL opens in a private window.
- [ ] Author login works.
- [ ] Admin login works.
- [ ] Collaborator invite accepted, or fallback documented.
- [ ] n8n JSON imports cleanly.
- [ ] n8n view access works, or export/recording provided.
- [ ] Recording link is viewable without requesting access.

### Security

- [ ] No secrets in repo (`git grep`).
- [ ] No secrets in n8n JSON.
- [ ] No secrets in screenshots/recording.
- [ ] Webhook rejects missing/wrong key.
- [ ] Callback rejects unauthenticated calls.
- [ ] Data API disabled/restricted.
- [ ] Repo private.
- [ ] Test credentials shared privately.

### Documentation

- [ ] README covers schema, integration, prompt, errors, challenges.
- [ ] n8n README covers import and credentials.
- [ ] Validation report included.
- [ ] Recording is 3–5 minutes and has audio.
- [ ] Links are accessible to the reviewer.

## 9. Fallback if time runs out

If the live flow cannot be completed:

1. Do not fake a successful execution.
2. Submit the working parts: data model, portals, privacy, badges, trigger attempt, n8n workflow export, README and recording.
3. Clearly state what works, what does not, and why.
4. Include the exact error/blocker and what you tried.
5. Ask HR whether a short extension is possible; the assignment values the learning process and honest documentation.

A documented failure is better than a fabricated success.

## 10. Post-submission

- [ ] Keep the Bubble/n8n workspaces available for review.
- [ ] Keep the recording link accessible.
- [ ] Do not delete the test users until BookLeaf confirms review is complete.
- [ ] Remove collaborator access after the review if requested.
- [ ] Rotate webhook/callback/AI secrets if they were shared more broadly than intended.
- [ ] Archive the build log and test results.

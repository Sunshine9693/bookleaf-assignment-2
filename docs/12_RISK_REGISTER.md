# 12 — Risk register

**Scale:** likelihood and impact are High / Medium / Low.  
**Owner:** "User" = account/plan decision; "Build" = implementation task; "Both" = shared.

| # | Risk | Likelihood | Impact | Mitigation | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | OpenCode Browse is unavailable, so Bubble/n8n cannot be inspected or edited | High | High | Install/pair Browse and sign in manually; if impossible, use the Bubble/n8n web UIs with the user driving and the agent guiding | User | **Open blocker** |
| R2 | Bubble Free cannot publish a live app in 2026 | High | High | Use the dev/preview URL + logins + recording, or a short Starter trial with approval, or ask HR which is acceptable | User | **Mitigated** — Free dev preview + HR fallback approved |
| R3 | Bubble Free allows only one editor, so BookLeaf cannot be added as a collaborator | High | Medium | Use HR's fallback: URL + author/admin logins + recording; alternatively a paid seat with approval | User | **Mitigated** — HR fallback approved; no invite planned |
| R4 | n8n Cloud trial expires before BookLeaf reviews the app | Medium | High | Export the workflow JSON; record the execution; self-host locally if needed; provide view access while active | User | **Mitigated** — self-host + tunnel approved; export/recording are durable evidence |
| R5 | Local n8n + tunnel URL is unstable or changes | Medium | High | Use a stable tunnel/domain; keep n8n running during review; provide export + recording as the durable evidence | Build | Planned |
| R6 | AI API key is exposed or reused from the portfolio project | High | High | Create a separate key; rotate the exposed key; store only in n8n credentials; never put it in Bubble/repo/chat | User + Build | **Mitigated by decision** — new key approved; creation/rotation pending |
| R7 | Webhook secret is visible in the browser because the API call runs client-side | Medium | High | Call from a Bubble backend workflow; mark the header private; verify the network tab; stop if exposed | Build | Planned |
| R8 | Author privacy rules are misconfigured and leak another author's data | Medium | High | Apply rules on `Author`, `Book`, `User`; test with AUTH001/AUTH002; derive the author from `Current User` | Build | Planned |
| R9 | Bubble advanced filter cannot express author-level overdue/pending | Medium | Medium | Test in the editor; fallback to stacked repeating groups or a grouped Book search; do not weaken the requirement | Build | Planned |
| R10 | CSV import duplicates rows or breaks relationships | Medium | Medium | Import once; verify counts; export author IDs; use the mapping script; delete books before authors on rollback | Build | Planned |
| R11 | CSV list/date format rejected by Bubble | Medium | Medium | Pipe delimiter, JSON-array lists, Bubble date format, Validate Data, one-row dry run | Build | Planned |
| R12 | AI hallucinates a payout date or transaction | Medium | High | Grounding prompt, no transaction data, output validation, human review, explicit "confirm within 48 hours" language | Build | Planned |
| R13 | AI output is generic or misses an in-production book | Medium | Medium | Structured payload + rubric + validation; test AUTH007/AUTH009; retry on failure | Build | Planned |
| R14 | Duplicate clicks create duplicate summaries/cost | Medium | Medium | Bubble 120s guard + disabled button; n8n request/author guard; callback terminal-state guard | Build | Planned |
| R15 | Callback is spoofed or replayed | Low | High | Bearer token, existing `request_id`, terminal-state guard, HTTPS | Build | Planned |
| R16 | n8n static-data idempotency fails in queue/multi-worker mode | Low | Medium | Use single-instance demo; Bubble guard is primary; document the limitation; Redis/Postgres if scaled | Build | Accepted |
| R17 | n8n or callback dies, leaving a log Queued forever | Medium | Medium | 5-minute stale-log handler; Failed status + retry; visible error | Build | Planned |
| R18 | Bubble API call times out while n8n continues | Medium | Medium | Webhook returns 202 immediately; 30s timeout; failure handler; callback guard | Build | Planned |
| R19 | Free-plan workload units are exhausted during the demo | Low | Medium | Minimal searches; avoid 5s polling; 15s polling only while queued; small dataset | Build | Planned |
| R20 | Deadline (14 Nov) is missed due to access/plan delays | Medium | High | Escalate early; ask HR about preview acceptance; prioritise data/privacy/portals over polish | Both | **Open** |
| R21 | Assignment 1 repo is accidentally modified | Low | High | Read-only rule; check `git status` before/after; never run commands that write there | Build | Controlled |
| R22 | Secrets appear in the n8n JSON export | Medium | High | Credentials referenced by name; scan JSON for `sk-`, `Bearer`, key headers, passwords | Build | Planned |
| R23 | PII appears in screenshots/recording | Medium | Medium | Use sample data; mask headers/emails; clean browser profile; review recording before upload | Both | Planned |
| R24 | Reviewer cannot open the app URL (login wall, preview permission) | Medium | High | Test in a private window; provide logins; include recording; confirm collaborator access | Both | Planned |
| R25 | Prompt injection via a book title | Low | Low | Treat data as data; validate output; test with a malicious title | Build | Planned |
| R26 | Real email is sent accidentally | Low | High | SMTP node disabled by default; log-only mode; explicit approval before enabling; test recipient only | Build | Controlled |
| R27 | Bubble app timezone shifts dates by a day | Low | Medium | Set Asia/Kolkata; import at noon; display date-only; spot-check | Build | Planned |
| R28 | The app implies transaction history that does not exist | Medium | High | No `PayoutRecord`; aggregate labels; disclaimer in UI and AI prompt | Build | Planned |
| R29 | BookLeaf expects a different callback auth method | Low | Medium | Verify Bubble's API workflow auth in the editor; fallback to a body token over HTTPS; document | Build | Planned |
| R30 | Free-plan app is slow during review | Medium | Low | Keep pages light; avoid heavy searches; recording covers the flow; explain free-tier cold starts | Both | Accepted |

## Decisions needed before build

| Decision | Options | Recommended | Needed by | Status |
| --- | --- | --- | --- | --- |
| D1 Browser access | Install Browse / user-driven UI | Install Browse; it unlocks inspection and reduces manual work | Immediately | **Installed; pairing pending** |
| D2 Bubble plan | Free dev preview / Starter trial / ask HR | Ask HR + use Free dev preview if acceptable; do not start a trial without approval | Before publishing | **Decided — Free dev preview + HR fallback** |
| D3 n8n hosting | Cloud trial / self-host + tunnel | Cloud trial for build; export + recording for durability; self-host if trial expires | Before workflow build | **Decided — self-host + HTTPS tunnel** |
| D4 AI provider/key | Separate OpenRouter key / OpenAI key | Separate key, rotated; `gpt-4o-mini` class | Before AI node | **Decided — new OpenRouter key** |
| D5 Import approval | Proceed / wait | Proceed after a backup and a one-row validation | Before data import | Pending |
| D6 Test users | Create 2–4 / minimum | Admin + AUTH001 + AUTH002 + AUTH008 for demos | Before privacy tests | Pending |
| D7 Real email | Log only / SMTP | Log only; SMTP only if explicitly approved | Before submission | Log-only default |

## Review triggers

Revisit this register:

- After Browse is paired and the Bubble/n8n workspaces are inspected.
- After the Bubble plan is chosen.
- After the first successful import.
- After the first end-to-end n8n run.
- Before recording.
- Before sending the submission.

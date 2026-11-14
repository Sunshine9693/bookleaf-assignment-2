# BookLeaf Assignment 2 — Author Royalty Dashboard & Automated Notification System

Workspace for BookLeaf's second technical assignment: a Bubble.io application with an n8n + AI royalty-summary automation.

**Packaging checkpoint (15 November 2026):** Earlier portal/history evidence is preserved. New read-only history checks confirm Failed shows the same eleven IDs with **nine Bulk/two Single** labels; Success shows zero rows and its empty message; clearing the filter restores All statuses. No genuine AI/callback success or password login is verified. A [3:46 narrated saved-evidence walkthrough](deliverables/bookleaf-evidence-walkthrough-final.mp4) of the earlier captures is ready; it is not an interactive recording. Saved live n8n exports pass configuration audit: main inactive, error handler published/attached with raw retention off. The Bubble callback is unexposed for handoff. See [latest status](update_v5.md), [QA](docs/13_QA_RESULTS.md), [history reconciliation](docs/notification-live-reconciliation.json) and [export audit](n8n/live-export-verification.json).

**Current testing blocker:** Bubble now reports a Free-plan workflow limit and requests an upgrade to continue testing. The plan screen shows Free, “128 of 50K” and overages disabled; that workload display does not explain the separate workflow-limit notice. No upgrade or trial was authorized or taken. [Saved plan evidence](docs/bubble-free-limit-live.txt) and the current checkpoint record the limitation. Private callback-credential rotation/completion is also required before a live connection; no credential value is included here.

**Deadline:** 7 days from the HR email of **7 November 2026** → internal target **14 November 2026**. Confirm the exact cutoff timezone with HR.

## What is in this workspace

| Path | Purpose |
| --- | --- |
| `reference/` | The two assignment PDFs, the exact sample dataset, and the HR email. Read-only source material. |
| `data/` | Validated CSV files, review snapshots, manifest and validation report. |
| `scripts/` | Dataset conversion and Bubble author-link builder. No dependencies. |
| `docs/` | Audit, plan, requirements checklist, database design, status rules, import runbook, n8n/AI specs, security, tests, submission checklist, build log and risk register. |
| `n8n/` | Main/error workflow drafts, shared validation logic, local test results and setup notes. |

## Source of truth

- Dataset: `reference/bookleaf_sample_data.json`, SHA-256 `34fd3b03f4b26e68b466a6364c3b7fe2f3884d3d7dc65134b67cac8e006b59f8`.
- The same hash is present in Assignment 1's seed file, confirming the dataset is identical.
- 10 authors, 18 books. Totals: earned ₹2,43,382; paid ₹2,02,543; pending ₹40,839.

## Quick start (local tooling only)

```powershell
cd S:\bookleaf-assignment-2

# Regenerate and validate all CSVs (defaults to today; pass a date to test the status rules)
node scripts/convert-dataset.mjs --as-of=2026-11-10

# After importing Authors into Bubble and exporting them with Unique ID:
node scripts/build-bubble-import.mjs --export="S:\path\to\Authors.csv"
```

`scripts/build-bubble-import.mjs` refuses to produce `books.bubble-import.csv` unless all 10 authors are mapped. This prevents importing orphaned books.

## Documents

1. [Audit and findings](docs/00_AUDIT_AND_FINDINGS.md)
2. [Implementation plan](docs/01_IMPLEMENTATION_PLAN.md)
3. [Requirements checklist and traceability](docs/02_REQUIREMENTS_CHECKLIST.md)
4. [Database design](docs/03_DATABASE_DESIGN.md)
5. [Dynamic royalty status rules](docs/04_STATUS_RULES.md)
6. [Bubble data import runbook](docs/05_DATA_IMPORT_RUNBOOK.md)
7. [n8n workflow specification](docs/06_N8N_WORKFLOW_SPEC.md)
8. [AI prompt specification](docs/07_AI_PROMPT_SPEC.md)
9. [Security and secrets](docs/08_SECURITY_AND_SECRETS.md)
10. [Test plan](docs/09_TEST_PLAN.md)
11. [Submission checklist](docs/10_SUBMISSION_CHECKLIST.md)
12. [Build log](docs/11_BUILD_LOG.md)
13. [Risk register](docs/12_RISK_REGISTER.md)
14. [Draft submission README](docs/SUBMISSION_README.md)

## Guardrails

- Assignment 1 at `S:\bookLIB\bookleaf-portal-copy` is read-only. Do not modify, reset, commit to, or push to it.
- Bubble remains the application platform; n8n remains the automation layer. No React/Express substitute.
- Free plans only unless a paid plan or trial is explicitly approved. No publishing, collaborator invites, imports, real emails or destructive actions without approval.
- Preserve the supplied values, nulls, zeros and `available_on` entries exactly.
- Do not fabricate payout transaction history. The dataset contains aggregate paid/pending figures and one last-payout date per book.
- Never commit or print passwords, JWTs, API keys or webhook secrets.

## Approved decisions

| Area | Decision |
| --- | --- |
| Bubble plan | Free plan development/preview URL, with HR's fallback (app URL + author/admin logins + recording). No paid upgrade or trial without further approval. |
| n8n hosting | Continue in the existing n8n Cloud workspace at `https://sanafatma.app.n8n.cloud`, as recorded in the latest handoff. Exported JSON and recording are the durable evidence. |
| AI provider | A new OpenRouter key, separate from the exposed portfolio key, stored only in n8n credentials. |

## Immediate next action

**Latest provider-only check (15 November):** A separate manual n8n component test reached the validator but returned `valid=false`, with `AI provider request failed after retries`. It did not call Bubble or send email. This is a failed real-provider attempt, not an AI/callback pass; the provider's underlying failure cause is unconfirmed. See [component procedure](n8n/PROVIDER_VERIFICATION_STEPS.md).

Finish the free-plan evidence package and confirm reviewer access, using the completed saved-evidence video with its explicit limitations. Keep the main workflow inactive and callback unexposed until private credential rotation/setup and authorized testing are available. A future live acceptance run must verify genuine AI/callback success, authentication/replay protection, actual password logins and successful bulk summaries. Follow [the latest checkpoint](update_v5.md); older handoffs are historical where they differ. Do not repeat the already reconciled bulk failure run merely to increase the log count.

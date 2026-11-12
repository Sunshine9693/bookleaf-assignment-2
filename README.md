# BookLeaf Assignment 2 — Author Royalty Dashboard & Automated Notification System

Workspace for BookLeaf's second technical assignment: a Bubble.io application with an n8n + AI royalty-summary automation.

**Status (12 November 2026):** Work is in progress. The handoff records the verified 10-author / 18-book data layer, privacy rules, login page and author dashboard as complete; the admin dashboard is partially built. Codex has confirmed authenticated access to the existing Bubble admin editor. Backend automation, n8n integration and end-to-end acceptance testing remain pending. See [the current handoff](update_v2.md) for implementation details and known blockers.

**Deadline:** 7 days from the HR email of **7 November 2026** → internal target **14 November 2026**. Confirm the exact cutoff timezone with HR.

## What is in this workspace

| Path | Purpose |
| --- | --- |
| `reference/` | The two assignment PDFs, the exact sample dataset, and the HR email. Read-only source material. |
| `data/` | Validated CSV files, review snapshots, manifest and validation report. |
| `scripts/` | Dataset conversion and Bubble author-link builder. No dependencies. |
| `docs/` | Audit, plan, requirements checklist, database design, status rules, import runbook, n8n/AI specs, security, tests, submission checklist, build log and risk register. |
| `n8n/` | Reserved for the exported workflow JSON and its README. Currently empty. |

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

Finish verifying the n8n browser session, then resume the existing Bubble application by correcting `adm_stat_pending_v` to sum `royalty_pending` across Books. Follow [the latest handoff](update_v2.md); earlier documents and build-log entries are historical where their access or hosting instructions differ.

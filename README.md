# BookLeaf Assignment 2 — Author Royalty Dashboard & Automated Notification System

Workspace for BookLeaf's second technical assignment: a Bubble.io application with an n8n + AI royalty-summary automation.

**Latest acceptance checkpoint:** a real 252-word provider summary passes source/policy review; all three user-assisted reset/login checks reached their expected dashboards; the hardened main draft export passes audit. The full Bubble callback remains unverified because collection authentication still needs the matching shared secret entered privately. [Current acceptance and evidence](docs/22_CURRENT_ACCEPTANCE.md) supersedes older pending-login/provider statements below. Main remains inactive; callback unexposed; no paid plan or public deployment.

**Packaging checkpoint (15 November 2026):** Portal/history evidence is preserved, including eleven Failed IDs with **nine Bulk/two Single** labels and working status/empty/reset filtering. New Author/Admin metadata captures pass 93 source comparisons. A real reviewed provider summary and three user-assisted password-login destinations are now recorded. The [3:46 saved-evidence walkthrough](deliverables/bookleaf-evidence-walkthrough-final.mp4) predates those new checks and is not an interactive recording. The [hardened main export audit](n8n/hardened-live-export-verification.json) passes; main remains inactive, error handler attached/published with retention off, and callback unexposed. [Current acceptance](docs/22_CURRENT_ACCEPTANCE.md) defines the remaining scope.

**Current live-connection blocker:** Bubble collection authentication still needs the same shared secret as n8n Header Auth account. The user reported callback-key setup, but its actual authentication remains untested. A prior Free-plan workflow-limit notice is preserved; login and an internal backend reset nevertheless ran, so it does not establish a blanket testing block. No upgrade or trial was taken. No credential value is included here.

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

The [final Free-plan follow-up](docs/15-NOVEMBER-FOLLOWUP.md) adds observed wrong-password rejection, admin-detail logout and protected-route denial. Both book-card views now explain blank unavailable metadata; fresh author/admin captures passed 93 source-comparison checks, including all five BK004 platforms and BK015 production/zero values. This does not establish successful password login or AI/callback success. A corrected OpenRouter allowed-domain field is prepared but awaits direct user credential entry/Save and a real rerun.

**Latest provider-only check (15 November):** The hardened component produced a real 252-word summary that passed automated and human source/policy review. [Results and prior rejected attempts](n8n/PROVIDER_COMPONENT_RESULT.md) preserve the scope; no Bubble callback or email pass is implied.

Complete private shared-secret entry, then verify one full app request and authenticated callback, terminal/replay/security behavior and successful bulk summaries. Confirm reviewer access and arrange private delivery of the user-set passwords. Keep main inactive and callback unexposed until the connection prerequisites are ready. Use the [current checkpoint](docs/22_CURRENT_ACCEPTANCE.md); do not rerun failures merely to increase log counts.

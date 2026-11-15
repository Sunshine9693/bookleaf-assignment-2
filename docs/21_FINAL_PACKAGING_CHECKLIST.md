# Final checkpoint packaging checklist

**Newest checkpoint — 16 November:** [22_CURRENT_ACCEPTANCE.md](22_CURRENT_ACCEPTANCE.md) records the provider pass, three user-assisted logins, hardened export audit, verified matching webhook secret, and a real callback rejected by Bubble's Free-plan Workflow API restriction. Main was unpublished and callback disabled again after approved testing. One new Single timeout brings history to twelve genuine Failed requests. Earlier pending-credential/login/provider statements and eleven-request counts below are historical. Full integration remains unaccepted; no upgrade/trial was taken.

**Free-plan final package additions:** the 4:46 silent low-fps actual UI capture, codec/timing validation and encoder; fresh valid 235-word provider evidence; reviewer handoff; approved sent/pending GitHub invitation evidence; updated unsent email draft. The original slideshow is retained as historical. Raw capture frames, decoded review samples and local Python tool packages remain excluded. No full callback acceptance or accepted reviewer invitation is claimed.

Additional files are staged by exact filename after review: current acceptance and user-assisted login/configuration captures; source/policy hardening module/builders/checks; accepted/rejected provider evidence and iteration ledger; prepared/saved hardened main plus distinct audits; reviewed metadata and accepted-provider screenshots. Credential-form images, passwords, tokens, source correspondence, local ID maps and unreviewed screenshots remain excluded. No whole-folder staging is authorized by this paragraph.

Packaging refreshed **15 November 2026**, for the final one-hour handoff window. Historical captures/checks remain dated 13–14 November. This plan does not declare the assignment complete or authorize email, collaborator invitations, new activation, purchases or trials. The user has chosen to keep the Free plan.

## Current acceptance boundary

Available: source-preserving data validation; admin rows/filters; two Author Run as dashboards/six denials; author logout; Priya admin metadata; Ananya no-payout display; complete eleven-request history; original/retry IDs preserved; nine eligible authors covered once with two immediate failures and seven timeout failures. Notifications-page admin logout lands on login. No genuine AI/callback success or password-login pass is established.

Current blockers: Bubble Free-plan workflow limit and private credential replacement/setup. No paid workaround is authorized. If these remain, finish the package with explicit limitations rather than rerun the same failures or present local fixtures as live results.

## Finish in this order

1. Preserve the audited saved live exports: main inactive, error handler published/attached, both raw-retention-off. The callback is unexposed for handoff. Publication/attachment is not invocation proof; the error handler's sanitized output is transient, not a durable audit.
2. Freeze the checkpoint: reconcile [latest handoff](../update_v5.md), [submission README](SUBMISSION_README.md), [QA ledger](13_QA_RESULTS.md) and [backend status](19_BACKEND_IMPLEMENTATION_STATUS.md). State the platform/credential block and unverified password access explicitly.
3. Include the completed [226-second evidence walkthrough](../deliverables/bookleaf-evidence-walkthrough-final.mp4) and [validation](../deliverables/video-validation.json). Label it a narrated saved-evidence slideshow, not an interactive recording. Audio/video metadata, decoded audio and a decoded frame were checked. The interactive script remains conditional; actual password login and live AI success are unverified.
4. Confirm the preview and actual reviewer repository access. A private repository URL alone grants no access; editor Run as does not establish reviewer password login. Do not invent credentials or invite collaborators without the applicable authorization.
5. Run the local checks below, scan the final staged diff/export, and commit only an explicit whitelist. Main owns commits/pushes. Re-scan after any additional live export.
6. Fill the [unsent email draft](20_SUBMISSION_EMAIL_DRAFT.md) with actual final results/link availability. Remove bracketed instructions before sending. Sending itself requires explicit authorization.

## Meaningful local checks

```powershell
node scripts/qa-readonly.mjs --as-of=2026-11-14
node scripts/qa-admin-live.mjs
node scripts/qa-author-live.mjs
node scripts/qa-book-detail-live.mjs
node scripts/qa-notification-live.mjs
node scripts/test-n8n-workflow.mjs
node scripts/test-n8n-callback-verification.mjs
git diff --check
```

These are local data/artifact/saved-capture checks. The last callback artifact check makes no network request or Bubble write; that temporary test must remain unexecuted while the platform limit persists. Any later connection requires a rotated/replaced private credential, not the previously exposed credential.

## Explicit checkpoint whitelist

Stage named paths after reviewing their diffs. Never use `git add .` or wildcard whole-folder staging for this checkpoint.

- Current narrative: `README.md`, `update_v5.md`, `docs/SUBMISSION_README.md`, and the changed documentation `docs/10_SUBMISSION_CHECKLIST.md`, `13_QA_RESULTS.md`, `14_RECORDING_SCRIPT.md`, `15_SUBMISSION_STATUS.md`, `17_OUTBOUND_BUBBLE_RECIPE.md`, `19_BACKEND_IMPLEMENTATION_STATUS.md`, `20_SUBMISSION_EMAIL_DRAFT.md`, `21_FINAL_PACKAGING_CHECKLIST.md` (all latter names under `docs/`).
- Evidence and reconcilers: `scripts/qa-notification-live.mjs`; `docs/qa-evidence.json`, `admin-live-reconciliation.json`, `author-live-reconciliation.json`, `book-detail-live-reconciliation.json`, `notification-live-reconciliation.json`; captures `notification-history-all-live.txt`, `notification-history-live.txt`, `single-disconnected-test-live.json`, `admin-notifications-logout-live.txt`, `bubble-free-limit-live.txt`, `bubble-bulk-config-live.txt`, `bubble-timeout-age-guard-live.txt` (all evidence/captures under `docs/`). Earlier partial retry/bulk/timeout captures are optional context; the complete all-history capture is the acceptance input.
- n8n work, **after its owner confirms readiness**: `n8n/README.md`, `local-test-results.json`, `royalty-summary-error-workflow.json`, `CALLBACK_VERIFICATION_STEPS.md`, `LIVE_VERIFICATION_CHECKLIST.md`, `callback-terminal-verification-workflow.json` (all under `n8n/`); `scripts/build-n8n-workflow.mjs`, `scripts/test-n8n-workflow.mjs`, `scripts/test-n8n-callback-verification.mjs`. The frozen main export has not changed; do not imply a changed error artifact modifies its hash.
- Optional screenshots **only after visual review**: `bubble-free-limit-live.png`, `notification-history-live.png`. Screenshots are binary and were excluded from the text credential-pattern scan.

**15 November additions to the named whitelist:**

- Saved live export package, after integration-owner confirmation: `n8n/royalty-summary-live-export.json`, `n8n/royalty-summary-error-live-export.json`, `n8n/live-export-verification.json`, `scripts/verify-n8n-live-exports.mjs`.
- Current handoff/editor evidence: `docs/bubble-callback-handoff-disabled.txt`, `docs/n8n-main-settings-live.txt`; parent-reviewed history-filter evidence can be added by exact filename once reconciled.
- Finished video: `deliverables/bookleaf-evidence-walkthrough-final.mp4`, `deliverables/README.md`, `deliverables/NARRATION.md`, `deliverables/evidence-video-manifest.json`, `deliverables/video-validation.json`.
- Video reproduction: `scripts/build-evidence-walkthrough.ps1`, `scripts/convert-evidence-video.ps1`, `scripts/finalize-evidence-mp4.py`, `scripts/verify-evidence-video.py`.

Do not stage `deliverables/` wholesale. Keep the AVI, intermediate MP4s, logs, generated WAV/JPEG assets and decoded validation media local. The final MP4 is approximately 3.2 MB and is the intended reviewer artifact.

**15 November history-filter/source additions independently reconciled:** `docs/history-status-failed-live.txt`, `docs/history-status-success-live.txt`, `docs/history-status-reset-live.txt`, `docs/history-filter-config-live.txt`, plus the updated `scripts/qa-notification-live.mjs` and `docs/notification-live-reconciliation.json`. Both desktop screenshots `history-filter-final-live.png` and `history-filter-empty-live.png` were visually reviewed and are safe to stage explicitly. The Failed capture matches the eleven original IDs and now confirms nine Bulk/two Single; Success/empty/reset checks pass. The video remains unchanged.

Keep local/excluded: `reference/`, `data/`, `callback-credential-help.png`, `n8n-webhook-credential-form.png`, personal HR correspondence, ID maps, credential screens, raw service/execution payloads, and other unreviewed screenshots. Do not add source correspondence merely to make a fresh clone self-contained. Existing tests document that the supplied original JSON is a local prerequisite.

## Credential scan result and limits

The checkpoint scan considered 94 tracked/untracked nonignored paths and inspected nonbinary text for high-confidence provider-key, JWT, private-key, long literal Bearer and long credential-assignment patterns. **No matches were found.** No matching values were printed. `data/bubble-author-ids.json` and `reference/HR_EMAIL.eml` are ignored. This is a limited pattern check, not a guarantee that every possible secret format is detectable; binary screenshots and ignored files were not content-scanned. The builder reports the exposed callback value was not saved to project files/Git. Rotate/revoke it privately before further use.

The current callback-artifact and history-reconciliation checks pass locally. `git diff --check` now passes after removing added Markdown hard-break whitespace from the submission README. Run the final staged check again after all agents finish editing.

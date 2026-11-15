# Free-plan reviewer handoff — 16 November 2026

This is the verified-work handoff available on the Free plan. It is **not 100% integration acceptance**: the full Bubble request → AI → accepted callback → original NotificationLog Success path remains incomplete. The user chose Keep Free; no upgrade/trial was taken. [Current acceptance](22_CURRENT_ACCEPTANCE.md) is authoritative over older checkpoints.

## Reviewer entry

1. Accept the GitHub invitation sent to musavir@bookleafpub.in (resolved account: musavir-khurshid), then open [the private repository](https://github.com/Sunshine9693/bookleaf-assignment-2). GitHub currently shows Pending Invite; acceptance is not yet confirmed. The user explicitly approved the collaborator permission, which includes code changes in this personal-repository UI. [Sent-invitation evidence](reviewer-invitation-pending-2026-11-16.txt). Keep the assignment and supplied data private; the brief prohibits public sharing. The ZIP is an alternative for private delivery.
2. Open the [Bubble development login](https://sanathesunshine9693.bubbleapps.io/version-test/login). This is the development preview, not a public live deployment.
3. Receive the existing user-set passwords from Sana through an agreed private channel. **Reviewer password delivery remains outstanding.** Passwords and API secrets are not in this document, Git or the video. Do not create replacement users or invoke the disabled temporary setup flow.

| Approved test account | Email | Expected destination and scope |
| --- | --- | --- |
| Admin | `bookleaf.admin@example.com` | Admin dashboard; ten authors, eighteen books, portfolio filters and notification history |
| Author 1 / AUTH001 | `bookleaf.author1@example.com` | Priya Sharma's author dashboard; two books; earned 19,908, paid 16,338, pending 3,570 INR |

The user personally completed password reset/login steps, after which the builder observed the expected Admin, Priya and Rohit destinations. This is user-assisted login evidence; independent reviewer access and private password delivery still need confirmation. Log out between role checks. No real author email is required.

The HR fallback allows **app URL + test logins + short recording** where Bubble collaborator access is limited. It does **not** waive the assignment's authenticated callback/status-update requirement or turn the current platform failure into a successful integration.

## Workflow files and evidence

Private GitHub file links require repository access; the same paths are included in the handoff package:

- [Prepared hardened main workflow](https://github.com/Sunshine9693/bookleaf-assignment-2/blob/main/n8n/royalty-summary-hardened-workflow.json).
- [Saved hardened live export](https://github.com/Sunshine9693/bookleaf-assignment-2/blob/main/n8n/royalty-summary-hardened-live-export.json).
- [Saved error-handler export](https://github.com/Sunshine9693/bookleaf-assignment-2/blob/main/n8n/royalty-summary-error-live-export.json).
- [Hardened export audit](https://github.com/Sunshine9693/bookleaf-assignment-2/blob/main/n8n/hardened-live-export-verification.json): twenty nodes/eighteen edges, expected credential references and raw retention off. The attached/published error handler has no verified invocation.
- [Reviewed real provider result](https://github.com/Sunshine9693/bookleaf-assignment-2/blob/main/n8n/provider-hardening-success-result.json): accepted 252-word summary with source figures, quarterly/45-day policy and separate overdue review guidance. This is isolated provider-component success, not a Bubble callback/email pass.
- [Authenticated stale-request diagnostic](shared-secret-authenticated-diagnostic-2026-11-16.txt): HTTP 400 after webhook authentication verifies the saved shared-secret match and timestamp rejection. It does not prove a real-author generation.
- [Callback platform rejection](callback-platform-block-2026-11-16.txt): HTTP 401 with Bubble's explicit message that the app does not expose an API and needs a subscription upgrade for API calls. This establishes the Free-plan Workflow API restriction; it does not establish a bad key, successful bearer authentication or execution of the terminal guard.

There are twelve genuine Failed logs and no Success. The newest Priya Single request timed out through server recovery; the terminal callback attempt left it unchanged. Earlier nine-author bulk coverage and retry/failure evidence remain historical, not successful bulk summaries. [Before](terminal-callback-before-2026-11-16.txt) / [after](terminal-callback-after-2026-11-16.txt) evidence is preserved.

The new [4:46 current UI walkthrough](../deliverables/bookleaf-current-ui-walkthrough.mp4) shows actual current Admin search/detail, a fresh real AI execution with valid output, callback rejection, Priya's Author preview and Admin-route redirect. It is silent with captions, samples actual browser screenshots at approximately 1 fps, and preserves observed wall-clock timing while holding the previous frame across capture gaps. It is not full-motion recording or a successful integrated callback demo. The Author recording uses editor-assisted Run as; separate user-assisted password-login evidence is documented above. [Codec/timing validation](../deliverables/current-ui-video-validation.json), [fresh 235-word provider result](../n8n/fresh-provider-ui-result-2026-11-16.json). Narrow viewport views may clip long output; the complete summary is available in that result file.

The existing [3:46 narrated saved-evidence walkthrough](../deliverables/bookleaf-evidence-walkthrough-final.mp4) remains historical screenshot/text-panel evidence; its narration predates later results and it was not overwritten.

## Safe final state and remaining delivery checks

- Main n8n workflow unpublished; Bubble callback unexposed; Data API off. [Main state](n8n-unpublished-after-test-2026-11-16.txt), [callback state](callback-disabled-after-test-2026-11-16.txt). The separate manual callback checker remains unpublished, with all execution-retention modes off.
- Shared-secret entry/matching is complete. Callback bearer validity and revocation of the earlier exposed key remain unverified. No secret values should be transferred in repository files or recordings.
- Confirm reviewer ZIP/repository access, privately deliver the approved account passwords, and verify the reviewer's preview entry. Do not make the repository public to solve access.
- The current short recording identifies actual captured scope and callback restriction. Successful callbacks, bulk summaries and accepted duplicate/late callback security remain unverified.

A GitHub collaborator invitation was sent only after explicit approval. No submission email, real author email, paid upgrade or public Bubble deployment was performed. Live n8n workspace viewer access is not granted; private workflow exports and the actual-run video provide reviewable artifacts.

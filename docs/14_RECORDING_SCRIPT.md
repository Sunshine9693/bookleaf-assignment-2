# Recording script (target 4 minutes 30 seconds)

**15 November packaging update:** a [3:46 narrated saved-evidence walkthrough](../deliverables/bookleaf-evidence-walkthrough-final.mp4) is ready, with [narration](../deliverables/NARRATION.md) and [validation](../deliverables/video-validation.json). It uses actual safe screenshots and labeled text panels, with local synthetic speech. It is not an interactive browser recording, live successful execution or password-login demonstration. Source captures are dated 13–14 November; packaging does not turn them into new live tests.

The script below remains a conditional plan for a future interactive recording. Record only behavior that has been observed working. If a stage is unavailable, use the honest fallback rather than narrating it as successful.

**14 November checkpoint:** the portfolio, two Run as author sessions, six protected-route redirects, author logout, Priya admin metadata and Ananya no-payout display have saved evidence. Full history now shows eleven distinct Failed requests: nine eligible bulk authors once each (two immediate rejections, seven timeout failures), plus separate original/retry Priya requests. Real password login and genuine AI/callback success remain pending. Bubble now reports a Free-plan workflow limit; no upgrade was authorized/taken. Credential replacement/setup is pending privately. The automation success rows below are conditional narration, not completion claims.

## Prepare

- Use the development preview, not the Bubble editor canvas placeholders.
- Keep the browser free of personal tabs. Pause capture while entering passwords; never show credentials, header secrets, API keys, full request headers or credential screens.
- Have an admin session, two author sessions for isolation, the n8n execution view and the Notification Log ready.
- Use the supplied sample records. Do not alter any of the 10 Authors or 18 Books to manufacture a demo result.
- Verify the displayed live results against [13_QA_RESULTS.md](13_QA_RESULTS.md) and [09_TEST_PLAN.md](09_TEST_PLAN.md) before recording.
- Actual email is optional and is not enabled by this assignment's default flow. Say clearly that the generated email draft is stored in Bubble for review.

## Main walkthrough

| Time | Screen and action | Suggested narration |
| --- | --- | --- |
| 0:00–0:15 | App login / title | “This is the BookLeaf Author Royalty Dashboard, built in Bubble with an n8n automation. It uses the supplied sample dataset of 10 authors and 18 books.” |
| 0:15–0:45 | AUTH001 author portal | “Priya sees her two books. The figures reconcile to ₹19,908 earned, ₹16,338 paid and ₹3,570 pending. The book details include sales, royalty figures and the last payout recorded.” Show the required book details, not just the summary cards. |
| 0:45–1:05 | Second author session | “Rohit's session shows his own books and totals. Access is enforced by Bubble privacy rules, with page guards for navigation.” Demonstrate the actual isolated result or blocked admin URL; do not claim a test that was not run. |
| 1:05–1:35 | Admin overview | “The admin can see the portfolio and combine author-name, city and payout-status filters.” Show Mumbai, Fully paid, Overdue, and reset. “The current sample has one fully paid author and nine overdue authors. The Pending-only filter is empty because no current record is within that category.” |
| 1:35–1:55 | Selected author detail | Open AUTH001 through View. “The admin detail uses the selected Author as its page data. These payout figures are aggregates and the last payout date supplied in the dataset. There are no transaction records to invent or display.” |
| 1:55–2:15 | Single trigger | Click Generate & Send Royalty Summary once. “The app creates a request log before calling n8n. The request ID correlates the automation and callback.” Show the actual Queued/Processing state and duplicate-trigger protection. |
| 2:15–2:45 | n8n execution | “n8n checks authentication and timestamp freshness, validates the one-author payload, checks duplicates, builds the grounded prompt and calls the configured AI model.” Show the actual execution ID and successful/error node path. Keep credentials hidden. |
| 2:45–3:10 | Notification Log | “The callback updates the same request to Success or Failed, with a completion time. This is the generated email draft, saved for review; no actual email was sent.” Show the subject/body, per-book figures, three totals and appropriate payout guidance. |
| 3:10–3:35 | Verified failure / retry | Use an already verified, clearly identified test failure with no secrets on screen. “A failure is recorded visibly rather than leaving a spinner. Retry creates a new request and preserves the previous attempt.” Show the Failed row and its safe error, then actual retry behavior if verified. |
| 3:35–4:05 | Bulk run | “Bulk generation uses the same author workflow independently for each eligible author. AUTH008 is skipped because pending is zero.” Show nine actual correlated log rows and their current terminal results. Do not substitute local fixture output for live rows. |
| 4:05–4:30 | Architecture / wrap-up | “Bubble owns users, privacy, data and logs; n8n owns validation, AI generation and callbacks. The full payload avoids a broad Bubble Data API token. The export, prompt design, test results and limitations are included in the private repository.” Mention the development-preview and trial limitations, plus any unfinished feature. |

## Final recording branch: choose immediately before capture

**If genuine single, failure/retry and bulk acceptance have all passed:** follow the table above and show the saved request IDs/results. Say “verified” only for the checks supported in the final QA ledger. Record an already completed, reviewed summary rather than wait for an unpredictable model response on camera; identify it as a previously completed request.

**If single succeeds but bulk/recovery is unfinished:** retain 0:00–3:10, then use about 30 seconds to show the actual verified failure or describe the missing test accurately. Close by 4:00 with: “Single-author generation and the callback are demonstrated here. [Bulk / retry / timeout: list only the unfinished items] remain unverified. The repository records those limitations.” Do not show fixture output as live history.

**If no real AI/callback success exists:** use this 3:30 order:

| Time | Show and say |
| --- | --- |
| 0:00–0:25 | Introduce the existing Bubble development app and unchanged 10-author / 18-book dataset. State that the automation remains incomplete. |
| 0:25–1:05 | Show Priya's own books/totals and the required metadata that is actually visible. If using Run as, say “This is an editor-created author session; password login is not yet verified.” |
| 1:05–1:25 | Show Rohit's own books and one demonstrated protected-route redirect. Describe the observed own-book scope and redirect, without claiming arbitrary database-query testing. |
| 1:25–2:05 | Show the admin overview, filters, selected Priya detail and aggregate-payout disclaimer. |
| 2:05–2:30 | Show the complete saved history. Say “These are eleven separate Failed requests. The nine-author bulk request set includes every author with pending royalties and skips the fully paid author. Two failed immediately; seven recorded timeout errors. The original and retry remain separate. No genuine AI generation or callback success is verified.” |
| 2:30–3:00 | Show the saved n8n design with credentials hidden. Say “These are the validation, model and callback steps in the saved workflow. The 49 passing checks are local fixture tests, not a live AI execution.” |
| 3:00–3:30 | Show the final status/readme and enumerate only the remaining material gates: private credential replacement/setup, real AI/callback success, successful bulk summaries and password login, as applicable. State that Bubble now reports a Free-plan workflow limit, no upgrade was taken and no email was sent. |

For every branch, replace any bracketed narration with the actual final result **before recording**. If the actual password logins have not passed, never present an editor Run as session as a credential demonstration. Do not narrate a generated message as an email delivery.

## Summary-content spot-check

Before showing a generated body, check it against the actual payload:

| Record | Required behavior |
| --- | --- |
| AUTH001 | Both published books; correct totals; overdue acknowledgement and review guidance; no scheduled-payment claim |
| AUTH008 | Fully paid acknowledgement; no invented pending payment or overdue explanation |
| AUTH007 | Exact `In Production - Cover Design` stage for BK013; no sales or publication-date fabrication |
| AUTH009 | ₹850 pending and ₹1,000 rollover threshold; exact Typesetting stage for BK015; threshold does not erase overdue escalation |

The quarterly cycle and 45-day policy window are separate from the internal 90-day badge rule. Do not describe the 90-day threshold as the author's payout policy.

## Honest fallback if the live flow is incomplete

Replace the affected stage with a short factual statement, for example:

> “The interface and request contract are built. A live AI/callback run is still pending because [specific observed blocker]. This is the saved workflow design, not a successful execution. The test ledger records that limitation.”

If bulk or failure recovery was not tested, omit the demonstration and state the gap. A saved workflow, an editor placeholder or a mock response is not a live end-to-end result. Keep the final recording within 3–5 minutes and check audio and playback before submission.

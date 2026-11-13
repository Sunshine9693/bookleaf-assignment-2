# Recording script (target 4 minutes 30 seconds)

This is a recording script, not evidence that the recording or live tests have occurred. Record only behavior that has been observed working. If a stage is unavailable, use the honest fallback below rather than narrating it as successful.

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

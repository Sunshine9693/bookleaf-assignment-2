# 19 — Backend implementation status

**Packaging review: 15 November 2026. Live observations and captures: 14 November 2026.** This record summarizes the primary builder's live-editor observations supplied to the backend reviewer, with subsequent builder updates. The reviewer did not operate the browser. The local n8n export comparison passed again on 15 November without changing templates or downloaded exports; no new live credential/platform test was run. **Editor configuration is not successful live integration verification.**

## Final Keep-Free handoff checkpoint

The user explicitly chose to keep the Free plan and package the verified work. The Bubble callback is now **UNEXPOSED**: [handoff capture](bubble-callback-handoff-disabled.txt) shows `Expose as a public API workflow` value 0. Its earlier Admin-only public configuration is historical; do not imply an active callable callback or runtime authentication pass. Other internal workflows remain unexposed, the Data API stays disabled and no new live test is authorized by these prepared artifacts.

The saved n8n main workflow `THfIQmhfGo1r8Hzk` is inactive and has the published internal error handler `CNrpnRtjpWmuCFjq` attached in its saved Error Workflow setting. Both have timezone Asia/Kolkata and successful/failed/manual/progress execution-data retention OFF, with 180/30-second timeouts. The handler's sanitized output is transient, not a durable audit; Bubble NotificationLog and its timeout path are the durable operational record. Automatic error-handler invocation has not been tested.

Actual UI downloads are `n8n/royalty-summary-live-export.json` and `n8n/royalty-summary-error-live-export.json`. [Local export verification](../n8n/live-export-verification.json) confirms all main Code nodes, 20 nodes and 18 graph edges, selected credential references, attached handler ID, retention settings and inactive/active states. No credential-shaped values or pinned/static execution data were found by the scan. Export configuration is not credential validity, real AI execution or accepted callback proof. The frozen generated main template remains unchanged.

## Current platform and credential blockers

The 14 November Bubble capture displays a red Upgrade / Workflow limit notice. The builder reported the tooltip: “This app reached a workflow limit available on the Free plan. Please upgrade to continue testing.” [Saved plan text](bubble-free-limit-live.txt) shows Free, 128 of 50K and overages disabled; the monthly workload figure does not establish availability of the restricted workflow feature. No paid upgrade or trial was authorized/taken. Existing seven timeout outcomes were captured before this notice and are not evidence that new testing remains available. The 15 November packaging review did not probe the platform again.

Callback credential validity remains unverified. Both n8n callback nodes select the existing `Header Auth account 3` reference, but selection does not prove its value is valid. A credential became tool-visible during private copy troubleshooting; the builder reports no value was saved to project files or Git. User rotation/revocation and private replacement entry are required before connection testing. No value is included in this document. The builder has cleared the browser clipboard and hidden the API-key view at handoff. Do not change authentication requirements to work around this blocker.

## Configured in the existing Bubble app

| Component | Editor ID | Observed configuration |
| --- | --- | --- |
| `trigger_royalty_summary` | `bTGYx` | Unexposed; required Author and TriggerSource parameters. Event requires Current User role Admin, nonempty Author, and no log for that Author whose status is neither Success nor Failed. |
| Create log | `bTGZJ` | Author and trigger source parameters; Queued; server requested time; requested_by Current User; email_sent no; attempt_count 1. |
| Persist request | `bTGZL` | Changes Result of Create log: request_id and idempotency_key are that log's unique ID; status Processing. |
| Schedule recovery | `bTGZd` | Schedules private `mark_summary_timeout` at current time + five minutes; passes Result of Persist request. |
| Outbound request | `bTGZi` | API Connector action mapped to fresh ISO UTC timestamp, JSON-safe request/author identifiers and name, and live Books search constrained by Author. List formatting includes the nine minimum book fields with comma delimiter; both nullable dates use literal-null / JSON-safe-date branches. |
| Outbound rejection update | `bTGZn` | Targets matching request ID, excluding Success/Failed logs; sets Failed, server completion time, email_sent no and a safe error. Original condition was accepted=no AND duplicate=no; review correction below remains necessary until rechecked. |
| `mark_summary_timeout` | `bTGZQ` | Unexposed; required NotificationLog; Admin, nonempty-log and nonterminal conditions. |
| Timeout update | `bTGZb` | Sets Failed, server completion time, email_sent no and safe timeout error. Builder reports added conditions: requested_at nonempty and Current date/time plus minutes(-5) > log.requested_at. This selects strictly older-than-five-minute requests; scheduled/early invocation behavior remains untested. |
| `n8n_callback` | `bTGSX0` | UNEXPOSED at final handoff; earlier approved public configuration used Admin only. Eight parameters including typed NotificationStatus. Event rejects Queued/Processing and requires an existing request ID. Update search excludes terminal logs; completed_at is Bubble Current date/time and email_sent is no. Returns ok=yes. Authentication and terminal-duplicate behavior remain unverified live. |
| Single-author button | `bTGaA` | Generate & Send Royalty Summary; click workflow `bTGaH` requires Admin; action `bTGaR` schedules the private trigger with Current page's Author and Single. Busy conditional searches this author's nonterminal logs, disables clicking and changes its label. |
| Bulk action | Builder observation | Schedule on a list of Author: Search Books where royalty_pending > 0, each author, unique elements; source Bulk, five-second interval, action Admin-only. Captured history covers nine eligible-author terminal failures, not successful AI/callback bulk processing. |

The API Connector collection uses private-header authentication but its secret is empty. Its synthetic manually entered response shape contains accepted/duplicate yes-no fields and error text. No credential or successful live provider/callback execution is recorded here.

The formatter observation was subsequently saved in `bubble-outbound-formatter-live.txt`. Callback configuration observations are in `bubble-callback-auth-live.txt` and `bubble-callback-update-live.txt`. These record editor configuration, not an accepted authenticated callback.

One actual Single button click created exactly one development NotificationLog. App Data displayed attempt_count 1, email_sent no, a completion timestamp and the configured safe service-rejection message. The subsequent `notification-history-live.txt` capture directly shows Priya's original 9:57 request with **Failed**, its safe error, completion time, empty subject/body/model and email delivery disabled. No successful AI execution is claimed. Other HTTP-error shapes and scheduled recovery still require direct verification.

The complete `notification-history-all-live.txt` capture supersedes the first unchanged-tree Retry notice. Independent `scripts/qa-notification-live.mjs` reconciliation confirms eleven unique IDs: Priya's 9:57 original and 10:28 subsequent request remain distinct, with original previously captured displayed fields preserved; nine further 10:41 requests cover every source author with positive pending royalty once, excluding AUTH008. Priya and Rohit failed immediately; the remaining seven rows show timeout failures completed at 10:46. All eleven are Failed, with no generated subject/body/model and delivery disabled. See `notification-live-reconciliation.json`.

The builder identifies the actions as Retry and Bulk. The capture independently proves the distinct requests/author coverage and terminal failure outcomes, but does not show trigger_source or the clicks. Minute-level timestamps support observed recovery outcomes, not exact five-minute elapsed seconds or early-call denial. No AI generation or callback acceptance pass follows from these failures.

The n8n webhook selects `Header Auth account`, the provider selects `Header Auth account 2`, and both callback nodes select `Header Auth account 3`. The UI exports confirm only those references; the provider key and callback bearer have not been validated. The supplied app domain is not an API token. Callback-token rotation/replacement remains a prerequisite; the API-key view is hidden and the browser clipboard cleared at handoff.

## Necessary corrections/checks before acceptance

1. **HTTP failure handling review:** inspect the actual Connector response and test additional error shapes. The current manual schema exposes accepted, request_id, duplicate, error text and raw body; an additional Connector error flag was not visible in the workflow chooser. If such a flag becomes available, a suggested guard is:

   ```text
   Result of outbound returned an error is yes
   OR
   (Result of outbound's accepted is no
    AND Result of outbound's duplicate is not yes)
   ```

   The current accepted=no AND duplicate=no condition did execute the rejection branch in the actual disconnected-service test. Do not generalize that one result to every HTTP/transport failure or infer unverified empty-boolean semantics. The n8n invalid-payload HTTP400 response omits duplicate; test it explicitly. Exact serial replay has duplicate=yes and must not fail the original request. Keep terminal exclusions. Error-inclusive was enabled before manual response definition. [Error handling reference](https://manual.bubble.io/core-resources/api/the-api-connector/adding-calls#include-errors-in-response-and-allow-workflow-actions-to-continue).

   If the current editor cannot express boolean `is not yes`, a UI-compatible candidate is to format **each** of accepted and duplicate as text (yes output `yes`, no output `no`), apply text `:defaulting to "no"`, then require **both** formatted text expressions `is not "yes"`. This rejects any ordinary result that is neither explicitly accepted nor explicitly a duplicate, without depending on whether an absent Boolean compares equal to no. The [official operators reference](https://manual.bubble.io/core-resources/data/operations-and-comparisons) documents Boolean formatting and default values, but does not specify the comparison of an absent Boolean against no. Verify the expression against actual successful, duplicate and failed responses before recording a pass. A transport exception that aborts before this action still requires scheduled timeout recovery. No official source reviewed guarantees that a manually entered response schema automatically adds the Connector's error-wrapper fields; do not invent wrapper keys.

2. **Timeout age:** the builder reports the actual action now requires nonempty requested_at and `Current date/time:plus minutes(-5) > log's requested_at`, with existing Admin/nonterminal event checks retained. Verify persistence and early/scheduled invocation behavior. The strict comparison selects timestamps older than five minutes, not exactly equal; do not call this a timed-recovery pass from configuration alone.

3. **Callback authentication:** public exposure is OFF at final handoff. Keep it off until user credential rotation/replacement, legitimately available platform testing and the relevant approval. Its prior Admin-only configuration and selected private bearer reference are not an authenticated runtime pass. Keep the Data API disabled and other backend events unexposed.

4. **Callback completion time:** terminal-only incoming status, Bubble Current date/time and email_sent no are now configured. If Processing callbacks are deliberately supported later, leave their completion time empty and add a terminal-only server timestamp action dependent on a successful nonterminal update result.

5. **Preserve terminal state:** keep terminal exclusions on the callback's actual Thing to change, not only an earlier count. A duplicate terminal callback may acknowledge without overwriting its first result. Unknown IDs must still fail the event condition; do not enable Return200ifnotrun merely to acknowledge duplicates.

6. **Dispatch and UI:** verify the actual Single and Bulk buttons call the private trigger with the intended Author/TriggerSource and that logged-out/Author roles cannot dispatch it. Bulk eligibility must come from live Book pending royalties, not the malformed Author.total_pending relation.

## Guard strengths and remaining limitation

The current trigger guard blocks any nonterminal request for the Author, which avoids releasing a request at 120 seconds while n8n may still be working. The separately scheduled timeout provides recovery if the outbound action aborts before its failure branch.

However, search-before-create and terminal-search guards remain **non-atomic**. Bubble documents lagging searches and parallel execution. No verified unique-key claim or compare-and-set primitive was introduced; n8n static data also remains a sequential-demo safeguard. Do not describe this as concurrent exactly-once processing. [Execution rules](https://manual.bubble.io/help-guides/logic/workflows/actions).

## Still unverified live

- Private shared secret and callback bearer configured securely.
- Current-timestamp request accepted; stale/invalid requests rejected.
- Correct JSON after Bubble dynamic substitution, including punctuation, numeric zeros and null dates.
- Real AI summary, factual review and authenticated callback update.
- Missing/invalid bearer rejected; unknown request rejected; repeated callback preserves terminal result.
- Other outbound HTTP/transport shapes, early timeout rejection, exact scheduled timing, successful-terminal immunity and late callback behavior. Seven timed-out rows are now captured.
- Rapid duplicate triggers and successful AI/callback bulk outcomes. Distinct retry IDs and all nine eligible terminal failure outcomes are now captured.
- Persistence of final editor changes after any save warning.

Local n8n tests and schema inspection do not satisfy these live acceptance items.

## Deadline implementation and acceptance plan

These are instructions for the primary builder, not newly observed editor changes.

1. **Timeout action:** require `log's requested_at is not empty` and `log's requested_at <= Current date/time:plus minutes(-5)`, as well as Admin, a nonempty log and nonterminal status. Put the age check on the actual update action; the event may repeat it. Do not use `>` here, which would select recent requests. Retain the separately scheduled five-minute recovery even when immediate outbound rejection handling works.
2. **Bulk entry:** on the Admin dashboard use **Schedule API workflow on a list**, type **Author**, list `Search for Books (royalty_pending > 0):each item's author:unique elements`, workflow `trigger_royalty_summary`, author `This Author`, source **Bulk**. Require Admin at the UI workflow and retain the private trigger's server authorization. Derive the list from live Books; do not add cached Author totals. Existing active authors may be skipped by the per-author guard. For an exact nine-log acceptance run, first confirm there are no nonterminal logs for the nine eligible Authors. AUTH008 is not eligible. Disable the bulk control while an eligible-author request is active; repeated simultaneous backend execution remains non-atomic.
3. **History:** provide an Admin-only NotificationLog repeating group, newest `requested_at` first. At minimum display Author, requested time, status, trigger source and safe error. A selected-log group can display completed time, subject, body, AI model, execution ID and email-sent state. Keep author-role/logged-out denial; historical summaries are Admin data.
4. **Retry:** a Failed row's Admin-only Retry control schedules the existing private trigger for that row's Author with source **Single**. Require the row still Failed and no active request for that Author. The trigger creates a new log and new request ID; do not reset or reuse the old log. The current `attempt_count = 1` describes each new request, not cumulative retry history; document this convention rather than modifying the old Failed row to mimic cumulative counting.

Shortest proof order:

- One real request: original log reaches Success through the protected callback; subject/body/model/execution ID and server completion time are populated, email_sent remains no.
- One failure and Retry: exactly one additional log with a different request ID; the old Failed row, timestamps, error and summary fields remain unchanged. The retry reaches a terminal state. A callback for the old request cannot overwrite the new request or resurrect the old terminal log.
- Timeout: an early invocation leaves a recent nonterminal test log unchanged; the scheduled invocation at/after five minutes marks only that stale nonterminal log Failed. A successful log remains unchanged when its scheduled timeout later runs.
- Bulk: snapshot history before/after one click with no pre-existing active eligible requests. Exactly nine new request IDs cover the nine eligible Authors once each, all have source Bulk, AUTH008 has no new row, and every new row becomes terminal independently. An individual failure must not prevent the other eight completing.
- Repeat serial click/replay and unauthenticated/unknown/duplicate callbacks; preserve the stated non-atomic concurrency limitation. A terminal history row and a 202 acceptance response alone do not establish accurate AI output.

Do not spend deadline time changing the source dataset, adding retry counters to existing records, or building transactional claim infrastructure. Finish the protected lifecycle, visible history, retry and the above evidence first; disclose the known concurrency limitation.

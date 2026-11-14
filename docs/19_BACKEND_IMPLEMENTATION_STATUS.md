# 19 — Backend implementation status

**Updated 14 November 2026.** This record summarizes the primary builder's live-editor observations supplied to the backend reviewer, with subsequent builder updates. The reviewer did not operate the browser. **Editor configuration is not successful live integration verification.**

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
| Timeout update | `bTGZb` | Sets Failed, server completion time, email_sent no and safe timeout error. Requested-age condition still needs verification/addition. |
| `n8n_callback` | `bTGSX0` | Exposed with Admin only after the user's explicit live-test approval. Eight parameters including typed NotificationStatus. Event rejects Queued/Processing and requires an existing request ID. Update search excludes terminal logs; completed_at is Bubble Current date/time and email_sent is no. Returns ok=yes. |
| Single-author button | `bTGaA` | Generate & Send Royalty Summary; click workflow `bTGaH` requires Admin; action `bTGaR` schedules the private trigger with Current page's Author and Single. Busy conditional searches this author's nonterminal logs, disables clicking and changes its label. |

The API Connector collection uses private-header authentication but its secret is empty. Its synthetic manually entered response shape contains accepted/duplicate yes-no fields and error text. No credential or successful live provider/callback execution is recorded here.

The formatter observation was subsequently saved in `bubble-outbound-formatter-live.txt`. Callback configuration observations are in `bubble-callback-auth-live.txt` and `bubble-callback-update-live.txt`. These record editor configuration, not an accepted authenticated callback.

One actual Single button click created exactly one development NotificationLog. App Data displayed attempt_count 1, email_sent no, a completion timestamp and the configured safe service-rejection message. No successful AI execution is claimed. The final status field, other HTTP-error shapes and scheduled recovery still require direct verification.

The n8n provider node selects Header Auth account 2; its key has not been read or tested. Header Auth account 3 is prepared with Authorization and an allowed domain restricted to this Bubble app. The user is entering the callback token directly. The supplied app domain is not an API token. Bubble Settings > API is open to help the user locate/create the token privately.

## Necessary corrections/checks before acceptance

1. **HTTP failure handling review:** inspect the actual Connector response and test additional error shapes. The current manual schema exposes accepted, request_id, duplicate, error text and raw body; an additional Connector error flag was not visible in the workflow chooser. If such a flag becomes available, a suggested guard is:

   ```text
   Result of outbound returned an error is yes
   OR
   (Result of outbound's accepted is no
    AND Result of outbound's duplicate is not yes)
   ```

   The current accepted=no AND duplicate=no condition did execute the rejection branch in the actual disconnected-service test. Do not generalize that one result to every HTTP/transport failure or infer unverified empty-boolean semantics. The n8n invalid-payload HTTP400 response omits duplicate; test it explicitly. Exact serial replay has duplicate=yes and must not fail the original request. Keep terminal exclusions. Error-inclusive was enabled before manual response definition. [Error handling reference](https://manual.bubble.io/core-resources/api/the-api-connector/adding-calls#include-errors-in-response-and-allow-workflow-actions-to-continue).

2. **Timeout age:** add `log's requested_at <= Current date/time:plus minutes(-5)` to the nonterminal timeout update. This protects against an accidental early internal call as well as scheduling mistakes. Retain Admin authorization.

3. **Callback authentication:** Admin only is now configured with user approval. The private bearer credential still needs user completion and authenticated testing. Keep the Data API disabled and other backend events unexposed.

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
- Outbound HTTP failure, transport failure, five-minute recovery and late callback behavior.
- Rapid duplicate triggers, retry, and all nine independent bulk outcomes.
- Persistence of final editor changes after any save warning.

Local n8n tests and schema inspection do not satisfy these live acceptance items.

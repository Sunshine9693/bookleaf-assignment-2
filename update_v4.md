# BookLeaf Assignment 2 — 14 November 2026

## Verified

- Admin overview: all 10 authors, 18 books and royalty totals reconcile; filters pass.
- Two author Run as sessions: correct own books and totals; six protected-route attempts redirect to the author portal.
- Author logout and subsequent logged-out author/admin dashboard visits return to login.
- Required book metadata and exact publication status are configured on both views. Priya admin detail passes 14/14 source checks; Ananya's missing payout label and zero-paid totals pass.
- Private GitHub repository contains the code, workflow artifacts and explicit QA evidence.

## Newly configured, still requiring end-to-end acceptance

- Private admin-authorized summary trigger creates a log, persists its unique request ID, sets Processing, schedules five-minute recovery and calls n8n.
- Outbound JSON includes only the selected author's relevant books, JSON-safe text, numeric royalties and explicit null-date branches; timestamp is current ISO UTC.
- Callback accepts terminal outcomes, requires an existing request, preserves terminal records, uses server completion time and keeps email_sent false.
- User approved the Admin-only callback connection and transfer of supplied author/book royalty data to OpenRouter for testing. Callback is exposed with Admin only; other backend events remain unexposed.
- Single button and its nonterminal busy condition are configured. One real click created one development log and recorded the safe disconnected-service rejection message.

## Remaining

- User must finish entering/saving the Bubble bearer credential privately in n8n. Bubble Settings > API is open to locate/create the token. The app domain is not a token.
- Enter the shared webhook secret in Bubble's private collection authentication, verify the provider credential and assign the dedicated Bubble credential to both callback nodes.
- Import/select the safe n8n error workflow; verify final workflow settings and activation for the approved test flow.
- Build notification history, retry/navigation and bulk controls; verify all nine eligible outcomes.
- Exercise real AI/callback success, authentication rejection, invalid/stale payloads, timeout, late callback, duplicates and retry.
- Finish password-login provisioning/testing and final recording/submission artifacts. Run as tests do not establish password-login acceptance.

No real email, public Bubble deployment, plan purchase or source-data reset has occurred. Search-based guards remain non-atomic; no concurrent exactly-once guarantee is claimed. Latest implementation details are in docs/19_BACKEND_IMPLEMENTATION_STATUS.md.

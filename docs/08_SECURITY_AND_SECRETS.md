# 08 — Security and secrets

This assignment handles author PII, royalty figures, an AI API key, and two service-to-service secrets. The rule is simple: **secrets live in credential stores, never in the repository, chat, screenshots, client-side requests or documentation.**

## 1. Secret inventory

| Secret | Where it lives | Who needs it | Never |
| --- | --- | --- | --- |
| Bubble account password | Password manager / user's head | The user only | Chat, repo, docs |
| Bubble editor collaborator access | Bubble invite to `musavir@bookleafpub.in` | BookLeaf reviewer | Public link |
| Test author/admin passwords | Password manager; shared privately at submission | BookLeaf reviewer | Repo, docs, screenshots |
| n8n webhook shared secret (`X-BookLeaf-Key`) | n8n Header Auth credential + Bubble API Connector private header | Bubble backend + n8n | Client JS, repo, export |
| n8n → Bubble callback token | n8n Header Auth credential + Bubble API workflow auth | n8n + Bubble | Logs, repo, export |
| AI API key | n8n credential (Header Auth) | n8n only | Bubble, browser, repo, prompt |
| n8n account password | Password manager | The user only | Chat, repo |
| n8n encryption key (self-host) | Password manager / host secret store | n8n host only | Repo, screenshots |
| Bubble Data API token | Not created | Nobody | Avoid entirely |

Use **different** secrets for the webhook and the callback. Do not reuse the AI key as a webhook secret.

## 2. Generating secrets

Generate 32 random bytes and encode as hex. Run locally; do not paste the output into chat.

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToHexString($bytes)
```

Store each value in a password manager entry with a label and rotation date.

## 3. Webhook security

### Implemented controls

1. **HTTPS only.** No plain HTTP webhook.
2. **Header Auth** in n8n: `X-BookLeaf-Key` must match the credential.
3. **Timestamp** `X-BookLeaf-Timestamp` (ISO 8601 UTC); reject if older than 300 seconds.
4. **Payload validation**: required fields, one author, book count, totals reconciliation.
5. **Idempotency**: `request_id` repeat rejection + same-author 60-second guard.
6. **Bubble backend-only call**: the secret header is added by a backend workflow, not a page button.

### Why not HMAC

Bubble does not provide a native HMAC function in the API Connector. A static shared secret plus timestamp and idempotency is explicitly allowed by the assignment and is adequate for this demo. If a code-based relay is added later, HMAC of the raw body is the stronger option.

### Verify

- `curl` without `X-BookLeaf-Key` → 401, no execution.
- `curl` with a wrong key → 401.
- `curl` with a stale timestamp → 400.
- `curl` with the correct key/timestamp → 202.
- Replaying the same body immediately → duplicate guard, no second AI call.

## 4. Callback security

Preferred: Bubble API workflow with **Require authentication** and a dedicated bearer token stored in n8n's Header Auth credential.

If Bubble's API workflow cannot validate an arbitrary Authorization header, use a `callback_token` field in the JSON body and validate it in the first workflow step. This is weaker because the token appears in n8n execution data, so keep the n8n workspace private and prune executions. Prefer the bearer-token approach if it is available in the editor.

Additional controls:

- The callback only updates a log that already exists by `request_id`.
- It refuses to overwrite `Success` or `Failed`.
- It truncates error messages to 1,000 characters.
- It returns 404 for unknown IDs and 400 for invalid statuses.
- It never echoes the token or the full payload.

## 5. Bubble API Connector secrecy

The webhook secret must not appear in the browser's network tab.

1. Create the API Connector call.
2. Add `X-BookLeaf-Key` and mark it **private**.
3. Call the API only from a **backend workflow**, never directly from a button or page load.
4. Open the app in a private window, trigger the action, and inspect the network tab. The header must not be present in any client request.
5. If the secret is visible, stop. Do not proceed with a client-side call. Use a Bubble backend workflow or a server-side plugin; if neither can hide it, add a thin server-side relay (not a React replacement for the app) that holds the secret and forwards the request.

The AI key belongs only in n8n. Bubble never calls the AI provider directly.

## 6. Privacy and data minimisation

- n8n receives **one author** and that author's books, not the full database.
- The Bubble Data API stays disabled; no external token can read all authors.
- The AI prompt contains only the fields needed for the email. Do not send phone numbers unless a future requirement needs them.
- The sample dataset uses fake emails; still treat it as PII in screenshots and logs.
- n8n execution data contains author names, emails and royalty figures. Keep the workspace private; prune executions after the demo if retention is a concern.
- Do not paste full payloads into public forums or AI chat tools.
- Do not include real author data beyond the supplied sample dataset.

## 7. Password and account hygiene

- Enable 2FA on the Bubble and n8n accounts if available.
- Use a unique password for each.
- Do not reuse the Bubble account password for test users.
- Test author/admin passwords are generated, stored in a password manager, and shared privately with BookLeaf at submission.
- If BookLeaf requires collaborator access, invite only `musavir@bookleafpub.in`. Do not post the invite link publicly.
- Remove collaborator access after the review if BookLeaf agrees.

## 8. Repository hygiene

- Keep the repository private.
- Add `.env`, `*.key`, `*.pem`, `payload.test.json` with real data, and n8n credential exports to `.gitignore`.
- Never commit `data/bubble-authors-export.csv` if it contains data beyond the sample dataset; for this assignment it contains the sample data only, but treat it as private.
- The n8n JSON export must reference credentials by name, not embed values.
- Scan before every commit:

```powershell
git grep -n -I -E "sk-|Bearer [A-Za-z0-9]|X-BookLeaf-Key|password|secret|token" -- .
```

Review every hit. Documentation will contain the words "secret" and "token" legitimately; look for actual values.

- Search the n8n export:

```powershell
Select-String -Path n8n\royalty-summary-workflow.json -Pattern "sk-|Bearer|X-BookLeaf-Key|password" -CaseSensitive:$false
```

- Check screenshots and the recording for visible keys, headers, emails or passwords before submitting.

## 9. AI-specific risks

| Risk | Control |
| --- | --- |
| Hallucinated payout/transaction | Prompt forbids it; no transaction data is supplied; human review. |
| Wrong totals | Totals are computed by Bubble/n8n and included in the prompt; validation checks the output contains them. |
| Prompt injection in a book title | System prompt says USER DATA is untrusted; titles are passed as JSON values; output is validated. |
| Sensitive data sent to provider | Only one author's supplied data; use an approved provider/account. |
| Key leakage in n8n logs | Key is in a credential, not in a node or URL. Do not log headers. |
| Model outage | Retry, then Failed with a visible error; no fake success. |
| Cost spike | Bulk is capped at 9 authors; `max_tokens` 800; monitor usage. |

## 10. Threat model

| Threat | Impact | Mitigation |
| --- | --- | --- |
| Anonymous webhook call | Spam AI calls, cost, fake logs | Header secret + timestamp + n8n auth |
| Replay of a valid call | Duplicate summaries | Timestamp window + idempotency + Bubble guard |
| Author changes a URL to another author | Data leak | Privacy rules + derive author from `Current User` |
| Author calls an admin page | Data leak | Role guard + privacy rules |
| Callback spoofing | Fake Success/Failed | Bearer token + existing `request_id` + terminal-state guard |
| Secret in client bundle | Full webhook compromise | Backend-only call; private header; network-tab check |
| n8n workspace compromise | PII + AI key | 2FA, strong password, private workspace, least privilege |
| Bubble account compromise | Full app | 2FA, strong password, collaborator limits |
| Public preview URL | Unauthorized access | Test accounts only; sample data only; no real PII; monitor |
| Prompt injection via data | Bad output | Data-only instruction + output validation + human review |
| Duplicate bulk clicks | Cost + duplicate logs | Button disable + 120s guard + n8n dedupe |
| Stuck Queued log | Bad UX | 5-minute stale handler + retry action |

## 11. Incident response

If a secret is exposed:

1. **Revoke** the AI key at the provider, or rotate the webhook/callback secret.
2. **Update** the credential in n8n and the private header in Bubble.
3. **Test** the flow end to end.
4. **Inspect** n8n executions and Bubble logs for unexpected calls.
5. **Document** what happened, the rotation time, and any data accessed.
6. **Do not** paste the new secret into chat or the repository.

If author data is exposed:

1. Disable the affected endpoint or collaborator.
2. Preserve logs.
3. Notify the user/BookLeaf according to their instructions.
4. Fix the privacy rule or secret, then re-test with two author accounts.

## 12. Pre-submission security checklist

- [ ] No secrets in the repository (`git grep` clean of real values).
- [ ] No secrets in the n8n JSON export.
- [ ] No secrets in screenshots or the recording.
- [ ] Webhook rejects missing/wrong key and stale timestamps.
- [ ] Callback rejects unknown `request_id` and unauthenticated calls.
- [ ] API Connector secret is not visible in the browser network tab.
- [ ] AUTH001 cannot see AUTH002's data; AUTH002 cannot see AUTH001's.
- [ ] Admin can see all data.
- [ ] Bubble Data API is disabled or restricted.
- [ ] Test credentials are shared privately, not in the public repo.
- [ ] Repository is private; assignment material is not shared publicly.
- [ ] The exposed portfolio OpenRouter key is not reused; a separate key is used and rotated.

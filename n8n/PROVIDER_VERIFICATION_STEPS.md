# Independent real-provider component verification

This prepared workflow tests **only OpenRouter generation and strict output validation**. It does not call Bubble, create/update NotificationLog, expose a webhook, send an email or bypass Bubble's Free-plan workflow-testing limit. It must not be described as a successful end-to-end integration or callback.

**15 November observations:** initial provider failure and raw-output/hardening rejections are preserved in [PROVIDER_COMPONENT_RESULT.md](PROVIDER_COMPONENT_RESULT.md). Latest isolated hardening candidate produced a real252-word response with model `openai/gpt-4o-mini`, final `valid=true` and human factual/policy/plain-text review PASS. No Bubble callback or email occurred. The separately prepared [promotion artifact](royalty-summary-hardened-workflow.json) changes only the two reviewed Code nodes; see [verification evidence](hardened-promotion-verification.json). This does not establish live-main deployment or end-to-end success.

Artifact: `provider-component-verification-workflow.json`. It is inactive, has five nodes, a 120-second timeout, all four execution-data save modes OFF and empty pinned data. Its Build grounded prompt, OpenRouter AI and Validate AI summary logic/parameters are copied exactly from the frozen main workflow. The only credential-binding change is a name-only reference to the existing `Header Auth account 2`; no value is embedded.

The local fixture node validates the original supplied **AUTH001 / Priya Sharma** record with its exact two Books: earned **19,908**, paid **16,338**, pending **3,570**. Dates, zeros and source figures remain unchanged. Request metadata is labelled for this manual component test. Email and phone are excluded. The fixture node is named `Request guard` solely to satisfy the unchanged prompt node's lookup; this flow does not exercise static-data dedupe.

## Manual execution in the existing n8n workspace

1. Create a **separate empty workflow** in the existing workspace. Import/paste this JSON. Do not overwrite the main or error workflows. Keep this manual workflow unpublished.
2. Select the existing **Header Auth account 2** on OpenRouter AI. Use it only if it is the approved newly configured OpenRouter credential; do not reuse the exposed portfolio key. Do not open, copy or print its value. If no suitable saved credential exists, stop that action and leave the component test unverified.
3. Verify settings: Asia/Kolkata, timeout 120 seconds, successful/failed/manual/progress data saving OFF, no pinned input. The sole network node must POST only to `https://openrouter.ai/api/v1/chat/completions`; no callback or webhook node exists.
4. Execute once manually. This sends the source author's allowlisted book/royalty data to the already approved AI provider through the saved credential. Existing key availability/balance is not assumed, and no purchase or top-up is authorized by these steps.
5. Inspect the **Validate AI summary** node's runtime output. A component pass requires **`valid=true`**, a real returned subject/body and factual human review. An overall green n8n run with `valid=false` is a controlled validation failure, not a pass. Provider failures use the error output into the same validator and show a safe generic rejection.
6. Review both titles, copies sold, earned/paid/pending figures, last-payout dates and correctly labelled consolidated totals. Verify the overdue 48-hour review language, no invented scheduled payment or bank/transaction reference, appropriate policy language and Team BookLeaf signature. The parser is a guardrail, not a proof of all prose claims.
7. Capture credential-free evidence from the final validator output: component workflow ID, execution ID if displayed, `valid`, controlled error or reviewed subject/body. The unchanged request node configures `openai/gpt-4o-mini`; the final validator does not add a model field. If recording a provider-returned model name, read only that response field, never request headers or credential fields. Since retention is OFF, inspect the runtime result before navigating away; do not enable saving or pin data merely to preserve proof. Keep any evidence clearly labelled **manual provider component**, not Bubble callback or notification delivery.
8. Do not retry the run repeatedly to force a pass. If the provider returns a credential/balance error or the output fails strict validation, record that result and its limitation. Do not substitute a fixture body or mark the Bubble log Success manually.

The existing Bubble callback stays unexposed and its previously exposed token must not be reused. A successful manual-provider test does not verify that callback token, Bubble outbound shared secret, server dispatch, persisted replay protection, bulk success or actual password login.

## Local artifact checks

```powershell
node scripts/build-n8n-provider-verification.mjs
node scripts/test-n8n-provider-verification.mjs
```

The local checks validate source consistency, frozen-node equivalence, data minimization, graph routing and safe error handling without calling a provider or fabricating an AI response. The original main workflow file is not rewritten.

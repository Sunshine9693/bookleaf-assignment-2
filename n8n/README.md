# n8n workspace

This folder is reserved for the exported workflow and its setup notes.

**Status:** empty. The workflow has not been built yet; Bubble/n8n access is still blocked.

When the workflow is built and tested, add:

```text
n8n/
  royalty-summary-workflow.json   # exported from n8n, credentials referenced by name
  README.md                       # import steps, credential names, webhook URL, test payload
  payload.example.json            # synthetic/sample payload only, no secrets or real PII
```

Before committing the export:

1. Confirm no credential values are embedded.
2. Search for `sk-`, `Bearer`, `X-BookLeaf-Key`, passwords and tokens.
3. Import the JSON into a clean n8n instance to verify it loads.
4. Document any n8n Cloud trial or self-host/tunnel limitation.

See `docs/06_N8N_WORKFLOW_SPEC.md` for the full design.

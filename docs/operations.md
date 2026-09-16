# Deployment and operations

## Release checklist

- Run typecheck, unit tests, exact-SQL quota regression, local API integration and build.
- Verify anonymous users cannot read saved investigations or originals. Attempt forged identity headers at the public gateway. Use two real accounts to verify deployed isolation before onboarding sensitive production data.
- Configure `NEBIUS_API_KEY` as a secret in the hosting environment. Set the global endpoint and exact NVIDIA model ID. Redeploy after runtime environment changes.
- Run `npm run test:live`. Inspect the recorded source quotes, actual scope, usage and model ID. A mock test is insufficient for hackathon eligibility.
- Through the hosted UI, perform upload → real extraction → human approval → recall trace → review → packet export.
- Recheck the public judge URL from a signed-out browser. Maintain access through the official judging period.

## Local setup and migrations

`npm run build` generates `dist/server/wrangler.json`. `npm run db:local` uses a local migration journal and `.wrangler/state`. It skips already applied migrations. It never applies remote migrations. Production migration files are immutable after deployment; add a new migration for later changes.

## Limits and estimated cost

Default daily limits are 20 extraction attempts per signed-in account and 100 across the site. One active extraction per investigation prevents accidental duplicate runs. Limits count attempts, including provider failures, to cap worst-case spend. Deleting records does not erase budget consumption. The public synthetic drill makes no inference calls.

Development estimate for Super: $0.30 per million input tokens and $0.90 per million output tokens, from Nebius’s official benchmark code. Rates can change. At an illustrative 12,000 input / 4,000 output tokens, model inference is $0.0072; this is a cost model, not measured usage. Hosting, support, extraction, storage and acquisition costs remain separate.

## Failure and recovery

- **Upload failure:** the last saved investigation remains available. Successful earlier files in a multi-file upload remain saved. Orphan cleanup is attempted when a save conflict follows R2 upload.
- **Revision conflict:** reload the investigation; review against the current sources and retry. Do not overwrite another reviewer’s state.
- **Model timeout/auth/rate-limit:** the approved graph does not change. Sources remain saved. Retry only after fixing the cause.
- **Failed worker after reservation:** after five minutes a later request can mark its abandoned job and retry. Operators should inspect provider usage and job records if a result was lost at the network boundary.
- **Completed but unattached result:** inspect `inference_jobs.result` under an authorized operator account. Its `source_revision` must match the source evidence before attaching a proposal. There is no end-user job-recovery UI yet; do not claim automatic recovery.
- **D1 or R2 outage:** APIs return a recoverable unavailable state. No offline write queue is implemented.

## Retention and privacy

Original uploads and extracted text persist until the user deletes the investigation. Deletion removes the investigation, attempts R2 deletion, and redacts job results. Minimal job metadata remains for budget accounting; scheduled retention cleanup is not implemented. A failed R2 deletion needs an operator retry; no automatic orphan sweeper is present.

Audit history is append-only through application actions, not a cryptographically immutable compliance archive. Structured exclusion decisions preserve the before-relationship and quoted evidence. Full arbitrary historical-state reconstruction after every dataset replacement is not implemented; exported snapshots provide portable point-in-time copies.

Backups, recovery-point objectives, real customer data retention terms, access reviews and incident response need explicit operational ownership before commercial production use. These are release responsibilities, not claims made by the MVP.

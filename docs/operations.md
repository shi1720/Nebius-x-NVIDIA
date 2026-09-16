# Deployment and operations

## Active services

Public application: [recallroom.web.app](https://recallroom.web.app). Firebase project `recallroom-ai-2026` contains Hosting, Authentication and Firestore. The isolated Cloud Run API, Cloud Tasks queue and private evidence bucket are in existing billed project `granted-ai-2026`.

The API endpoint is `https://recallroom-api-812985487554.us-central1.run.app`. Treat production mutations as real cloud operations. Use synthetic disposable records for acceptance testing. Historical Sites/Cloudflare migration tools do not initialize or deploy this runtime.

## Build and deployment

```bash
npm ci
npm run typecheck
npm test
npm run build:api
VITE_API_ORIGIN=https://recallroom-api-812985487554.us-central1.run.app npm run build:web
npm run deploy
```

The deployment command delegates to `scripts/deploy-firebase.sh`. It requires an authenticated operator with access to the configured Google Cloud and Firebase projects. Inspect its project targets before adapting it for another account. Do not substitute credentials into committed files or command output. Firebase Hosting serves `dist/firebase`; the API container is deployed separately to Cloud Run.

The API service identity needs only its required Firestore, bucket and task permissions. Firebase Auth Admin is used for token verification; users access private data through the API, not direct Firestore client rules. Restrict storage to the service identity. Keep model credentials server-side using the deployed secret configuration.

## Local development

`npm run dev` starts the Vite frontend on port 5173. `npm run dev:api` starts the Next.js API on port 3000. Set `VITE_API_ORIGIN=http://localhost:3000` for the frontend and `APP_ORIGIN=http://127.0.0.1:5173` for the API, then open the frontend at that exact origin.

Configure the Firebase web app in `public/firebase-config.json`, authorize the local hostname, and provide server-side Application Default Credentials, `GOOGLE_CLOUD_PROJECT` and `STORAGE_BUCKET`. Use a dedicated development project. Local private API requests use those configured cloud resources; there is no documented emulator-only workflow. The public synthetic drill works without a model key.

Background extraction additionally requires:

```dotenv
TASK_PROJECT=your-task-project
SERVICE_ORIGIN=https://your-reachable-api-service
TASK_SERVICE_ACCOUNT=your-task-service-account-email
```

The queue is named `recallroom-inference` in `us-central1`. The dispatcher must be able to mint an OIDC token for the configured service account. The handler verifies that identity and the API origin as audience. Do not expose an unauthenticated local shortcut for this handler.

## Release acceptance

1. Run typecheck, automated tests and both production builds. Inspect the latest migration-specific results; old CI runs are not current proof.
2. Run `RECALLROOM_API_URL=https://recallroom-api-812985487554.us-central1.run.app node scripts/test-firebase-api.mjs`. Inspect every result and cleanup outcome in `docs/evaluation/firebase-api.json`.
3. Verify public sample access and responsive navigation in a browser. Complete sign-in, create a private investigation, upload an original, review evidence, export, reload and sign out.
4. Verify isolation with two real Firebase accounts. Anonymous, invalid-token and wrong-account requests must not retrieve private state or originals. Direct task invocations without the expected service identity must fail.
5. Configure a real `NEBIUS_API_KEY`, exact NVIDIA model ID and endpoint. Run `npm run test:live`, then perform the hosted upload, extraction, review and import path. A mock is insufficient for the hackathon requirement.
6. Confirm the public video accurately shows working software, has audible narration and captions, and is no longer than three minutes. Maintain free demo access through the judging period.

## Limits and inference budget

Default limits are 20 extraction attempts per account per UTC day and 100 across the site. Firestore transactions couple those counters to an owned, current investigation and a single active job. Attempts include provider failures; deleting an investigation does not reset daily quotas. The public synthetic drill makes no inference calls.

The queue permits two simultaneous tasks. Task dispatch and handler timeouts are 180 seconds, while model inference has its own 90-second budget and at most two selected transient retries. A stale investigation lock expires after five minutes. Retries consume an attempt only when a new reservation succeeds.

Rate estimates in the commercial model are planning assumptions, not measured production costs. Account for Cloud Run, Tasks, Firestore, storage, support and onboarding separately. No live Nebius usage or savings are claimed before a real trace is recorded.

## Failure and recovery

- **Upload failure:** the last saved investigation remains. Previously successful files in a multi-file selection can remain saved. An orphan cleanup is attempted when a save conflict follows upload.
- **Revision conflict:** reload the investigation and review the current evidence before retrying. Never overwrite newer review state.
- **Model error or timeout:** approved records remain unchanged. Fix the cause before retrying. The UI polls the background job and can surface a stale timeout after five minutes.
- **Duplicate task:** the transactional claim skips a job that is no longer queued. Do not manually reset completed jobs to queued.
- **Changed investigation:** a result cannot attach to a mismatched job or source revision. Inspect job status and source state before starting a new request.
- **Firestore or storage outage:** requests return a recoverable error. No offline write queue is implemented.

## Retention and privacy

Originals and extracted text persist until the user deletes their investigation. Deletion removes investigation state and related inference-job records, then deletes stored originals. Daily quota counters remain so deletion cannot bypass limits. A storage cleanup failure needs operator attention; no automatic orphan sweeper or scheduled quota retention cleanup is supplied.

Audit history is append-only through application actions, not a cryptographically immutable archive. Exclusions preserve the original relationship and cited decision. Arbitrary historical reconstruction after every dataset replacement is not implemented; exports provide point-in-time copies.

Define backups, recovery objectives, customer data terms, access reviews and incident response before handling sensitive commercial records. Do not claim regulatory certification or a completed production security program.

## Historical tools

The SQLite quota suite, D1 migration commands and earlier Cloudflare API checks describe the prior implementation. They can explain historical regressions but do not test active Firestore transactions or the Firebase authentication boundary. Use the hosted Firebase report and browser acceptance for this deployment.

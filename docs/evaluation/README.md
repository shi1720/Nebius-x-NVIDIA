# Evaluation evidence

The current deployment is [recallroom.web.app](https://recallroom.web.app), using Firebase Hosting and Authentication, Firestore, private Google Cloud Storage, Cloud Run and Cloud Tasks.

## Current engineering checks

- **37 automated unit and provider-contract tests pass.** The graph suite additionally compares results against an independent fixed-point oracle over 150 generated graphs.
- **58 of 58 hosted API checks pass** against the deployed Cloud Run service using two real disposable Firebase accounts. The [sanitized report](firebase-api.json) covers token verification, anonymous and wrong-account rejection, exact-origin CORS, task-identity rejection, persistence, source-backed review, stale revisions, original uploads and downloads, hashes, duplicate files, PDF verification, export audit, expired locks and deletion.
- **10 of 10 operator checks pass** against the production Firestore functions. The [operator report](firebase-operator.json) verifies concurrent per-user and global quota boundaries, rejected reservations consuming no budget, a single active job per investigation, and expired-lock update and deletion behavior. Test-process limits are lowered only for the bounded test; deployed limits are unchanged. No task is enqueued and no model request is made.
- Disposable test records and accounts were cleaned up. Deletion of uploaded originals was also verified directly in the private Google Cloud Storage bucket.
- Real browser Google sign-in succeeded and a private Sunward investigation was created for Shivam. The public layout was inspected at 390px mobile width without page-level horizontal overflow. Remaining browser acceptance is tracked in [delivery status](../STATUS.md).

These are engineering checks, not a benchmark of real recall outcomes, independently validated extraction accuracy, or a certification. Provider-contract tests use explicit mocks. A successful task-authentication rejection test does not establish a successful background model run.

## Live inference remains pending

No usable Nebius key is configured. A real NVIDIA model run through Nebius Token Factory, source-to-proposal extraction, human approval, and persisted hosted import still need verification. No real model latency, usage, quality or cost is claimed. An OpenAI TTS call used for neutral demo narration is unrelated to the required NVIDIA inference workload.

## Reproduce

```bash
npm ci
npm run typecheck
npm test
npm run build:api
npm run build:web
RECALLROOM_API_URL=https://recallroom-api-812985487554.us-central1.run.app node scripts/test-firebase-api.mjs
```

The hosted suite makes real authentication and API requests with synthetic disposable data. Inspect its cleanup results as well as its pass count. For the bounded operator suite, an authorized operator can run:

```bash
npx tsx scripts/test-firebase-operator.ts
```

That script requires operator access to the configured Firestore project and creates temporary records. It restores only its own successful reservations from the shared daily counter; it does not reset unrelated usage.

With a configured Nebius key, the separate real-provider check is:

```bash
npm run test:live
```

This last command incurs actual provider usage. It must not be described as passed when it stops for a missing credential.

## Historical evidence

The earlier [production smoke report](production-smoke.json), SQLite quota checks, Cloudflare local API suite, old CI run and [initial internal rubric review](final-judge-review.md) describe the previous deployment. They remain historical context, not current Firebase acceptance or an official judging score. The active API and operator reports above supersede the old authentication and persistence evidence. No current migration CI pass is inferred from an earlier commit.

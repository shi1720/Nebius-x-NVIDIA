# Security and data handling

Do not include customer evidence, API keys or personal data in public issues. Report a suspected vulnerability privately to the repository owner through GitHub's available private reporting channel. If unavailable, request a private contact route without posting sensitive records or exploit details.

## Authentication and authorization

The active application uses Firebase Google or email/password authentication. The browser sends a Firebase ID token to the isolated Cloud Run API, which verifies it with Firebase Admin, including revocation checks. Caller-supplied user identifiers or legacy `oai-authenticated-*` headers do not establish identity. No Sites authentication gateway is part of the active deployment.

Every private investigation, original-file and job lookup checks the verified owner's ID. Mutating requests require the configured frontend origin and the expected investigation revision. Firestore transactions enforce ownership, quotas and active-job locks. Firestore client rules deny direct document access; private data operations run through the API. Original objects are private and downloaded only through an authorized lookup.

Cloud Tasks calls the extraction handler with an OIDC identity token. The handler verifies its audience and the exact configured service-account email. A normal Firebase user token cannot authorize task execution. The API is reachable for public configuration and signed-in application requests, so each protected route must preserve its own verification boundary.

## Evidence and model boundary

Uploaded records are untrusted evidence. They cannot authorize application actions. PDF text remains unverified until a reviewer compares it with the original. Source hashes identify content; they do not prove the authenticity or truth of a document.

Model requests contain source text but no application credentials or unrestricted tools. Returned records enter an unapproved proposal and must pass schema, source-quote and domain checks before human import. Failed extraction leaves approved records unchanged. Exports escape HTML and neutralize active spreadsheet formulas. Customer messages remain unsent drafts.

Model credentials stay server-side and must never appear in a `VITE_` variable, static bundle, source repository, export or public log. Firebase's browser configuration identifies the public web app and is not an administrative credential.

## Verification and limits

The Firebase migration has passed 58 hosted API checks, including two-account isolation and rejected task identities, and 10 operator checks for transactional quotas and lock expiry. Private GCS original cleanup was verified. See [evaluation evidence](docs/evaluation/README.md) for the reports and their limits. These tests do not establish live NVIDIA inference or a completed commercial security program.

User deletion removes investigation state and related job records, then deletes original files. Daily quota counters remain. Failed object cleanup requires operator attention; no automatic orphan sweeper is supplied. Audit history is append-only through normal application actions, not a cryptographically immutable archive.

This MVP does not certify food safety. Handling real incident data requires deployment-specific review, retention and backup policies, operational ownership and accountable human quality leadership. No regulatory certification, real-world extraction accuracy or guaranteed safety outcome is claimed.

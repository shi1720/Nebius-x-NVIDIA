# Evaluation evidence

As of September 16, 2026:

- **34 automated unit/provider-contract tests passed.** The graph suite additionally compares results against an independent fixed-point oracle over 150 generated DAGs.
- **27 local API checks passed** against the actual development server, D1 and R2: sign-in boundary, forged-header rejection, ownership lookups, same-origin mutations, persistence, stale revisions, source upload/download, server-derived text, duplicate hashes, unverified PDF decision rejection, missing-key behavior and disposable-record cleanup.
- Exact production reservation SQL passed SQLite regression checks for coupled user/global quotas, concurrent jobs, stale revisions, missing investigations and ownership.
- Desktop and 390px mobile layouts inspected in the real browser. Public sample navigation, source inspection, evidence-based review and WebMCP valid/invalid record calls exercised. A real selectable-text PDF was uploaded through the browser, stored in R2, inspected and explicitly verified; its extracted text and separate hashes persisted.
- TypeScript and production Worker builds completed successfully during development. Final build status is reflected by CI.

These are **engineering checks**, not a benchmark of food recall outcomes or real-world extraction accuracy. Provider contract tests use explicit mocks. No real model latency or quality is claimed until `live-nebius.json` exists from `npm run test:live`.

## Remaining gates

Real NVIDIA/Nebius inference, deployed login with two real accounts, hosted PDF upload → review → extraction, and final recorded demo are required before production or submission-ready claims.

## Reproduce

```bash
npm ci
npm run typecheck
npm test
npm run test:quota
npm run build
npm run db:local
npm run dev
# In a second terminal:
npm run test:api
# With a valid key; incurs real Nebius inference usage:
npm run test:live
```

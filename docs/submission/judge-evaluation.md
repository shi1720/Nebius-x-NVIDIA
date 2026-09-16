# RecallRoom · Independent judging protocol

**Purpose:** An evidence-based rehearsal against the published rubric. This is an internal evaluation, not an official judge score or prediction of winning.

## Final internal rubric review: September 16, 2026, 16:13 UTC

**Review status:** INTERNAL rehearsal, not an official jury score, external audit or prize prediction. A separate LLM agent conducted this bounded review of the release evidence and selected implementation boundaries. This agent also edited submission documents and pitch assets, so this is not independent external validation.

**Revision:** working tree based on `4b0b7788f01215025a6425b3294036e1a11af414`, including the final v1.7 adapter and hosted acceptance report. The eventual submission commit must include these changes. The review inspected the current project story, README, rendered final pitch and brief, desktop/mobile/tablet screenshots, actual provider and cloud reports, draft-approval endpoint and CSV coverage implementation. It relied on recorded browser evidence and did not independently repeat the entire browser workflow or interview customers.

| Criterion | Internal score | Demonstrated evidence and limit |
| --- | ---: | --- |
| Technological implementation | 4 / 5 | The [hosted report](../evaluation/hosted-nebius.json) verifies real NVIDIA Nemotron 3 Super on Nebius Token Factory through Cloud Tasks, six private uploads, reviewed import, persistence and audited exports. All 17 proposed records matched the synthetic answer key. The code enforces ownership, revision and draft checks, PDF text verification, domain validation and supported CSV coverage before import. The recorded 41 unit/provider tests, [60 API checks](../evaluation/firebase-api.json) and [10 operator checks](../evaluation/firebase-operator.json) support the boundaries. One fictional scenario and retained extraction failures limit broader reliability claims. |
| Design | 4 / 5 | The incident summary separates 800 confirmed units from a 240-unit uncertain batch. Source inspection and two evidence-backed decisions provide a coherent path to a response packet. Desktop, 390px mobile and 768px tablet evidence shows readable hierarchy and working navigation. The final pitch and captioned demo explain the same workflow. Browser coverage is recorded manual acceptance, not comprehensive accessibility or cross-browser testing. |
| Potential impact | 3 / 5 | The buyer and trigger are specific: quality managers at small manufacturers reconciling existing records after a supplier alert or during a drill. The $99/site/month hypothesis and consultant channel are credible experiments. There are no customer interviews, paid pilots, measured time savings or evidence of repeat use. A low measured inference cost alone cannot validate willingness to pay or support costs. |
| Quality of the idea | 4 / 5 | The project focuses on an explainable recall boundary. AI proposes cited records, deterministic logic calculates quantities, and reviewers preserve unresolved relationships until evidence supports changes. The cookie example demonstrates this distinction clearly. Existing traceability vendors are acknowledged. Differentiation remains a product hypothesis until users choose this workflow over their alternatives. |

**Internal total: 15 / 20.** Equal weighting is a rehearsal convention because the published rubric does not specify numerical weights. The improvement from the historical 13/20 review reflects verified hosted NVIDIA use and working import/export evidence. It does not predict the judges' decision.

### Material findings

1. **Evidence breadth remains the main limitation.** The successful hosted case and several direct-provider variants share one fictional scenario. Keep this limitation and the failed attempts visible. The current story does so. No additional feature work is required to make that claim honest.
2. **Coverage checks are not semantic proof.** The inspected implementation catches missing supported CSV rows, but it cannot prove that every ambiguous candidate is present or that every inferred relationship is correct. The final testing instructions correctly require reviewing ambiguous inputs against original sources before import. This is a documented operational limit, not a reason to relabel the fixture as production accuracy.
3. **One historical screenshot needs context.** `docs/screenshots/firebase-tablet.png` still displays the pre-activation message that live inference awaits configuration. Label it as historical layout evidence or exclude it from current judging imagery. The [hosted report](../evaluation/hosted-nebius.json), final pitch and video establish the current integration. Do not use the stale screenshot to describe current provider status.

No additional submission-blocking implementation defect was identified in this bounded review. Final publication checks and the Devpost submitted state remain release tasks for the primary operator. This finding is limited to the inspected artifacts and code boundaries.

## Live-provider evidence update: September 16, 2026

After the rehearsal below, a real NVIDIA Nemotron 3 Super request through Nebius Token Factory passed the `sunward-v1` synthetic fixture. The [sanitized trace](../evaluation/live-nebius.json) records 21.929 seconds, 1,332 input and 4,731 output tokens, an estimated $0.00466 inference cost, no validation issues and exact agreement with all five expected scope totals.

The later [UUID/PDF fixture](../evaluation/live-nebius-upload.json) also passed after an [incomplete hosted proposal](../evaluation/hosted-nebius-initial.json) triggered prompt and coverage fixes. The current unit/provider suite has 41 tests. The original scorecard below retains its historical 37-test context.

This resolves the rehearsal's missing real-provider evidence. The later [hosted browser acceptance](../evaluation/hosted-nebius.json) passed actual upload, NVIDIA extraction, reviewed import, reload, two cited decisions and inspected exports. The actual inference took 17.562 seconds at an estimated $0.0045627. The original **13/20** score below remains a historical rehearsal, not a current score. At the time of that evidence update, no new scoring pass had been conducted; the later bounded review appears above. Passing variants of one fictional scenario, with failures during development, do not establish real-world recall accuracy, customer value or typical provider performance.

## Firebase release review: September 16, 2026

**Reviewer:** independent LLM engineering reviewer. Reviewed the Firebase migration working tree based on commit `f12443b`, source code, recorded browser acceptance and the actual cloud test reports. This pass did not open another browser session or conduct customer interviews.

**Product:** [RecallRoom](https://recallroom.web.app), a recall investigation workspace for small food manufacturers. Firebase Hosting serves the React application. Firebase Authentication identifies users; an isolated Cloud Run API verifies their ID tokens, stores investigations in Firestore, preserves private originals in Google Cloud Storage, and queues extraction through Cloud Tasks. The NVIDIA Nemotron adapter targets Nebius Token Factory.

| Published criterion          | Internal score | Evidence and practical limit                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | -------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Technological implementation |          2 / 5 | The actual cloud API passed 60 checks and production Firestore quota functions passed 10 operator checks, including concurrent limits, account isolation, source provenance and expired locks. The central hackathon requirement remains unverified: no usable Nebius key or successful NVIDIA inference trace is available. Infrastructure correctness cannot substitute for that requirement. |
| Design                       |          4 / 5 | The incident graph, cited-source inspection, review decisions, private workspace, responsive layout and preliminary exports form a coherent workflow. Recorded browser acceptance includes Google sign-in and mobile inspection. Actual hosted extraction, review and import still needs to be demonstrated with the required provider.                                                         |
| Potential impact             |          3 / 5 | A specific buyer and recurring recall-drill workflow are defined. Existing receiving, production and shipment files are a plausible starting point. There are no customer interviews, paying users, measured time savings or validated willingness to pay. The $99/site/month proposal is a testable pricing hypothesis.                                                                        |
| Quality of the idea          |          4 / 5 | The useful distinction is the division of responsibility: AI proposes cited relationships; deterministic code calculates scope; people resolve uncertainty. This is more specific than a generic chat assistant. Traceability software already exists, so differentiation must be established through adoption and workflow evidence.                                                           |

**Internal total: 13 / 20.** Equal weighting is only a rehearsal convention. This score does not predict the official outcome, and the outstanding live-provider requirement is a submission gate regardless of the total.

### Concrete review findings and fixes

- New evidence now marks the approved trace as needing review. HTML, CSV and customer drafts retain that warning. Resolving a single relationship does not silently clear source freshness.
- Firebase account changes now remount the private workspace by user ID. This prevents a direct account switch in another tab from leaving the previous account's investigation visible in React state.
- The owned investigation response now exposes its unexpired active job ID. The frontend can rediscover a queued extraction in a fresh tab or after losing the initial queue response. It also tolerates unavailable session storage. The updated API and frontend were deployed, and the expanded 60-check API suite passed, including active-job recovery assertions.
- Expired extraction locks no longer block ordinary changes or deletion. Both direct production-function tests and deployed API tests verified that behavior.
- Deletion and storage limits were checked against the implementation and successful cloud cleanup. Storage deletion after an infrastructure outage still requires operator attention; there is no automatic orphan sweeper. No claim of flawless failure recovery or regulatory certification is warranted.
- The deployment script targets the existing provisioned Firebase and Cloud Run projects and preserves their runtime configuration. It is a repeat-deployment script, not a one-command bootstrap of IAM, billing, queues and provider secrets into an empty account.

### Evidence and remaining gates

- [Hosted API report](../evaluation/firebase-api.json): 60 passing checks in the recorded run; exact test-account GCS prefixes were verified empty after deletion. The final deployment includes two additional active-job recovery assertions, both passing.
- [Operator report](../evaluation/firebase-operator.json): 10 passing checks against the production Firestore functions. Only disposable cases were used; test reservations and account counters were cleaned up. No inference tasks were enqueued.
- The 37 unit/provider-contract tests, typecheck and lint pass after the final code fixes. Mocked model responses do not prove live model quality.
- **Original highest priority, now partly resolved:** the credential and real synthetic evaluation are complete. Demonstrate hosted upload, NVIDIA extraction, reviewed import, lot selection and export, recording provider metadata and reviewer corrections.
- **Commercial next step:** test the workflow with a consenting quality manager using a small approved dataset. Measure baseline investigation time, time with RecallRoom, missing relationships and review effort. Do not invent those results for the pitch.
- **Submission next step:** verify the public video and every Devpost link. Keep narration explicit about any provider verification still pending. A polished video cannot turn an unavailable integration into a completed requirement.

## Give the reviewer

Provide the current demo URL, exact repository revision, README, synthetic source packet, answer key, test output, sanitized live-provider trace, and draft video. Ask the reviewer to inspect the running product rather than relying on marketing copy. Record review date and whether the reviewer used an LLM, a human, or both.

## Suggested scoring

Use four equally weighted dimensions only as an internal convention; the published rubric does not supply numeric weights.

| Dimension                    | 1: weak                                 | 3: credible MVP                                                    | 5: strong submission                                                                                                                 |
| ---------------------------- | --------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Technological implementation | Scripted screens or unverifiable AI use | Real end-to-end workflow and verified NVIDIA/Nebius inference      | Robust ingestion, deterministic scope, provenance, fault handling, meaningful evaluations, and measurable live execution             |
| Design                       | Confusing workflow or dead controls     | Clear case flow with useful source inspection                      | Coherent responsive experience, understandable uncertainty, accessible controls, useful exports, and polished empty/error states     |
| Potential impact             | Broad claims without a buyer            | Specific quality-team workflow and plausible commercial hypothesis | User-tested workflow, grounded baseline comparison, credible pricing experiment, and evidence of repeated use                        |
| Quality of idea              | Generic assistant or claims of novelty  | Focused recall workflow with clear differentiation                 | Compelling evidence-first interaction, informed competitive position, and an effective explanation of why AI belongs in the pipeline |

Do not award points for unimplemented features, fabricated customer feedback, or an unverified production claim. Record “not evaluated” when evidence is missing.

## Critical correctness checks

- Source lot PB-0901-A reaches exactly 480 oat bars and 320 energy bites in the supplied confirmed lineage.
- Confirmed shipped count is 600 to three customers, with 200 confirmed units remaining on site.
- The 240-cookie ambiguity, including 120 shipped units, remains separately visible until evidence supports a reviewed decision.
- Lot PB-0901-B's 360 oat bars are not silently merged into lot A.
- Missing records do not become evidence of absence. Duplicate imports do not duplicate quantity counts.
- Unit counts and source-material kilograms are not combined into unsupported mass-balance claims.
- Every displayed evidence link resolves to the relevant source, not merely a document with similar terminology.
- Provider timeout, malformed model output, and missing credential produce honest recoverable states.
- Upload and export boundaries enforce tenant isolation and do not expose credentials or other users' records.
- Notification generation creates reviewable drafts and does not silently send messages.

## Evaluation measurements

Measure affected-shipment recall and precision against a reviewer-authored answer key, provenance correctness, ambiguous-case detection, duplicate handling, time to a reviewed packet, input/output tokens, estimated inference cost, and request latency. Report sample size and whether records were synthetic. A perfect synthetic result does not establish production accuracy.

## Reviewer prompt

> You are an independent hackathon reviewer. Evaluate the supplied RecallRoom revision against Technological Implementation, Design, Potential Impact, and Quality of the Idea. Inspect the running app and evidence. For every score, cite a concrete observed behavior or artifact. Separate verified facts, reasonable inferences, and unsupported claims. Attempt the listed correctness cases. Identify the three changes most likely to improve the submission, ranked by user impact and judging impact. Do not inflate a score because the project description is persuasive. If live NVIDIA/Nebius use cannot be verified, state that explicitly. Produce a concise scorecard, blocking issues, and actionable improvements; do not claim to predict the actual judges.

## Iteration rule

Fix correctness and evidence-integrity failures first, then complete broken user journeys, then improve the most confusing visual or narrative moment. Rerun affected checks after changes. Preserve the original scorecard and revision so improvement is auditable. Never write a retrospective “judge score” without conducting the review.

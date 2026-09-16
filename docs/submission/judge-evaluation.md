# RecallRoom · Independent judging protocol

**Purpose:** An evidence-based rehearsal against the published rubric. This is an internal evaluation, not an official judge score or prediction of winning.

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

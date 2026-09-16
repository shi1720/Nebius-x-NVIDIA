# RecallRoom · Final independent rubric review

**Review date:** September 16, 2026  
**Project owner:** Shivam Gupta  
**Recommended track:** Best Apps and Agents  
**Review type:** Independent AI-assisted internal review. Scores are non-binding estimates, not official judging, a predicted result, or evidence of customer validation.

## Assessment

**Estimated product score: 15.5/20, improved from 14/20.** RecallRoom now presents a coherent, testable investigation workflow with unusually explicit treatment of uncertain evidence. The earlier engineering and documentation findings have been addressed. It remains an evaluated MVP with an outstanding hackathon eligibility gate: a real NVIDIA model run on Nebius has not yet been verified.

The point total must not obscure that gate. A polished fixture-backed demonstration and passing mocked-provider tests do not satisfy a requirement for a working project using the required infrastructure. Final eligibility and scoring belong to the organizers.

| Published criterion | Previous estimate | Current estimate | Evidence and remaining limit |
|---|---:|---:|---|
| Technological Implementation | 3/5 | **4/5** | Deterministic propagation, net quantity ranges, ingredient balances, structured review decisions, source provenance, strict proposal validation, ownership and revision controls, bounded inference requests, and a successful verification workflow. Actual Nemotron extraction quality, live latency, and hosted acceptance still await a credential. |
| Design | 4/5 | **4/5** | A consistent incident/evidence/review/export flow, clear affected-versus-held distinctions, inspectable source records, and usable output formats. The saved screenshot supports visual coherence, but its capture has a framing/stitching defect. This pass did not interact with the deployed browser or independently verify accessibility. |
| Potential Impact | 3/5 | **3.5/5** | The buyer, existing-records workflow, recurring-drill use case, competitive position, pricing assumptions, and support-sensitive unit economics are now documented. The separate recalled-ingredient stock view improves operational usefulness. No customer interviews, paid pilots, measured savings, or repeated usage are established. |
| Quality of the Idea | 4/5 | **4/5** | The strongest differentiator remains evidence-backed resolution of ambiguous lot identities, with the decision preserved after scope changes. Traceability competitors already exist, so the focused adoption model and trust boundary are credible; first/only claims would not be. |
| **Total** | **14/20** | **15.5/20** | Equal weighting is this review's convention; the published rubric does not specify numeric weights. |

## What improved since the original review

1. **Ingredient stock is now part of the response.** The UI and export show received, confirmed-use, possible-use, and remaining quantities separately from finished units. For the sample, unresolved use produces a 40–50 kg range for lot A; the reviewed clarification supports 50 kg remaining. This is a transaction-derived balance, not an independent physical inventory verification.
2. **Exclusion no longer erases its rationale.** A structured decision stores the original relationship, exact quote, document reference, reviewer, reason, timestamp, and revision. The packet includes those decisions, including excluded links.
3. **Draft cards and import share the editable proposal.** The cited-record view reads the parsed draft rather than a stale original model response, removing the earlier mismatch between the facts displayed and those approved.
4. **Completion requires all recorded relationships to be reviewed.** A possible alternative-lot link can no longer coexist with a blanket completed state simply because it lies outside the selected recall path.
5. **The repository is now judge-readable.** A project-specific README, license, setup guide, architecture, operating limits, example packet, research, commercial thesis, submission copy, narration, product brief, and pitch deck replace the starter-only presentation.

## Evidence inspected

- Current source: `lib/domain.ts`, `lib/export.ts`, and the draft, balance, and completion paths in `components/recall-room.tsx`.
- Project-specific README, `docs/STATUS.md`, `docs/evaluation/README.md`, and `.github/workflows/ci.yml`.
- Visual inspection of `docs/screenshots/incident-room.png`.
- Presence of the product brief PDF, pitch PDF, editable PPTX, submission documents, example investigation, CSV, and HTML packet. The deck and PDFs were not independently rendered in this pass; their existence is not a fresh visual-QA assertion.
- The public [GitHub verification run](https://github.com/shi1720/Nebius-x-NVIDIA/actions/runs/35097118912) independently displayed **Success** for commit `3a4b893`. Its workflow includes type checking, unit tests, quota checks, build, database setup, and local API integration. Individual run logs were not independently read in this review.
- The evaluation record reports **34 unit/provider-contract tests**, **27 local API checks**, quota SQL regression tests, and comparison with an independent reachability oracle over **150 generated graphs**. These counts were inspected in project documentation and supplied by the implementation lead; this reviewer did not rerun them. They are engineering evidence, not real-world food-safety or extraction benchmarks.
- The [public demo URL](https://recallroom.sg127977958.chatgpt.site) was supplied as deployed. The research-browser tool could not open it, so this pass does not independently certify its present reachability or hosted behavior. The implementation lead's separate browser evidence should accompany the release record.

## Remaining gates

### Required to substantiate the hackathon submission

1. **Live NVIDIA/Nebius acceptance:** configure the credential securely, run the real-provider acceptance check, inspect the proposed records against the source packet, and retain the sanitized result with the exact model ID, request metadata, usage, and observed outcome. A failing or incomplete extraction must remain visible.
2. **Hosted acceptance:** use real signed-in accounts to verify ownership isolation and the deployed upload → PDF-text verification → extraction → review → export journey. Local success does not establish hosted authentication behavior.
3. **Public video:** record actual app footage and Shivam's narration, identify Nebius Token Factory and NVIDIA Nemotron audibly, and publish a public video no longer than three minutes. Do not narrate a live-provider claim over fixture-only footage.
4. **Final entry:** confirm eligibility and current official requirements, publish the final Devpost submission with the correct public links and firsthand platform feedback, and keep the demonstration available through the stated judging period.

### Small presentation correction

The saved incident-room PNG includes substantial empty canvas and a repeated lower section, consistent with a capture or stitching artifact. Replace it with one clean, legible viewport capture for the README and pitch materials. This is an artifact-quality finding, not proof that the application layout itself is broken.

### Commercial validation after the engineering gates

The next meaningful impact evidence is a quality professional completing a drill, checking every relevant inclusion and exclusion, and identifying whether the packet fits their real workflow. Record the result and the sample size. A paid pilot or repeated drill would strengthen the commercial case; desk research and proposed prices do not demonstrate willingness to pay.

## Recommended final demonstration emphasis

Keep the story centered on one ambiguous batch. Show the confirmed 800 finished units, 600 shipped units, three affected destinations, and separate 240-unit hold. Open the source. Review the signed clarification. Show the changed scope alongside the preserved decision, then export the packet. Briefly show the recalled ingredient balance in kilograms and the actual provider trace. This communicates both practical value and the architecture more effectively than a tour of every feature.

No new product features are recommended before closing the remaining acceptance and submission gates. The improvement from the original review is supported by observable changes; it is not a guarantee of a prize or a production-readiness certification.

## Release-owner follow-up

The screenshot finding was resolved after this review by replacing the stitched capture with a visually verified 1280 × 720 browser viewport from the public deployment. The original review and score above are preserved. Hosted smoke evidence is available in `production-smoke.json`; live inference and real hosted account acceptance remain open.

# Platform feedback

## Documentation and implementation observations

Nebius Token Factory's OpenAI-compatible interface made it practical to isolate the NVIDIA adapter behind a typed request and response boundary. RecallRoom requests evidence-linked structured output, validates it independently and keeps provider failures separate from approved investigation records.

Useful documentation details for this workflow include an exact current model identifier, a canonical endpoint, supported structured-output schema shapes, usage accounting and request identifiers. Our adapter records provider metadata when it is returned and rejects malformed output rather than inventing a successful result.

## Observed NVIDIA execution

On September 16, 2026, RecallRoom called `nvidia/nemotron-3-super-120b-a12b` through `https://api.tokenfactory.nebius.com/v1/` against the synthetic `sunward-v1` source fixture. The real response passed application validation and matched all five scope totals in the supplied answer key: 800 confirmed units, 240 held units, 600 confirmed shipped units, 120 held shipped units and 360 units outside the recorded path.

The recorded request took **21.929 seconds**, with **1,332 input tokens and 4,731 output tokens**. Estimated inference cost was **$0.00466**, based on configured token prices, not a reconciled invoice. The [sanitized trace](../evaluation/live-nebius.json) includes the provider request ID, model, prompt version and exact comparison. This is one synthetic fixture, not evidence of typical latency, general accuracy or production reliability.

A second [direct-provider evaluation](../evaluation/live-nebius-upload.json) used the actual sample files, random document IDs and browser-equivalent PDF text. After prompt and validation changes, it returned six lots, five relationships and six shipments with all expected scope totals: **42.923 seconds**, **1,611 input tokens**, **4,641 output tokens**, and **$0.0046602 estimated inference cost**. These are two passing variants of the same fictional scenario, with failed development attempts. They are not an accuracy benchmark or a success-rate estimate.

## Incomplete extraction and the resulting changes

The [first hosted proposal](../evaluation/hosted-nebius-initial.json) was structurally valid but contained only one lot and no relationships or shipments. We inspected it and did not import it. A subsequent [UUID/PDF trial](../evaluation/live-nebius-upload-incomplete.json) returned two lots with no relationships or shipments. Our new coverage checks flagged ten issues in that incomplete result.

We added deterministic row-coverage checks for supported CSV inputs and blocked import of incomplete proposals. We also clarified how to handle absent optional supplier context and relationship notes, and strengthened the prompt's completeness requirements. A later UUID/PDF evaluation passed. The sequence suggests prompt ambiguity contributed, but one repeat does not prove the cause or eliminate model variability. Further hosted testing still returned empty arrays, which coverage checks blocked. That showed the first successful repeat had not resolved reliability across the workflow.

The main lesson is that valid JSON and correct citations on the records returned do not guarantee that all source records were extracted. A platform cookbook combining structured output with completeness checks, explicit optional-field behavior and evaluation examples would help builders of evidence-sensitive workflows. Human review remains mandatory in RecallRoom.

## Prompt and decoder alignment

Further diagnostics exposed a mismatch between the instructions visible to the model and the decoder schema. During development, we added the full schema to the prompt as well as `response_format`, following [Nebius structured-output guidance](https://docs.tokenfactory.nebius.com/ai-models-inference/json). We also aligned decoder constraints with application validation. These were integration changes in our adapter, not evidence of a general provider outage.

One [schema-error trial](../evaluation/live-nebius-hosted-schema-error.json) lacks the original provider body and exact failing field. We retained that diagnostic gap instead of inventing its cause. A [later decoder trial](../evaluation/live-nebius-hosted-decoder-error.json) produced malformed record labels and omitted relationships. We removed an unsuitable label regex and continued testing. Subsequent trials recorded duplicate records and truncated output. The final v1.7 adapter sends an ordinary chat request with the exact schema in the prompt and intentionally omits provider `response_format` constraints. Strict server JSON parsing, Zod validation, evidence checks and supported CSV coverage remain mandatory.

The [final direct-provider trial](../evaluation/live-nebius-hosted-packet.json) using exact text saved from the hosted app passed: six lots, five relationships, six shipments, exact scope totals and no validation issues. It took 44.350 seconds, used 2,600 input and 5,514 output tokens, and had an estimated $0.0057426 inference cost. This is a third passing variant of the same fictional scenario. Earlier successes and later failures remain in the record; no typical latency or reliability claim follows from these development trials.

## Final hosted result

The [actual hosted workflow](../evaluation/hosted-nebius.json) subsequently passed end to end: six private source uploads, reviewed PDF text, real NVIDIA extraction through Cloud Tasks, inspection of all 17 proposed records, reviewed import, reload, two evidence-backed decisions and verified JSON/HTML export. Inference took **17.562 seconds**, with **2,600 input and 4,203 output tokens**, at **$0.0045627 estimated cost**. The initial scope matched the fictional answer key. The reviewed cookie correction removed the hold while preserving the 800 confirmed-unit scope.

This verifies the integration on the tested case. The earlier omissions, schema errors, duplicate and truncated outputs remain part of the development evidence. It does not establish general accuracy, typical latency or a comparative benchmark.

## Onboarding feedback and suggested improvements

Account creation, user-confirmed terms acceptance, active billing and the official $25 hackathon credit redemption are complete. Zero data retention is enabled. A clearer credit-activation checklist before sign-up would help participants prepare for the billing verification step. This is an observed onboarding issue.

For this use case, a documented recipe combining structured output, request IDs and per-request usage would shorten the path from an initial call to an auditable application. Schema examples that show exact source citations and ambiguous identifiers would be particularly useful. These are requests based on our implementation experience, not claims that the platform lacks every equivalent feature.

## Other services used

The active frontend is hosted at [recallroom.web.app](https://recallroom.web.app) on Firebase Hosting. Firebase Authentication, Firestore, private Google Cloud Storage, an isolated Cloud Run API and Cloud Tasks support the application. Those services host the app; they do not replace the NVIDIA model on Nebius requirement.

OpenAI TTS generated the disclosed neutral synthetic narration for the demo. It does not imitate Shivam's voice and is not part of the recall-extraction pipeline.

We have not used Nebius AI Cloud, Nebius Serverless Jobs, Nebius Serverless Endpoints, NVIDIA physical hardware or Tavily in this implementation and claim none of those integrations.

## Devpost field-ready feedback

These ratings are subjective impressions from early development. They are not benchmark results or comparisons with a matched alternative-provider test.

1. **Nemotron output quality: 6/10.** The final hosted workflow and three direct-provider variants of our fictional recall fixture passed with exact scope totals after prompt and validation work. Other calls omitted most records despite returning structured JSON, and other integration trials failed. We added CSV row-coverage checks and require human approval before import. The successful results were useful, but completeness and schema integration required substantial independent checks.

2. **Likelihood of recommending Nemotron on Nebius: 7/10.** The compatible API, returned usage and request IDs made the integration practical to inspect. I would recommend evaluating it for structured extraction with representative data, validation and human review. Our small synthetic evaluation does not establish reliability across customer records.

3. **Experience running inference on Nebius: 7/10.** This rates our experience getting the integration running and inspecting real requests. We did not run a matched cloud or local comparison, so it should not be read as evidence that Nebius outperforms another environment. Billing verification added an onboarding step before we could use the hackathon credit.

4. **Why we chose the model.** We chose NVIDIA Nemotron 3 Super, `nvidia/nemotron-3-super-120b-a12b`, for evidence-linked structured extraction through Nebius Token Factory. The task needs relationships and exact source quotations from receiving, production and shipment records. The model proposes records, while application code calculates scope and reviewers approve changes. We did not claim this model was best based on a comparative benchmark.

5. **Prompting approach.** We ask for a complete structured proposal, exact source quotations and explicit preservation of ambiguous historical relationships. The final adapter supplies the exact schema in an ordinary chat prompt and validates JSON and domain constraints on the server. Provider response-format constraints are intentionally disabled after our integration trials produced incomplete arrays, duplicates or truncation. We use short document aliases during extraction and map them back to private source IDs. We clarified that missing optional fields should not cause otherwise supported records to disappear. Schema, citation and CSV row-coverage checks run outside the model. Missing mandatory facts block import until the source is corrected. Shipment dates remain required; lots and relationships do not require dates. Coverage detects missing supported CSV rows, but does not prove candidate completeness or semantic correctness. Review every ambiguous input against original sources before import.

6. **Comparison with other models.** We have not conducted a controlled comparison with other extraction models. OpenAI was used for supporting demo narration, not as a substitute for NVIDIA recall extraction. Our evidence consists of actual Nemotron calls, recorded failures, passing synthetic variants and application regression tests.

7. **Most valuable Nebius capabilities.** Token Factory's compatible inference API let us keep the adapter small and typed. The response metadata made request usage, latency and provider identity visible in the investigation trace. Hackathon credit allowed real integration testing. Firebase and Google Cloud host the application; all recall model extraction uses NVIDIA Nemotron through Nebius Token Factory.

8. **Features and improvements.** A clearer billing and credit-activation checklist would improve onboarding. For structured extraction, a cookbook covering absent optional fields, exact source citations and completeness evaluation would be useful. Our key failure was valid JSON that omitted source records. Schema conformance alone did not catch that, so we added application-level coverage checks.

9. **What we would build next with Nemotron.** We would like stronger completeness evaluation for document extraction, examples that preserve conflicting evidence, and clearer guidance on schema constraints across serving modes. A benchmark that measures omitted records and unsupported relationships, alongside valid JSON, would help teams assess whether a proposal is ready for human review.

# Devpost fields and judge testing instructions

## Project name

RecallRoom

## Elevator pitch

A recall starts with one lot. Know where it ends. RecallRoom connects food-production records to affected products and customers, with source evidence and human review behind every decision.

## Links and category

- Working application: https://recallroom.web.app
- Public repository: https://github.com/shi1720/Nebius-x-NVIDIA
- Public video: https://www.youtube.com/watch?v=J0Gy2FWsm-M
- Track: Best Apps and Agents
- Creator: Shivam Gupta
- License: MIT
- Project story: `submission.md`
- YouTube title and description: `youtube.md`
- Provider feedback: `platform-feedback.md`

Use RecallRoom throughout. “Granted” is an existing infrastructure project name and is not the product's name.

## Testing instructions: public drill

1. Open https://recallroom.web.app. The landing investigation is a fictional sample. Changes in this public drill last for the current visit.
2. In the incident room, confirm 800 affected finished units, 600 shipped units, three customers, and a separate 240-cookie precautionary hold. The 120 shipped cookies are not included in the confirmed 600 shipped units.
3. Select a batch or shipment in the graph. Open its source record and inspect the quoted evidence.
4. Choose **Review the source record** for the ambiguous cookie batch. Select the supplied supporting clarification, which states: `10 kg of PB-0901-B was consumed in COO-0904. No PB-0901-A was used in this batch.`
5. Exclude the relationship from `PB-0901-A` to `COO-0904`. Use the exact quote above and the reason: `The supplied batch clarification identifies PB-0901-B and explicitly rules out PB-0901-A.`
6. In **Review & export**, confirm the alternative relationship from `PB-0901-B` to `COO-0904` using that supporting record and the same exact quote. The confirmed affected count stays 800. The cookie hold is removed from this recall path. The recorded recalled-ingredient balance is 50 kg remaining.
7. Inspect the activity history. Both review decisions and their evidence should be present.
8. Acknowledge the packet scope and download the HTML packet, shipment CSV, or JSON snapshot. Open the HTML file and use its print control to save a PDF. Customer messages are drafts and are not sent.
9. Reset the synthetic drill to repeat. On mobile, use the navigation control and scroll the graph horizontally to inspect the full chain.


## Testing instructions: private records and model extraction

Private storage and authentication use Firebase. The real NVIDIA Nemotron 3 Super workflow through Nebius Token Factory passed hosted upload, reviewed import, reload, two quoted review decisions and export. The instructions below reproduce that private workflow. Use only fictional or authorized records.

1. Use Google sign-in or create an email/password account with the authentication form. Create a private investigation. No shared judge password is required if the deployed sign-in flow permits new accounts.
2. Start from an empty investigation. Download and unzip the synthetic source pack. Upload files 01 through 05 and one copy of file 06, either the selectable-text PDF or the TXT clarification. Do not upload both versions of the same clarification. Use fictional or authorized test data only.
3. If testing the selectable-text PDF, inspect its original and explicitly verify the extracted text before using it as evidence. Scanned-image OCR is not supported.
4. Choose **Extract with Nemotron**. Wait for the request to finish. Inspect the actual model identifier, provider trace, source citations, and proposal. A request or validation failure should display an error without replacing approved records.
5. Review the proposal and choose **Import reviewed records** only after checking the evidence. Set `PB-0901-A` as the recalled lot and inspect the resulting scope.
6. Reload the page and reopen the investigation to verify persistence. Download an original source file and an export packet.
7. Sign out. Private investigations and source files must require authentication. A different signed-in account must not be able to read the first account's investigation.
8. Delete the disposable investigation when finished.

The initial fixture has ambiguity by design. The clarification supports a later review decision; it does not authorize the model to silently rewrite the historical ambiguous record. A live proposal may need correction against the source records before it matches the answer key. Keep unsupported or incomplete proposals out of the investigation. Never substitute a fixture for a failed model request.


## Recorded real NVIDIA evaluation

The [sanitized provider trace](../evaluation/live-nebius.json) records `nvidia/nemotron-3-super-120b-a12b` on Nebius Token Factory against `sunward-v1`. All five expected scope totals matched: 800 confirmed units, 240 held units, 600 confirmed shipped units, 120 held shipped units and 360 units outside the recorded path. The response passed validation.

The run took 21.929 seconds and used 1,332 input plus 4,731 output tokens. Estimated inference cost was $0.00466, excluding app infrastructure and human review. One synthetic fixture establishes a working integration, not real-world extraction accuracy or typical latency. Model output requires human approval before import. OpenAI supplied supporting demo narration, not recall extraction.

The [UUID/PDF evaluation](../evaluation/live-nebius-upload.json) additionally used actual sample files with random document identifiers and browser-equivalent PDF text. It returned six lots, five relationships and six shipments with the same expected totals in 42.923 seconds, using 1,611 input and 4,641 output tokens at an estimated $0.0046602. An earlier hosted proposal omitted most records and was not imported. Subsequent source-row coverage checks block such incomplete proposals. These are two passing variants of one fictional scenario, with failures during development; they are not an accuracy benchmark.

Coverage detects missing supported CSV rows, but does not prove candidate completeness or semantic correctness. Review every ambiguous input against original sources before import. Missing mandatory facts block import until source correction; shipment dates remain required.

The final adapter uses a schema-guided prompt and strict server validation. It sends ordinary chat requests without provider `response_format` constraints, then requires valid JSON, domain schema, evidence and source coverage before import. A [direct-provider check using exact hosted text](../evaluation/live-nebius-hosted-packet.json) passed with six lots, five links and six shipments in 44.350 seconds, at an estimated $0.0057426. This third direct-provider variant preceded the actual hosted acceptance below. All development failures remain recorded.

## Verified hosted acceptance

The [actual hosted browser report](../evaluation/hosted-nebius.json) passed the six-file workflow. Nemotron returned six lots, five links and six shipments with all five expected initial scope totals. The run took 17.562 seconds, used 2,600 input plus 4,203 output tokens and had an estimated $0.0045627 inference cost. Reviewed import and recalled-lot selection persisted after reload. Two evidence-backed decisions removed the cookie hold from this recall path. JSON and HTML exports included the provider, source hash and decision history. This is one fictional scenario, not an accuracy or production-reliability benchmark.

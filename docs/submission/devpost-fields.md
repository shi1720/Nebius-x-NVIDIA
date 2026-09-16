# Devpost fields and judge testing instructions

## Project name

RecallRoom

## Elevator pitch

A recall starts with one lot. Know where it ends. RecallRoom connects food-production records to affected products and customers, with source evidence and human review behind every decision.

## Links and category

- Working application: https://recallroom.web.app
- Public repository: https://github.com/shi1720/Nebius-x-NVIDIA
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

**Current limit:** Private storage and authentication are implemented on Firebase. The full hosted model workflow cannot pass until a usable Nebius key is configured. Steps that need live extraction are acceptance instructions, not a claim that they have already passed.

1. Use Google sign-in or create an email/password account with the authentication form. Create a private investigation. No shared judge password is required if the deployed sign-in flow permits new accounts.
2. Start from an empty investigation. Download and unzip the synthetic source pack, then upload its receiving, production, and shipment records. Use fictional or authorized test data only.
3. If testing the selectable-text PDF, inspect its original and explicitly verify the extracted text before using it as evidence. Scanned-image OCR is not supported.
4. Choose **Extract with Nemotron**. Wait for the request to finish. Inspect the actual model identifier, provider trace, source citations, and proposal. A request or validation failure should display an error without replacing approved records.
5. Review the proposal and choose **Import reviewed records** only after checking the evidence. Set `PB-0901-A` as the recalled lot and inspect the resulting scope.
6. Reload the page and reopen the investigation to verify persistence. Download an original source file and an export packet.
7. Sign out. Private investigations and source files must require authentication. A different signed-in account must not be able to read the first account's investigation.
8. Delete the disposable investigation when finished.

The initial fixture has ambiguity by design. A live proposal may need correction against the provided source records before it matches the sample answer key. Do not silently substitute a fixture for a failed model request.


## Implementation claims after verified inference

Only after recording a successful real NVIDIA run on Nebius, replace the pending model paragraph in the story with:

> NVIDIA Nemotron, served through Nebius Token Factory, turns uploaded records into a structured proposal with source quotations. We validated the integration against the supplied synthetic records and recorded the actual model identifier, provider, usage, and latency. The model output enters a review queue, and a person must approve it before it becomes part of the investigation. This fixture test establishes that the integration works; it does not establish real-world extraction accuracy.

The Firebase application is publicly deployed. That fact does not by itself satisfy the requirement for NVIDIA inference on Nebius. An OpenAI test or narration-generation call is not evidence of that integration.

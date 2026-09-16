# RecallRoom · Three-minute demo

**Presenter:** Shivam Gupta  
**Target runtime:** 2:50–2:58, including transitions  
**Narration:** Approximately 350 words; read at a calm 125–130 words per minute.  
**Status:** Capture plan, not a record of completed functionality. Rehearse against the final app. The live-provider sentence below is only for a verified Nebius run.

## Verbatim narration and capture sequence

| Time      | Capture                                                                                         | Say verbatim                                                                                                                                                                                                                                                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:22 | Open the incident workspace on a supplier alert. Keep “Synthetic demonstration” visible.        | “A supplier has recalled one lot of peanut butter. You run a small food business. Your receiving records, production sheets, and shipping exports all tell part of the story. Which products did it reach? Who received them? And what are you still missing?”                                                                               |
| 0:22–0:43 | Show project name, then the source-document list. Open one record briefly.                      | “I'm Shivam Gupta, and this is RecallRoom: an evidence-backed workspace for that moment. This is a fictional drill. I start with supplier lot PB-0901-A and one hundred kilograms of received material, then bring the relevant records into the same case.”                                                                                 |
| 0:43–1:07 | Run the analysis. Show completed provider trace, then lot graph.                                | “NVIDIA Nemotron, served through Nebius Token Factory, interprets the records and proposes structured relationships. Application checks validate those relationships and calculate the scope. The model helps make messy evidence usable; it doesn't decide that food is safe. Here, the confirmed path reaches two production batches.”     |
| 1:07–1:30 | Select oat bars, then energy bites. Show shipments and inventory counts.                        | “That's four hundred eighty oat bars and three hundred twenty energy bites: eight hundred finished units. Six hundred have shipped to three customers. Two hundred remain on site. I can open a shipment and inspect the source record supporting its connection to the recalled lot.”                                                       |
| 1:30–1:57 | Open the ambiguity panel and underlying cookie record. Keep ambiguous counts visually separate. | “But this cookie record has an ambiguous lot reference. Two hundred forty cookies, including one hundred twenty shipped units, remain a separate unresolved exposure. RecallRoom keeps that uncertainty visible. It asks for supporting evidence, and a reviewer must resolve the relationship before the scope can be treated as complete.” |
| 1:57–2:15 | Open the supplied signed clarification. Exclude A → cookies, then confirm B → cookies with the cited evidence.                          | “The signed clarification identifies lot B. I exclude the lot A connection, then confirm lot B using that evidence. The cookie hold leaves this recall path. The original relationship, exact quote, and reviewer decision remain in the packet. This is traceability, not a safety clearance.”                                                   |
| 2:15–2:38 | Preview exported packet: shipment register, evidence, unresolved items, draft communication.    | “The response packet brings affected shipments, source evidence, open issues, and customer-specific drafts together. A quality manager reviews the result and controls the action. Recurring drills make this useful before an emergency, too: they reveal where the next missing lot reference could slow a response.”                      |
| 2:38–2:55 | Return to the reviewed workspace with counts and graph. End on title.       | “RecallRoom is for smaller teams working with the records they already have. Our next step is to validate real drill workflows with quality professionals. The goal is simple: a recall response that people can inspect, explain, and act on.”                                                                                              |

## Capture requirements

1. Record at 1920 × 1080 or higher. Use one consistent browser zoom and hide private tabs, bookmarks, credentials, and notifications.
2. Begin with the loaded app. Keep the demo-data label visible; do not imply a real customer emergency.
3. Use a successful live Nebius run for the provider shot. Show the exact model ID and provider in an inspectable trace. Never fabricate a latency, token count, or completed status.
4. Keep the confirmed 800 units and ambiguous 240 cookies separate in the visual hierarchy. The 120 ambiguous shipped cookies are not included in the confirmed 600 shipped units.
5. If a live inference exceeds the available shot time, record it completely and use a plainly labeled time cut. Do not edit a failed request into apparent success.
6. Record the export actually opening. Keep notification drafts visibly labeled as drafts; do not send them to real recipients for the demo.
7. Use a quiet microphone take. Avoid background music under the detailed explanation. Add captions and leave two seconds on the final frame.
8. Upload a public, accessible YouTube video only after confirming it is under three minutes and the audio names both Nebius Token Factory and NVIDIA Nemotron.

## Pre-credential review version

For an internal review before the live integration is verified, replace the 0:43 narration with:

> “This review uses synthetic fixtures. The integration is designed for NVIDIA Nemotron on Nebius Token Factory, with live execution still awaiting a credential. Application checks validate relationships and calculate scope. Here, the confirmed path reaches two production batches.”

That internal review is **not** a substitute for the hackathon's required working system on Nebius infrastructure. Do not publish it as proof of live execution.

## Ambiguity shot rehearsal

Use the included fictional signed clarification, not an invented reviewer assertion. In the initial sample, exclude `PB-0901-A → COO-0904` with its exact supporting quote and a specific reason; then confirm `PB-0901-B → COO-0904` from the same clarification. Rehearse both actions before recording. Expected result: 800 confirmed finished units, 600 shipped units, zero cookies on this recall path, and 50 kg of recalled ingredient remaining by the recorded balance. The excluded relationship and rationale must still appear in the exported packet. If a real model proposal differs, review and correct it against the supplied evidence before recording these expected totals.

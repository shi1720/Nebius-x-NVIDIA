# RecallRoom demo narration and capture plan

**Creator:** Shivam Gupta  
**Narration:** Neutral synthetic voice generated with OpenAI TTS, disclosed in the video description. It does not imitate Shivam.  
**Source of truth:** `docs/video/narration-segments.json`  
**Length:** 338 words; rendered duration is 150.25 seconds, below the three-minute submission limit.  
**Video URL:** See `docs/submission/youtube.md` for the current public upload.

The narration below matches the generated segments verbatim. It includes actual NVIDIA Nemotron inference on Nebius Token Factory using fictional records. This is a captured product walkthrough, not a claim of measured accuracy on real recalls.

## Verbatim narration

### 1. Supplier alert

A supplier recalls one lot of peanut butter. You run a small food business. Your receiving spreadsheet, batch sheets, and shipment export each hold part of the answer. Which products did it reach? Who received them? And what are you still missing?

### 2. RecallRoom introduction

This is RecallRoom, created by Shivam Gupta. It brings the evidence into one investigation. Every record in this demonstration is fictional.

### 3. Confirmed scope

Start with the recalled ingredient. Follow its path through production to customers. Four hundred eighty oat bars and three hundred twenty energy bites: eight hundred affected finished units. Six hundred have shipped to three customers. Two hundred remain on site.

### 4. Source inspection

Click a shipment, and you can inspect the source behind it.

### 5. Ambiguous cookie batch

But this cookie batch only says P B September. That could refer to a different ingredient lot. RecallRoom keeps two hundred forty cookies on a separate precautionary hold, including one hundred twenty that have shipped. The uncertainty stays visible.

### 6. Supporting clarification

Now open the supporting clarification. It identifies lot B and explicitly says no lot A was used. A reviewer excludes the lot A relationship, then confirms lot B using that evidence.

### 7. Decision history and ingredient balance

The cookie hold leaves this recall path. The original relationship, exact quote, and review decision remain in the history. The recorded balance now shows fifty kilograms of the recalled ingredient remaining.

### 8. NVIDIA extraction and review

Here is a real extraction with NVIDIA Nemotron on Nebius Token Factory. The model proposes records and exact source quotes. Application code validates the evidence and calculates the scope. A person reviews the proposal before import. The run history shows the actual provider, model, token usage, and latency.

### 9. Export packet

Finally, export the investigation packet. It includes the shipment register, evidence, review decisions, and customer-specific message drafts. A quality manager controls what happens next.

### 10. Commercial direction

RecallRoom is designed for smaller teams using the records they already have. Recurring drills can expose missing evidence before an emergency. Our next step is to validate that workflow with quality professionals.

### 11. Closing

A recall starts with one lot. RecallRoom helps you see where it ends, and what still needs an answer.

## Capture and caption checks

1. Capture actual behavior from [recallroom.web.app](https://recallroom.web.app). Keep fictional-data labels visible and private credentials out of the recording.
2. Keep 800 confirmed affected units and 240 held cookies visually separate. The 120 shipped cookies are not part of the confirmed 600 shipped units.
3. Show the supplied clarification and both evidence-backed actions: exclude `PB-0901-A → COO-0904`, then confirm `PB-0901-B → COO-0904`. The final recalled-ingredient balance is 50 kg.
4. Show the retained original relationship, quotation and decision history. Do not imply that leaving the recorded path is a safety clearance.
5. Open the actual exported packet. Keep customer messages visibly described as drafts.
6. Use captions that match the segment text. Inspect readability, timing and the full uploaded audio. No unlicensed music or impersonated voice is needed.
7. Keep the complete public video no longer than three minutes. Inspect the YouTube result and public visibility before placing its URL in Devpost.

## Verified-provider scene

The provider scene uses actual screenshots from the deployed Firebase application: sources, a completed extraction proposal, and the run history. It identifies NVIDIA Nemotron on Nebius Token Factory and shows the review boundary before importing records. The opening workflow uses the clearly labeled synthetic drill.

The live fixture report is in `docs/evaluation/live-nebius.json`. A passing synthetic fixture does not establish real-world recall accuracy. OpenAI is used only for this neutral narration and caption alignment; it does not substitute for the required NVIDIA workload on Nebius.

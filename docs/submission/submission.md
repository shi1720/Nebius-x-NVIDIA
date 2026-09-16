# RecallRoom · Submission copy

**Owner:** Shivam Gupta  
**Recommended track:** Best Apps and Agents  
**Editorial status:** Draft. Update implementation and verification statements after the final build review. A live Nebius credential has not yet been supplied for runtime verification.

## Project name

RecallRoom

## Tagline

Turn scattered food-production records into an evidence-backed recall response.

## Inspiration

When a supplier recalls an ingredient lot, a food manufacturer needs to answer a concrete question: which finished products and customers could it have reached? The evidence may be split across receiving sheets, batch records, and shipment exports. A fluent answer is not enough. The team needs to see the source, understand uncertainty, and review the action.

RecallRoom is built around that moment. Its intended users are small food manufacturers, co-packers, and the quality professionals who help them prepare for recalls.

## What it does

RecallRoom is an incident workspace for reconstructing lot lineage from supplied records. Its core workflow connects a recalled ingredient to production batches and customer shipments, shows the evidence behind each relationship, and keeps unresolved lot references visible for human review. The response packet brings the scope, evidence, open issues, and customer-specific communication drafts together.

The fictional demonstration starts with peanut-butter lot PB-0901-A. Its confirmed lineage reaches 800 finished units: 480 oat bars and 320 energy bites. Of those, 600 have shipped to three customers and 200 remain on site. A 240-cookie batch has an ambiguous reference, so its 120 shipped units remain a separate issue requiring investigation. A different 360-bar batch references PB-0901-B. Every number describes synthetic demo records, not a real incident or customer result.

## How we are building it

The intended pipeline uses NVIDIA Nemotron through Nebius Token Factory to interpret records and propose structured, evidence-linked relationships. Application code validates those structures and computes the lot graph and shipment scope. Human reviewers resolve ambiguous evidence and control the response. This separation makes it possible to test important behavior independently of a model's prose.

The open-model approach gives us a practical route to inspectable, portable inference. We are instrumenting the integration so the final submission can show the model identifier, provider, token usage, latency, and any failure or retry rather than presenting an unverified “AI-powered” label.

**Current verification limit:** Live Nebius execution is pending a credential. Do not submit this paragraph as a completed integration claim until a successful run and its trace have been recorded. A fixture-backed demonstration is useful for review, but does not establish compliance with the hackathon's live infrastructure requirement.

## What makes it different

Traceability and recall products already exist. RecallRoom's proposed focus is an incident workspace over records the business already has, with each scope decision tied to source evidence and uncertainty treated as part of the result. The defining demonstration is the ambiguous lot reference: the application should preserve the unresolved exposure instead of generating an unjustified all-clear.

## Challenges

The hard part is preserving identity and uncertainty across inconsistent documents. Similar-looking lot codes can refer to different material. A missing relationship does not establish that a shipment is unaffected. Units and kilograms also cannot be reconciled without the relevant production quantities. These constraints guide the validation rules and evaluation cases.

## What we are proud of

The product design makes a technical trust boundary visible: the model interprets messy evidence; deterministic checks compute scope; a person reviews the decision. The goal is a complete, understandable workflow for a quality professional, rather than a chat interface that hides how its answer was formed.

## What we learned

Our desk research highlighted that existing business records often hold useful information, while inconsistent lot identity and missing source information can prevent reliable tracing. It also clarified the competitive landscape: the opportunity is a focused workflow with lower adoption friction, not a claim that recall software is new.

## What's next

Validate the workflow with quality managers and consultants, evaluate de-identified drill packets against human-authored answer keys, and test whether repeated readiness drills support paid usage. Broader file support and operational integrations should follow demonstrated reliability on the narrow initial workflow.

## Commercial potential

The initial business hypothesis is a $49 single drill or $99 per site per month for recurring readiness. These prices are experiments; there are no paying customers or validated savings to report. Token-cost calculations suggest inference may be a small part of cost, while onboarding and support deserve close attention.

## Credits

Created by **Shivam Gupta**, with AI-assisted research, implementation, testing, and documentation. The repository history and project documentation should reflect actual contributions. Do not invent interviews, customer feedback, or personal actions.

## Feedback for Nebius and NVIDIA

**Before live testing:** No firsthand runtime feedback is available yet. The integration requirements we intend to assess are structured-output reliability, model discovery, request tracing, latency, retry behavior, and usage accounting.

**After live testing:** Replace this note with observed behavior, exact model/provider details, reproducible requests, and concrete improvement suggestions. Distinguish documentation feedback from behavior observed in the API. Do not claim the service accelerated development or reduced cost without a relevant comparison.

## Submission completion checklist

- [ ] Working demo URL, tested from a fresh unauthenticated browser.
- [ ] Public repository URL with an open-source license and clear setup instructions.
- [ ] Verified live Nebius run using an NVIDIA open-source model; recorded model ID and sanitized request trace.
- [ ] Uploaded public YouTube video, at most three minutes, with audible Nebius/NVIDIA explanation.
- [ ] Accurate feature and test status; remove unimplemented functionality from submission copy.
- [ ] Feedback based on actual service use.
- [ ] Confirm official eligibility and current rules before submission.
- [ ] State whether this project existed before the submission period; use repository history and actual creation dates.
- [ ] Attend-city selection only if Shivam actually attended an eligible event.

Do not mark this submission ready until the live runtime, public demo, repository, and video requirements are completed.

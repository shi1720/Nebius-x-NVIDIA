# RecallRoom project story

**Creator:** Shivam Gupta  
**Track:** Best Apps and Agents  
**Demo:** https://recallroom.web.app  
**Repository:** https://github.com/shi1720/Nebius-x-NVIDIA

**Verification:** The Firebase application and real NVIDIA Nemotron 3 Super workflow passed a hosted test from six source uploads through reviewed import, reload, evidence-backed decisions and export. See the [sanitized hosted report](https://github.com/shi1720/Nebius-x-NVIDIA/blob/main/docs/evaluation/hosted-nebius.json). This fictional scenario does not establish real-world recall accuracy.

## Inspiration

A supplier sends a recall notice for one ingredient lot. Somewhere in a small food business, a quality manager opens a receiving spreadsheet, a folder of batch sheets, and a shipment export.

The question is urgent and concrete: **Which products did this ingredient reach, and who received them?**

One record says `PB-0901-A`. Another says `PB-Sept`. Guessing that they mean the same thing can change the scope of the response. Ignoring the mismatch can hide a problem.

We built RecallRoom for that moment. Our starting point was a practical constraint: smaller manufacturers and co-packers need to work with the records they already have. A useful product should help them reconstruct the evidence, find what is missing, and prepare a response they can explain.

## What it does

RecallRoom brings receiving records, production batches, and customer shipments into one investigation. An interactive graph shows how a recalled ingredient moves through finished products to customers. Select a record to inspect the source behind it.

The fictional demonstration begins with one peanut-butter lot. Its confirmed path reaches **800 finished units**: 480 oat bars and 320 energy bites. Of those, 600 units have shipped to three customers and 200 remain on site.

A separate batch of 240 cookies uses an ambiguous lot reference. RecallRoom keeps those cookies on a precautionary hold within the investigation instead of folding them into the confirmed count. A supplied clarification identifies the other ingredient lot. A reviewer can use that evidence to exclude the recalled-lot relationship and confirm the alternative relationship. The original link, supporting quote, and decision remain in the audit history.

The exportable response packet brings together the shipment register, source citations, remaining uncertainties, review decisions, and customer-specific message drafts. The app prepares those drafts; a person controls any communication or operational action.

## How we built it

RecallRoom uses React and TypeScript, served as a static application on Firebase Hosting at [recallroom.web.app](https://recallroom.web.app). Firebase Authentication supports Google and email/password sign-in. A Cloud Run API verifies identity and controls account-owned Firestore investigations and private Google Cloud Storage originals. Cloud Tasks runs authenticated background extraction jobs so a long model request does not block the web request.

**NVIDIA Nemotron 3 Super, served through Nebius Token Factory**, turns source records into a structured proposal with exact quotations. Our verified hosted run used `nvidia/nemotron-3-super-120b-a12b` and extracted six lots, five relationships and six shipments with all expected scope totals. Inference took 17.562 seconds, used 2,600 input and 4,203 output tokens, and had an estimated cost of $0.00456. We inspected the proposal, imported the reviewed records, reloaded the case, resolved the cookie ambiguity with two cited decisions, and verified the downloaded packet. Sanitized traces and failed development attempts remain in the repository. These checks cover one fictional scenario, not real-world accuracy or typical latency.

The final adapter uses a schema-guided prompt and strict server validation. It sends an ordinary chat request without provider response-format constraints, then parses JSON and validates the proposal against our domain schema.

The model proposes records. Deterministic application code validates citations, lot references, units, quantities, and graph structure, then calculates the recall scope. A human reviews the proposal before import and supplies evidence for relationship changes. This separation lets us test the calculations independently and inspect the reasoning behind a result.

The code is public under the MIT license. The repository includes setup instructions, synthetic source documents, automated tests, and reproducible evaluation commands.

## Challenges we ran into

The hardest challenge was representing uncertainty without making it disappear in a polished answer. An ambiguous lot label must remain visible through the graph, shipment totals, ingredient balances, and exported packet.

Live testing exposed a more subtle failure: a well-formed proposal could still omit nearly all the source records. We kept that incomplete hosted result out of the investigation. We clarified how the prompt should handle absent optional fields and added CSV row-coverage checks that block incomplete import. A repeat evaluation using upload-style document IDs and PDF text then passed. Row coverage detects missing supported CSV records, but it does not prove semantic correctness or that every possible lot relationship is present. A reviewer still checks ambiguous inputs against the originals. Further trials revealed incomplete arrays, duplicate records and truncated output while we aligned the prompt with decoder constraints. We retained those failures and moved the final adapter to schema-guided prompting with strict application validation. This made the failures as useful as the successful calls.

Quantity accounting needed equal care. Kilograms of an ingredient are different from units of finished goods. Repacking can create multiple graph nodes for the same physical output. Our calculations keep these quantities separate and avoid counting intermediate production twice.

Evidence also needs a trustworthy path into the system. Text uploads are read from their original bytes. Extracted PDF text requires a reviewer to compare it with the original before it can authorize an import or decision. Stale edits, duplicate files, invalid source quotes, and concurrent extraction requests each needed explicit handling.

## Accomplishments that we're proud of

We built a complete investigation workflow around a specific problem: inspect records, trace a lot, review uncertainty, and export the evidence.

The most meaningful moment in the demo is the cookie batch. The scope changes only after a reviewer provides a supporting record, and the excluded relationship stays inspectable afterward. That makes the result easier to explain to the next person who opens the case.

Our current automated suite passes 41 tests covering the domain logic, evidence checks, exports, and mocked provider contracts. The hosted Firebase API passed 60 checks, and 10 operator checks verified concurrent quotas and expired-lock behavior against the production Firestore functions. The separate hosted NVIDIA workflow matched the supplied fixture answer key and preserved the provider trace, source hashes and review decisions in exported files. The graph suite also checks its results against an independent calculation over 150 generated graphs. These are engineering checks, not claims about real-world recall accuracy.

## What we learned

In this workflow, the useful output is a reviewable chain of evidence. A fluent explanation cannot repair a missing lot identity. Showing what remains unresolved can be more useful than making the dashboard look complete.

We also learned to evaluate commercial viability beyond token cost. Onboarding, messy records, and the time needed for human review will matter to a small customer. Our initial business hypothesis is recurring recall-readiness drills over existing exports, with food-safety consultants as a potential channel. A proposed $99 per site monthly price is a hypothesis to test, not established demand.

## What's next for RecallRoom

Next, work with quality professionals to evaluate permitted drill packets against human-authored answer keys. We want to measure incorrect links, missed exposure, unsupported exclusions, and review time before expanding the scope.

Next would come better document adapters, consultant workflows, and integrations guided by those evaluations. The commercial question is whether teams will return for the next drill and pay for a result they can inspect.

RecallRoom was created by **Shivam Gupta**, who set the product direction, commercial constraints, and quality bar, with AI-assisted implementation, research, and testing.

# RecallRoom · Research and product thesis

**Owner:** Shivam Gupta  
**Research date:** September 16, 2026  
**Evidence status:** Desk research using primary government and vendor sources. No customer interviews, paid pilots, or measured commercial outcomes have been completed.

## The decision

Build a recall incident room for small food manufacturers and co-packers whose evidence is spread across receiving records, production sheets, and shipment exports. Start with a bounded question: **“A supplier recalled this lot. Which products and customers could it have reached, and what evidence is still missing?”**

The first product should make traceability gaps reviewable and turn approved findings into a coherent response packet. It should complement the records a business already keeps. It does not need to become its ERP, warehouse system, or food-safety certification platform.

## What the evidence supports

| Primary source                                                                                                                                                                | What it establishes                                                                                                                                         | Product implication                                                                                    | Limit                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| [FDA traceability readiness tabletop report, June 2026](https://www.fda.gov/media/192993/download?attachment=)                                                                | Fifteen participating firms showed incomplete or inconsistent lot-code and source information; many relevant facts existed in traditional business records. | Reconcile existing records and expose gaps before producing a scope report.                            | Small, voluntary sample; findings are not representative of the whole food industry. The exercise was not a real outbreak. |
| [FDA Food Traceability Rule overview](https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-requirements-additional-traceability-records-certain-foods) | Covered entities must make specified records available within 24 hours of a qualifying request, including an electronic sortable spreadsheet when required. | An exportable evidence register and complete source references are more useful than a chat transcript. | Coverage and exemptions vary. A prototype export must not be described as automatically FDA-compliant.                     |
| [FDA traceability FAQs](https://www.fda.gov/food/food-safety-modernization-act-fsma/frequently-asked-questions-fsma-food-traceability-rule)                                   | Traceability depends on the relevant tracking events, lot identities, and records available across supply-chain participants.                               | Preserve source lot, internal lot, transformation, and shipment identity separately.                   | Recheck current regulatory details before submission; no claim that one rule covers every food.                            |

**Timing:** The FDA report states that FDA will not enforce the Food Traceability Rule before July 20, 2028, following a congressional directive. Avoid an imminent January 2026 deadline narrative. The immediate value proposition is readiness, evidence quality, and practical response coordination.

## Competitive landscape

| Product                                                                                                                                                                      | Verified offering                                                                                                                                                                                          | RecallRoom's proposed position                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [FoodDocs pricing](https://www.fooddocs.com/pricing) and [recall workflow](https://www.fooddocs.com/knowledge/how-to-perform-a-product-recall-using-end-to-end-traceability) | Professional includes traceability and recall data at $299/site/month on monthly billing, or $250/site/month billed annually. Its recall workflow assumes records have first been completed in the system. | A focused incident workspace that begins with existing exports and documents. The lower proposed price must reflect a narrower product. |
| [Mar-Kov traceability](https://mar-kov.com/traceability/)                                                                                                                    | Parent/child lot tracing, batch records, and affected shipment information within manufacturing software.                                                                                                  | A lightweight companion when a full manufacturing-system migration is not the current priority.                                         |
| [TraceGains Supplier Management](https://tracegains.com/compliance/supplier-management/)                                                                                     | Supplier-document collection, digitization, monitoring, and ingredient information.                                                                                                                        | Resolve a specific recall investigation with evidence-linked scope and explicit unresolved relationships.                               |

RecallRoom should never claim to be the first recall tool, the only use of AI in food safety, or a replacement for established traceability systems. Its proposed differentiation is the combination of **low-friction ingestion, inspectable evidence, deterministic lot propagation, and conservative treatment of ambiguity**. The distinctiveness of that combination remains a hypothesis to test with buyers and competitor demos.

## Buyer and entry workflow

The initial buyer hypothesis is a quality manager or owner at a small manufacturer or co-packer. A second distribution hypothesis is a food-safety consultant who conducts traceability drills across several client sites. The user brings receiving, production, and shipping records, runs a drill, resolves issues, and exports the reviewed packet.

Recurring drills and evidence-quality reviews offer a more credible subscription habit than waiting for rare emergencies. Pilot success should mean that a quality professional can verify the resulting scope and explain every exclusion, not merely that an attractive graph appears quickly.

## Validation plan

1. Interview five quality managers and three food-safety consultants. Ask them to walk through their most recent drill before showing the product. Record current tools, time spent, missing records, approval roles, and purchasing process.
2. Secure permission to evaluate de-identified historical or synthetic drill packets. Do not request confidential incident records until suitable controls exist.
3. Compare results with a human-authored answer key. Measure affected-shipment recall, incorrect exclusions, unresolved-issue detection, provenance correctness, elapsed time, and human review effort.
4. Offer a paid, bounded pilot at a stated experimental price. Record acceptance and rejection reasons; do not equate interview interest with willingness to pay.
5. Test whether consultants bring a second client and whether manufacturers repeat a drill without founder assistance.

## Demo boundary

The demo is fictional. Recalled peanut-butter lot **PB-0901-A** contains **100 kg** of source material. Confirmed lineage reaches **480 oat bars and 320 energy bites: 800 finished units**, of which **600 shipped to three customers and 200 remain on site**. A separate **240-cookie** batch, including **120 shipped units**, has an ambiguous lot reference. Another **360-oat-bar** batch uses **PB-0901-B**.

These are scenario facts, not customer outcomes. Kilograms and finished-unit counts are different measures; do not imply that a mass balance has been proven from these figures alone. The cookie uncertainty must remain visible until supporting evidence is reviewed. Lot B can be outside the supplied lot-A lineage without being declared generally safe.

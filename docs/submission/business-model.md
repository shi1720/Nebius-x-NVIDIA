# RecallRoom · Commercial model

**Status:** Proposed business model, not validated revenue or traction.  
**Owner:** Shivam Gupta

## The promise customers could buy

Turn the records a food business already holds into a reviewable recall scope and response packet. The economic value would come from less manual reconciliation, faster identification of missing evidence, and better-targeted operational action. None of those savings has yet been measured in a customer setting.

Start with a narrow paid workflow: a quality manager runs a traceability drill, reviews source-linked findings, resolves ambiguous lot references, and exports the approved packet. Avoid pricing the product around a promise that an AI model can certify food safety.

## Packaging hypotheses

| Offer        | Experimental price | Included scope                                                                       | Why test it                                                     |
| ------------ | -----------------: | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Single drill |           $49 once | One bounded case, source review, and exports within a documented usage limit         | Low-commitment way to test whether users pay for the outcome.   |
| Site         |          $99/month | One site, recurring drills, case history, and a defined monthly processing allowance | Tests whether readiness is a recurring workflow.                |
| Consultant   |         $299/month | Up to five client workspaces, separately isolated, with pooled processing limits     | Tests a channel with repeated use and lower acquisition effort. |

Prices, limits, and multi-client functionality are proposals, not implemented entitlements. Avoid accepting payment for features before they exist. FoodDocs' published Professional price is $299/site/month monthly or $250 with annual billing, but it includes a broader food-safety product; that comparison does not prove demand for RecallRoom. [FoodDocs pricing](https://www.fooddocs.com/pricing)

## Model cost, with explicit arithmetic

Planning inputs supplied for this build: **Nemotron Super input $0.30 per million tokens; output $0.90 per million tokens.** Verify the actual model ID, current rate, reasoning-token accounting, and usage response before publishing a live cost claim. See [Nebius Token Factory pricing](https://nebius.com/token-factory/prices).

`inference_cost_usd = input_tokens / 1,000,000 × 0.30 + output_tokens / 1,000,000 × 0.90`

| Hypothetical case     | Total input tokens across all calls | Total output tokens across all calls | Inference cost | Budget with 2× usage contingency |
| --------------------- | ----------------------------------: | -----------------------------------: | -------------: | -------------------------------: |
| Compact drill         |                              20,000 |                                5,000 |        $0.0105 |                          $0.0210 |
| Typical planning case |                              60,000 |                               12,000 |        $0.0288 |                          $0.0576 |
| Large case            |                             250,000 |                               40,000 |        $0.1110 |                          $0.2220 |

These are calculations, not benchmark results. All extraction, interpretation, drafting, retries, and reasoning tokens must be included in the eventual measured totals. OCR services, image-model calls, storage, application compute, observability, taxes, payment fees, and support are excluded above.

For a hypothetical $99 account running ten typical cases per month, inference with the 2× contingency is **$0.576/month**. A provisional contribution model is:

| Monthly line item                              |                       Assumption |
| ---------------------------------------------- | -------------------------------: |
| Revenue                                        |                           $99.00 |
| Inference allowance                            |                           $0.576 |
| Allocated application, storage, and monitoring |                            $5.00 |
| Payment processing allowance                   |                            $3.27 |
| Support: 15 minutes at an assumed $30/hour     |                            $7.50 |
| Contribution before fixed costs                | **$82.654, approximately 83.5%** |

Infrastructure and payment allowances are placeholders, not provider quotes. This excludes engineering, security work, insurance, customer acquisition, legal review, founder salary, and tax. If support instead takes two hours per account each month at $30/hour, contribution falls to approximately **30.5%**. Onboarding and data quality, rather than token cost alone, are likely to determine viability.

## Go-to-market experiment

Recruit three food-safety consultants to review a fictional drill, then ask whether they would purchase one case for a real client with permission. Give the manufacturer an exportable packet and a concrete list of record-quality issues. Test a second drill within 30 days before treating the account as recurring demand.

Success criteria should be set before the pilot: correct scope against a reviewer-authored answer key, no unsupported exclusions, complete evidence references, manageable review time, and an actual payment or purchasing commitment. No outreach messages have been sent and no commitments have been obtained.

## Defensibility and risks

Potential defensibility lies in approved document adapters, carefully adjudicated lot aliases, a difficult edge-case evaluation set, and consultant workflows. A generic model wrapper is easy to reproduce. Customer records must remain under the customer's control; a future shared benchmark would require explicit permission and suitable de-identification.

The largest commercial risks are infrequent usage, trust in imported data, liability concerns, entrenched systems, and expensive onboarding. Reduce those risks with recurring drills, transparent evidence, strict scope boundaries, self-service exports, and a narrow initial supported-record format. Do not claim automated regulatory compliance, guaranteed savings, or a production security certification.

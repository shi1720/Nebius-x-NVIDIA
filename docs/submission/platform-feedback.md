# Platform feedback

## Observed during documentation and implementation

- The OpenAI-compatible Token Factory contract made it straightforward to isolate a provider adapter behind a typed schema and test request/response behavior.
- Public model documentation has evolved: current examples recommend a global endpoint, while older pages show regional endpoints. A single canonical current snippet and migration warning would reduce setup mistakes.
- Model IDs are case-sensitive and include punctuation differences. Startup catalog validation and clear deprecation notices are useful; an always-current copy button for each model ID would help further.
- JSON schema documentation and examples should consistently show the `json_schema: {name, strict, schema}` wrapper. A schema compatibility matrix per model would make capability selection easier.
- Token usage, request IDs, structured output and configurable models fit an auditable pipeline. RecallRoom records those fields when supplied rather than inferring performance.

## Awaiting direct runtime observation

At this stage, a Nebius key has not been supplied. We have not measured actual provider latency, response quality, reliability, token cost, or hardware performance. The comments above concern documentation and adapter implementation, not a completed production workload.

After real tests, replace this section with observed model ID, source fixture, usage, latency, schema behavior, failure cases and specific changes requested. Do not submit invented feedback about service performance.

## Other infrastructure

The web application uses Sites/Cloudflare for application hosting, account authentication and D1/R2 storage. Runtime model inference is designed for Nebius Token Factory. We did not use Nebius AI Cloud, Serverless Jobs, Serverless Endpoints, NVIDIA physical hardware or Tavily, and claim none of those integrations.

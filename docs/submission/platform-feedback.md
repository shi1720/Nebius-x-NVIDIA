# Platform feedback

## Documentation and implementation observations

Nebius Token Factory's OpenAI-compatible interface made it practical to isolate the NVIDIA adapter behind a typed request and response boundary. RecallRoom requests evidence-linked structured output, validates it independently and keeps provider failures separate from approved investigation records.

Useful documentation details for this workflow include an exact current model identifier, a canonical endpoint, supported structured-output schema shapes, usage accounting and request identifiers. Our adapter records provider metadata when it is returned and rejects malformed output rather than inventing a successful result.

## Direct runtime feedback is pending

No usable Nebius API key is configured, and no real NVIDIA inference has been verified. Account creation and terms acceptance are complete, and zero data retention is enabled. The console requires billing address and card verification before proceeding. The official $25 hackathon promo code has arrived by email but has not been redeemed. We therefore make no firsthand claims about provider latency, response quality, reliability, token cost, hardware performance or development speed improvements from actual inference.

A clearer credit-activation checklist before sign-up would help participants prepare for the billing verification step. This is an observed onboarding issue, not a claim about model performance.

After a real run, update this section with the exact model ID, synthetic source fixture, observed schema behavior, usage, latency, any failure or retry, and a concrete suggestion based on that evidence. A mocked contract test is not runtime feedback.

## Other services used

The active frontend is hosted at [recallroom.web.app](https://recallroom.web.app) on Firebase Hosting. Firebase Authentication, Firestore, private Google Cloud Storage, an isolated Cloud Run API and Cloud Tasks support the application. Those services host the app; they do not replace the NVIDIA model on Nebius requirement.

OpenAI TTS generated the disclosed neutral synthetic narration for the demo. It does not imitate Shivam's voice and is not part of the recall-extraction pipeline.

We have not used Nebius AI Cloud, Nebius Serverless Jobs, Nebius Serverless Endpoints, NVIDIA physical hardware or Tavily in this implementation and claim none of those integrations.

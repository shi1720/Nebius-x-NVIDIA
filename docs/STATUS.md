# Delivery and submission status

## Active deployment

- Public demo: [recallroom.web.app](https://recallroom.web.app).
- Public MIT repository: [shi1720/Nebius-x-NVIDIA](https://github.com/shi1720/Nebius-x-NVIDIA).
- Static Vite/React frontend on Firebase Hosting.
- Firebase Google and email/password authentication with server-verified ID tokens.
- Account-owned Firestore investigations, private Google Cloud Storage originals, an isolated Cloud Run API and authenticated Cloud Tasks extraction jobs.
- Sites, D1 and R2 are no longer the active application runtime.

## Engineering verification

- **37 automated tests pass**, including graph, provenance, export and mocked provider contracts.
- **58 of 58 hosted API checks pass** after the task-authentication fix, including two-account isolation, source provenance, review persistence, task identity rejection, expired-lock handling and cleanup. See [the Firebase API report](evaluation/firebase-api.json).
- **10 of 10 operator checks pass** against the production Firestore functions for concurrent user/global quotas, duplicate extraction locks and expired-lock updates and deletion. See [the operator report](evaluation/firebase-operator.json). Private original-file deletion was also verified directly in Google Cloud Storage.
- Browser Google sign-in succeeded and a private Sunward test investigation was created for Shivam. The public application was inspected at 390px mobile width with no page-level horizontal overflow. Broader browser checks are still being completed.
- The API checks use disposable real Firebase accounts and synthetic records. The operator checks do not enqueue inference. Neither report establishes live model quality.
- Old SQLite and Cloudflare reports, and the previous GitHub CI link, are historical evidence. No current Firebase migration CI success is claimed here.

## Implemented product

Incident room, lot graph, source inspection, private persistence, source uploads, evidence-backed review, portable output, async model request handling, deterministic quantity checks and a clearly labeled public synthetic drill.

The NVIDIA Nemotron adapter targets Nebius Token Factory. **No usable Nebius API key is configured and no actual NVIDIA model execution has been verified.** Nebius account setup remains at new-account terms. An OpenAI key is available for supporting work, not as a substitute for the hackathon's required provider.

## Submission materials

Devpost story, links, three captioned screenshots, a branded thumbnail, technical feedback and a judge ZIP attachment have been saved to the existing draft. Eligibility declarations and the public YouTube URL remain incomplete. Testing instructions, commercial research, pitch assets and YouTube copy are available in `docs/submission`. A 327-word narration has been generated with OpenAI TTS using a disclosed neutral synthetic voice. The 145.06-second, captioned 1080p video uses actual captured application screens and explicitly states that live Nebius verification is pending. Its rendered frames and media streams were inspected. It is hosted at https://recallroom.web.app/demo.html. Public YouTube upload awaits the required action-time Terms acknowledgement.

## Remaining acceptance gates

1. Complete the remaining browser acceptance and inspect the final hosted version. The current 58 API and 10 operator checks have passed.
2. Complete Nebius setup, obtain a usable key and record real NVIDIA inference through Token Factory, including the hosted source-to-approved-record workflow.
3. Complete the pending YouTube Terms acknowledgement and publish the finished captioned video. Update the recording after real provider verification.
4. Supply country of residence and eligibility declarations, add the public YouTube URL, then review the final Devpost rules acknowledgement and submission status. The factual draft fields are saved.
5. Keep the public demo available through December 15, 2026, the stated end of judging.

## Claim boundaries

All sample data is fictional. No win, customer interview, paying customer, measured time saving, regulatory certification or live extraction accuracy is claimed. Pricing is a hypothesis. Shivam Gupta set the product direction and quality bar; implementation, research and testing were AI-assisted.

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
- **60 of 60 hosted API checks pass** after the task-authentication fix, including two-account isolation, source provenance, review persistence, task identity rejection, expired-lock handling and cleanup. See [the Firebase API report](evaluation/firebase-api.json).
- **10 of 10 operator checks pass** against the production Firestore functions for concurrent user/global quotas, duplicate extraction locks and expired-lock updates and deletion. See [the operator report](evaluation/firebase-operator.json). Private original-file deletion was also verified directly in Google Cloud Storage.
- Browser Google sign-in succeeded and a private Sunward test investigation was created for Shivam. The public application was inspected at 390px mobile width with no page-level horizontal overflow. Google sign-in and saved-investigation reload were verified. The sign-in and incident layouts at 390px, and evidence navigation at 768px, have no page-level horizontal overflow. Tablet icon navigation has accessible names.
- The API checks use disposable real Firebase accounts and synthetic records. The operator checks do not enqueue inference. Neither report establishes live model quality.
- The Firebase release passed [GitHub CI](https://github.com/shi1720/Nebius-x-NVIDIA/actions/runs/35103728228) at commit `9db701a`. Old SQLite and Cloudflare reports remain historical evidence.

## Implemented product

Incident room, lot graph, source inspection, private persistence, source uploads, evidence-backed review, portable output, async model request handling, deterministic quantity checks and a clearly labeled public synthetic drill.

The NVIDIA Nemotron adapter targets Nebius Token Factory. **No usable Nebius API key is configured and no actual NVIDIA model execution has been verified.** Nebius account creation and the user-confirmed terms step are complete, with zero data retention enabled. Billing details and a payment method are saved. The official $25 hackathon promo code has been redeemed, and the console explicitly shows Billing: Active. Creating and securely configuring the inference API key is the next step. An OpenAI key is available for supporting work, not as a substitute for the hackathon's required provider.

## Submission materials

Devpost story, links, three captioned screenshots, a branded thumbnail, technical feedback and a judge ZIP attachment have been saved to the existing draft. The public YouTube URL is now saved in the video field; Devpost shows 4/5 steps complete. The country, applicable province response, age and affiliation declarations are saved using the user’s confirmation. Final submission remains incomplete. Testing instructions, commercial research, pitch assets and YouTube copy are available in `docs/submission`. A 327-word narration has been generated with OpenAI TTS using a disclosed neutral synthetic voice. The 145.06-second, captioned 1080p video uses actual captured application screens and explicitly states that live Nebius verification is pending. Its rendered frames and media streams were inspected. Hosted playback advanced with audio unmuted and no decoding error; the served MP4 hash matches the inspected local file.

The video is public at https://www.youtube.com/watch?v=d7_Y3J3-84E, with a downloadable copy at https://recallroom.web.app/demo.html. YouTube copyright and Community Guidelines checks completed with no issues. The uploaded English subtitle track, branded thumbnail, AI-use disclosure and signed-out public playback were verified. The recording must still be updated to demonstrate actual NVIDIA inference after provider activation.

## Remaining acceptance gates

1. Application acceptance is complete for the tested synthetic and authentication workflows: 37 unit tests, 60 hosted API checks, 10 operator checks, and desktop/mobile/tablet inspection. Live extraction remains a separate gate below.
2. Obtain a usable Nebius key and record real NVIDIA inference through Token Factory, including the hosted source-to-approved-record workflow.
3. Update the published recording after real provider verification. YouTube publication itself is complete.
4. Review the final Devpost rules acknowledgement and submission status after verified NVIDIA inference. The eligibility fields, factual draft fields and public YouTube URL are saved.
5. Keep the public demo available through December 15, 2026, the stated end of judging.

## Claim boundaries

All sample data is fictional. No win, customer interview, paying customer, measured time saving, regulatory certification or live extraction accuracy is claimed. Pricing is a hypothesis. Shivam Gupta set the product direction and quality bar; implementation, research and testing were AI-assisted.

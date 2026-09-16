# Delivery and submission status

## Active deployment

- Public demo: [recallroom.web.app](https://recallroom.web.app).
- Public MIT repository: [shi1720/Nebius-x-NVIDIA](https://github.com/shi1720/Nebius-x-NVIDIA).
- Static Vite/React frontend on Firebase Hosting.
- Firebase Google and email/password authentication with server-verified ID tokens.
- Account-owned Firestore investigations, private Google Cloud Storage originals, an isolated Cloud Run API and authenticated Cloud Tasks extraction jobs.
- Sites, D1 and R2 are no longer the active application runtime.

## Engineering verification

- **41 automated tests pass**, including graph, provenance, export and mocked provider contracts.
- **60 of 60 hosted API checks pass** after the task-authentication fix, including two-account isolation, source provenance, review persistence, task identity rejection, expired-lock handling and cleanup. See [the Firebase API report](evaluation/firebase-api.json).
- **10 of 10 operator checks pass** against the production Firestore functions for concurrent user/global quotas, duplicate extraction locks and expired-lock updates and deletion. See [the operator report](evaluation/firebase-operator.json). Private original-file deletion was also verified directly in Google Cloud Storage.
- Browser Google sign-in succeeded and a private Sunward test investigation was created for Shivam. The public application was inspected at 390px mobile width with no page-level horizontal overflow. Google sign-in and saved-investigation reload were verified. The sign-in and incident layouts at 390px, and evidence navigation at 768px, have no page-level horizontal overflow. Tablet icon navigation has accessible names.
- The API checks use disposable real Firebase accounts and synthetic records. The operator checks do not enqueue inference. Neither report establishes live model quality.
- The Firebase release passed [GitHub CI](https://github.com/shi1720/Nebius-x-NVIDIA/actions/runs/35103728228) at commit `9db701a`. Old SQLite and Cloudflare reports remain historical evidence.

## Verified hosted model workflow

**The real NVIDIA workflow passed end to end on Firebase.** The [hosted browser report](evaluation/hosted-nebius.json) records six uploaded fictional source files, reviewed PDF text, Cloud Tasks completion, inspection of all 17 proposed records, reviewed import, recalled-lot selection, persistence after reload, two quoted review decisions, and verified JSON and HTML downloads.

The actual run used `nvidia/nemotron-3-super-120b-a12b` through Nebius Token Factory, prompt v1.7. It took **17.562 seconds**, used **2,600 input and 4,203 output tokens**, and had an **estimated inference cost of $0.0045627**. The initial scope was 800 confirmed units, 240 held units, 600 confirmed shipped units, 120 held shipped units and 360 units outside the recorded path. After two reviewed decisions, the confirmed count stayed 800, hold became zero, and 600 units were outside the recorded path. The export retained provider metadata, source hashes and decisions.

The final adapter sends an ordinary chat request with the exact schema in the prompt. Strict server JSON, Zod, evidence and supported CSV coverage checks validate the proposal. Provider `response_format` constraints are intentionally disabled after recorded integration failures. Coverage catches missing supported CSV rows, but cannot prove semantic correctness or completeness of ambiguous candidates. Review of originals remains required.

Nebius account setup, confirmed terms, active billing and hackathon credit redemption are complete. The API key is configured as a server secret. OpenAI supports demo narration, not recall extraction.

## Development evidence and limits

Three direct-provider variants passed before hosted acceptance: [initial fixture](evaluation/live-nebius.json), [UUID/PDF fixture](evaluation/live-nebius-upload.json), and [exact hosted text](evaluation/live-nebius-hosted-packet.json). They share one fictional scenario and are not a real-world accuracy or typical-latency benchmark.

The [first two hosted proposals](evaluation/hosted-nebius-initial.json) omitted most or all records and were not imported. The deployed server rejected an attempted import of the older incomplete proposal without changing the case revision. Other retained trials record [incomplete source coverage](evaluation/live-nebius-upload-incomplete.json), [an unresolved schema error](evaluation/live-nebius-hosted-schema-error.json), [decoder problems](evaluation/live-nebius-hosted-decoder-error.json), [duplicate records](evaluation/live-nebius-hosted-duplicate-error.json), and [JSON-mode truncation](evaluation/live-nebius-hosted-json-mode-error.json). Prompt, decoder and validation changes followed. These reports prevent successful fixtures from hiding the development failures.

## Submission materials

The refreshed **150.25-second** public demo is [on YouTube](https://www.youtube.com/watch?v=J0Gy2FWsm-M). It shows actual captured application screens, including the live hosted NVIDIA proposal. It uses a disclosed neutral AI voice, burned-in captions and a published English subtitle track. A branded thumbnail and AI-use disclosure are set. YouTube's copyright and Community Guidelines checks reported no issues. Signed-out playback reached the end at 1080p with audio and no decoding error. Downloadable media is available through [the demo page](https://recallroom.web.app/demo.html).

Devpost's story, links, screenshots, thumbnail, technical feedback and judge attachment have been saved to the existing draft. The country, applicable province response, age and affiliation declarations are saved using the user's confirmation. The final revised story, links, provider feedback and judge attachment were saved and inspected in Devpost. Final submission remains incomplete. Current story, testing instructions, feedback and pitch artifacts are in the repository.

## Remaining submission steps

1. Application verification is complete for the tested workflows: 41 unit/provider tests, 60 hosted API checks, 10 operator checks, responsive browser inspection, and the real NVIDIA hosted extraction-to-export workflow.
2. The refreshed video is public and signed-out playback reached the end. Final Firebase media deployment and Chrome playback are verified.
3. Refresh Devpost's final links and materials, review its final rules acknowledgement and verify the submitted state. Eligibility declarations are saved.
4. Keep the public demo available through December 15, 2026, the stated end of judging.

## Claim boundaries

All sample data is fictional. No win, customer interview, paying customer, measured time saving, regulatory certification or live extraction accuracy is claimed. Pricing is a hypothesis. Shivam Gupta set the product direction and quality bar; implementation, research and testing were AI-assisted.

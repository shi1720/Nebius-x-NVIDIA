# Security and data handling

Do not include customer evidence, API keys or personal data in public issues. Report a suspected vulnerability privately to the repository owner through GitHub's available private reporting channel; if unavailable, request a private contact route without posting exploit details or sensitive records.

## Security boundary

Private requests rely on identity supplied by the Sites authentication gateway. The gateway must strip client-supplied `oai-authenticated-*` headers, and the underlying Worker must not be reachable through a separate untrusted origin. Deployments without this boundary are unsupported for private data.

All investigation and original-file lookups check the signed-in owner's ID. Mutations check origin and revision. Model documents cannot authorize application actions. PDF text remains unverified until explicitly compared with its original. The extraction model sees source text but has no tool access or application credentials.

This MVP is not a food-safety certification system. Any use with actual incident data requires deployment-specific security review, verified real-account isolation, agreed retention and backup policies, and accountable human quality leadership.

import test from "node:test";
import assert from "node:assert/strict";
import {
  extractDocuments,
  checkedBaseUrl,
  estimateCost,
  DEFAULT_MODEL,
  EXTRACTION_SCHEMA,
} from "../lib/nebius";
import { sampleInvestigation } from "../lib/sample";
const seed = sampleInvestigation();
const mock =
  (content: string, finish_reason = "stop") =>
  async () =>
    Response.json({
      id: "mock-contract-response",
      choices: [{ message: { content }, finish_reason }],
      usage: { prompt_tokens: 500, completion_tokens: 900 },
    });
test("OpenAI-compatible request uses NVIDIA and explicit schema; response is validated draft", async () => {
  let captured: Record<string, unknown> = {};
  const fetcher = async (url: unknown, options: RequestInit | undefined) => {
    assert.equal(
      url,
      "https://api.tokenfactory.nebius.com/v1/chat/completions",
    );
    captured = JSON.parse(String(options?.body));
    assert.equal(
      (options?.headers as Record<string, string>).Authorization,
      "Bearer test-key-not-real",
    );
    return mock(JSON.stringify(seed.dataset))();
  };
  const r = await extractDocuments(
    seed.documents,
    { apiKey: "test-key-not-real" },
    fetcher as typeof fetch,
  );
  assert.equal(captured.model, DEFAULT_MODEL);
  assert.ok(
    (
      captured.messages as { role: string; content: string }[]
    )[0].content.includes(JSON.stringify(EXTRACTION_SCHEMA)),
    "the reasoning model must see the schema, not only the constrained decoder",
  );
  assert.equal(
    captured.response_format,
    undefined,
    "provider-guided decoding is deliberately disabled; local validation remains mandatory",
  );
  assert.equal(r.run.inputTokens, 500);
  assert.equal(r.run.outputTokens, 900);
  assert.equal(r.issues.length, 0);
  assert.equal(r.run.provider, "Nebius Token Factory");
});
test("invalid JSON, schema, truncation and missing content fail closed", async () => {
  for (const [body, reason] of [
    ["not-json", "stop"],
    ["{}", "stop"],
    [JSON.stringify(seed.dataset), "length"],
  ])
    await assert.rejects(
      extractDocuments(
        seed.documents,
        { apiKey: "test" },
        mock(body, reason) as typeof fetch,
      ),
    );
});
test("invented citations stay in a rejected draft, never silently imported", async () => {
  const bad = structuredClone(seed.dataset);
  bad.lots[0].evidence.quote = "Invented quantity proof";
  const r = await extractDocuments(
    seed.documents,
    { apiKey: "test" },
    mock(JSON.stringify(bad)) as typeof fetch,
  );
  assert.ok(r.issues.some((i) => i.id === "evidence-PB-0901-A"));
});
test("auth failure makes one request and never returns sample data", async () => {
  let calls = 0;
  await assert.rejects(
    extractDocuments(seed.documents, { apiKey: "test" }, (async () => {
      calls++;
      return new Response("", { status: 401 });
    }) as typeof fetch),
    /NEBIUS_AUTH_FAILED/,
  );
  assert.equal(calls, 1);
});
test("provider transient retry is bounded to two calls", async () => {
  let calls = 0;
  await assert.rejects(
    extractDocuments(seed.documents, { apiKey: "test" }, (async () => {
      calls++;
      return new Response("", {
        status: 503,
        headers: { "retry-after": "0.25" },
      });
    }) as typeof fetch),
    /NEBIUS_UNAVAILABLE/,
  );
  assert.equal(calls, 2);
});
test("rejects non-Nebius endpoints, missing key and oversized inputs", async () => {
  assert.throws(() => checkedBaseUrl("https://attacker.example/v1/"));
  assert.throws(() => checkedBaseUrl("http://api.tokenfactory.nebius.com/v1/"));
  await assert.rejects(extractDocuments(seed.documents, { apiKey: "" }));
  await assert.rejects(
    extractDocuments([{ ...seed.documents[0], text: "x".repeat(90001) }], {
      apiKey: "test",
    }),
  );
  await assert.rejects(
    extractDocuments(seed.documents, { apiKey: "test", model: "not-nvidia" }),
  );
});
test("cost estimate uses token counts, never a per-call invented figure", () => {
  assert.equal(estimateCost(DEFAULT_MODEL, 1000000, 1000000), 1.2);
  assert.equal(
    estimateCost("nvidia/Nemotron-3_5-Lightning", 1000000, 1000000),
    0.3,
  );
});

test("opaque upload IDs use compact source aliases and citations map back to originals", async () => {
  const documents = seed.documents.map((document) => ({
    ...document,
    id: crypto.randomUUID(),
  }));
  const dataset = structuredClone(seed.dataset);
  for (const record of [
    ...dataset.lots,
    ...dataset.links,
    ...dataset.shipments,
  ]) {
    const index = seed.documents.findIndex(
      (document) => document.id === record.evidence.documentId,
    );
    record.evidence.documentId = `source-${index + 1}`;
  }
  let body: { messages: { content: string }[] } | undefined;
  const draft = await extractDocuments(documents, { apiKey: "test" }, (async (
    _url,
    options,
  ) => {
    body = JSON.parse(String(options?.body));
    return mock(JSON.stringify(dataset))();
  }) as typeof fetch);
  const sent = JSON.parse(body!.messages[1].content).documents;
  assert.deepEqual(
    sent.map((d: { documentId: string }) => d.documentId),
    documents.map((_, i) => `source-${i + 1}`),
  );
  assert.equal(draft.issues.length, 0);
  assert.equal(draft.dataset.lots[0].evidence.documentId, documents[1].id);
});

test("schema-valid partial extraction flags omitted receiving, production and shipment rows", async () => {
  const partial = { lots: [seed.dataset.lots[0]], links: [], shipments: [] };
  const draft = await extractDocuments(
    seed.documents,
    { apiKey: "test" },
    mock(JSON.stringify(partial)) as typeof fetch,
  );
  assert.ok(
    draft.issues.some(
      (issue) =>
        issue.message.includes("received lot PB-0901-B") &&
        issue.severity === "error",
    ),
  );
  assert.ok(
    draft.issues.some((issue) =>
      issue.message.includes("produced lot OAT-0902"),
    ),
  );
  assert.ok(
    draft.issues.some((issue) => issue.message.includes("shipment SHP-106")),
  );
  assert.equal(
    draft.dataset.lots.length,
    1,
    "coverage validation must never fill in model omissions",
  );
});

test("coverage checks quoted CSV cells and detects a missing known-input relationship", async () => {
  const documents = seed.documents.map((document) => ({
    ...document,
    text: document.text.replaceAll("Peanut oat bars", '"Peanut, oat bars"'),
  }));
  const dataset = structuredClone(seed.dataset);
  dataset.links = dataset.links.filter((link) => link.to !== "OAT-0902");
  const draft = await extractDocuments(
    documents,
    { apiKey: "test" },
    mock(JSON.stringify(dataset)) as typeof fetch,
  );
  assert.ok(
    draft.issues.some(
      (issue) =>
        issue.id.startsWith("source-coverage-") &&
        issue.message.includes("input relationship for OAT-0902"),
    ),
  );
  assert.ok(
    !draft.issues.some(
      (issue) =>
        issue.id.startsWith("source-coverage-") &&
        issue.message.includes("produced lot"),
    ),
  );
});

test("more than twelve documents fail before making a model call", async () => {
  await assert.rejects(
    extractDocuments(
      Array.from({ length: 13 }, (_, i) => ({
        ...seed.documents[0],
        id: `doc-${i}`,
      })),
      { apiKey: "test" },
    ),
    /between 1 and 12/,
  );
});

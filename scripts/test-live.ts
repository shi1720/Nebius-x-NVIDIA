/** Real, metered Nebius integration evaluation. No mocks and no silent fallback. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import {
  extractDocuments,
  DEFAULT_MODEL,
  DEFAULT_BASE_URL,
  checkedBaseUrl,
} from "../lib/nebius";
import { sampleInvestigation } from "../lib/sample";
import { trace, validateDataset } from "../lib/domain";
try {
  const content = await readFile(".env", "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]])
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
} catch {}
const apiKey = process.env.NEBIUS_API_KEY;
if (!apiKey) {
  console.error("BLOCKED: set NEBIUS_API_KEY in .env. No model call was made.");
  process.exit(2);
}
const model = process.env.NEBIUS_MODEL || DEFAULT_MODEL,
  baseUrl = checkedBaseUrl(process.env.NEBIUS_BASE_URL || DEFAULT_BASE_URL);
const catalogResponse = await fetch(baseUrl + "models", {
  headers: { Authorization: `Bearer ${apiKey}` },
  signal: AbortSignal.timeout(20000),
});
if (!catalogResponse.ok)
  throw new Error(
    `Model catalog returned HTTP ${catalogResponse.status}. Check your key.`,
  );
const catalog = (await catalogResponse.json()) as { data?: { id: string }[] };
if (!catalog.data?.some((m) => m.id === model)) {
  console.error(
    "Configured model not available. NVIDIA catalog IDs:",
    catalog.data?.filter((m) => m.id.startsWith("nvidia/")).map((m) => m.id),
  );
  process.exit(3);
}
const sample = sampleInvestigation();
const draft = await extractDocuments(sample.documents, {
  apiKey,
  model,
  baseUrl,
});
const issues = validateDataset(draft.dataset, sample.documents);
const result = trace(draft.dataset, sample.recalledLotIds, sample.documents);
const expected = {
  confirmedUnits: 800,
  holdUnits: 240,
  shippedUnits: 600,
  holdShippedUnits: 120,
  outsideUnits: 360,
};
const actual = {
  confirmedUnits: result.confirmedUnits,
  holdUnits: result.holdUnits,
  shippedUnits: result.shippedUnits,
  holdShippedUnits: result.holdShippedUnits,
  outsideUnits: result.outsideUnits,
};
const scopeMatches = Object.entries(expected).every(
  ([key, value]) => actual[key as keyof typeof actual] === value,
);
const report = {
  at: new Date().toISOString(),
  mode: "live",
  fixture: "sunward-v1",
  model,
  baseUrl,
  run: draft.run,
  issues,
  expected,
  actual,
  scopeMatches,
  passed: scopeMatches && !issues.some((i) => i.severity === "error"),
  limitations: [
    "One synthetic extraction fixture is not a real-world accuracy benchmark.",
    "Human review is still required before importing the extracted records.",
  ],
};
await mkdir("docs/evaluation", { recursive: true });
await writeFile(
  "docs/evaluation/live-nebius.json",
  JSON.stringify(report, null, 2) + "\n",
);
await mkdir(".sites-runtime", { recursive: true });
await writeFile(
  ".sites-runtime/live-draft.json",
  JSON.stringify(draft, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;

/** Live regression for actual uploaded files and opaque document IDs. Metered. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  extractDocuments,
  DEFAULT_MODEL,
  DEFAULT_BASE_URL,
} from "../lib/nebius";
import { trace, datasetSchema, type SourceDocument } from "../lib/domain";
try {
  for (const line of (await readFile(".env", "utf8")).split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]])
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
} catch {}
const apiKey = process.env.NEBIUS_API_KEY;
if (!apiKey) throw new Error("Set NEBIUS_API_KEY. No model call was made.");
const files = [
  "01_supplier_alert.txt",
  "02_receiving.csv",
  "03_production.csv",
  "04_shipments.csv",
  "05_inventory_count.txt",
  "06_signed_batch_clarification.pdf",
];
const documents: SourceDocument[] = [];
const packetPath = process.argv[2];
if (packetPath) {
  const packet = JSON.parse(await readFile(packetPath, "utf8")) as {
    name: string;
    text: string;
  }[];
  for (const item of packet)
    documents.push({
      id: randomUUID(),
      name: item.name,
      text: item.text,
      sha256: createHash("sha256").update(item.text).digest("hex"),
      uploadedAt: new Date().toISOString(),
      textVerified: true,
      extractionMethod: item.name.endsWith(".pdf")
        ? "browser-pdf"
        : "server-text",
    });
}

for (const name of packetPath ? [] : files) {
  const data = await readFile(`public/samples/${name}`);
  let text = new TextDecoder().decode(data);
  if (name.endsWith(".pdf")) {
    const pdf = await getDocument({
      data: new Uint8Array(data),
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;
    const pages = [];
    try {
      for (let n = 1; n <= pdf.numPages; n++) {
        const content = await (await pdf.getPage(n)).getTextContent();
        pages.push(
          `Page ${n}\n` +
            content.items
              .map((item) =>
                "str" in item
                  ? item.str + ("hasEOL" in item && item.hasEOL ? "\n" : " ")
                  : "",
              )
              .join(""),
        );
      }
      text = pages.join("\n\n");
    } finally {
      await pdf.destroy();
    }
  }
  documents.push({
    id: randomUUID(),
    name,
    text,
    sha256: createHash("sha256").update(data).digest("hex"),
    uploadedAt: new Date().toISOString(),
    textVerified: true,
    extractionMethod: name.endsWith(".pdf") ? "browser-pdf" : "server-text",
  });
}
const draft = await extractDocuments(
  documents,
  {
    apiKey,
    model: process.env.NEBIUS_MODEL || DEFAULT_MODEL,
    baseUrl: process.env.NEBIUS_BASE_URL || DEFAULT_BASE_URL,
  },
  async (url, options) => {
    const response = await fetch(url, options);
    if (response.ok) {
      const payload = (await response.clone().json()) as {
        choices?: { message?: { content?: string } }[];
      };
      await mkdir(".sites-runtime", { recursive: true });
      await writeFile(
        ".sites-runtime/live-packet-response.json",
        JSON.stringify(payload, null, 2),
      );
      try {
        const parsed = datasetSchema.safeParse(
          JSON.parse(payload.choices?.[0]?.message?.content ?? "null"),
        );
        const diagnostics = parsed.success
          ? []
          : parsed.error.issues.map((issue) => ({
              path: issue.path,
              code: issue.code,
              message: issue.message,
            }));
        await writeFile(
          ".sites-runtime/live-packet-validation.json",
          JSON.stringify(diagnostics, null, 2),
        );
        if (diagnostics.length)
          console.log(
            JSON.stringify({ validationIssues: diagnostics }, null, 2),
          );
      } catch {
        console.log("Provider diagnostic: response content was not JSON.");
      }
    }
    return response;
  },
);
const result = trace(draft.dataset, ["PB-0901-A"], documents);
const expected = {
  lots: 6,
  links: 5,
  shipments: 6,
  confirmedUnits: 800,
  holdUnits: 240,
  shippedUnits: 600,
  holdShippedUnits: 120,
  outsideUnits: 360,
};
const actual = {
  lots: draft.dataset.lots.length,
  links: draft.dataset.links.length,
  shipments: draft.dataset.shipments.length,
  confirmedUnits: result.confirmedUnits,
  holdUnits: result.holdUnits,
  shippedUnits: result.shippedUnits,
  holdShippedUnits: result.holdShippedUnits,
  outsideUnits: result.outsideUnits,
};
const report = {
  at: new Date().toISOString(),
  mode: "live",
  fixture: packetPath
    ? "sunward-hosted-text-uuid-v1"
    : "sunward-upload-uuid-pdf-v1",
  inputMethod: packetPath
    ? "Saved original text viewed in hosted UI; new UUID IDs; sha256 hashes text, not original file bytes"
    : "Local sample file bytes and PDF.js extraction",
  files: documents.map(({ id, name, sha256 }) => ({ id, name, sha256 })),
  run: draft.run,
  expected,
  actual,
  issues: draft.issues,
  passed:
    Object.entries(expected).every(
      ([key, value]) => actual[key as keyof typeof actual] === value,
    ) && !draft.issues.some((issue) => issue.severity === "error"),
  limitations: [
    "One additional synthetic fixture is not an accuracy benchmark.",
    "This script calls Nebius directly, not the hosted application. Input is either local sample files or source text saved from the hosted UI, as identified in inputMethod.",
    "Clarification is evidence for later human review, not permission for automatic relationship decisions.",
  ],
};
await mkdir("docs/evaluation", { recursive: true });
await writeFile(
  packetPath
    ? "docs/evaluation/live-nebius-hosted-packet.json"
    : "docs/evaluation/live-nebius-upload.json",
  JSON.stringify(report, null, 2) + "\n",
);
await mkdir(".sites-runtime", { recursive: true });
await writeFile(
  packetPath
    ? ".sites-runtime/live-hosted-packet-draft.json"
    : ".sites-runtime/live-upload-draft.json",
  JSON.stringify(draft, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;

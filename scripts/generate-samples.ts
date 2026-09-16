import { writeFile, mkdir } from "node:fs/promises";
import { sampleInvestigation } from "../lib/sample";
import { packetHtml, shipmentCsv } from "../lib/export";
const sample = sampleInvestigation();
await mkdir("public/samples", { recursive: true });
for (const d of sample.documents)
  await writeFile("public/samples/" + d.name, d.text + "\n");
await mkdir("docs/examples", { recursive: true });
await writeFile(
  "docs/examples/sample-investigation.json",
  JSON.stringify(sample, null, 2) + "\n",
);
await writeFile("docs/examples/sample-packet.html", packetHtml(sample));
await writeFile("docs/examples/sample-shipments.csv", shipmentCsv(sample));
console.log(
  "Generated synthetic source files, portable investigation and preliminary packet.",
);

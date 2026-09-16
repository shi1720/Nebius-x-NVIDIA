import test from "node:test";
import assert from "node:assert/strict";
import { sampleInvestigation } from "../lib/sample";
import {
  trace,
  validateDataset,
  resolveLink,
  datasetSchema,
  hasEvidence,
  type Dataset,
} from "../lib/domain";
import { shipmentCsv, packetHtml, csvCell, customerDraft } from "../lib/export";
const seed = sampleInvestigation;
test("synthetic drill has source-valid, physically consistent records", () => {
  const s = seed();
  assert.deepEqual(validateDataset(s.dataset, s.documents), []);
  assert.equal(datasetSchema.safeParse(s.dataset).success, true);
});
test("recall reaches production and shipments, preserving possible paths", () => {
  const s = seed(),
    r = trace(s.dataset, s.recalledLotIds, s.documents);
  assert.equal(r.confirmedUnits, 800);
  assert.equal(r.holdUnits, 240);
  assert.equal(r.shippedUnits, 600);
  assert.equal(r.holdShippedUnits, 120);
  assert.equal(r.onSiteUnits, 200);
  assert.equal(r.outsideUnits, 360);
  assert.equal(r.customers.length, 3);
  assert.equal(r.canFinalize, false);
});
test("source-backed exclusion narrows scope without changing confirmed impact", () => {
  const s = seed();
  const next = resolveLink(
    s,
    "USE-003",
    "excluded",
    { documentId: "correction", quote: "No PB-0901-A was used in this batch." },
    "The signed clarification excludes the recalled lot.",
    "Quality reviewer",
  );
  const r = trace(next.dataset, next.recalledLotIds, next.documents);
  assert.equal(r.holdUnits, 0);
  assert.equal(r.confirmedUnits, 800);
  assert.equal(r.outsideUnits, 600);
  assert.equal(next.revision, 2);
  assert.equal(s.dataset.links.length, 5);
  assert.equal(next.audit.at(-1)?.actor, "Quality reviewer");
});
test("unsubstantiated or short-reason decisions are rejected", () => {
  const s = seed();
  assert.throws(() =>
    resolveLink(
      s,
      "USE-003",
      "excluded",
      { documentId: "correction", quote: "Everything is safe." },
      "This is not evidence.",
      "reviewer",
    ),
  );
  assert.throws(() =>
    resolveLink(
      s,
      "USE-003",
      "excluded",
      {
        documentId: "correction",
        quote: "No PB-0901-A was used in this batch.",
      },
      "ok",
      "reviewer",
    ),
  );
});
test("already confirmed relationships cannot be silently reviewed again", () => {
  const s = seed();
  assert.throws(() =>
    resolveLink(
      s,
      "USE-001",
      "excluded",
      s.dataset.links[0].evidence,
      "Reason long enough to pass.",
      "reviewer",
    ),
  );
});
test("confirmed reachability dominates a possible alternative regardless of edge order", () => {
  const s = seed();
  s.dataset.links.push({
    ...s.dataset.links[2],
    id: "USE-X",
    certainty: "confirmed",
  });
  for (let n = 0; n < 4; n++) {
    s.dataset.links.reverse();
    const r = trace(s.dataset, s.recalledLotIds);
    assert.equal(r.statuses["COO-0904"], "affected");
    assert.equal(r.confirmedUnits, 1040);
  }
});
test("unrelated confirmed input does not upgrade possible contaminated path", () => {
  const s = seed();
  s.dataset.links.find((l) => l.id === "USE-004")!.certainty = "confirmed";
  assert.equal(trace(s.dataset, s.recalledLotIds).statuses["COO-0904"], "hold");
});
test("possible contamination propagates through rework", () => {
  const s = seed();
  s.dataset.links.push({
    id: "REWORK",
    from: "COO-0904",
    to: "OAT-0905",
    quantity: 1,
    unit: "units",
    certainty: "confirmed",
    evidence: s.dataset.links[0].evidence,
    note: "",
  });
  const r = trace(s.dataset, s.recalledLotIds);
  assert.equal(r.statuses["OAT-0905"], "hold");
  assert.equal(
    r.holdUnits,
    599,
  ); /* One consumed intermediate unit is not counted twice. */
});
test("cycles fail validation but traversal always terminates", () => {
  const s = seed();
  s.dataset.links.push(
    {
      id: "CYCLE1",
      from: "COO-0904",
      to: "OAT-0905",
      quantity: 1,
      unit: "units",
      certainty: "confirmed",
      evidence: s.dataset.links[0].evidence,
      note: "",
    },
    {
      id: "CYCLE2",
      from: "OAT-0905",
      to: "COO-0904",
      quantity: 1,
      unit: "units",
      certainty: "confirmed",
      evidence: s.dataset.links[0].evidence,
      note: "",
    },
  );
  assert.ok(
    validateDataset(s.dataset, s.documents).some((i) => i.id === "cycle"),
  );
  assert.equal(
    trace(s.dataset, s.recalledLotIds, s.documents).canFinalize,
    false,
  );
});
test("orphan finished goods remain held and taint their descendants", () => {
  const s = seed();
  s.dataset.links = s.dataset.links.filter((l) => l.to !== "OAT-0905");
  assert.equal(
    trace(s.dataset, s.recalledLotIds, s.documents).statuses["OAT-0905"],
    "hold",
  );
});
test("unknown recalled lot and empty recall cannot finalize", () => {
  const s = seed();
  assert.equal(trace(s.dataset, ["MISSING"], s.documents).canFinalize, false);
  assert.equal(trace(s.dataset, [], s.documents).canFinalize, false);
});
test("duplicate IDs fail validation across record types", () => {
  const s = seed();
  s.dataset.links[0].id = s.dataset.lots[0].id;
  assert.ok(
    validateDataset(s.dataset, s.documents).some((i) =>
      i.id.startsWith("duplicate"),
    ),
  );
});
test("missing endpoints and invented citation fail validation", () => {
  const s = seed();
  s.dataset.links[0].to = "MISSING";
  s.dataset.shipments[0].evidence.quote = "A completely fabricated shipment.";
  const issues = validateDataset(s.dataset, s.documents);
  assert.ok(issues.some((i) => i.id === "orphan-USE-001"));
  assert.ok(issues.some((i) => i.id === "evidence-SHP-101"));
});
test("source quotes normalize whitespace but never invent content", () => {
  const s = seed();
  assert.equal(
    hasEvidence(
      {
        documentId: "correction",
        quote: "No  PB-0901-A\nwas used in this batch.",
      },
      s.documents,
    ),
    true,
  );
  assert.equal(
    hasEvidence(
      { documentId: "none", quote: "No PB-0901-A was used in this batch." },
      s.documents,
    ),
    false,
  );
});
test("kg and units cannot be interchanged", () => {
  const s = seed();
  s.dataset.links[0].unit = "units";
  assert.ok(
    validateDataset(s.dataset, s.documents).some(
      (i) => i.id === "unit-USE-001",
    ),
  );
});
test("outbound use plus shipments cannot exceed available quantity", () => {
  const s = seed();
  s.dataset.shipments[0].quantity = 999;
  assert.ok(
    validateDataset(s.dataset, s.documents).some(
      (i) => i.id === "balance-OAT-0902",
    ),
  );
});
test("fractional floating point tolerance avoids false overdraw", () => {
  const s = seed();
  s.dataset.lots[0].quantity = 0.3;
  s.dataset.links[0].quantity = 0.1;
  s.dataset.links[1].quantity = 0.2;
  assert.ok(
    !validateDataset(s.dataset, s.documents).some(
      (i) => i.id === "balance-PB-0901-A",
    ),
  );
});
test("invalid calendar dates and negative amounts are rejected", () => {
  const s = seed();
  s.dataset.shipments[0].date = "2026-02-30";
  assert.ok(
    validateDataset(s.dataset, s.documents).some(
      (i) => i.id === "date-SHP-101",
    ),
  );
  s.dataset.lots[0].quantity = -1;
  assert.equal(datasetSchema.safeParse(s.dataset).success, false);
});
test("no duplicate counting for overlapping recalled roots", () => {
  const s = seed();
  assert.equal(
    trace(s.dataset, ["PB-0901-A", "PB-0901-A", "OAT-0902"]).confirmedUnits,
    800,
  );
});
test("CSV output guards spreadsheet formula injection", () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.ok(csvCell("\t=1+1").includes("'"));
  const s = seed();
  s.dataset.shipments[0].customer = "@SUM(1,2)";
  assert.ok(shipmentCsv(s).includes("'@SUM"));
});
test("HTML packet escapes hostile source content and preserves preliminary status", () => {
  const s = seed();
  s.title = "<script>alert(1)</script>";
  const html = packetHtml(s);
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("PRELIMINARY"));
  assert.ok(html.includes("No live AI extraction was run"));
  assert.ok(html.includes("USE-003"));
});
test("customer drafts contain only their own affected and hold shipments", () => {
  const s = seed();
  const d = customerDraft(s, "Market & Co.");
  assert.ok(d.includes("SHP-101"));
  assert.ok(d.includes("SHP-105"));
  assert.ok(!d.includes("SHP-102"));
  assert.ok(d.includes("NOT SENT"));
  assert.ok(d.includes("PRECAUTIONARY HOLD"));
});
test("random DAG trace matches independent fixed-point oracle", () => {
  let n = 93571;
  const random = () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 2 ** 32;
  };
  for (let trial = 0; trial < 150; trial++) {
    const s = seed(),
      data: Dataset = { lots: [], links: [], shipments: [] };
    for (let i = 0; i < 14; i++)
      data.lots.push({ ...s.dataset.lots[0], id: "N" + i, kind: "ingredient" });
    for (let i = 0; i < 14; i++)
      for (let j = i + 1; j < 14; j++)
        if (random() < 0.15)
          data.links.push({
            ...s.dataset.links[0],
            id: `E${i}-${j}`,
            from: "N" + i,
            to: "N" + j,
            certainty: random() < 0.5 ? "confirmed" : "possible",
          });
    const confirmed = new Set(["N0"]),
      all = new Set(["N0"]);
    for (let k = 0; k < 14; k++)
      for (const l of data.links) {
        if (all.has(l.from)) all.add(l.to);
        if (confirmed.has(l.from) && l.certainty === "confirmed")
          confirmed.add(l.to);
      }
    const result = trace(data, ["N0"]);
    for (const l of data.lots)
      assert.equal(
        result.statuses[l.id],
        confirmed.has(l.id) ? "affected" : all.has(l.id) ? "hold" : "outside",
      );
  }
});
test("repack avoids double counting intermediate output and exposes stock uncertainty", () => {
  const s = seed();
  const a = { ...s.dataset.lots[2], id: "A", quantity: 100 },
    b = { ...s.dataset.lots[2], id: "B", quantity: 100 };
  const d: Dataset = {
    lots: [s.dataset.lots[0], a, b],
    links: [
      { ...s.dataset.links[0], id: "IN", to: "A", quantity: 1 },
      {
        ...s.dataset.links[0],
        id: "REPACK",
        from: "A",
        to: "B",
        quantity: 100,
        unit: "units",
      },
    ],
    shipments: [{ ...s.dataset.shipments[0], lotId: "B", quantity: 100 }],
  };
  let r = trace(d, ["PB-0901-A"]);
  assert.equal(r.confirmedUnits, 100);
  assert.equal(r.onSiteUnits, 0);
  d.links[1].certainty = "possible";
  r = trace(d, ["PB-0901-A"]);
  assert.deepEqual(r.onSiteRange, { min: 0, max: 100 });
  assert.equal(r.holdUnits, 100);
});
test("ingredient balance never combines kg and output units", () => {
  const s = seed();
  const r = trace(s.dataset, s.recalledLotIds);
  const b = r.balances.find((b) => b.lotId === "PB-0901-A")!;
  assert.equal(b.received, 100);
  assert.equal(b.consumed, 50);
  assert.equal(b.minRemaining, 40);
  assert.equal(b.maxRemaining, 50);
  assert.equal(b.unit, "kg");
});
test("excluded link is retained with decision evidence for reconstruction", () => {
  const s = seed();
  const e = {
    documentId: "correction",
    quote: "No PB-0901-A was used in this batch.",
  };
  const next = resolveLink(
    s,
    "USE-003",
    "excluded",
    e,
    "The source explicitly excludes lot A.",
    "reviewer",
  );
  assert.deepEqual(next.decisions[0].linkBefore, s.dataset.links[2]);
  assert.deepEqual(next.decisions[0].evidence, e);
  assert.equal(next.decisions[0].revision, 2);
  assert.equal(
    trace(next.dataset, next.recalledLotIds, next.documents).canFinalize,
    false,
  );
});
test("unverified PDF text cannot justify a link review", () => {
  const s = seed();
  s.documents.find((d) => d.id === "correction")!.textVerified = false;
  assert.throws(
    () =>
      resolveLink(
        s,
        "USE-003",
        "excluded",
        {
          documentId: "correction",
          quote: "No PB-0901-A was used in this batch.",
        },
        "The source appears to exclude the lot.",
        "reviewer",
      ),
    /Verify the extracted PDF/,
  );
  assert.equal(
    trace(s.dataset, s.recalledLotIds, s.documents).canFinalize,
    false,
  );
});

import { z } from "zod";
const id = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
    "Use letters, digits, dots, underscores or hyphens for IDs.",
  );
const text = z.string().trim().min(1).max(240);
export const evidenceSchema = z.object({
  documentId: id,
  quote: z.string().trim().min(4).max(1800),
});
export const lotSchema = z.object({
  id,
  name: text,
  kind: z.enum(["ingredient", "finished"]),
  quantity: z.number().positive().max(1e9),
  unit: z.enum(["kg", "units"]),
  supplier: z.string().max(160),
  evidence: evidenceSchema,
});
export const linkSchema = z.object({
  id,
  from: id,
  to: id,
  quantity: z.number().positive().max(1e9),
  unit: z.enum(["kg", "units"]),
  certainty: z.enum(["confirmed", "possible"]),
  evidence: evidenceSchema,
  note: z.string().max(500),
});
export const shipmentSchema = z.object({
  id,
  lotId: id,
  customer: text,
  quantity: z.number().positive().max(1e9),
  unit: z.enum(["kg", "units"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  evidence: evidenceSchema,
});
export const datasetSchema = z.object({
  lots: z.array(lotSchema).max(100),
  links: z.array(linkSchema).max(250),
  shipments: z.array(shipmentSchema).max(250),
});
export const documentSchema = z.object({
  id,
  name: z.string().min(1).max(180),
  text: z.string().min(1).max(60000),
  sha256: z.string().max(64),
  uploadedAt: z.string(),
  storageKey: z.string().optional(),
  mimeType: z.string().optional(),
  textSha256: z.string().optional(),
  extractionMethod: z
    .enum(["server-text", "browser-pdf", "synthetic"])
    .optional(),
  textVerified: z.boolean().optional(),
});
export type Evidence = z.infer<typeof evidenceSchema>;
export type Lot = z.infer<typeof lotSchema>;
export type Link = z.infer<typeof linkSchema>;
export type Shipment = z.infer<typeof shipmentSchema>;
export type Dataset = z.infer<typeof datasetSchema>;
export type SourceDocument = z.infer<typeof documentSchema>;
export type Status = "affected" | "hold" | "outside";
export type Issue = {
  id: string;
  severity: "error" | "warning";
  message: string;
  recordId?: string;
};
export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
  revision: number;
};
export type ModelRun = {
  id: string;
  model: string;
  provider: "Nebius Token Factory";
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  estimatedCostUsd: number;
  requestId: string;
  at: string;
};
export type ExtractionDraft = {
  id: string;
  dataset: Dataset;
  issues: Issue[];
  run: ModelRun;
};
export type ReviewDecision = {
  id: string;
  linkBefore: Link;
  decision: "confirmed" | "excluded";
  evidence: Evidence;
  reason: string;
  actor: string;
  revision: number;
  at: string;
};
export type Investigation = {
  id: string;
  title: string;
  organization: string;
  hazard: string;
  recalledLotIds: string[];
  documents: SourceDocument[];
  dataset: Dataset;
  revision: number;
  createdAt: string;
  updatedAt: string;
  audit: AuditEvent[];
  runs: ModelRun[];
  decisions: ReviewDecision[];
  draft: ExtractionDraft | null;
  isSample: boolean;
};
export const emptyDataset: Dataset = { lots: [], links: [], shipments: [] };
export const normalizeQuote = (s: string) => s.replace(/\s+/g, " ").trim();
export function hasEvidence(e: Evidence, docs: SourceDocument[]) {
  const d = docs.find((x) => x.id === e.documentId);
  return (
    !!d &&
    normalizeQuote(e.quote).length >= 4 &&
    normalizeQuote(d.text).includes(normalizeQuote(e.quote))
  );
}
/** Model outputs are proposals. Reject broken identity, invented quotes and physical impossibilities before import. */
export function validateDataset(
  data: Dataset,
  docs: SourceDocument[],
): Issue[] {
  const issues: Issue[] = [];
  for (const d of docs)
    if (d.textVerified === false)
      issues.push({
        id: `unverified-${d.id}`,
        severity: "warning",
        message: `${d.name}: compare the extracted PDF text with the original before relying on it.`,
      });
  const seen = new Set<string>();
  const all = [...data.lots, ...data.links, ...data.shipments];
  for (const r of all) {
    if (r.unit === "units" && !Number.isInteger(r.quantity))
      issues.push({
        id: `fractional-${r.id}`,
        severity: "error",
        recordId: r.id,
        message: `${r.id}: finished-item unit counts must be whole numbers.`,
      });
    if (seen.has(r.id))
      issues.push({
        id: `duplicate-${r.id}`,
        severity: "error",
        recordId: r.id,
        message: `Duplicate record ID: ${r.id}.`,
      });
    seen.add(r.id);
    if (!hasEvidence(r.evidence, docs))
      issues.push({
        id: `evidence-${r.id}`,
        severity: "error",
        recordId: r.id,
        message: `${r.id} has a missing source or a quote not found in its document.`,
      });
  }
  const lots = new Map(data.lots.map((l) => [l.id, l]));
  for (const l of data.lots)
    if (
      (l.kind === "finished" && l.unit !== "units") ||
      (l.kind === "ingredient" && l.unit !== "kg")
    )
      issues.push({
        id: `kind-unit-${l.id}`,
        severity: "error",
        recordId: l.id,
        message: `${l.id}: this MVP records ingredients in kg and finished goods in units.`,
      });
  for (const e of data.links) {
    const a = lots.get(e.from),
      b = lots.get(e.to);
    if (!a || !b)
      issues.push({
        id: `orphan-${e.id}`,
        severity: "error",
        recordId: e.id,
        message: `${e.id} references a missing lot.`,
      });
    else {
      if (e.from === e.to || b.kind === "ingredient")
        issues.push({
          id: `direction-${e.id}`,
          severity: "error",
          recordId: e.id,
          message: `${e.id} has an invalid production relationship.`,
        });
      if (e.unit !== a.unit)
        issues.push({
          id: `unit-${e.id}`,
          severity: "error",
          recordId: e.id,
          message: `${e.id} must use the input lot's unit (${a.unit}).`,
        });
    }
  }
  const adj = new Map<string, string[]>();
  for (const e of data.links)
    adj.set(e.from, [...(adj.get(e.from) || []), e.to]);
  const visiting = new Set<string>(),
    done = new Set<string>();
  let cyclic = false;
  function visit(k: string) {
    if (visiting.has(k)) {
      cyclic = true;
      return;
    }
    if (done.has(k)) return;
    visiting.add(k);
    for (const next of adj.get(k) || []) visit(next);
    visiting.delete(k);
    done.add(k);
  }
  for (const k of lots.keys()) visit(k);
  if (cyclic)
    issues.push({
      id: "cycle",
      severity: "error",
      message:
        "Production relationships contain a cycle. Correct the source records before tracing.",
    });
  for (const s of data.shipments) {
    const lot = lots.get(s.lotId);
    if (!lot || lot.kind !== "finished")
      issues.push({
        id: `ship-lot-${s.id}`,
        severity: "error",
        recordId: s.id,
        message: `${s.id} must reference a finished-goods lot.`,
      });
    else if (lot.unit !== s.unit)
      issues.push({
        id: `ship-unit-${s.id}`,
        severity: "error",
        recordId: s.id,
        message: `${s.id} has a different unit from its lot.`,
      });
    if (
      !Number.isFinite(Date.parse(s.date)) ||
      new Date(s.date).toISOString().slice(0, 10) !== s.date
    )
      issues.push({
        id: `date-${s.id}`,
        severity: "error",
        recordId: s.id,
        message: `${s.id} has an invalid date.`,
      });
  }
  for (const lot of data.lots) {
    const used = data.links
      .filter((l) => l.from === lot.id && l.certainty === "confirmed")
      .reduce((a, b) => a + b.quantity, 0);
    const shipped = data.shipments
      .filter((s) => s.lotId === lot.id)
      .reduce((a, b) => a + b.quantity, 0);
    if (used + shipped > lot.quantity + 1e-6)
      issues.push({
        id: `balance-${lot.id}`,
        severity: "error",
        recordId: lot.id,
        message: `${lot.id}: recorded use and shipments (${used + shipped} ${lot.unit}) exceed available quantity (${lot.quantity} ${lot.unit}).`,
      });
    if (lot.kind === "finished" && !data.links.some((e) => e.to === lot.id))
      issues.push({
        id: `unlinked-${lot.id}`,
        severity: "warning",
        recordId: lot.id,
        message: `${lot.id} has no ingredient relationship. Treat its scope as unknown.`,
      });
  }
  return issues;
}
/** Monotone reachability: a confirmed path dominates a possible path, never the reverse. */
export function trace(
  data: Dataset,
  roots: string[],
  docs: SourceDocument[] = [],
) {
  const statuses: Record<string, Status> = Object.fromEntries(
    data.lots.map((l) => [l.id, "outside"]),
  );
  const reasons: Record<string, string[]> = {};
  const edges = new Map<string, Link[]>();
  for (const e of data.links)
    edges.set(e.from, [...(edges.get(e.from) || []), e]);
  const queue: string[] = [];
  for (const root of roots) {
    if (root in statuses) {
      statuses[root] = "affected";
      queue.push(root);
      reasons[root] = ["Recalled ingredient lot"];
    }
  }
  const rank = { outside: 0, hold: 1, affected: 2 };
  let cursor = 0;
  while (cursor < queue.length) {
    const from = queue[cursor++];
    for (const e of edges.get(from) || []) {
      const next: Status =
        statuses[from] === "affected" && e.certainty === "confirmed"
          ? "affected"
          : "hold";
      if (rank[next] > rank[statuses[e.to] || "outside"]) {
        statuses[e.to] = next;
        reasons[e.to] = [e.id];
        queue.push(e.to);
      } else if (next === statuses[e.to] && !reasons[e.to]?.includes(e.id)) {
        reasons[e.to] = [...(reasons[e.to] || []), e.id];
      }
    }
  }
  // An orphaned production batch cannot be classified outside the scope merely for lacking edges.
  const unknown = data.lots.filter(
    (l) =>
      l.kind === "finished" &&
      !data.links.some((e) => e.to === l.id) &&
      statuses[l.id] === "outside",
  );
  for (const l of unknown) {
    statuses[l.id] = "hold";
    reasons[l.id] = ["Missing production inputs"];
    queue.push(l.id);
  }
  while (cursor < queue.length) {
    const from = queue[cursor++];
    for (const e of edges.get(from) || [])
      if (statuses[e.to] === "outside") {
        statuses[e.to] = "hold";
        reasons[e.to] = [e.id];
        queue.push(e.to);
      }
  }
  const finished = data.lots.filter((l) => l.kind === "finished");
  const shipments = data.shipments.map((s) => ({
    ...s,
    status: statuses[s.lotId] || "hold",
  }));
  const sumShip = (status: Status) =>
    shipments
      .filter((s) => s.status === status)
      .reduce((a, s) => a + s.quantity, 0);
  const issues = docs.length ? validateDataset(data, docs) : [];
  for (const root of roots)
    if (!(root in statuses))
      issues.push({
        id: `missing-root-${root}`,
        severity: "error",
        message: `Recalled lot ${root} does not exist in the records.`,
      });
  for (const root of roots)
    if (
      root in statuses &&
      !data.links.some((l) => l.from === root) &&
      data.lots.find((l) => l.id === root)?.kind === "ingredient"
    )
      issues.push({
        id: `untraced-root-${root}`,
        severity: "warning",
        recordId: root,
        message: `No downstream production was found for ${root}. Verify record completeness; absence of a link is not proof of no use.`,
      });
  const ambiguous = data.links.filter(
    (l) => l.certainty === "possible" && statuses[l.from] !== "outside",
  );
  const balance = (lot: Lot) => {
    const confirmed = data.links
        .filter((e) => e.from === lot.id && e.certainty === "confirmed")
        .reduce((a, e) => a + e.quantity, 0),
      possible = data.links
        .filter((e) => e.from === lot.id && e.certainty === "possible")
        .reduce((a, e) => a + e.quantity, 0),
      shipped = data.shipments
        .filter((s) => s.lotId === lot.id)
        .reduce((a, s) => a + s.quantity, 0);
    return {
      lotId: lot.id,
      name: lot.name,
      unit: lot.unit,
      received: lot.quantity,
      consumed: confirmed,
      possibleConsumption: possible,
      shipped,
      minRemaining: Math.max(0, lot.quantity - confirmed - possible - shipped),
      maxRemaining: Math.max(0, lot.quantity - confirmed - shipped),
    };
  };
  const balances = data.lots.map(balance);
  const sumRange = (status: Status) => {
    const records = finished
      .filter((l) => statuses[l.id] === status)
      .map(balance);
    return {
      min: records.reduce((a, b) => a + b.minRemaining + b.shipped, 0),
      max: records.reduce((a, b) => a + b.maxRemaining + b.shipped, 0),
    };
  };
  const affectedRange = sumRange("affected"),
    holdRange = sumRange("hold"),
    outsideRange = sumRange("outside");
  const onSiteRange = {
    min: Math.max(0, affectedRange.min - sumShip("affected")),
    max: Math.max(0, affectedRange.max - sumShip("affected")),
  };
  return {
    statuses,
    reasons,
    shipments,
    issues,
    ambiguous,
    balances,
    affectedRange,
    holdRange,
    outsideRange,
    onSiteRange,
    confirmedUnits: affectedRange.max,
    holdUnits: holdRange.max,
    outsideUnits: outsideRange.max,
    shippedUnits: sumShip("affected"),
    holdShippedUnits: sumShip("hold"),
    onSiteUnits: onSiteRange.max,
    customers: [
      ...new Set(
        shipments.filter((s) => s.status === "affected").map((s) => s.customer),
      ),
    ],
    canFinalize:
      roots.length > 0 &&
      issues.length === 0 &&
      data.links.every((l) => l.certainty === "confirmed") &&
      unknown.length === 0,
  };
}
export function resolveLink(
  inv: Investigation,
  linkId: string,
  decision: "confirmed" | "excluded",
  evidence: Evidence,
  note: string,
  actor: string,
): Investigation {
  const link = inv.dataset.links.find((l) => l.id === linkId);
  if (!link || link.certainty !== "possible")
    throw new Error("Only an unresolved relationship can be reviewed.");
  if (
    inv.documents.find((d) => d.id === evidence.documentId)?.textVerified ===
    false
  )
    throw new Error(
      "Verify the extracted PDF text against its original before using it for a decision.",
    );
  if (!hasEvidence(evidence, inv.documents))
    throw new Error("The supporting quote must appear in a source document.");
  if (note.trim().length < 12)
    throw new Error("Add a reason of at least 12 characters.");
  const next = structuredClone(inv);
  next.dataset.links =
    decision === "excluded"
      ? next.dataset.links.filter((l) => l.id !== linkId)
      : next.dataset.links.map((l) =>
          l.id === linkId
            ? { ...l, certainty: "confirmed", evidence, note: note.trim() }
            : l,
        );
  const issues = validateDataset(next.dataset, next.documents);
  if (issues.some((i) => i.severity === "error"))
    throw new Error(issues.find((i) => i.severity === "error")!.message);
  next.decisions = [
    ...(next.decisions || []),
    {
      id: crypto.randomUUID(),
      linkBefore: structuredClone(link),
      decision,
      evidence,
      reason: note.trim(),
      actor,
      revision: inv.revision + 1,
      at: new Date().toISOString(),
    },
  ];
  return addAudit(
    next,
    actor,
    "Relationship reviewed",
    `${linkId}: ${decision}. ${note.trim()} [${evidence.documentId}] Quote: ${evidence.quote}`,
  );
}
export function addAudit(
  inv: Investigation,
  actor: string,
  action: string,
  detail: string,
): Investigation {
  const revision = inv.revision + 1,
    at = new Date().toISOString();
  return {
    ...inv,
    revision,
    updatedAt: at,
    audit: [
      ...inv.audit,
      { id: crypto.randomUUID(), at, actor, action, detail, revision },
    ],
  };
}

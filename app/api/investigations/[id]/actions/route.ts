import { z } from "zod";
import {
  identity,
  loadInvestigation,
  saveInvestigation,
  apiError,
  json,
  sameOrigin,
  readJson,
  ApiError,
} from "@/lib/server";
import {
  addAudit,
  resolveLink,
  evidenceSchema,
  validateDataset,
  datasetSchema,
  trace,
} from "@/lib/domain";
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("resolve"),
    revision: z.number().int(),
    linkId: z.string(),
    decision: z.enum(["confirmed", "excluded"]),
    evidence: evidenceSchema,
    note: z.string().min(12).max(1000),
  }),
  z.object({
    action: z.literal("approve-draft"),
    revision: z.number().int(),
    draftId: z.string(),
    dataset: datasetSchema,
  }),
  z.object({ action: z.literal("discard-draft"), revision: z.number().int() }),
  z.object({
    action: z.literal("set-recall"),
    revision: z.number().int(),
    lotIds: z.array(z.string()).min(1).max(30),
    hazard: z.string().trim().min(3).max(300),
  }),
  z.object({ action: z.literal("export"), revision: z.number().int() }),
  z.object({
    action: z.literal("verify-document"),
    revision: z.number().int(),
    documentId: z.string(),
    textSha256: z.string().length(64),
  }),
]);
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(request);
    const user = await identity(),
      body = schema.parse(await readJson(request));
    const inv = await loadInvestigation((await ctx.params).id, user.userId);
    if (inv.revision !== body.revision)
      throw new ApiError(
        409,
        "This investigation changed in another tab. Reload before saving.",
      );
    let next = inv;
    if (body.action === "resolve") {
      try {
        next = resolveLink(
          inv,
          body.linkId,
          body.decision,
          body.evidence,
          body.note,
          user.displayName,
        );
      } catch (e) {
        throw new ApiError(
          400,
          e instanceof Error ? e.message : "Review failed",
        );
      }
    }
    if (body.action === "approve-draft") {
      if (inv.documents.some((d) => d.textVerified === false))
        throw new ApiError(
          422,
          "Compare extracted PDF text with its original and record verification before approving the draft.",
        );
      if (!inv.draft || inv.draft.id !== body.draftId)
        throw new ApiError(409, "This extraction draft is no longer current.");
      const issues = validateDataset(body.dataset, inv.documents);
      if (issues.some((i) => i.severity === "error"))
        throw new ApiError(
          422,
          issues.find((i) => i.severity === "error")!.message,
        );
      if (!body.dataset.lots.length)
        throw new ApiError(422, "The draft has no lots to import.");
      next = addAudit(
        {
          ...inv,
          dataset: body.dataset,
          draft: null,
          recalledLotIds: inv.recalledLotIds.filter((id) =>
            body.dataset.lots.some((l) => l.id === id),
          ),
        },
        user.displayName,
        "Extraction approved",
        `Human reviewed and replaced the trace with ${body.dataset.lots.length} lots, ${body.dataset.links.length} relationships and ${body.dataset.shipments.length} shipments. Model run ${inv.draft.run.id}.`,
      );
    }
    if (body.action === "discard-draft")
      next = addAudit(
        { ...inv, draft: null },
        user.displayName,
        "Extraction discarded",
        "The approved trace was unchanged.",
      );
    if (body.action === "set-recall") {
      if (body.lotIds.some((id) => !inv.dataset.lots.some((l) => l.id === id)))
        throw new ApiError(
          400,
          "Select lots that exist in the approved records.",
        );
      next = addAudit(
        {
          ...inv,
          recalledLotIds: [...new Set(body.lotIds)],
          hazard: body.hazard,
        },
        user.displayName,
        "Recall scope selected",
        `Recalled lots: ${body.lotIds.join(", ")}. ${body.hazard}`,
      );
    }
    if (body.action === "verify-document") {
      const doc = inv.documents.find((d) => d.id === body.documentId);
      if (!doc || doc.textSha256 !== body.textSha256)
        throw new ApiError(
          409,
          "The extracted text has changed. Review the current document.",
        );
      next = addAudit(
        {
          ...inv,
          documents: inv.documents.map((d) =>
            d.id === body.documentId ? { ...d, textVerified: true } : d,
          ),
        },
        user.displayName,
        "PDF text verified",
        `${doc.name}: reviewer attested comparison of extracted text ${doc.textSha256} against original ${doc.sha256}.`,
      );
    }
    if (body.action === "export") {
      const scope = trace(inv.dataset, inv.recalledLotIds, inv.documents);
      next = addAudit(
        inv,
        user.displayName,
        "Investigation packet exported",
        `Revision ${inv.revision}. ${scope.confirmedUnits} affected units; ${scope.holdUnits} units on hold. ${scope.canFinalize ? "Recorded scope reviewed." : "Open questions included; packet remains preliminary."}`,
      );
    }
    await saveInvestigation(next, user.userId, body.revision);
    return json({ investigation: next });
  } catch (e) {
    return apiError(e);
  }
}

import {
  identity,
  loadInvestigation,
  saveInvestigation,
  apiError,
  json,
  sameOrigin,
  readJson,
  bindings,
  reserveInference,
  finishInference,
  ApiError,
} from "@/lib/server";
import { extractDocuments, modelErrorMessage } from "@/lib/nebius";
import { addAudit } from "@/lib/domain";
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(request);
    const user = await identity(),
      payload = await readJson(request, 1000),
      inv = await loadInvestigation((await ctx.params).id, user.userId);
    if (payload.revision !== inv.revision)
      throw new ApiError(
        409,
        "Reload the investigation before running extraction.",
      );
    if (!inv.documents.length)
      throw new ApiError(
        400,
        "Upload source documents before running extraction.",
      );
    const e = bindings();
    if (!e.NEBIUS_API_KEY)
      throw new ApiError(
        503,
        modelErrorMessage(new Error("NEBIUS_NOT_CONFIGURED")),
      );
    const jobId = await reserveInference(user.userId, inv);
    let draft;
    try {
      draft = await extractDocuments(inv.documents, {
        apiKey: e.NEBIUS_API_KEY,
        model: e.NEBIUS_MODEL,
        baseUrl: e.NEBIUS_BASE_URL,
      });
    } catch (error) {
      await finishInference(jobId, { error: modelErrorMessage(error) }, false);
      throw new ApiError(502, modelErrorMessage(error));
    }
    const next = addAudit(
      { ...inv, draft, runs: [...inv.runs, draft.run] },
      user.displayName,
      "Live extraction completed",
      `${draft.run.model} via Nebius. ${draft.issues.length} validation issues. Awaiting human review; the approved graph is unchanged.`,
    );
    try {
      await saveInvestigation(next, user.userId, inv.revision, jobId);
    } finally {
      await finishInference(jobId, draft, true);
    }
    return json({ investigation: next });
  } catch (e) {
    return apiError(e);
  }
}

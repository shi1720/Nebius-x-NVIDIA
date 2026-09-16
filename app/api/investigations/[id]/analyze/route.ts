import {
  identity,
  loadInvestigation,
  apiError,
  json,
  sameOrigin,
  readJson,
  bindings,
  reserveInference,
  finishInference,
  readInference,
  ApiError,
} from "@/lib/server";
import { enqueueInference } from "@/lib/inference-queue";
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
      throw new ApiError(409, "Reload before running extraction.");
    if (!inv.documents.length)
      throw new ApiError(
        400,
        "Upload source documents before running extraction.",
      );
    if (!bindings().NEBIUS_API_KEY)
      throw new ApiError(
        503,
        "Live NVIDIA extraction is not configured yet. The sample drill remains available.",
      );
    const jobId = await reserveInference(user.userId, inv);
    try {
      await enqueueInference(jobId);
    } catch {
      await finishInference(
        jobId,
        undefined,
        "The extraction could not be queued. Please retry.",
      );
      throw new ApiError(
        503,
        "The extraction could not be queued. Please retry.",
      );
    }
    return json({ jobId, status: "queued" }, 202);
  } catch (e) {
    return apiError(e);
  }
}
export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await identity(),
      id = (await ctx.params).id,
      jobId = new URL(request.url).searchParams.get("job");
    if (!jobId) throw new ApiError(400, "Provide an extraction id.");
    const job = await readInference(jobId, user.userId);
    if (job.investigationId !== id)
      throw new ApiError(404, "Extraction not found.");
    return json({
      status: job.status,
      error: job.error,
      investigation:
        job.status === "completed"
          ? await loadInvestigation(id, user.userId)
          : undefined,
    });
  } catch (e) {
    return apiError(e);
  }
}

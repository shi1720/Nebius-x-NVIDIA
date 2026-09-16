import {
  claimInference,
  loadInvestigation,
  finishInference,
  bindings,
  json,
  readJson,
  apiError,
} from "@/lib/server";
import { verifyTask } from "@/lib/inference-queue";
import { extractDocuments, modelErrorMessage } from "@/lib/nebius";
import { addAudit } from "@/lib/domain";
export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    await verifyTask(request);
    const { jobId } = await readJson(request, 1000);
    if (typeof jobId !== "string" || !/^[\w-]{1,120}$/.test(jobId))
      return json({ error: "Invalid job" }, 400);
    const job = await claimInference(jobId);
    if (!job) return json({ skipped: true });
    try {
      const inv = await loadInvestigation(job.investigationId, job.owner),
        e = bindings();
      const draft = await extractDocuments(inv.documents, {
        apiKey: e.NEBIUS_API_KEY || "",
        model: e.NEBIUS_MODEL,
        baseUrl: e.NEBIUS_BASE_URL,
      });
      const next = addAudit(
        { ...inv, draft, runs: [...inv.runs, draft.run] },
        "NVIDIA extraction service",
        "Live extraction completed",
        `${draft.run.model} via Nebius. ${draft.issues.length} validation issues. Awaiting human review; the approved graph is unchanged.`,
      );
      await finishInference(jobId, next);
    } catch (e) {
      await finishInference(jobId, undefined, modelErrorMessage(e));
    }
    return json({ processed: true });
  } catch (e) {
    return apiError(e);
  }
}

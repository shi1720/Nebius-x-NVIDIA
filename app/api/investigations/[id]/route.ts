import {
  identity,
  loadInvestigation,
  apiError,
  json,
  sameOrigin,
  bindings,
  ApiError,
} from "@/lib/server";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(_request: Request, ctx: Ctx) {
  try {
    const user = await identity();
    return json({
      investigation: await loadInvestigation(
        (await ctx.params).id,
        user.userId,
      ),
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request, ctx: Ctx) {
  try {
    sameOrigin(request);
    const user = await identity(),
      id = (await ctx.params).id;
    const inv = await loadInvestigation(id, user.userId);
    const deleted = await bindings()
      .DB.prepare(
        "DELETE FROM investigations WHERE id = ? AND owner_id = ? AND NOT EXISTS (SELECT 1 FROM inference_jobs WHERE investigation_id = ? AND status = 'running') RETURNING id",
      )
      .bind(id, user.userId, id)
      .first();
    if (!deleted)
      throw new ApiError(
        409,
        "An extraction is running. Wait for it to complete before deleting this investigation.",
      );
    await bindings()
      .DB.prepare(
        "UPDATE inference_jobs SET result = NULL WHERE investigation_id = ? AND owner_id = ?",
      )
      .bind(id, user.userId)
      .run();
    await Promise.all(
      inv.documents
        .filter((d) => d.storageKey)
        .map((d) => bindings().BUCKET.delete(d.storageKey!)),
    );
    return json({ deleted: true });
  } catch (e) {
    return apiError(e);
  }
}

import {
  identity,
  loadInvestigationSnapshot,
  apiError,
  json,
  sameOrigin,
  deleteInvestigation,
} from "@/lib/server";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(_request: Request, ctx: Ctx) {
  try {
    const user = await identity();
    return json(
      await loadInvestigationSnapshot((await ctx.params).id, user.userId),
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request, ctx: Ctx) {
  try {
    sameOrigin(request);
    const user = await identity(),
      id = (await ctx.params).id;
    await deleteInvestigation(id, user.userId);
    return json({ deleted: true });
  } catch (e) {
    return apiError(e);
  }
}

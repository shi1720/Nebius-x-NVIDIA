import { z } from "zod";
import {
  identity,
  bindings,
  apiError,
  json,
  sameOrigin,
  readJson,
  ApiError,
} from "@/lib/server";
import { sampleInvestigation } from "@/lib/sample";
import { emptyDataset } from "@/lib/domain";
export async function GET() {
  try {
    const user = await identity();
    const rows = await bindings()
      .DB.prepare(
        "SELECT id,title,revision,updated_at FROM investigations WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 40",
      )
      .bind(user.userId)
      .all();
    return json({ investigations: rows.results });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await identity();
    const { mode, title, organization } = z
      .object({
        mode: z.enum(["sample", "empty"]),
        title: z.string().trim().min(3).max(120),
        organization: z.string().trim().min(2).max(100),
      })
      .parse(await readJson(request, 3000));
    const count = await bindings()
      .DB.prepare(
        "SELECT count(*) as total FROM investigations WHERE owner_id = ?",
      )
      .bind(user.userId)
      .first<{ total: number }>();
    if ((count?.total || 0) >= 30)
      throw new ApiError(
        429,
        "You can save up to 30 investigations. Export and delete an old one to make room.",
      );
    const now = new Date().toISOString();
    const inv = {
      ...sampleInvestigation(),
      id: crypto.randomUUID(),
      title,
      organization,
      createdAt: now,
      updatedAt: now,
    };
    if (mode === "empty") {
      inv.dataset = structuredClone(emptyDataset);
      inv.documents = [];
      inv.recalledLotIds = [];
      inv.hazard = "Supplier alert under review";
      inv.isSample = false;
    }
    inv.audit = [
      {
        id: crypto.randomUUID(),
        at: now,
        actor: user.displayName,
        action: "Investigation created",
        detail:
          mode === "sample"
            ? "Copied the clearly labeled synthetic drill into a private workspace."
            : "Created an empty investigation.",
        revision: 1,
      },
    ];
    await bindings()
      .DB.prepare(
        "INSERT INTO investigations (id,owner_id,title,state,revision,updated_at) VALUES (?,?,?,?,?,?)",
      )
      .bind(inv.id, user.userId, inv.title, JSON.stringify(inv), 1, now)
      .run();
    return json({ investigation: inv }, 201);
  } catch (e) {
    return apiError(e);
  }
}

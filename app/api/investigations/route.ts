import { z } from "zod";
import {
  identity,
  listInvestigations,
  createInvestigation,
  apiError,
  json,
  sameOrigin,
  readJson,
} from "@/lib/server";
import { sampleInvestigation } from "@/lib/sample";
import { emptyDataset } from "@/lib/domain";
export async function GET() {
  try {
    const user = await identity();
    return json({ investigations: await listInvestigations(user.userId) });
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
    await createInvestigation(inv, user.userId);
    return json({ investigation: inv }, 201);
  } catch (e) {
    return apiError(e);
  }
}

import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { RESERVE_JOB_SQL } from "./quota";
import type { Investigation } from "./domain";
export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  NEBIUS_API_KEY?: string;
  NEBIUS_MODEL?: string;
  NEBIUS_BASE_URL?: string;
  NEBIUS_DAILY_USER_LIMIT?: string;
  NEBIUS_DAILY_GLOBAL_LIMIT?: string;
};
export const bindings = () => env as unknown as Bindings;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function identity() {
  const user = await getChatGPTUser();
  if (!user)
    throw new ApiError(
      401,
      "Sign in to save investigations and use live extraction.",
    );
  return user;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    throw new ApiError(403, "This request must originate from RecallRoom.");
}
export async function boundedBody(request: Request, maxBytes: number) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new ApiError(413, "Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}
export async function readJson(request: Request, maxBytes = 160000) {
  const body = new TextDecoder().decode(await boundedBody(request, maxBytes));
  try {
    return JSON.parse(body);
  } catch {
    throw new ApiError(400, "Invalid JSON request.");
  }
}
export async function loadInvestigation(id: string, owner: string) {
  const row = await bindings()
    .DB.prepare(
      "SELECT state FROM investigations WHERE id = ? AND owner_id = ?",
    )
    .bind(id, owner)
    .first<{ state: string }>();
  if (!row) throw new ApiError(404, "Investigation not found.");
  return JSON.parse(row.state) as Investigation;
}
export async function saveInvestigation(
  inv: Investigation,
  owner: string,
  expectedRevision: number,
  jobId = "",
) {
  const row = await bindings()
    .DB.prepare(
      "UPDATE investigations SET state = ?, title = ?, revision = ?, updated_at = ? WHERE id = ? AND owner_id = ? AND revision = ? AND NOT EXISTS (SELECT 1 FROM inference_jobs WHERE investigation_id = ? AND status = 'running' AND id != ?) RETURNING id",
    )
    .bind(
      JSON.stringify(inv),
      inv.title,
      inv.revision,
      inv.updatedAt,
      inv.id,
      owner,
      expectedRevision,
      inv.id,
      jobId,
    )
    .first();
  if (!row)
    throw new ApiError(
      409,
      "This investigation changed in another tab or has an active extraction. Reload after extraction finishes before applying your decision.",
    );
}
export async function reserveInference(owner: string, inv: Investigation) {
  const day = new Date().toISOString().slice(0, 10),
    e = bindings(),
    id = crypto.randomUUID(),
    at = new Date().toISOString();
  const userLimit = Math.min(
      50,
      Math.max(1, Number(e.NEBIUS_DAILY_USER_LIMIT) || 20),
    ),
    globalLimit = Math.min(
      1000,
      Math.max(1, Number(e.NEBIUS_DAILY_GLOBAL_LIMIT) || 100),
    );
  await e.DB.prepare(
    "UPDATE inference_jobs SET status = 'abandoned' WHERE investigation_id = ? AND status = 'running' AND started_at < ?",
  )
    .bind(inv.id, new Date(Date.now() - 300000).toISOString())
    .run();
  const row = await e.DB.prepare(RESERVE_JOB_SQL)
    .bind(
      id,
      owner,
      inv.id,
      inv.revision,
      day,
      at,
      owner,
      day,
      userLimit,
      day,
      globalLimit,
      inv.id,
      inv.id,
      owner,
      inv.revision,
    )
    .first();
  if (!row)
    throw new ApiError(
      429,
      "An extraction is already running, or the daily AI budget is reached. No additional inference was started.",
    );
  return id;
}
export async function finishInference(
  id: string,
  result: unknown,
  success: boolean,
) {
  await bindings()
    .DB.prepare(
      "UPDATE inference_jobs SET status = ?, result = ? WHERE id = ? AND EXISTS (SELECT 1 FROM investigations WHERE investigations.id = inference_jobs.investigation_id)",
    )
    .bind(success ? "completed" : "failed", JSON.stringify(result), id)
    .run();
}
export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  if (error instanceof Error && error.name === "ZodError")
    return Response.json(
      { error: "The request contains invalid or missing fields." },
      { status: 400 },
    );
  console.error("RecallRoom request failed", {
    name: error instanceof Error ? error.name : "UnknownError",
  });
  return Response.json(
    {
      error:
        "The service could not complete this request. Your last saved investigation is unchanged. Please retry.",
    },
    { status: 503 },
  );
}
export const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

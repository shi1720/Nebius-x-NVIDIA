import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database, bucket } from "./firebase-admin";
import type { Investigation } from "./domain";
import { createHash } from "node:crypto";
export const bindings = () => process.env;
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
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (!origin || origin !== expected)
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
export const caseRef = (id: string) => {
  if (!/^[\w-]{1,120}$/.test(id))
    throw new ApiError(404, "Investigation not found.");
  return database().collection("investigations").doc(id);
};
const uidKey = (owner: string) =>
  createHash("sha256").update(owner).digest("hex");
const userRef = (owner: string) =>
  database().collection("accounts").doc(uidKey(owner));
function serialize(inv: Investigation) {
  const state = JSON.stringify(inv);
  if (Buffer.byteLength(state) > 850000)
    throw new ApiError(
      413,
      "This investigation is too large. Export it and start a new investigation.",
    );
  return state;
}
function owned(
  data: FirebaseFirestore.DocumentData | undefined,
  owner: string,
) {
  if (!data || data.owner !== owner)
    throw new ApiError(404, "Investigation not found.");
  return data;
}
export async function loadInvestigation(id: string, owner: string) {
  return (await loadInvestigationSnapshot(id, owner)).investigation;
}
export async function loadInvestigationSnapshot(id: string, owner: string) {
  const data = owned((await caseRef(id).get()).data(), owner);
  return {
    investigation: JSON.parse(data.state) as Investigation,
    activeJobId:
      typeof data.activeJob === "string" && data.lockUntil > Date.now()
        ? data.activeJob
        : null,
  };
}
export async function listInvestigations(owner: string) {
  const rows = await database()
    .collection("investigations")
    .where("owner", "==", owner)
    .limit(40)
    .get();
  return rows.docs
    .map((d) => ({
      id: d.id,
      title: d.get("title"),
      revision: d.get("revision"),
      updated_at: d.get("updatedAt"),
    }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function createInvestigation(inv: Investigation, owner: string) {
  const ref = caseRef(inv.id),
    account = userRef(owner),
    state = serialize(inv);
  await database().runTransaction(async (tx) => {
    const a = await tx.get(account);
    if ((a.get("count") || 0) >= 30)
      throw new ApiError(
        429,
        "You can save up to 30 investigations. Export and delete an old one to make room.",
      );
    tx.create(ref, {
      owner,
      state,
      title: inv.title,
      revision: inv.revision,
      updatedAt: inv.updatedAt,
      activeJob: null,
      lockUntil: 0,
    });
    tx.set(account, { count: (a.get("count") || 0) + 1 });
  });
}
export async function saveInvestigation(
  inv: Investigation,
  owner: string,
  expectedRevision: number,
  jobId = "",
) {
  const ref = caseRef(inv.id),
    state = serialize(inv);
  await database().runTransaction(async (tx) => {
    const data = owned((await tx.get(ref)).data(), owner);
    if (
      data.revision !== expectedRevision ||
      (data.activeJob &&
        data.lockUntil > Date.now() &&
        data.activeJob !== jobId)
    )
      throw new ApiError(
        409,
        "This investigation changed in another tab or has an active extraction. Reload before saving.",
      );
    tx.update(ref, {
      state,
      title: inv.title,
      revision: inv.revision,
      updatedAt: inv.updatedAt,
      ...(data.lockUntil <= Date.now()
        ? { activeJob: null, lockUntil: 0 }
        : {}),
    });
  });
}
export async function deleteInvestigation(id: string, owner: string) {
  const ref = caseRef(id),
    account = userRef(owner);
  const inv = await database().runTransaction(async (tx) => {
    const [row, a] = await Promise.all([tx.get(ref), tx.get(account)]);
    const data = owned(row.data(), owner);
    if (data.activeJob && data.lockUntil > Date.now())
      throw new ApiError(
        409,
        "An extraction is running. Wait for it to complete before deleting this investigation.",
      );
    tx.delete(ref);
    tx.set(account, { count: Math.max(0, (a.get("count") || 1) - 1) });
    return JSON.parse(data.state) as Investigation;
  });
  const jobs = await database()
    .collection("inferenceJobs")
    .where("investigationId", "==", id)
    .get();
  await Promise.all(jobs.docs.map((d) => d.ref.delete()));
  await Promise.all(
    inv.documents
      .filter((d) => d.storageKey)
      .map((d) =>
        bucket().file(d.storageKey!).delete({ ignoreNotFound: true }),
      ),
  );
}
export type InferenceJob = {
  owner: string;
  investigationId: string;
  revision: number;
  status: string;
  startedAt: number;
  error?: string;
};
export async function reserveInference(owner: string, inv: Investigation) {
  const day = new Date().toISOString().slice(0, 10),
    db = database(),
    id = crypto.randomUUID(),
    ref = caseRef(inv.id),
    job = db.collection("inferenceJobs").doc(id);
  const daily = db.collection("dailyQuotas").doc(day),
    user = db.collection("dailyQuotas").doc(day + "-" + uidKey(owner));
  const userLimit = Math.min(
      50,
      Math.max(1, Number(process.env.NEBIUS_DAILY_USER_LIMIT) || 20),
    ),
    globalLimit = Math.min(
      1000,
      Math.max(1, Number(process.env.NEBIUS_DAILY_GLOBAL_LIMIT) || 100),
    );
  await db.runTransaction(async (tx) => {
    const [r, g, u] = await Promise.all([
      tx.get(ref),
      tx.get(daily),
      tx.get(user),
    ]);
    const data = owned(r.data(), owner);
    if (data.revision !== inv.revision)
      throw new ApiError(409, "Reload before extraction.");
    if (data.activeJob && data.lockUntil > Date.now())
      throw new ApiError(409, "An extraction is already running.");
    if (
      (g.get("count") || 0) >= globalLimit ||
      (u.get("count") || 0) >= userLimit
    )
      throw new ApiError(
        429,
        "The daily AI budget is reached. No additional inference was started.",
      );
    tx.set(daily, { count: (g.get("count") || 0) + 1 });
    tx.set(user, { count: (u.get("count") || 0) + 1 });
    tx.create(job, {
      owner,
      investigationId: inv.id,
      revision: inv.revision,
      status: "queued",
      startedAt: Date.now(),
    });
    tx.update(ref, { activeJob: id, lockUntil: Date.now() + 300000 });
  });
  return id;
}
export async function claimInference(id: string) {
  const ref = database().collection("inferenceJobs").doc(id);
  return database().runTransaction(async (tx) => {
    const row = await tx.get(ref),
      job = row.data() as InferenceJob | undefined;
    if (!job || job.status !== "queued") return null;
    const inv = owned(
      (await tx.get(caseRef(job.investigationId))).data(),
      job.owner,
    );
    if (inv.activeJob !== id || inv.lockUntil <= Date.now()) {
      tx.update(ref, { status: "abandoned" });
      return null;
    }
    tx.update(ref, { status: "running" });
    return job;
  });
}
export async function readInference(id: string, owner: string) {
  if (!/^[\w-]{1,120}$/.test(id))
    throw new ApiError(404, "Extraction not found.");
  const ref = database().collection("inferenceJobs").doc(id);
  const job = (await ref.get()).data() as InferenceJob | undefined;
  if (!job || job.owner !== owner)
    throw new ApiError(404, "Extraction not found.");
  if (
    ["queued", "running"].includes(job.status) &&
    job.startedAt < Date.now() - 300000
  ) {
    await finishInference(
      id,
      undefined,
      "The extraction timed out. Your approved records are unchanged. You can retry.",
    );
    return {
      ...job,
      status: "failed",
      error: "The extraction timed out. Please retry.",
    };
  }
  return job;
}
export async function finishInference(
  id: string,
  next?: Investigation,
  error?: string,
) {
  const ref = database().collection("inferenceJobs").doc(id);
  await database().runTransaction(async (tx) => {
    const j = await tx.get(ref);
    if (!j.exists) return;
    const job = j.data() as InferenceJob;
    const c = caseRef(job.investigationId),
      row = await tx.get(c);
    if (!row.exists) {
      tx.delete(ref);
      return;
    }
    const data = owned(row.data(), job.owner);
    if (data.activeJob !== id || data.revision !== job.revision) {
      tx.update(ref, {
        status: "failed",
        error: "The investigation changed. Run extraction again.",
      });
      return;
    }
    tx.update(ref, {
      status: error ? "failed" : "completed",
      error: error || null,
      completedAt: Date.now(),
    });
    tx.update(c, {
      activeJob: null,
      lockUntil: 0,
      ...(next && !error
        ? {
            state: serialize(next),
            title: next.title,
            revision: next.revision,
            updatedAt: next.updatedAt,
          }
        : {}),
    });
  });
}
export const putOriginal = async (key: string, bytes: ArrayBuffer) => {
  await bucket().file(key).save(Buffer.from(bytes), {
    resumable: false,
    contentType: "application/octet-stream",
  });
};
export const deleteOriginal = async (key: string) => {
  await bucket().file(key).delete({ ignoreNotFound: true });
};
export const getOriginal = async (key: string) => {
  try {
    const [bytes] = await bucket().file(key).download();
    return new Uint8Array(bytes);
  } catch (e) {
    if ((e as { code?: number }).code === 404) return null;
    throw e;
  }
};
export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return json({ error: error.message }, error.status);
  if (error instanceof Error && error.name === "ZodError")
    return json(
      { error: "The request contains invalid or missing fields." },
      400,
    );
  console.error("RecallRoom request failed", {
    name: error instanceof Error ? error.name : "UnknownError",
  });
  return json(
    {
      error:
        "The service could not complete this request. Your last saved investigation is unchanged. Please retry.",
    },
    503,
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

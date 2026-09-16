/** Bounded operator acceptance against the exact production Firestore functions.
 * npx tsx scripts/test-firebase-operator.ts
 * Uses the operator's gcloud access token in memory. Creates only disposable cases.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import {
  initializeApp,
  deleteApp,
  applicationDefault,
} from "firebase-admin/app";
import { GoogleAuth, OAuth2Client } from "google-auth-library";
import { getFirestore } from "firebase-admin/firestore";
import { sampleInvestigation } from "../lib/sample";
import type { Investigation } from "../lib/domain";

const run = promisify(execFile);
const projectId = "recallroom-ai-2026";
const report: {
  at: string;
  mode: string;
  projectId: string;
  checks: { name: string; passed: boolean; count?: number }[];
  cleanup: { name: string; passed: boolean }[];
  passed: boolean;
  failure?: string;
  limitations: string[];
} = {
  at: new Date().toISOString(),
  mode: "operator-firestore-production-functions",
  projectId,
  checks: [],
  cleanup: [],
  passed: false,
  limitations: [
    "Quota limits are lowered only in this test process to reach boundaries with at most five reservations; deployed service configuration is unchanged.",
    "No inference task is enqueued and no model request is made.",
  ],
};
const check = (name: string, value: unknown, count?: number) => {
  report.checks.push({
    name,
    passed: Boolean(value),
    ...(count === undefined ? {} : { count }),
  });
  if (!value) throw new Error(name);
};
const ids: { inv: Investigation; owner: string }[] = [];
const owners = new Set<string>();
const jobIds: string[] = [];
const ownerKey = (owner: string) =>
  createHash("sha256").update(owner).digest("hex");
const day = new Date().toISOString().slice(0, 10);
let token = "";
let app: ReturnType<typeof initializeApp> | undefined;
let db: ReturnType<typeof getFirestore> | undefined;
let api: typeof import("../lib/server") | undefined;
let reservations = 0;

async function patchLock(id: string, until: number) {
  const root = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/investigations/${id}`;
  const response = await fetch(
    root + "?updateMask.fieldPaths=activeJob&updateMask.fieldPaths=lockUntil",
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          activeJob: { stringValue: "disposable-stale-lock" },
          lockUntil: { integerValue: String(until) },
        },
      }),
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!response.ok)
    throw new Error("Operator could not seed the disposable lock");
}

try {
  token = (
    await run("gcloud", ["auth", "print-access-token"], { timeout: 30000 })
  ).stdout.trim();
  if (!token) throw new Error("Operator access token unavailable");
  process.env.GOOGLE_CLOUD_PROJECT = projectId;
  process.env.STORAGE_BUCKET = "recallroom-ai-2026-evidence";
  process.env.NEBIUS_DAILY_USER_LIMIT = "2";
  process.env.NEBIUS_DAILY_GLOBAL_LIMIT = "100";
  app = initializeApp({
    projectId,
    storageBucket: process.env.STORAGE_BUCKET,
    credential: applicationDefault(),
  });
  db = getFirestore(app);
  const oauth = new OAuth2Client();
  oauth.setCredentials({
    access_token: token,
    expiry_date: Date.now() + 3000000,
  });
  db.settings({
    auth: new GoogleAuth({ authClient: oauth }),
    preferRest: true,
  });
  api = await import("../lib/server");

  const makeCase = async (owner: string) => {
    owners.add(owner);
    const inv = {
      ...sampleInvestigation(),
      id: randomUUID(),
      title: "DISPOSABLE OPERATOR ACCEPTANCE",
    };
    await api!.createInvestigation(inv, owner);
    ids.push({ inv, owner });
    return inv;
  };
  const reserve = async (owner: string, inv: Investigation) => {
    const id = await api!.reserveInference(owner, inv);
    reservations++;
    jobIds.push(id);
    return id;
  };
  const ownerA = "operator-test-" + randomUUID();
  const casesA: Investigation[] = [];
  // Provision sequentially so setup failures cannot race the cleanup block.
  for (let i = 0; i < 6; i++) casesA.push(await makeCase(ownerA));
  const results = await Promise.allSettled(
    casesA.map((inv) => reserve(ownerA, inv)),
  );
  check(
    "Concurrent user quota allows exactly two reservations",
    results.filter((r) => r.status === "fulfilled").length === 2,
    2,
  );
  check(
    "Remaining concurrent user reservations are rejected with 429",
    results
      .filter((r) => r.status === "rejected")
      .every((r) => r.reason?.status === 429),
  );
  const userCounter = await db
    .collection("dailyQuotas")
    .doc(day + "-" + ownerKey(ownerA))
    .get();
  check(
    "Denied reservations do not consume the user budget",
    userCounter.get("count") === 2,
  );

  const ownerB = "operator-test-" + randomUUID();
  const single = await makeCase(ownerB);
  const duplicates = await Promise.allSettled([
    reserve(ownerB, single),
    reserve(ownerB, single),
  ]);
  check(
    "Concurrent extraction of one case reserves one job",
    duplicates.filter((r) => r.status === "fulfilled").length === 1,
  );
  check(
    "Concurrent duplicate is rejected with a lock conflict",
    duplicates.some((r) => r.status === "rejected" && r.reason?.status === 409),
  );

  const globalCount =
    (await db.collection("dailyQuotas").doc(day).get()).get("count") || 0;
  process.env.NEBIUS_DAILY_GLOBAL_LIMIT = String(globalCount + 1);
  const ownerC = "operator-test-" + randomUUID();
  const ownerD = "operator-test-" + randomUUID();
  const globalA = await makeCase(ownerC);
  const globalB = await makeCase(ownerD);
  const globals = await Promise.allSettled([
    reserve(ownerC, globalA),
    reserve(ownerD, globalB),
  ]);
  check(
    "Concurrent global boundary allows one final reservation",
    globals.filter((r) => r.status === "fulfilled").length === 1,
  );
  check(
    "Global budget rejection is explicit 429",
    globals.some((r) => r.status === "rejected" && r.reason?.status === 429),
  );

  const staleOwner = "operator-test-" + randomUUID();
  const stale = await makeCase(staleOwner);
  await patchLock(stale.id, Date.now() - 600000);
  await api.saveInvestigation(
    { ...stale, revision: stale.revision + 1 },
    staleOwner,
    stale.revision,
  );
  const saved = await api.loadInvestigation(stale.id, staleOwner);
  check(
    "Expired extraction lock does not block normal updates",
    saved.revision === stale.revision + 1,
  );
  const lockState = await db.collection("investigations").doc(stale.id).get();
  check(
    "Normal update clears expired activeJob and lockUntil",
    lockState.get("activeJob") === null && lockState.get("lockUntil") === 0,
  );
  await patchLock(stale.id, Date.now() - 600000);
  await api.deleteInvestigation(stale.id, staleOwner);
  check(
    "Expired extraction lock does not block deletion",
    !(await db.collection("investigations").doc(stale.id).get()).exists,
  );
} catch (error) {
  // Never print command stderr, SDK objects or credential-bearing request details.
  report.failure =
    report.checks.at(-1)?.passed === false
      ? report.checks.at(-1)!.name
      : `Operator test interrupted by ${error instanceof Error ? error.name : "unknown error"}: ${
          error instanceof Error
            ? error.message
                .split(token || "\0")
                .join("[REDACTED]")
                .slice(0, 250)
            : "no details"
        }`;
} finally {
  if (db) {
    for (const { inv } of ids) {
      try {
        // These IDs were generated and created by this process only.
        await db.collection("investigations").doc(inv.id).delete();
        report.cleanup.push({ name: "Disposable case removed", passed: true });
      } catch {
        report.cleanup.push({ name: "Disposable case removed", passed: false });
      }
    }
    for (const jobId of jobIds) {
      try {
        await db.collection("inferenceJobs").doc(jobId).delete();
      } catch {
        report.cleanup.push({ name: "Disposable job removed", passed: false });
      }
    }
    try {
      const daily = db.collection("dailyQuotas").doc(day);
      await db.runTransaction(async (tx) => {
        const row = await tx.get(daily);
        const count = row.get("count") || 0;
        if (count < reservations)
          throw new Error("Counter changed unexpectedly");
        if (reservations) tx.set(daily, { count: count - reservations });
      });
      report.cleanup.push({
        name: "Only successful test reservations subtracted from shared daily counter",
        passed: true,
      });
    } catch {
      report.cleanup.push({
        name: "Only successful test reservations subtracted from shared daily counter",
        passed: false,
      });
    }
    for (const owner of owners) {
      try {
        await db
          .collection("dailyQuotas")
          .doc(day + "-" + ownerKey(owner))
          .delete();
        await db.collection("accounts").doc(ownerKey(owner)).delete();
      } catch {
        report.cleanup.push({
          name: "Disposable owner metadata removed",
          passed: false,
        });
      }
    }
  }
  if (app) await deleteApp(app).catch(() => {});
  token = "";
  report.passed =
    !report.failure &&
    report.checks.length > 0 &&
    report.checks.every((c) => c.passed) &&
    report.cleanup.every((c) => c.passed);
  await mkdir("docs/evaluation", { recursive: true });
  await writeFile(
    "docs/evaluation/firebase-operator.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}

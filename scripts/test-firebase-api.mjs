/** Real deployed acceptance checks. Only synthetic disposable accounts and records.
 * Run: RECALLROOM_API_URL=https://<service>.run.app node scripts/test-firebase-api.mjs
 * Add RECALLROOM_OPERATOR_CHECKS=1 for expired-lock seeding and exact GCS-prefix cleanup verification.
 * No model calls. Passwords and Firebase ID tokens stay in memory and are never logged.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const origin = "https://recallroom.web.app";
const report = {
  at: new Date().toISOString(),
  mode: "deployed-firebase-api",
  apiOrigin: null,
  browserOrigin: origin,
  checks: [],
  cleanup: [],
  passed: false,
  limitations: [
    "These requests exercise deployed APIs and real disposable Firebase accounts, not browser UI or Google popup sign-in.",
    "No live model calls are made; this suite does not establish NVIDIA/Nebius extraction quality.",
    "Deletion is verified through application APIs. Internal storage object removal requires a separate operator check.",
  ],
};
const users = [];
const records = [];
let apiOrigin, apiKey;
let operatorToken;

class CheckFailure extends Error {}
function check(name, passed, details = {}, stopOnFailure = true) {
  report.checks.push({ name, passed: Boolean(passed), ...details });
  if (!passed && stopOnFailure) throw new CheckFailure(name);
}
function status(name, response, expected, stopOnFailure = true) {
  check(
    name,
    response.status === expected,
    {
      expectedStatus: expected,
      actualStatus: response.status,
    },
    stopOnFailure,
  );
}
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function firebase(action, body) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000),
    },
  );
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { status: response.status, data };
}

async function api(
  path,
  {
    user,
    token,
    method = "GET",
    body,
    requestOrigin = origin,
    headers: extraHeaders = {},
  } = {},
) {
  const headers = new Headers(extraHeaders);
  headers.set("Origin", requestOrigin);
  const bearer = token ?? user?.idToken;
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
  if (body !== undefined && !(body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const response = await fetch(apiOrigin + path, {
    method,
    headers,
    body:
      body instanceof FormData
        ? body
        : body === undefined
          ? undefined
          : JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
    redirect: "manual",
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  return { status: response.status, headers: response.headers, data, text };
}

function uploadForm(name, original, extracted, revision, type = "text/plain") {
  const form = new FormData();
  form.append("file", new Blob([original], { type }), name);
  form.append("text", extracted);
  form.append("revision", String(revision));
  return form;
}

async function createCase(user, label) {
  const response = await api("/api/investigations", {
    user,
    method: "POST",
    body: {
      mode: "sample",
      title: `DISPOSABLE API ACCEPTANCE ${label}`,
      organization: "Synthetic Acceptance Test",
    },
  });
  // Register successful creations for cleanup before validating their shape.
  if (response.data?.investigation?.id)
    records.push({
      id: response.data.investigation.id,
      user,
      label,
      deleted: false,
    });
  status(`${label}: create private investigation`, response, 201);
  const inv = response.data?.investigation;
  check(
    `${label}: created state includes a revision and synthetic documents`,
    inv &&
      Number.isInteger(inv.revision) &&
      inv.documents?.length > 0 &&
      inv.isSample === true,
  );
  return inv;
}

try {
  if (!process.env.RECALLROOM_API_URL)
    throw new CheckFailure(
      "RECALLROOM_API_URL must identify the deployed RecallRoom API; no requests made",
    );
  const url = new URL(process.env.RECALLROOM_API_URL);
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".run.app") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !["", "/"].includes(url.pathname)
  ) {
    throw new CheckFailure(
      "RECALLROOM_API_URL must be an HTTPS Cloud Run origin without credentials or a path",
    );
  }
  apiOrigin = url.origin;
  report.apiOrigin = apiOrigin;
  const config = JSON.parse(
    await readFile(
      new URL("../public/firebase-config.json", import.meta.url),
      "utf8",
    ),
  );
  if (config.projectId !== "recallroom-ai-2026" || !config.apiKey)
    throw new CheckFailure(
      "Refusing to create test accounts outside the RecallRoom Firebase project",
    );
  apiKey = config.apiKey;
  if (process.env.RECALLROOM_OPERATOR_CHECKS === "1") {
    operatorToken = (
      await promisify(execFile)(process.env.GCLOUD_BIN || "gcloud", ["auth", "print-access-token"], {
        timeout: 30000,
      })
    ).stdout.trim();
    if (!operatorToken)
      throw new CheckFailure(
        "Operator token unavailable for storage cleanup verification",
      );
    report.limitations = report.limitations.filter(
      (item) => !item.startsWith("Deletion is verified"),
    );
  }

  status(
    "Anonymous investigations list is rejected",
    await api("/api/investigations"),
    401,
  );
  status(
    "Forged legacy identity headers are rejected",
    await api("/api/investigations", {
      headers: {
        "oai-authenticated-user-id": "forged-test-user",
        "oai-authenticated-user-email": "forged@example.invalid",
      },
    }),
    401,
  );
  status(
    "Tampered bearer token is rejected",
    await api("/api/investigations", { token: "invalid.firebase.token" }),
    401,
  );
  status(
    "Task endpoint rejects a missing identity",
    await api("/api/tasks/extract", {
      method: "POST",
      body: { jobId: "disposable-not-a-job" },
    }),
    401,
  );
  status(
    "Task endpoint rejects an invalid identity",
    await api("/api/tasks/extract", {
      method: "POST",
      token: "invalid.task.token",
      body: { jobId: "disposable-not-a-job" },
    }),
    401,
    false,
  );

  for (const label of ["account-a", "account-b"]) {
    const credential = {
      email: `recallroom-test-${randomUUID()}@example.invalid`,
      password: `Aa9!${randomBytes(32).toString("base64url")}`,
      returnSecureToken: true,
    };
    const response = await firebase("signUp", credential);
    if (response.data?.idToken)
      users.push({ label, idToken: response.data.idToken });
    status(`${label}: disposable Firebase account created`, response, 200);
    check(
      `${label}: Firebase issued an ID token`,
      typeof response.data?.idToken === "string" &&
        response.data.idToken.length > 100,
    );
  }
  const [a, b] = users;
  const wrongTask = await api("/api/tasks/extract", {
    method: "POST",
    user: a,
    body: { jobId: "disposable-not-a-job" },
  });
  check(
    "Task endpoint rejects a normal Firebase user",
    [401, 403].includes(wrongTask.status),
    { actualStatus: wrongTask.status },
    false,
  );
  status(
    "Cross-origin create is rejected",
    await api("/api/investigations", {
      user: a,
      method: "POST",
      requestOrigin: "https://untrusted.example.invalid",
      body: {
        mode: "sample",
        title: "SHOULD NOT EXIST",
        organization: "Synthetic Test",
      },
    }),
    403,
  );
  const preflight = await api("/api/investigations", {
    method: "OPTIONS",
    headers: {
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization,content-type",
    },
  });
  check(
    "Allowed-origin CORS preflight succeeds",
    [200, 204].includes(preflight.status),
    { actualStatus: preflight.status },
  );
  check(
    "CORS allow-origin is the exact deployed frontend",
    preflight.headers.get("access-control-allow-origin") === origin,
  );
  check(
    "CORS allows authorization headers",
    /authorization/i.test(
      preflight.headers.get("access-control-allow-headers") || "",
    ),
  );

  let inv = await createCase(a, "case-a");
  const second = await createCase(b, "case-b");
  const path = `/api/investigations/${inv.id}`;
  const action = path + "/actions";
  let response = await api(path, { user: a });
  status("Owner can reload private state", response, 200);
  check(
    "Reload preserves saved investigation and revision",
    response.data?.investigation?.id === inv.id &&
      response.data.investigation.revision === inv.revision,
  );
  response = await api("/api/investigations", { user: a });
  status("Owner can list saved investigations", response, 200);
  check(
    "Account A list includes only its own case",
    response.data?.investigations?.some((record) => record.id === inv.id) &&
      !response.data.investigations.some((record) => record.id === second.id),
  );
  response = await api("/api/investigations", { user: b });
  check(
    "Account B list includes only its own case",
    response.status === 200 &&
      response.data?.investigations?.some(
        (record) => record.id === second.id,
      ) &&
      !response.data.investigations.some((record) => record.id === inv.id),
  );
  status(
    "Another account cannot read the case",
    await api(path, { user: b }),
    404,
  );
  status(
    "Another account cannot update the case",
    await api(action, {
      user: b,
      method: "POST",
      body: { action: "export", revision: inv.revision },
    }),
    404,
  );
  status(
    "Another account cannot delete the case",
    await api(path, { user: b, method: "DELETE" }),
    404,
  );
  status(
    "Another account cannot download fixture originals",
    await api(
      path + "/documents?document=" + encodeURIComponent(inv.documents[0].id),
      { user: b },
    ),
    404,
  );
  status(
    "Unknown recalled lot is rejected",
    await api(action, {
      user: a,
      method: "POST",
      body: {
        action: "set-recall",
        revision: inv.revision,
        lotIds: ["NOT-IN-RECORDS"],
        hazard: "Synthetic invalid-root test",
      },
    }),
    400,
  );
  status(
    "An absent extraction draft cannot be approved",
    await api(action, {
      user: a,
      method: "POST",
      body: {
        action: "approve-draft",
        revision: inv.revision,
        draftId: "not-a-real-draft",
        dataset: inv.dataset,
      },
    }),
    409,
  );
  const priorRevision = inv.revision;
  response = await api(action, {
    user: a,
    method: "POST",
    body: {
      action: "resolve",
      revision: inv.revision,
      linkId: "USE-003",
      decision: "excluded",
      evidence: {
        documentId: "correction",
        quote: "No PB-0901-A was used in this batch.",
      },
      note: "The synthetic signed source excludes the recalled lot.",
    },
  });
  status("Source-backed review persists", response, 200);
  inv = response.data.investigation;
  check(
    "Excluded relationship and decision history persist together",
    inv.revision === priorRevision + 1 &&
      !inv.dataset.links.some((link) => link.id === "USE-003") &&
      inv.decisions.some(
        (decision) =>
          decision.linkBefore.id === "USE-003" &&
          decision.decision === "excluded",
      ),
  );
  status(
    "Stale revision cannot overwrite a decision",
    await api(action, {
      user: a,
      method: "POST",
      body: { action: "export", revision: priorRevision },
    }),
    409,
  );
  response = await api(path, { user: a });
  check(
    "Review survives a fresh API read",
    response.status === 200 &&
      response.data?.investigation?.revision === inv.revision &&
      response.data.investigation.decisions.length === inv.decisions.length,
  );

  const original =
    "SYNTHETIC ACCEPTANCE RECORD\nOriginal server text. No real customer data.";
  response = await api(path + "/documents", {
    user: a,
    method: "POST",
    body: uploadForm(
      "acceptance-evidence.txt",
      original,
      "FABRICATED CLIENT TEXT",
      inv.revision,
    ),
  });
  status("Synthetic TXT upload succeeds", response, 200);
  inv = response.data.investigation;
  const textDoc = inv.documents.at(-1);
  check(
    "Server extracts TXT from original bytes",
    textDoc.text === original && textDoc.text !== "FABRICATED CLIENT TEXT",
  );
  check(
    "Original and extracted text hashes match actual TXT bytes",
    textDoc.sha256 === sha256(original) &&
      textDoc.textSha256 === sha256(original),
  );
  check(
    "TXT provenance is verified and source review is required",
    textDoc.textVerified === true &&
      textDoc.extractionMethod === "server-text" &&
      inv.needsSourceReview === true,
  );
  status(
    "Duplicate original bytes are rejected even with a new filename",
    await api(path + "/documents", {
      user: a,
      method: "POST",
      body: uploadForm(
        "renamed-evidence.txt",
        original,
        original,
        inv.revision,
      ),
    }),
    409,
  );
  const originalPath =
    path + "/documents?document=" + encodeURIComponent(textDoc.id);
  status(
    "Anonymous original download is rejected",
    await api(originalPath),
    401,
  );
  status(
    "Another account cannot download uploaded originals",
    await api(originalPath, { user: b }),
    404,
  );
  response = await api(originalPath, { user: a });
  status("Owner can retrieve uploaded original", response, 200);
  check("Downloaded original bytes are unchanged", response.text === original);
  check(
    "Private original is not cacheable",
    /no-store/.test(response.headers.get("cache-control") || ""),
  );

  const pdfBytes = await readFile(
    new URL(
      "../public/samples/06_signed_batch_clarification.pdf",
      import.meta.url,
    ),
  );
  const pdfText =
    "SYNTHETIC SUPPORTING RECORD\n10 kg of PB-0901-B was consumed in COO-0904. No PB-0901-A was used in this batch.";
  response = await api(path + "/documents", {
    user: a,
    method: "POST",
    body: uploadForm(
      "synthetic-clarification.pdf",
      pdfBytes,
      pdfText,
      inv.revision,
      "application/pdf",
    ),
  });
  status("Synthetic PDF upload succeeds", response, 200);
  inv = response.data.investigation;
  const pdfDoc = inv.documents.at(-1);
  check(
    "PDF client text remains unverified with separate hashes",
    pdfDoc.textVerified === false &&
      pdfDoc.extractionMethod === "browser-pdf" &&
      pdfDoc.sha256 === sha256(pdfBytes) &&
      // Multipart fields normalize line endings on the wire; bind the digest to stored text.
      pdfDoc.text.replace(/\r\n/g, "\n") === pdfText &&
      pdfDoc.textSha256 === sha256(pdfDoc.text),
  );
  status(
    "Unverified PDF cannot authorize a review decision",
    await api(action, {
      user: a,
      method: "POST",
      body: {
        action: "resolve",
        revision: inv.revision,
        linkId: "USE-004",
        decision: "confirmed",
        evidence: {
          documentId: pdfDoc.id,
          quote: "10 kg of PB-0901-B was consumed in COO-0904.",
        },
        note: "Synthetic PDF text has not been reviewed yet.",
      },
    }),
    400,
  );
  status(
    "Verification with a stale text hash is rejected",
    await api(action, {
      user: a,
      method: "POST",
      body: {
        action: "verify-document",
        revision: inv.revision,
        documentId: pdfDoc.id,
        textSha256: "0".repeat(64),
      },
    }),
    409,
  );
  response = await api(action, {
    user: a,
    method: "POST",
    body: {
      action: "verify-document",
      revision: inv.revision,
      documentId: pdfDoc.id,
      textSha256: pdfDoc.textSha256,
    },
  });
  status("Reviewer can attest current PDF text hash", response, 200);
  inv = response.data.investigation;
  check(
    "PDF verification is persisted without clearing source review",
    inv.documents.find((doc) => doc.id === pdfDoc.id)?.textVerified === true &&
      inv.needsSourceReview === true,
  );
  status(
    "Mismatched draft remains rejected after PDF verification",
    await api(action, {
      user: a,
      method: "POST",
      body: {
        action: "approve-draft",
        revision: inv.revision,
        draftId: "not-a-real-draft",
        dataset: inv.dataset,
      },
    }),
    409,
  );
  response = await api(action, {
    user: a,
    method: "POST",
    body: { action: "export", revision: inv.revision },
  });
  status("Preliminary export audit can be recorded", response, 200);
  inv = response.data.investigation;
  check(
    "Export audit retains source freshness and preliminary status",
    inv.needsSourceReview === true &&
      /preliminary/i.test(inv.audit.at(-1)?.detail || ""),
  );

  if (operatorToken) {
    const ref = `https://firestore.googleapis.com/v1/projects/recallroom-ai-2026/databases/(default)/documents/investigations/${inv.id}`;
    const seedExpiredLock = async (until = Date.now() - 600000) => {
      const seeded = await fetch(
        ref +
          "?updateMask.fieldPaths=activeJob&updateMask.fieldPaths=lockUntil",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${operatorToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              activeJob: { stringValue: "synthetic-expired-job" },
              lockUntil: { integerValue: String(until) },
            },
          }),
          signal: AbortSignal.timeout(30000),
        },
      );
      if (!seeded.ok)
        throw new CheckFailure(
          "Operator could not seed expired lock on disposable case",
        );
    };
    let recovery;
    try {
      await seedExpiredLock(Date.now() + 60000);
      recovery = await api(path, { user: a });
    } finally {
      await seedExpiredLock();
    }
    check(
      "Owned case response exposes its active job for fresh-tab recovery",
      recovery?.status === 200 &&
        recovery.data?.activeJobId === "synthetic-expired-job",
    );
    const expired = await api(path, { user: a });
    check(
      "Expired job is not offered as an active recovery target",
      expired.status === 200 && expired.data?.activeJobId === null,
    );
    response = await api(action, {
      user: a,
      method: "POST",
      body: { action: "export", revision: inv.revision },
    });
    status(
      "Expired extraction lock permits a normal deployed update",
      response,
      200,
    );
    inv = response.data.investigation;
    const state = await fetch(ref, {
      headers: { Authorization: `Bearer ${operatorToken}` },
      signal: AbortSignal.timeout(30000),
    });
    const row = await state.json();
    check(
      "Normal deployed update clears expired lock metadata",
      state.ok &&
        row.fields?.activeJob?.nullValue === null &&
        row.fields?.lockUntil?.integerValue === "0",
    );
    await seedExpiredLock();
  }

  status(
    operatorToken
      ? "Owner can delete its case despite an expired extraction lock"
      : "Owner can delete its disposable case",
    await api(path, { user: a, method: "DELETE" }),
    200,
  );
  records.find((record) => record.id === inv.id).deleted = true;
  status("Deleted case is inaccessible", await api(path, { user: a }), 404);
  status(
    "Deleted case originals are inaccessible",
    await api(originalPath, { user: a }),
    404,
  );
  response = await api("/api/investigations", { user: a });
  check(
    "Deleted case disappears from its owner list",
    response.status === 200 &&
      Array.isArray(response.data?.investigations) &&
      !response.data.investigations.some((record) => record.id === inv.id),
  );
} catch (error) {
  report.failure =
    error instanceof CheckFailure
      ? error.message
      : `Acceptance run interrupted by ${error instanceof Error ? error.name : "an unknown error"}; inspect the failing step without logging credentials`;
} finally {
  for (const record of records) {
    if (record.deleted) {
      report.cleanup.push({
        kind: "investigation",
        label: record.label,
        passed: true,
      });
      continue;
    }
    try {
      const response = await api(`/api/investigations/${record.id}`, {
        user: record.user,
        method: "DELETE",
      });
      report.cleanup.push({
        kind: "investigation",
        label: record.label,
        passed: [200, 404].includes(response.status),
        status: response.status,
      });
    } catch {
      report.cleanup.push({
        kind: "investigation",
        label: record.label,
        passed: false,
        reason: "Cleanup request did not complete",
      });
    }
  }
  for (const user of users) {
    try {
      const response = await firebase("delete", { idToken: user.idToken });
      report.cleanup.push({
        kind: "firebase-account",
        label: user.label,
        passed: response.status === 200,
        status: response.status,
      });
    } catch {
      report.cleanup.push({
        kind: "firebase-account",
        label: user.label,
        passed: false,
        reason: "Account cleanup request did not complete",
      });
    }
  }
  if (operatorToken) {
    for (const record of records) {
      try {
        const storage = await fetch(
          `https://storage.googleapis.com/storage/v1/b/recallroom-ai-2026-evidence/o?prefix=${encodeURIComponent(record.id + "/")}`,
          {
            headers: { Authorization: `Bearer ${operatorToken}` },
            signal: AbortSignal.timeout(30000),
          },
        );
        const contents = await storage.json();
        const count =
          storage.ok && Array.isArray(contents.items)
            ? contents.items.length
            : storage.ok
              ? 0
              : null;
        report.cleanup.push({
          kind: "storage-prefix",
          label: record.label,
          passed: storage.ok && count === 0 && !contents.nextPageToken,
          remainingObjects: count,
          status: storage.status,
        });
      } catch {
        report.cleanup.push({
          kind: "storage-prefix",
          label: record.label,
          passed: false,
          reason: "Operator storage verification did not complete",
        });
      }
    }
    operatorToken = undefined;
  }
  report.counts = {
    passed: report.checks.filter((item) => item.passed).length,
    failed: report.checks.filter((item) => !item.passed).length,
  };
  report.passed =
    !report.failure &&
    report.checks.length > 0 &&
    report.checks.every((item) => item.passed) &&
    report.cleanup.every((item) => item.passed);
  const dir = new URL("../docs/evaluation/", import.meta.url);
  await mkdir(dir, { recursive: true });
  await writeFile(
    new URL("firebase-api.json", dir),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}

import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://localhost:5173";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error(
    "This integration suite creates/deletes synthetic records. Run only against local development.",
  );
let checks = 0;
const ok = (value, msg) => {
  assert.ok(value, msg);
  checks++;
};
const raw = async (path, options = {}) => fetch(base + path, options);
let r = await raw("/api/investigations");
ok(r.status === 401, "Anonymous list must be rejected");
r = await raw("/api/investigations", {
  headers: {
    "oai-authenticated-user-id": "local_seedy",
    "oai-authenticated-user-email": "attacker@example.test",
  },
});
ok(r.status === 401, "Local gateway must strip forged identity headers");
r = await raw("/signin-with-chatgpt?return_to=%2Fworkspace", {
  redirect: "manual",
});
ok(r.status === 302, "Local sign-in returns a redirect");
const cookie = r.headers.get("set-cookie")?.split(";")[0];
ok(cookie, "Local sign-in cookie exists");
const api = async (path, method = "GET", body, origin = base) => {
  const headers = { Cookie: cookie, Origin: origin };
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";
  const response = await raw(path, {
    method,
    headers,
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { error: text };
  }
  return { status: response.status, ...json };
};
r = await api(
  "/api/investigations",
  "POST",
  { mode: "sample", title: "API TEST DISPOSABLE", organization: "Local test" },
  "https://evil.example",
);
ok(r.status === 403, "Cross-site mutation blocked");
const created = await api("/api/investigations", "POST", {
  mode: "sample",
  title: "API TEST DISPOSABLE",
  organization: "Local test",
});
ok(created.status === 201, "Creates private investigation");
let inv = created.investigation;
try {
  r = await api("/api/investigations/" + inv.id);
  ok(r.investigation.id === inv.id, "Reads owned investigation");
  r = await api("/api/investigations/does-not-exist");
  ok(r.status === 404, "Unknown investigation hidden");
  const path = "/api/investigations/" + inv.id + "/actions";
  r = await api(path, "POST", {
    action: "set-recall",
    revision: inv.revision,
    lotIds: ["MISSING"],
    hazard: "Invalid test root",
  });
  ok(r.status === 400, "Unknown root rejected");
  r = await api(path, "POST", {
    action: "resolve",
    revision: inv.revision,
    linkId: "USE-003",
    decision: "excluded",
    evidence: { documentId: "correction", quote: "Fabricated all clear" },
    note: "A sufficiently long fake reason.",
  });
  ok(r.status === 400, "Fabricated evidence rejected");
  r = await api(path, "POST", {
    action: "resolve",
    revision: inv.revision,
    linkId: "USE-003",
    decision: "excluded",
    evidence: {
      documentId: "correction",
      quote: "No PB-0901-A was used in this batch.",
    },
    note: "The signed source excludes the recalled lot.",
  });
  ok(r.status === 200, "Valid review saved");
  ok(
    r.investigation.decisions[0].linkBefore.id === "USE-003",
    "Structured excluded link is retained",
  );
  const old = inv.revision;
  inv = r.investigation;
  r = await api(path, "POST", { action: "export", revision: old });
  ok(r.status === 409, "Stale revision cannot mutate state");
  r = await api("/api/investigations/" + inv.id);
  ok(r.investigation.revision === inv.revision, "Mutation survives reload");
  const form = new FormData();
  form.append(
    "file",
    new Blob(["AUTHENTIC ORIGINAL TEXT"], { type: "text/plain" }),
    "evidence.txt",
  );
  form.append("text", "FABRICATED CLIENT TEXT");
  form.append("revision", String(inv.revision));
  r = await api("/api/investigations/" + inv.id + "/documents", "POST", form);
  ok(r.status === 200, "Source upload succeeds");
  inv = r.investigation;
  const doc = inv.documents.at(-1);
  ok(
    doc.text === "AUTHENTIC ORIGINAL TEXT",
    "Server derives plain text from original bytes",
  );
  ok(
    doc.textVerified === true && doc.sha256 === doc.textSha256,
    "Plain text provenance is bound to original",
  );
  const duplicate = new FormData();
  duplicate.append(
    "file",
    new Blob(["AUTHENTIC ORIGINAL TEXT"], { type: "text/plain" }),
    "renamed.txt",
  );
  duplicate.append("text", "unused");
  duplicate.append("revision", String(inv.revision));
  r = await api(
    "/api/investigations/" + inv.id + "/documents",
    "POST",
    duplicate,
  );
  ok(r.status === 409, "Duplicate original bytes rejected");
  const pdf = new FormData();
  pdf.append(
    "file",
    new Blob(["%PDF-1.4\nSynthetic test payload"], { type: "application/pdf" }),
    "verification-test.pdf",
  );
  pdf.append(
    "text",
    "The original was not checked. Do not trust this candidate.",
  );
  pdf.append("revision", String(inv.revision));
  r = await api("/api/investigations/" + inv.id + "/documents", "POST", pdf);
  ok(r.status === 200, "PDF text accepted only as unverified candidate");
  inv = r.investigation;
  const pdfDoc = inv.documents.at(-1);
  ok(pdfDoc.textVerified === false, "PDF extraction is unverified");
  r = await api(path, "POST", {
    action: "resolve",
    revision: inv.revision,
    linkId: "USE-004",
    decision: "confirmed",
    evidence: { documentId: pdfDoc.id, quote: pdfDoc.text },
    note: "This fabricated PDF should never authorize a decision.",
  });
  ok(
    r.status === 400,
    "Unverified PDF cannot authorize a relationship decision",
  );
  const anonymous = await raw(
    "/api/investigations/" + inv.id + "/documents?document=" + doc.id,
  );
  ok(anonymous.status === 401, "Original downloads require identity");
  const original = await raw(
    "/api/investigations/" + inv.id + "/documents?document=" + doc.id,
    { headers: { Cookie: cookie } },
  );
  ok(original.status === 200, "Owner can download original");
  ok(
    (await original.text()) === "AUTHENTIC ORIGINAL TEXT",
    "Downloaded original is unchanged",
  );
  const config = await (await raw("/api/config")).json();
  if (!config.liveAvailable) {
    r = await api("/api/investigations/" + inv.id + "/analyze", "POST", {
      revision: inv.revision,
    });
    ok(
      (r.status === 503 && r.error.includes("No sample output")) ||
        (r.status === 503 && r.error.includes("no sample output")),
      "Missing key produces explicit failure, not fake inference",
    );
  }
} finally {
  r = await api("/api/investigations/" + inv.id, "DELETE");
  ok(r.status === 200, "Disposable test investigation deleted");
  r = await api("/api/investigations/" + inv.id);
  ok(r.status === 404, "Deleted investigation cannot be read");
}
console.log(
  `PASS: ${checks} API integration checks against local D1/R2 and the authentication gateway.`,
);

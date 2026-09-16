import { trace, type Investigation } from "./domain";
export const escapeHtml = (value: unknown) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
/** Neutralize spreadsheet formulas in text cells, including tab/CR prefixes. */
export const csvCell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[\s]*[=+@-]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};
export function shipmentCsv(inv: Investigation) {
  const t = trace(inv.dataset, inv.recalledLotIds, inv.documents);
  const rows = [
    [
      "investigation_id",
      "revision",
      "shipment_id",
      "lot_id",
      "customer",
      "quantity",
      "unit",
      "shipment_date",
      "scope",
      "source_document",
      "source_quote",
    ],
    ...t.shipments.map((s) => [
      inv.id,
      inv.revision,
      s.id,
      s.lotId,
      s.customer,
      s.quantity,
      s.unit,
      s.date,
      s.status === "outside"
        ? "outside recorded path (not safety clearance)"
        : s.status,
      s.evidence.documentId,
      s.evidence.quote,
    ]),
  ];
  return "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
export function customerDraft(inv: Investigation, customer: string) {
  const t = trace(inv.dataset, inv.recalledLotIds, inv.documents),
    shipments = t.shipments.filter(
      (s) => s.customer === customer && s.status !== "outside",
    );
  return `DRAFT — QUALITY REVIEW REQUIRED — NOT SENT\n${inv.isSample ? "SYNTHETIC RECALL DRILL — FICTIONAL SCENARIO\n" : ""}\nTo: ${customer}\nSubject: Product hold request — ${inv.organization} — ${inv.title}\n\nWe are investigating a supplier alert involving ${inv.recalledLotIds.join(", ")}: ${inv.hazard}.\n\nPlease locate and segregate the following recorded shipments pending instructions from your quality contact:\n${shipments.map((s) => `• ${s.lotId} | Shipment ${s.id} | ${s.quantity} ${s.unit} | ${s.date} | ${s.status === "hold" ? "PRECAUTIONARY HOLD — relationship unresolved" : "CONFIRMED RECORDED CONNECTION"}`).join("\n")}\n\nPlease confirm quantities received, remaining, and redistributed, and identify any downstream recipients. The listed shipment quantities are historical dispatch records, not a confirmed count currently held at your site.\n\nA quality manager must verify recipients, identifiers, hazard details, and response instructions before sending. No message has been sent by RecallRoom.\n\nPrepared from RecallRoom investigation ${inv.id}, revision ${inv.revision}.\n`;
}
export function packetHtml(inv: Investigation) {
  const t = trace(inv.dataset, inv.recalledLotIds, inv.documents),
    e = escapeHtml;
  const customers = [
    ...new Set(
      t.shipments.filter((s) => s.status !== "outside").map((s) => s.customer),
    ),
  ];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RecallRoom · Investigation packet</title><style>body{font:14px/1.6 system-ui,sans-serif;color:#18343a;max-width:1080px;margin:40px auto;padding:0 30px}h1{font-size:36px;letter-spacing:-1px}h2{font-size:21px;margin-top:36px;border-bottom:1px solid #ccd8d9;padding-bottom:9px}h3{font-size:16px}.brand{color:#136956;font-weight:750;letter-spacing:1px}.label{background:#fff2d6;border:1px solid #d9ba76;padding:16px}.metrics{display:flex;gap:40px;padding:20px 0}.metrics strong{display:block;font-size:30px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #dbe3e4;text-align:left;padding:8px;vertical-align:top;overflow-wrap:anywhere}th{background:#edf3f1}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.6 monospace;border:1px solid #dbe3e4;padding:18px;background:#fafcfc}blockquote{border-left:3px solid #74a393;margin:10px 0;padding:10px 16px;background:#f4f8f6}small{color:#627c81}.no-print button{padding:10px 16px;background:#136956;color:#fff;border:0;border-radius:5px;cursor:pointer}@media print{body{margin:0;padding:10mm;font-size:10pt}.no-print{display:none}h2{break-after:avoid}tr,blockquote{break-inside:avoid}pre{font-size:8pt}thead{display:table-header-group}@page{size:A4;margin:12mm}</style></head><body><div class="brand">RECALLROOM / INVESTIGATION PACKET</div><h1>${e(inv.title)}</h1><p>${e(inv.organization)} · Revision ${inv.revision} · Generated ${e(new Date().toISOString())}</p><div class="label"><strong>${inv.isSample ? "SYNTHETIC RECALL DRILL · " : ""}${t.canFinalize ? "RECORDED SCOPE REVIEWED" : "PRELIMINARY · OPEN QUESTIONS REMAIN"}</strong><br>This packet describes available records, not a food-safety certification. Outside the recorded path does not mean safe. A responsible quality manager must verify completeness and decide actions.</div><div class="no-print"><p>Save a PDF using your browser’s Print → Save as PDF.</p><button onclick="window.print()">Print / save PDF</button></div><h2>1. Scope and quantities</h2><p><strong>Alert:</strong> ${e(inv.hazard)}<br><strong>Recalled lots:</strong> ${e(inv.recalledLotIds.join(", ") || "Not selected")}</p><div class="metrics"><div><strong>${t.confirmedUnits}</strong>affected output units</div><div><strong>${t.holdUnits}</strong>units on hold</div><div><strong>${t.shippedUnits}</strong>affected shipped units</div></div><p>${t.onSiteRange.min === t.onSiteRange.max ? t.onSiteUnits : `${t.onSiteRange.min}–${t.onSiteRange.max}`} affected units remain on site according to recorded production, use and dispatch. ${t.outsideUnits} output units are outside the recorded path. ${t.holdShippedUnits} shipped units remain under precautionary hold. Unit totals subtract confirmed intermediate consumption to avoid counting the same tracked units twice. Possible consumption creates a range; displayed headline totals are its upper bound.</p><h3>Recalled ingredient stock (separate units)</h3><table><thead><tr><th>Lot</th><th>Received</th><th>Confirmed use</th><th>Possible use</th><th>Remaining range</th></tr></thead><tbody>${t.balances
    .filter((b) => inv.recalledLotIds.includes(b.lotId) && b.unit === "kg")
    .map(
      (b) =>
        `<tr><td>${e(b.lotId)}</td><td>${b.received} kg</td><td>${b.consumed} kg</td><td>${b.possibleConsumption} kg</td><td>${b.minRemaining}–${b.maxRemaining} kg</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table><h2>2. Shipment register</h2><table><thead><tr><th>Shipment / lot</th><th>Customer</th><th>Quantity</th><th>Date</th><th>Scope</th><th>Source</th></tr></thead><tbody>${t.shipments.map((s) => `<tr><td>${e(s.id)}<br>${e(s.lotId)}</td><td>${e(s.customer)}</td><td>${s.quantity} ${s.unit}</td><td>${e(s.date)}</td><td>${e(s.status === "outside" ? "Outside recorded path" : s.status)}</td><td>${e(s.evidence.documentId)}</td></tr>`).join("")}</tbody></table><h2>3. Unresolved evidence</h2>${[...t.issues.map((i) => i.message), ...inv.dataset.links.filter((l) => l.certainty === "possible").map((l) => `${l.id}: ${l.from} → ${l.to}. ${l.note}`)].map((m) => `<p>• ${e(m)}</p>`).join("") || "<p>No unresolved relationships or validation issues in these records. This does not verify external record completeness.</p>"}<h2>4. Evidence ledger</h2>${[...inv.dataset.lots, ...inv.dataset.links, ...inv.dataset.shipments].map((r) => `<p><strong>${e(r.id)}</strong> · ${e(r.evidence.documentId)}</p><blockquote>${e(r.evidence.quote)}</blockquote>`).join("")}<h3>Reviewed relationships, including exclusions</h3>${(inv.decisions || []).map((d) => `<p><strong>${e(d.linkBefore.id)} · ${e(d.decision)}</strong> · ${e(d.linkBefore.from)} → ${e(d.linkBefore.to)} · ${d.linkBefore.quantity} ${d.linkBefore.unit}<br>${e(d.actor)} · revision ${d.revision} · ${e(d.reason)}</p><blockquote>${e(d.evidence.quote)}<br><small>Source ${e(d.evidence.documentId)}</small></blockquote>`).join("") || "<p>No relationship decisions recorded.</p>"}<h2>5. Decision history</h2><table><thead><tr><th>Revision / time</th><th>Reviewer</th><th>Action</th></tr></thead><tbody>${inv.audit.map((a) => `<tr><td>${a.revision}<br>${e(a.at)}</td><td>${e(a.actor)}</td><td><strong>${e(a.action)}</strong><br>${e(a.detail)}</td></tr>`).join("")}</tbody></table><h2>6. Customer-specific drafts</h2><p>These are deterministic templates populated from the approved trace. Review and send through your normal incident process.</p>${customers.map((c) => `<h3>${e(c)}</h3><pre>${e(customerDraft(inv, c))}</pre>`).join("")}<h2>7. Provenance and model runs</h2><p>Trace reachability and quantity checks are calculated in code. Model extraction requires separate human approval.</p>${inv.runs.length ? inv.runs.map((r) => `<p>${e(r.provider)} · ${e(r.model)} · ${e(r.promptVersion)}<br>${r.inputTokens} input / ${r.outputTokens} output tokens · ${r.latencyMs} ms · estimated $${r.estimatedCostUsd.toFixed(6)}<br>Request: ${e(r.requestId)}</p>`).join("") : "<p>No live AI extraction was run for this investigation. Sample data was authored deterministically.</p>"}<h2>8. Source manifest</h2><table><thead><tr><th>Document</th><th>Original and extracted-text provenance</th></tr></thead><tbody>${inv.documents.map((d) => `<tr><td>${e(d.id)}<br>${e(d.name)}</td><td>Original: ${e(d.sha256 || "Synthetic fixture; see repository version")}<br>Text: ${e(d.textSha256 || "Fixture")}<br>Method: ${e(d.extractionMethod || "synthetic")}<br>${d.textVerified === false ? "UNVERIFIED TEXT" : "Text provenance reviewed"}</td></tr>`).join("")}</tbody></table><p><small>RecallRoom · Created by Shivam Gupta with AI-assisted implementation. The packet includes sensitive evidence; share only with appropriate recipients.</small></p></body></html>`;
}
export function downloadText(
  name: string,
  content: string,
  type = "text/plain",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

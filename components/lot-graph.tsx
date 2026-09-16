"use client";
import {
  Leaf,
  Package,
  Boxes,
  ArrowUpRight,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Network,
} from "lucide-react";
import { trace, type Investigation, type Status } from "@/lib/domain";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
export const statusLabel = (s: Status) =>
  s === "affected" ? "Affected" : s === "hold" ? "On hold" : "Outside path";
export default function LotGraph({
  inv,
  onInspect,
}: {
  inv: Investigation;
  onInspect: (id: string) => void;
}) {
  const t = trace(inv.dataset, inv.recalledLotIds, inv.documents),
    ingredients = inv.dataset.lots.filter((l) => l.kind === "ingredient"),
    batches = inv.dataset.lots.filter((l) => l.kind === "finished");
  const customers = [...new Set(inv.dataset.shipments.map((s) => s.customer))];
  const height = Math.max(
    470,
    batches.length * 107 + 30,
    customers.length * 110 + 80,
    ingredients.length * 130 + 40,
  );
  const positions: Record<string, { x: number; y: number }> = {};
  ingredients.forEach(
    (l, i) =>
      (positions[l.id] = {
        x: 10,
        y:
          ingredients.length === 2
            ? 110 + i * 222
            : 30 + (i * (height - 60)) / Math.max(ingredients.length, 1),
      }),
  );
  batches.forEach((l, i) => (positions[l.id] = { x: 335, y: 40 + i * 107 }));
  customers.forEach(
    (c, i) => (positions["customer:" + c] = { x: 685, y: 37 + i * 110 }),
  );
  const path = (from: { x: number; y: number }, to: { x: number; y: number }) =>
    `M ${from.x + 220} ${from.y + 46} C ${from.x + 275} ${from.y + 46} ${to.x - 55} ${to.y + 46} ${to.x} ${to.y + 46}`;
  if (!inv.dataset.lots.length)
    return (
      <section className="empty-card">
        <Network size={38} />
        <h2>Your investigation starts with evidence.</h2>
        <p>
          Upload receiving, production and shipment records in the Evidence
          library, then extract and review their lot relationships.
        </p>
      </section>
    );
  return (
    <section className="graph-panel">
      <Tabs defaultValue="graph">
        <div className="panel-heading">
          <div>
            <h2>Follow the lot</h2>
            <p>Every connection leads back to a source record.</p>
          </div>
          <TabsList>
            <TabsTrigger value="graph">Trace graph</TabsTrigger>
            <TabsTrigger value="table">Shipment register</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="graph">
          <div className="graph-column-heads">
            <span>
              01 <b>INGREDIENT LOTS</b>
            </span>
            <span>
              02 <b>PRODUCTION BATCHES</b>
            </span>
            <span>
              03 <b>CUSTOMER SHIPMENTS</b>
            </span>
          </div>
          <div
            className="graph-scroll"
            role="region"
            aria-label="Scrollable lot trace graph"
            tabIndex={0}
          >
            <div className="graph-canvas" style={{ height }}>
              <svg
                className="graph-lines"
                viewBox={`0 0 950 ${height}`}
                style={{ height }}
                aria-hidden="true"
              >
                {inv.dataset.links.map((l) =>
                  positions[l.from] && positions[l.to] ? (
                    <path
                      key={l.id}
                      d={path(positions[l.from], positions[l.to])}
                      className={
                        l.certainty === "possible"
                          ? "uncertain-line"
                          : t.statuses[l.from] === "outside"
                            ? "muted-line"
                            : ""
                      }
                    />
                  ) : null,
                )}
                {inv.dataset.shipments.map((s) =>
                  positions[s.lotId] && positions["customer:" + s.customer] ? (
                    <path
                      key={s.id}
                      d={path(
                        positions[s.lotId],
                        positions["customer:" + s.customer],
                      )}
                      className={
                        t.statuses[s.lotId] === "hold"
                          ? "uncertain-line"
                          : t.statuses[s.lotId] === "outside"
                            ? "muted-line"
                            : ""
                      }
                    />
                  ) : null,
                )}
              </svg>
              {inv.dataset.lots.map((l) => {
                const status = t.statuses[l.id];
                return (
                  <button
                    key={l.id}
                    className={`lot-node ${l.kind === "ingredient" ? "ingredient-node" : "batch-node"} ${status === "affected" ? "affected" : status === "hold" ? "uncertain" : "muted-node"}`}
                    style={{
                      left: positions[l.id]?.x,
                      top: positions[l.id]?.y,
                    }}
                    onClick={() => onInspect(l.id)}
                    aria-label={`Inspect ${l.id}, ${l.name}, ${statusLabel(status)}, ${l.quantity} ${l.unit}`}
                  >
                    <div className="node-type">
                      {l.kind === "ingredient" ? (
                        <Leaf size={15} />
                      ) : (
                        <Package size={14} />
                      )}
                      <span>
                        {l.kind === "ingredient"
                          ? inv.recalledLotIds.includes(l.id)
                            ? "RECALLED INGREDIENT"
                            : "INGREDIENT LOT"
                          : l.id}
                      </span>
                      {status === "hold" && <AlertTriangle size={14} />}
                    </div>
                    <strong>{l.name}</strong>
                    <div className="node-meta">
                      {l.kind === "ingredient"
                        ? l.id
                        : `${l.quantity.toLocaleString()} ${l.unit}`}
                      <span>
                        {l.kind === "ingredient"
                          ? `${l.quantity} ${l.unit}`
                          : statusLabel(status)}
                      </span>
                    </div>
                  </button>
                );
              })}
              {customers.map((c) => {
                const shipments = t.shipments.filter((s) => s.customer === c);
                const affected = shipments
                    .filter((s) => s.status === "affected")
                    .reduce((a, b) => a + b.quantity, 0),
                  hold = shipments
                    .filter((s) => s.status === "hold")
                    .reduce((a, b) => a + b.quantity, 0);
                return (
                  <button
                    className="lot-node customer-node"
                    key={c}
                    style={{
                      left: positions["customer:" + c].x,
                      top: positions["customer:" + c].y,
                    }}
                    onClick={() => onInspect("customer:" + c)}
                  >
                    <div className="node-type">
                      <Boxes size={15} />
                      CUSTOMER
                    </div>
                    <strong>{c}</strong>
                    <div className="node-meta">
                      {affected || hold
                        ? `${affected} affected${hold ? " · " + hold + " on hold" : ""}`
                        : "Outside recorded path"}
                      <ArrowUpRight size={14} />
                    </div>
                  </button>
                );
              })}
              <div
                className="stock-note"
                style={{
                  top: Math.max(365, customers.length * 110 + 45),
                  bottom: "auto",
                }}
              >
                <Package size={15} />
                {t.onSiteRange.min === t.onSiteRange.max
                  ? t.onSiteUnits
                  : `${t.onSiteRange.min}–${t.onSiteRange.max}`}{" "}
                affected units on site (records)
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="table">
          <div className="table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment / batch</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Shipped</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {t.shipments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <strong>{s.id}</strong>
                      <small>{s.lotId}</small>
                    </TableCell>
                    <TableCell>{s.customer}</TableCell>
                    <TableCell>
                      {s.quantity} {s.unit}
                    </TableCell>
                    <TableCell>{s.date}</TableCell>
                    <TableCell>
                      <span
                        className={`status-pill ${s.status === "affected" ? "rose" : s.status === "hold" ? "amber" : "neutral"}`}
                      >
                        {statusLabel(s.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        className="inline-link"
                        onClick={() => onInspect(s.id)}
                      >
                        Source <ArrowUpRight size={14} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      <div className="graph-footer">
        <span>
          <ShieldCheck size={15} />
          Scope is calculated from records. It is never guessed by AI.
        </span>
        <span>
          Click a node to inspect its evidence <ArrowRight size={14} />
        </span>
      </div>
    </section>
  );
}

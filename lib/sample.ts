import type { Investigation, SourceDocument, Dataset } from "./domain";
const at = "2026-09-16T08:00:00.000Z";
const sources = [
  {
    id: "supplier-alert",
    name: "01_supplier_alert.txt",
    text: "SYNTHETIC RECALL DRILL — NOT A REAL RECALL\nValley Nut Co. | Supplier alert | 16 September 2026\nProduct: Peanut butter. Lot: PB-0901-A.\nPotential Salmonella contamination. Place all product made with this lot on hold and trace customer shipments.\nLot PB-0901-B is not listed in this supplier notice. This does not establish its safety.",
  },
  {
    id: "receiving",
    name: "02_receiving.csv",
    text: "record_type,id,product,quantity,unit,supplier,date\ningredient,PB-0901-A,Peanut butter,100,kg,Valley Nut Co.,2026-09-01\ningredient,PB-0901-B,Peanut butter,80,kg,Valley Nut Co.,2026-09-01",
  },
  {
    id: "production",
    name: "03_production.csv",
    text: "batch_id,product,output_quantity,output_unit,input_lot,input_quantity,input_unit,date\nOAT-0902,Peanut oat bars,480,units,PB-0901-A,30,kg,2026-09-02\nBIT-0903,Energy bites,320,units,PB-0901-A,20,kg,2026-09-03\nCOO-0904,Peanut cookies,240,units,PB-Sept,10,kg,2026-09-04\nOAT-0905,Peanut oat bars,360,units,PB-0901-B,25,kg,2026-09-05\nNote: PB-Sept is ambiguous. PB-0901-A and PB-0901-B were both available. Preserve both candidate relationships until reviewed.",
  },
  {
    id: "shipping",
    name: "04_shipments.csv",
    text: "shipment_id,batch_id,customer,quantity,unit,date\nSHP-101,OAT-0902,Market & Co.,240,units,2026-09-06\nSHP-102,OAT-0902,Daily Grocer,120,units,2026-09-06\nSHP-103,BIT-0903,Daily Grocer,160,units,2026-09-07\nSHP-104,BIT-0903,Trailhouse,80,units,2026-09-07\nSHP-105,COO-0904,Market & Co.,120,units,2026-09-08\nSHP-106,OAT-0905,Trailhouse,180,units,2026-09-09",
  },
  {
    id: "warehouse",
    name: "05_inventory_count.txt",
    text: "Sunward Foods | Inventory count | 16 September 2026\nOAT-0902: 120 units on site.\nBIT-0903: 80 units on site.\nCOO-0904: 120 units on site.\nOAT-0905: 180 units on site.\nPB-0901-A: 50 kg on site.\nPB-0901-B: 45 kg on site.\nThis count is supporting evidence; investigate any mismatch with transaction records.",
  },
  {
    id: "correction",
    name: "06_signed_batch_clarification.txt",
    text: "SYNTHETIC SUPPORTING RECORD\nSunward Foods | Batch clarification | 16 September 2026\nFor batch COO-0904 (Peanut cookies), the shorthand PB-Sept refers to PB-0901-B.\n10 kg of PB-0901-B was consumed in COO-0904. No PB-0901-A was used in this batch.\nSupporting reference: warehouse issue slip WIS-0904-02.\nRecorded by: Maya Chen, production lead (fictional).\nA quality reviewer must approve any relationship change using this evidence.",
  },
];
const evidence = (documentId: string, quote: string) => ({ documentId, quote });
const row = (doc: string, id: string) =>
  sources
    .find((d) => d.id === doc)!
    .text.split("\n")
    .find((l) => l.startsWith(id + ","))!;
export function sampleInvestigation(): Investigation {
  const documents: SourceDocument[] = sources.map((d) => ({
    ...d,
    sha256: "",
    uploadedAt: at,
    textVerified: true,
    extractionMethod: "synthetic" as const,
    mimeType: d.name.endsWith(".csv") ? "text/csv" : "text/plain",
  }));
  const dataset: Dataset = {
    lots: [
      {
        id: "PB-0901-A",
        name: "Peanut butter",
        kind: "ingredient",
        quantity: 100,
        unit: "kg",
        supplier: "Valley Nut Co.",
        evidence: evidence("receiving", sources[1].text.split("\n")[1]),
      },
      {
        id: "PB-0901-B",
        name: "Peanut butter",
        kind: "ingredient",
        quantity: 80,
        unit: "kg",
        supplier: "Valley Nut Co.",
        evidence: evidence("receiving", sources[1].text.split("\n")[2]),
      },
      ...[
        { id: "OAT-0902", name: "Peanut oat bars", quantity: 480 },
        { id: "BIT-0903", name: "Energy bites", quantity: 320 },
        { id: "COO-0904", name: "Peanut cookies", quantity: 240 },
        { id: "OAT-0905", name: "Peanut oat bars", quantity: 360 },
      ].map((l) => ({
        ...l,
        kind: "finished" as const,
        unit: "units" as const,
        supplier: "Sunward Foods",
        evidence: evidence("production", row("production", l.id)),
      })),
    ],
    links: [
      {
        id: "USE-001",
        from: "PB-0901-A",
        to: "OAT-0902",
        quantity: 30,
        unit: "kg",
        certainty: "confirmed",
        evidence: evidence("production", row("production", "OAT-0902")),
        note: "",
      },
      {
        id: "USE-002",
        from: "PB-0901-A",
        to: "BIT-0903",
        quantity: 20,
        unit: "kg",
        certainty: "confirmed",
        evidence: evidence("production", row("production", "BIT-0903")),
        note: "",
      },
      {
        id: "USE-003",
        from: "PB-0901-A",
        to: "COO-0904",
        quantity: 10,
        unit: "kg",
        certainty: "possible",
        evidence: evidence("production", row("production", "COO-0904")),
        note: "PB-Sept can refer to either received peanut butter lot.",
      },
      {
        id: "USE-004",
        from: "PB-0901-B",
        to: "COO-0904",
        quantity: 10,
        unit: "kg",
        certainty: "possible",
        evidence: evidence("production", row("production", "COO-0904")),
        note: "Alternative candidate for the ambiguous PB-Sept reference.",
      },
      {
        id: "USE-005",
        from: "PB-0901-B",
        to: "OAT-0905",
        quantity: 25,
        unit: "kg",
        certainty: "confirmed",
        evidence: evidence("production", row("production", "OAT-0905")),
        note: "",
      },
    ],
    shipments: sources[3].text
      .split("\n")
      .slice(1)
      .map((r) => {
        const [id, lotId, customer, quantity, unit, date] = r.split(",");
        return {
          id,
          lotId,
          customer,
          quantity: Number(quantity),
          unit: unit as "units",
          date,
          evidence: evidence("shipping", r),
        };
      }),
  };
  return {
    id: "demo",
    title: "Peanut butter supplier alert",
    organization: "Sunward Foods",
    hazard: "Potential Salmonella contamination",
    recalledLotIds: ["PB-0901-A"],
    documents,
    dataset,
    revision: 1,
    createdAt: at,
    updatedAt: at,
    audit: [
      {
        id: "demo-created",
        at,
        actor: "RecallRoom",
        action: "Synthetic drill loaded",
        detail:
          "Fictional records. Deterministic sample dataset; no AI call has been made.",
        revision: 1,
      },
    ],
    runs: [],
    decisions: [],
    draft: null,
    isSample: true,
  };
}

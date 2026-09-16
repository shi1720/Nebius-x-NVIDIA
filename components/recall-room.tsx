"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Full navigation clears transient demo and private workspace state. Auth links must also bypass client routing. */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Network,
  Files,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  ArrowRight,
  Download,
  Plus,
  ChevronDown,
  CircleHelp,
  AlertTriangle,
  ScanLine,
  Upload,
  Sparkles,
  RotateCcw,
  Check,
  FileText,
  LoaderCircle,
  X,
  LockKeyhole,
  Trash2,
  Package,
  ClipboardCheck,
  Menu,
  Settings2,
  Mail,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  SidebarProvider,
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster, toast } from "sonner";
import { sampleInvestigation } from "@/lib/sample";
import {
  addAudit,
  resolveLink,
  trace,
  hasEvidence,
  validateDataset,
  datasetSchema,
  type Investigation,
  type Evidence,
} from "@/lib/domain";
import {
  downloadText,
  shipmentCsv,
  packetHtml,
  customerDraft,
} from "@/lib/export";
import { readSourceFile } from "@/lib/read-file";
import LotGraph, { statusLabel } from "./lot-graph";

type View = "room" | "evidence" | "export" | "activity";
type User = { name: string; email: string };
type Saved = {
  id: string;
  title: string;
  revision: number;
  updated_at: string;
};
const nav = [
  { id: "room" as const, label: "Incident room", icon: Network },
  { id: "evidence" as const, label: "Evidence library", icon: Files },
  { id: "export" as const, label: "Review & export", icon: ShieldCheck },
  { id: "activity" as const, label: "Activity log", icon: Activity },
];
const request = async (path: string, method = "GET", body?: unknown) => {
  const res = await fetch(path, {
    method,
    headers:
      body instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as {
    error?: string;
    investigation: Investigation;
    investigations: Saved[];
  };
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
};
const downloadUrl = (url: string) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "";
  anchor.click();
};
const formatNum = (n: number) => n.toLocaleString();
export default function RecallRoom({
  user,
  persistent = false,
}: {
  user?: User;
  persistent?: boolean;
}) {
  const [inv, setInvState] = useState<Investigation>(sampleInvestigation),
    [view, setView] = useState<View>("room"),
    [saved, setSaved] = useState<Saved[]>([]),
    [loaded, setLoaded] = useState(!persistent),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [inspect, setInspect] = useState<string | null>(null),
    [newOpen, setNewOpen] = useState(false),
    [resetOpen, setResetOpen] = useState(false),
    [menuOpen, setMenuOpen] = useState(false),
    [settingsOpen, setSettingsOpen] = useState(false),
    [config, setConfig] = useState({
      liveAvailable: false,
      model: "nvidia/nemotron-3-super-120b-a12b",
    }),
    [docSearch, setDocSearch] = useState("");
  const [newTitle, setNewTitle] = useState("Supplier recall investigation"),
    [organization, setOrganization] = useState(""),
    [newMode, setNewMode] = useState("empty");
  const [reviewLink, setReviewLink] = useState<string | null>(null),
    [reviewDoc, setReviewDoc] = useState(""),
    [reviewQuote, setReviewQuote] = useState(""),
    [reviewNote, setReviewNote] = useState(""),
    [reviewDecision, setReviewDecision] = useState("excluded");
  const [draftText, setDraftText] = useState(""),
    [approved, setApproved] = useState(false),
    [recallIds, setRecallIds] = useState<string[]>([]),
    [hazard, setHazard] = useState(""),
    [exportAcknowledged, setExportAcknowledged] = useState(false);
  const setInv = useCallback((next: Investigation) => {
    setInvState(next);
    setDraftText(next.draft ? JSON.stringify(next.draft.dataset, null, 2) : "");
    setApproved(false);
    setExportAcknowledged(false);
  }, []);
  const parsedDraft = useMemo(() => {
    try {
      return datasetSchema.parse(JSON.parse(draftText));
    } catch {
      return null;
    }
  }, [draftText]);
  const scope = useMemo(
    () => trace(inv.dataset, inv.recalledLotIds, inv.documents),
    [inv],
  );
  const run = async (label: string, fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(label);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy("");
    }
  };
  const refreshList = useCallback(async () => {
    const data = await request("/api/investigations");
    setSaved(data.investigations);
    return data.investigations as Saved[];
  }, []);
  useEffect(() => {
    fetch("/api/config")
      .then(
        (r) => r.json() as Promise<{ liveAvailable: boolean; model: string }>,
      )
      .then(setConfig)
      .catch(() => {});
    if (persistent) {
      request("/api/investigations")
        .then(async ({ investigations: list }) => {
          setSaved(list);
          if (list.length) {
            const data = await request("/api/investigations/" + list[0].id);
            setInv(data.investigation);
          } else setNewOpen(true);
          setLoaded(true);
        })
        .catch((e) => {
          setError(e.message);
          setLoaded(true);
        });
    }
  }, [persistent, setInv]);
  useEffect(() => {
    const d = document as Document & {
      modelContext?: {
        registerTool: (tool: unknown, options: { signal: AbortSignal }) => void;
      };
    };
    if (!d.modelContext?.registerTool) return;
    const abort = new AbortController();
    try {
      d.modelContext.registerTool(
        {
          name: "read_recall_scope",
          title: "Read current recall scope",
          description:
            "Read the current approved investigation scope and unresolved evidence. Does not make safety determinations.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: (input: unknown) => {
            if (
              !input ||
              typeof input !== "object" ||
              Object.keys(input).length
            )
              throw new Error("Expected an empty object.");
            return {
              investigationId: inv.id,
              revision: inv.revision,
              affectedUnits: scope.confirmedUnits,
              affectedUnitRange: scope.affectedRange,
              holdUnits: scope.holdUnits,
              holdUnitRange: scope.holdRange,
              onSiteUnitRange: scope.onSiteRange,
              affectedShipments: scope.shippedUnits,
              issues: scope.issues,
              unresolvedLinks: scope.ambiguous.map((l) => l.id),
            };
          },
        },
        { signal: abort.signal },
      );
      d.modelContext.registerTool(
        {
          name: "inspect_recall_record",
          title: "Inspect a record",
          description:
            "Open the same source evidence panel as clicking a graph node. This changes the visible panel only.",
          inputSchema: {
            type: "object",
            properties: { recordId: { type: "string" } },
            required: ["recordId"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: (input: unknown) => {
            const value = input as { recordId?: string };
            if (
              !value ||
              typeof value.recordId !== "string" ||
              Object.keys(value).some((k) => k !== "recordId")
            )
              throw new Error("Provide only recordId.");
            const record = [
              ...inv.dataset.lots,
              ...inv.dataset.links,
              ...inv.dataset.shipments,
            ].find((r) => r.id === value.recordId);
            if (!record) throw new Error("Record not found.");
            setInspect(record.id);
            return { id: record.id, evidence: record.evidence };
          },
        },
        { signal: abort.signal },
      );
    } catch {
      console.info("WebMCP unavailable in this browser.");
    }
    return () => abort.abort();
  }, [inv, scope]);
  const update = async (action: Record<string, unknown>) => {
    if (inv.id === "demo") {
      let next = inv;
      const actor = "Demo reviewer";
      if (action.action === "resolve")
        next = resolveLink(
          inv,
          action.linkId as string,
          action.decision as "confirmed" | "excluded",
          action.evidence as Evidence,
          action.note as string,
          actor,
        );
      if (action.action === "set-recall")
        next = addAudit(
          {
            ...inv,
            recalledLotIds: action.lotIds as string[],
            hazard: action.hazard as string,
          },
          actor,
          "Recall scope selected",
          `Recalled lots: ${(action.lotIds as string[]).join(", ")}`,
        );
      if (action.action === "export")
        next = addAudit(
          inv,
          actor,
          "Investigation packet exported",
          `Revision ${inv.revision}; preliminary status and open questions preserved.`,
        );
      setInv(next);
      return next;
    }
    const data = await request(
      `/api/investigations/${inv.id}/actions`,
      "POST",
      { ...action, revision: inv.revision },
    );
    setInv(data.investigation);
    await refreshList();
    return data.investigation as Investigation;
  };
  const openReview = (linkId: string) => {
    setReviewLink(linkId);
    setReviewDoc("");
    setReviewQuote("");
    setReviewNote("");
    setReviewDecision("excluded");
  };
  const demoMode = inv.id === "demo";
  const persisted = persistent && !demoMode;
  const unresolvedCount = inv.dataset.links.filter(
    (l) => l.certainty === "possible",
  ).length;
  const activeRecord = [
    ...inv.dataset.lots,
    ...inv.dataset.links,
    ...inv.dataset.shipments,
  ].find((r) => r.id === inspect);
  const activeDoc =
    inv.documents.find((d) => d.id === inspect) ||
    (activeRecord
      ? inv.documents.find((d) => d.id === activeRecord.evidence.documentId)
      : undefined);
  const customer = inspect?.startsWith("customer:") ? inspect.slice(9) : null;
  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!persisted) {
      setNewOpen(true);
      return;
    }
    await run("Reading and saving evidence", async () => {
      let current = inv;
      for (const file of Array.from(files)) {
        const text = await readSourceFile(file);
        const form = new FormData();
        form.append("file", file);
        form.append("text", text);
        form.append("revision", String(current.revision));
        const data = await request(
          `/api/investigations/${current.id}/documents`,
          "POST",
          form,
        );
        current = data.investigation;
        setInv(current);
      }
      toast.success(
        `${files.length} source file${files.length > 1 ? "s" : ""} saved.`,
      );
      await refreshList();
    });
  };
  const navigate = (v: View) => {
    setView(v);
    setMenuOpen(false);
  };
  const exportPacket = async (kind: "html" | "csv" | "json") =>
    run("Preparing evidence packet", async () => {
      const next = await update({ action: "export" });
      if (kind === "html")
        downloadText(
          `recallroom-${next.id}-r${next.revision}.html`,
          packetHtml(next),
          "text/html",
        );
      else if (kind === "csv")
        downloadText(
          `recallroom-shipments-r${next.revision}.csv`,
          shipmentCsv(next),
          "text/csv",
        );
      else {
        const portable = structuredClone(next);
        portable.documents = portable.documents.map((d) => {
          const copy = { ...d };
          delete copy.storageKey;
          return copy;
        });
        downloadText(
          `recallroom-investigation-r${next.revision}.json`,
          JSON.stringify(portable, null, 2),
          "application/json",
        );
      }
      toast.success("Packet downloaded. No customer messages were sent.");
    });
  return (
    <SidebarProvider className="app-shell">
      <Toaster richColors position="bottom-right" />
      <a href="#main-content" className="skip-link">
        Skip to investigation
      </a>
      <Sidebar collapsible="none" className="rail">
        <a className="brand" href="/" aria-label="RecallRoom home">
          <span className="brand-symbol">
            <ScanLine size={24} />
          </span>
          RecallRoom<span className="brand-period">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">{inv.organization[0]}</span>
          <div>
            {inv.organization}
            <small>
              {demoMode ? "Demonstration workspace" : "Private workspace"}
            </small>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <SidebarMenu>
          {nav.map((n) => (
            <SidebarMenuItem key={n.id}>
              <SidebarMenuButton
                className={`nav-item ${view === n.id ? "active" : ""}`}
                onClick={() => navigate(n.id)}
                aria-current={view === n.id ? "page" : undefined}
                tooltip={n.label}
              >
                <n.icon size={18} />
                <span className="nav-text">{n.label}</span>
                {n.id === "room" && <span className="nav-count">1</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="rail-note">
          <div className="eyebrow">BUILT FOR THE WHAT-IF</div>
          <p>
            A recall starts with one lot.
            <br />
            Know where it ends.
          </p>
          <div className="rail-note-line" />
        </div>
        <div className="rail-bottom">
          <a
            href="https://github.com/shi1720/Nebius-x-NVIDIA"
            target="_blank"
            rel="noreferrer"
          >
            <CircleHelp size={17} />
            Project & documentation
            <ArrowUpRight size={14} />
          </a>
          <div className="profile">
            <span>{user ? user.name.slice(0, 2).toUpperCase() : "SG"}</span>
            <div>
              {user ? user.name : "Shivam Gupta"}
              <small>
                {user ? "Signed in · private records" : "Project creator"}
              </small>
            </div>
          </div>
        </div>
      </Sidebar>
      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu text-button"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb-root">Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <span className="breadcrumb-current">
              {nav.find((n) => n.id === view)?.label}
            </span>
          </div>
          <div className="topbar-right">
            <span
              className={`demo-pill ${!inv.isSample ? "real-workspace" : ""}`}
            >
              {inv.isSample
                ? "SYNTHETIC RECALL DRILL"
                : "PRIVATE INVESTIGATION"}
            </span>
            {user ? (
              <a
                className="text-button"
                href="/signout-with-chatgpt?return_to=%2F"
                target="_top"
              >
                Sign out <ArrowUpRight size={15} />
              </a>
            ) : (
              <a
                className="text-button"
                href="/signin-with-chatgpt?return_to=%2Fworkspace"
                target="_top"
              >
                Sign in <ArrowUpRight size={15} />
              </a>
            )}
          </div>
        </header>
        <div className="main-content" id="main-content">
          <div className="page-title">
            <div>
              <div className="eyebrow">
                {demoMode
                  ? "INCIDENT RR-2026-001"
                  : `INVESTIGATION ${inv.id.slice(0, 8).toUpperCase()}`}{" "}
                <span className="revision-label">
                  / REVISION {inv.revision}
                </span>
              </div>
              <h1>
                {view === "room"
                  ? "One lot. The whole picture."
                  : view === "evidence"
                    ? "Start with the source."
                    : view === "export"
                      ? "From evidence to action."
                      : "Every decision, accounted for."}
              </h1>
              <p>
                {view === "room"
                  ? "Trace affected products. Resolve the unknowns. Act with evidence."
                  : view === "evidence"
                    ? "Keep original records. Review extracted facts before they enter the trace."
                    : view === "export"
                      ? "Review the scope and take a complete investigation packet with you."
                      : "A revision history of uploads, reviews, model runs and exports."}
              </p>
            </div>
            <Button className="primary" onClick={() => setNewOpen(true)}>
              <Plus size={17} />
              New investigation
            </Button>
          </div>
          {error && (
            <div className="error-banner" role="alert">
              <AlertTriangle size={18} />
              <span>{error}</span>
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {busy && (
            <div className="busy-banner" role="status">
              <LoaderCircle size={17} className="spin" />
              {busy}…
              {busy.includes("Nemotron") && (
                <span>
                  This may take up to 90 seconds. Your approved trace stays
                  available.
                </span>
              )}
            </div>
          )}
          {persistent && (
            <div className="saved-row">
              <LockKeyhole size={15} />
              <span>Saved investigations</span>
              <Select
                value={persisted ? inv.id : undefined}
                onValueChange={(id) =>
                  run("Loading investigation", async () => {
                    const data = await request("/api/investigations/" + id);
                    setInv(data.investigation);
                    setInspect(null);
                  })
                }
              >
                <SelectTrigger aria-label="Saved investigation">
                  <SelectValue placeholder="Choose an investigation" />
                </SelectTrigger>
                <SelectContent>
                  {saved.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                className="text-button"
                disabled={!persisted || !!busy}
                onClick={() => setResetOpen(true)}
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          )}
          {!loaded ? (
            <section className="empty-card">
              <LoaderCircle className="spin" />
              <h2>Loading your private investigations…</h2>
            </section>
          ) : (
            <>
              {view === "room" && (
                <>
                  <section className="incident-strip">
                    <span className="incident-icon">
                      <AlertTriangle size={20} />
                    </span>
                    <button
                      className="incident-title"
                      onClick={() => {
                        setRecallIds(inv.recalledLotIds);
                        setHazard(inv.hazard);
                        setSettingsOpen(true);
                      }}
                    >
                      <strong>{inv.title}</strong>
                      <p>
                        {inv.dataset.lots.find(
                          (l) => l.id === inv.recalledLotIds[0],
                        )?.supplier || inv.organization}
                        <span>·</span>
                        {inv.recalledLotIds.join(", ") ||
                          "Select recalled lots"}
                        <span>·</span>
                        {inv.hazard}
                      </p>
                    </button>
                    <button
                      className="text-button scope-edit"
                      onClick={() => {
                        setRecallIds(inv.recalledLotIds);
                        setHazard(inv.hazard);
                        setSettingsOpen(true);
                      }}
                      aria-label="Edit recalled lots"
                    >
                      <Settings2 size={16} />
                    </button>
                    <span
                      className={`status-pill ${scope.canFinalize ? "teal" : "amber"}`}
                    >
                      {scope.canFinalize
                        ? "Recorded scope reviewed"
                        : "Investigation open"}
                    </span>
                  </section>
                  <div className="metrics">
                    <div>
                      <span>CONFIRMED AFFECTED</span>
                      <strong>
                        {scope.affectedRange.min === scope.affectedRange.max
                          ? formatNum(scope.confirmedUnits)
                          : `${formatNum(scope.affectedRange.min)}–${formatNum(scope.affectedRange.max)}`}{" "}
                        <small>units</small>
                      </strong>
                      <p>
                        <span className="metric-red" />
                        Across{" "}
                        {
                          inv.dataset.lots.filter(
                            (l) =>
                              l.kind === "finished" &&
                              scope.statuses[l.id] === "affected",
                          ).length
                        }{" "}
                        production batches
                      </p>
                    </div>
                    <div>
                      <span>PRECAUTIONARY HOLD</span>
                      <strong>
                        {scope.holdRange.min === scope.holdRange.max
                          ? formatNum(scope.holdUnits)
                          : `${formatNum(scope.holdRange.min)}–${formatNum(scope.holdRange.max)}`}{" "}
                        <small>units</small>
                      </strong>
                      <p>
                        <span className="metric-amber" />
                        {scope.ambiguous.length
                          ? `${scope.ambiguous.length} lot reference${scope.ambiguous.length > 1 ? "s need" : " needs"} review`
                          : "No affected-path ambiguities"}
                      </p>
                    </div>
                    <div>
                      <span>SHIPPED TO CUSTOMERS</span>
                      <strong>
                        {formatNum(scope.shippedUnits)} <small>units</small>
                      </strong>
                      <p>{scope.customers.length} customer destinations</p>
                    </div>
                    <div>
                      <span>OUTSIDE RECORDED PATH</span>
                      <strong>
                        {formatNum(scope.outsideUnits)} <small>units</small>
                      </strong>
                      <p>Not a declaration of safety</p>
                    </div>
                  </div>
                  <div className="graph-overline">
                    <span>APPROVED RECORDS</span>
                    <div className="legend">
                      <span>
                        <i className="dot red" />
                        Affected
                      </span>
                      <span>
                        <i className="dot amber-dot" />
                        On hold
                      </span>
                      <span>
                        <i className="dot gray" />
                        Outside path
                      </span>
                    </div>
                  </div>
                  <LotGraph inv={inv} onInspect={setInspect} />
                  <section className="ingredient-balances">
                    <div className="balance-heading">
                      <Package size={19} />
                      <div>
                        <h3>Account for the ingredient, too.</h3>
                        <p>
                          Received minus recorded use. Unresolved consumption
                          stays a range.
                        </p>
                      </div>
                    </div>
                    {scope.balances
                      .filter(
                        (b) =>
                          inv.recalledLotIds.includes(b.lotId) &&
                          b.unit === "kg",
                      )
                      .map((b) => (
                        <div className="balance-row" key={b.lotId}>
                          <strong>{b.lotId}</strong>
                          <span>{b.received} kg received</span>
                          <span>{b.consumed} kg confirmed used</span>
                          <span className="balance-total">
                            {b.minRemaining === b.maxRemaining
                              ? b.maxRemaining
                              : `${b.minRemaining}–${b.maxRemaining}`}{" "}
                            kg still to account for
                          </span>
                          <button
                            className="inline-link"
                            onClick={() => setInspect(b.lotId)}
                          >
                            Evidence <ArrowUpRight size={14} />
                          </button>
                        </div>
                      ))}
                  </section>
                  <div className="bottom-grid">
                    <section
                      className={`review-card ${!scope.ambiguous.length ? "resolved-card" : ""}`}
                    >
                      <div className="review-card-icon">
                        {scope.ambiguous.length ? (
                          <AlertTriangle size={20} />
                        ) : (
                          <ShieldCheck size={20} />
                        )}
                      </div>
                      <div>
                        <div className="eyebrow">
                          {scope.ambiguous.length
                            ? "ONE QUESTION BEFORE YOU ACT"
                            : "KEEP THE EVIDENCE IN VIEW"}
                        </div>
                        <h3>
                          {scope.ambiguous[0]
                            ? `Which ingredient lot went into ${inv.dataset.lots.find((l) => l.id === scope.ambiguous[0].to)?.name.toLowerCase() || scope.ambiguous[0].to}?`
                            : !inv.recalledLotIds.length
                              ? "Select recalled lots after approving your records."
                              : "The recorded recall path has no unresolved links."}
                        </h3>
                        <p>
                          {scope.ambiguous[0]
                            ? `${scope.ambiguous[0].note} ${scope.holdUnits} output units remain on precautionary hold.`
                            : "Review the remaining source relationships and record completeness before making an operational decision."}
                        </p>
                        <button
                          className="inline-link"
                          onClick={() =>
                            scope.ambiguous[0]
                              ? openReview(scope.ambiguous[0].id)
                              : navigate("export")
                          }
                        >
                          {scope.ambiguous.length
                            ? "Review the source record"
                            : "Review the investigation"}
                          <ArrowRight size={16} />
                        </button>
                      </div>
                      <span className="count-badge">
                        {String(scope.ambiguous.length).padStart(2, "0")}
                      </span>
                    </section>
                    <section className="proof-card">
                      <div className="eyebrow">EVIDENCE, NOT ASSUMPTIONS</div>
                      <h3>
                        {inv.dataset.lots.length} lots.{" "}
                        {inv.dataset.links.length} traceable connections.
                      </h3>
                      <p>
                        {demoMode
                          ? "Explore the synthetic drill. Your changes last for this visit; sign in to save your own work."
                          : "Original documents and reviewer decisions are saved to your private investigation."}
                      </p>
                      <div className="proof-footer">
                        <Files size={16} />
                        {inv.documents.length} source documents
                        <button
                          className="inline-link"
                          onClick={() => navigate("evidence")}
                        >
                          Open library <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </section>
                  </div>
                  {scope.issues.length > 0 && (
                    <section className="validation-box">
                      <h3>Evidence gaps to review</h3>
                      {scope.issues.map((i) => (
                        <p key={i.id}>
                          <AlertTriangle size={15} />
                          {i.message}
                        </p>
                      ))}
                    </section>
                  )}
                </>
              )}
              {view === "evidence" && (
                <>
                  <section className="evidence-toolbar">
                    <div>
                      <h2>
                        Source documents{" "}
                        <span className="subtle-count">
                          {inv.documents.length}
                        </span>
                      </h2>
                      <p>
                        TXT, CSV, JSON, or PDFs with selectable text. Up to 2 MB
                        per file.
                      </p>
                    </div>
                    <div className="toolbar-actions">
                      <Button
                        variant="outline"
                        disabled={!!busy}
                        onClick={() => {
                          if (!persisted) {
                            setNewOpen(true);
                            return;
                          }
                          document.getElementById("source-upload")?.click();
                        }}
                      >
                        <Upload size={16} />
                        Upload records
                      </Button>
                      <Button
                        className="primary"
                        disabled={
                          !!busy ||
                          !persisted ||
                          !inv.documents.length ||
                          !config.liveAvailable
                        }
                        onClick={() =>
                          run(
                            "Nemotron is extracting source records",
                            async () => {
                              const data = await request(
                                `/api/investigations/${inv.id}/analyze`,
                                "POST",
                                { revision: inv.revision },
                              );
                              setInv(data.investigation);
                              toast.success(
                                "Extraction saved as a draft. Review it before importing.",
                              );
                            },
                          )
                        }
                      >
                        <Sparkles size={16} />
                        Extract with Nemotron
                      </Button>
                      <input
                        id="source-upload"
                        type="file"
                        multiple
                        accept=".txt,.csv,.json,.pdf"
                        className="sr-only"
                        onChange={(e) => {
                          void uploadFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </section>
                  <div
                    className={`ai-notice ${config.liveAvailable ? "ai-ready" : ""}`}
                  >
                    <Sparkles size={18} />
                    <div>
                      <strong>
                        {config.liveAvailable
                          ? "Live NVIDIA inference available"
                          : "Live NVIDIA inference awaits configuration"}
                      </strong>
                      <p>
                        {persisted
                          ? config.liveAvailable
                            ? "Source text is sent to Nebius Token Factory for extraction. Review every proposed record before importing it."
                            : "Your evidence can be saved now. The server needs a Nebius API key before live extraction can run."
                          : config.liveAvailable
                            ? "Sign in and create a saved investigation to run Nemotron on your records."
                            : "This public drill uses labeled synthetic data. No model call is simulated."}
                      </p>
                      <small>{config.model} · Nebius Token Factory</small>
                    </div>
                  </div>
                  <label className="search-field">
                    <Search size={17} />
                    <input
                      placeholder="Find a document or source phrase…"
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      aria-label="Search source documents"
                    />
                  </label>
                  <div className="document-grid">
                    {inv.documents
                      .filter((d) =>
                        (d.name + " " + d.text)
                          .toLowerCase()
                          .includes(docSearch.toLowerCase()),
                      )
                      .map((d, i) => (
                        <button
                          className="document-card"
                          key={d.id}
                          onClick={() => setInspect(d.id)}
                        >
                          <div className="doc-icon">
                            <FileText size={24} />
                          </div>
                          <span className="doc-index">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <strong>{d.name}</strong>
                          {d.textVerified === false && (
                            <span className="status-pill amber">
                              Verify PDF text
                            </span>
                          )}
                          <p>{d.text.slice(0, 125)}…</p>
                          <div>
                            <span>
                              {d.text.length.toLocaleString()} characters
                            </span>
                            <ArrowUpRight size={16} />
                          </div>
                        </button>
                      ))}
                  </div>
                  {!inv.documents.length && (
                    <section className="empty-card">
                      <Upload size={32} />
                      <h2>No source files yet.</h2>
                      <p>
                        Start with a receiving log, batch sheet and shipment
                        register. You can use the sample files below to test the
                        complete upload flow.
                      </p>
                    </section>
                  )}
                  <div className="sample-download">
                    <div>
                      <h3>Need records to try?</h3>
                      <p>
                        The fictional Sunward Foods drill includes receiving,
                        production, shipping and a signed clarification.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        downloadUrl("/samples/sunward-source-pack.zip");
                        toast.success("Synthetic source pack downloaded.");
                      }}
                    >
                      <Download size={16} />
                      Sample source files
                    </Button>
                  </div>
                  {inv.draft && (
                    <section className="draft-panel">
                      <div className="panel-heading">
                        <div>
                          <div className="eyebrow">
                            REVIEW REQUIRED · LIVE MODEL OUTPUT
                          </div>
                          <h2>Proposed trace records</h2>
                          <p>
                            {inv.draft.dataset.lots.length} lots ·{" "}
                            {inv.draft.dataset.links.length} relationships ·{" "}
                            {inv.draft.dataset.shipments.length} shipments
                          </p>
                        </div>
                        <span className="status-pill amber">Not imported</span>
                      </div>
                      <div className="draft-content">
                        <div className="run-stats">
                          <span>
                            {(inv.draft.run.latencyMs / 1000).toFixed(1)}{" "}
                            seconds
                          </span>
                          <span>
                            {inv.draft.run.inputTokens.toLocaleString()} in /{" "}
                            {inv.draft.run.outputTokens.toLocaleString()} out
                          </span>
                          <span>
                            Est. ${inv.draft.run.estimatedCostUsd.toFixed(5)}
                          </span>
                        </div>
                        <p>
                          The model proposes facts. Check identities, quantities
                          and source quotes below. Importing replaces the
                          approved trace and preserves the review history.
                        </p>
                        {inv.draft.issues.map((i) => (
                          <p className="draft-issue" key={i.id}>
                            <AlertTriangle size={16} />
                            {i.message}
                          </p>
                        ))}
                        <Tabs defaultValue="records">
                          <TabsList>
                            <TabsTrigger value="records">
                              Cited records
                            </TabsTrigger>
                            <TabsTrigger value="json">
                              Edit draft JSON
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="records">
                            <div className="draft-records">
                              {!parsedDraft && (
                                <p className="draft-issue">
                                  The editable proposal is invalid. Fix its JSON
                                  before reviewing or importing.
                                </p>
                              )}
                              {[
                                ...(parsedDraft?.lots || []),
                                ...(parsedDraft?.links || []),
                                ...(parsedDraft?.shipments || []),
                              ].map((r) => (
                                <div key={r.id}>
                                  <strong>{r.id}</strong>
                                  <span>
                                    {"name" in r
                                      ? r.name
                                      : "from" in r
                                        ? `${r.from} → ${r.to} · ${r.certainty}`
                                        : r.customer}{" "}
                                    · {r.quantity} {r.unit}
                                  </span>
                                  <blockquote>{r.evidence.quote}</blockquote>
                                  <button
                                    className="inline-link"
                                    onClick={() =>
                                      setInspect(r.evidence.documentId)
                                    }
                                  >
                                    Open {r.evidence.documentId}
                                    <ArrowUpRight size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                          <TabsContent value="json">
                            <label className="field-label" htmlFor="draft-json">
                              Editable extraction proposal
                            </label>
                            <textarea
                              id="draft-json"
                              className="code-input"
                              value={draftText}
                              onChange={(e) => {
                                setDraftText(e.target.value);
                                setApproved(false);
                              }}
                              spellCheck={false}
                            />
                          </TabsContent>
                        </Tabs>
                        <label className="check-label">
                          <Checkbox
                            checked={approved}
                            onCheckedChange={(v) => setApproved(v === true)}
                          />
                          I reviewed the proposed facts and their source
                          evidence.
                        </label>
                        <div className="toolbar-actions">
                          <Button
                            className="primary"
                            disabled={
                              !approved ||
                              !parsedDraft ||
                              !!busy ||
                              inv.documents.some(
                                (d) => d.textVerified === false,
                              )
                            }
                            onClick={() =>
                              run(
                                "Validating and importing reviewed records",
                                async () => {
                                  let parsed;
                                  try {
                                    parsed = datasetSchema.parse(
                                      JSON.parse(draftText),
                                    );
                                  } catch {
                                    throw new Error(
                                      "The edited draft must be valid traceability JSON.",
                                    );
                                  }
                                  const issues = validateDataset(
                                    parsed,
                                    inv.documents,
                                  );
                                  if (
                                    issues.some((i) => i.severity === "error")
                                  )
                                    throw new Error(
                                      issues.find(
                                        (i) => i.severity === "error",
                                      )!.message,
                                    );
                                  await update({
                                    action: "approve-draft",
                                    draftId: inv.draft!.id,
                                    dataset: parsed,
                                  });
                                  toast.success(
                                    "Reviewed records imported. Select the recalled lot to trace its path.",
                                  );
                                  setView("room");
                                },
                              )
                            }
                          >
                            <Check size={16} />
                            Import reviewed records
                          </Button>
                          <Button
                            variant="outline"
                            disabled={!!busy}
                            onClick={() =>
                              run("Discarding draft", async () => {
                                await update({ action: "discard-draft" });
                              })
                            }
                          >
                            Discard proposal
                          </Button>
                        </div>
                      </div>
                    </section>
                  )}
                </>
              )}
              {view === "export" && (
                <>
                  <section className="export-summary">
                    <div className="export-symbol">
                      <ClipboardCheck size={33} />
                    </div>
                    <div>
                      <div className="eyebrow">
                        INVESTIGATION PACKET · REVISION {inv.revision}
                      </div>
                      <h2>
                        {scope.canFinalize
                          ? "Recorded scope reviewed. Human decisions remain."
                          : "Keep the open questions in the packet."}
                      </h2>
                      <p>
                        {scope.confirmedUnits} affected output units ·{" "}
                        {scope.holdUnits} units on precautionary hold ·{" "}
                        {scope.shippedUnits} affected units dispatched.
                      </p>
                    </div>
                    <span
                      className={`status-pill ${scope.canFinalize ? "teal" : "amber"}`}
                    >
                      {scope.canFinalize ? "Reviewed records" : "Preliminary"}
                    </span>
                  </section>
                  <div className="export-grid">
                    <section className="export-main">
                      <h2>Review checklist</h2>
                      <div className="checklist-row">
                        <Check size={18} />
                        <div>
                          <strong>Source-linked records</strong>
                          <p>
                            {inv.documents.length} source files support{" "}
                            {inv.dataset.lots.length +
                              inv.dataset.links.length +
                              inv.dataset.shipments.length}{" "}
                            approved records.
                          </p>
                        </div>
                      </div>
                      <div className="checklist-row">
                        {unresolvedCount || scope.issues.length ? (
                          <AlertTriangle size={18} />
                        ) : (
                          <Check size={18} />
                        )}
                        <div>
                          <strong>
                            {unresolvedCount + scope.issues.length} record
                            questions remain
                          </strong>
                          <p>
                            Incomplete evidence is included in every export. A
                            packet is not an all-clear.
                          </p>
                        </div>
                      </div>
                      {inv.dataset.links
                        .filter((l) => l.certainty === "possible")
                        .map((l) => (
                          <div className="unresolved-row" key={l.id}>
                            <span>
                              <strong>
                                {l.from} → {l.to}
                              </strong>
                              <small>{l.note}</small>
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReview(l.id)}
                            >
                              Review
                            </Button>
                          </div>
                        ))}
                      {scope.issues.map((i) => (
                        <p className="draft-issue" key={i.id}>
                          {i.message}
                        </p>
                      ))}
                      <div className="checklist-row">
                        <LockKeyhole size={18} />
                        <div>
                          <strong>
                            Decision authority stays with your quality team
                          </strong>
                          <p>
                            RecallRoom does not certify safety, release
                            inventory, or send customer messages.
                          </p>
                        </div>
                      </div>
                      <label className="check-label">
                        <Checkbox
                          checked={exportAcknowledged}
                          onCheckedChange={(v) =>
                            setExportAcknowledged(v === true)
                          }
                        />
                        I understand this export reflects the available records
                        and preserves unresolved questions.
                      </label>
                      <div className="export-buttons">
                        <Button
                          className="primary"
                          disabled={
                            !exportAcknowledged ||
                            !!busy ||
                            !inv.dataset.lots.length
                          }
                          onClick={() => exportPacket("html")}
                        >
                          <Download size={17} />
                          Download investigation packet
                        </Button>
                        <Button
                          variant="outline"
                          disabled={!exportAcknowledged || !!busy}
                          onClick={() => exportPacket("csv")}
                        >
                          Shipment CSV
                        </Button>
                        <Button
                          variant="outline"
                          disabled={!exportAcknowledged || !!busy}
                          onClick={() => exportPacket("json")}
                        >
                          Portable JSON
                        </Button>
                      </div>
                      <p className="small-note">
                        The HTML packet includes a Print / Save PDF button,
                        citations, decision history, source hashes and
                        customer-specific drafts.
                      </p>
                    </section>
                    <aside className="export-aside">
                      <div className="eyebrow">WHAT LEAVES WITH YOU</div>
                      {[
                        "Scope and quantity summary",
                        "Shipment register",
                        "Unresolved evidence",
                        "Cited evidence ledger",
                        "Reviewer decision history",
                        "Customer-specific drafts",
                        "Model usage and provenance",
                      ].map((s, i) => (
                        <div key={s}>
                          <span>{String(i + 1).padStart(2, "0")}</span>
                          {s}
                        </div>
                      ))}
                      <p>Open formats. Your records remain portable.</p>
                    </aside>
                  </div>
                  <section className="customer-section">
                    <h2>Customer hold drafts</h2>
                    <p>
                      Prepare one draft per affected destination. Nothing is
                      sent automatically.
                    </p>
                    <div className="customer-drafts">
                      {[
                        ...new Set(
                          scope.shipments
                            .filter((s) => s.status !== "outside")
                            .map((s) => s.customer),
                        ),
                      ].map((c) => (
                        <button
                          key={c}
                          className="customer-draft-card"
                          onClick={() => setInspect("customer:" + c)}
                        >
                          <Mail size={21} />
                          <div>
                            <strong>{c}</strong>
                            <small>Review shipment details and draft</small>
                          </div>
                          <ArrowUpRight size={17} />
                        </button>
                      ))}
                    </div>
                  </section>
                </>
              )}
              {view === "activity" && (
                <>
                  <section className="activity-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Investigation history</h2>
                        <p>
                          {demoMode
                            ? "This visit only. Sign in to preserve investigation history."
                            : "Saved with the investigation. Concurrent edits are checked against the revision."}
                        </p>
                      </div>
                      {demoMode && (
                        <Button
                          variant="outline"
                          onClick={() => setResetOpen(true)}
                        >
                          <RotateCcw size={16} />
                          Reset drill
                        </Button>
                      )}
                    </div>
                    <div className="timeline">
                      {[...inv.audit].reverse().map((a) => (
                        <div className="timeline-event" key={a.id}>
                          <div className="timeline-point">
                            <Check size={14} />
                          </div>
                          <div>
                            <div className="event-head">
                              <strong>{a.action}</strong>
                              <span>Revision {a.revision}</span>
                            </div>
                            <p>{a.detail}</p>
                            <small>
                              {a.actor} · {new Date(a.at).toLocaleString()}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="model-panel">
                    <h2>Model usage</h2>
                    <p>
                      Only real calls appear here. Cost uses documented
                      development rates, not a billing receipt.
                    </p>
                    {inv.runs.length ? (
                      <div className="table-wrap">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Model / provider</TableHead>
                              <TableHead>Input / output tokens</TableHead>
                              <TableHead>Latency</TableHead>
                              <TableHead>Estimated cost</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inv.runs.map((r) => (
                              <TableRow key={r.id}>
                                <TableCell>
                                  {r.model}
                                  <small>{r.provider}</small>
                                </TableCell>
                                <TableCell>
                                  {r.inputTokens} / {r.outputTokens}
                                </TableCell>
                                <TableCell>
                                  {(r.latencyMs / 1000).toFixed(1)}s
                                </TableCell>
                                <TableCell>
                                  ${r.estimatedCostUsd.toFixed(5)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="model-empty">
                        <Sparkles size={22} />
                        <strong>
                          No live model calls in this investigation.
                        </strong>
                        <p>
                          The sample trace and review actions are deterministic.
                          Live extraction requires a saved investigation and a
                          configured Nebius key.
                        </p>
                        <button
                          className="inline-link"
                          onClick={() => navigate("evidence")}
                        >
                          Go to evidence library <ArrowRight size={16} />
                        </button>
                      </div>
                    )}
                  </section>
                </>
              )}
            </>
          )}
          <footer className="page-footer">
            <span>
              RECALLROOM <span> / </span> TRACE · VERIFY · ACT
            </span>
            <span>
              NVIDIA Nemotron + Nebius Token Factory <span>·</span>
              {inv.runs.length
                ? "Live extraction recorded"
                : "Sample / manual trace"}
            </span>
          </footer>
        </div>
      </main>
      <Sheet open={!!inspect} onOpenChange={(v) => !v && setInspect(null)}>
        <SheetContent className="evidence-sheet">
          <SheetHeader>
            <SheetTitle>
              {customer ||
                activeRecord?.id ||
                activeDoc?.name ||
                "Source evidence"}
            </SheetTitle>
            <SheetDescription>
              {customer
                ? "Recorded shipments and an unsent customer-specific draft."
                : "Inspect the record and the original supporting text."}
            </SheetDescription>
          </SheetHeader>
          <div className="sheet-body">
            {customer ? (
              <>
                <div className="customer-shipments">
                  {scope.shipments
                    .filter((s) => s.customer === customer)
                    .map((s) => (
                      <div key={s.id}>
                        <div>
                          <strong>{s.lotId}</strong>
                          <small>
                            {s.id} · {s.date}
                          </small>
                        </div>
                        <span>
                          {s.quantity} {s.unit}
                        </span>
                        <span
                          className={`status-pill ${s.status === "affected" ? "rose" : s.status === "hold" ? "amber" : "neutral"}`}
                        >
                          {statusLabel(s.status)}
                        </span>
                      </div>
                    ))}
                </div>
                <h3>Hold request draft</h3>
                <pre className="source-text">
                  {customerDraft(inv, customer)}
                </pre>
                <Button
                  variant="outline"
                  onClick={() => {
                    downloadText(
                      `draft-${customer.replace(/\W+/g, "-")}.txt`,
                      customerDraft(inv, customer),
                    );
                    toast.success("Draft downloaded. Nothing was sent.");
                  }}
                >
                  <Download size={16} />
                  Download unsent draft
                </Button>
              </>
            ) : (
              <>
                {activeRecord && (
                  <>
                    <div className="record-facts">
                      <strong>
                        {"name" in activeRecord
                          ? activeRecord.name
                          : "from" in activeRecord
                            ? `${activeRecord.from} → ${activeRecord.to}`
                            : activeRecord.customer}
                      </strong>
                      <span>
                        {activeRecord.quantity} {activeRecord.unit}
                      </span>
                    </div>
                    <div className="eyebrow">CITED EVIDENCE</div>
                    <blockquote className="evidence-quote">
                      {activeRecord.evidence.quote}
                    </blockquote>
                    <div
                      className={`verification-line ${hasEvidence(activeRecord.evidence, inv.documents) ? "verified" : "invalid"}`}
                    >
                      <ShieldCheck size={16} />
                      {hasEvidence(activeRecord.evidence, inv.documents)
                        ? "Quote verified in source document"
                        : "Source verification failed"}
                    </div>
                    {inv.dataset.links
                      .filter(
                        (l) =>
                          l.to === activeRecord.id ||
                          l.from === activeRecord.id,
                      )
                      .map((l) => (
                        <div className="related-record" key={l.id}>
                          <span>
                            {l.from} → {l.to}
                            <small>
                              {l.quantity} {l.unit} · {l.certainty}
                            </small>
                          </span>
                          {l.certainty === "possible" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setInspect(null);
                                openReview(l.id);
                              }}
                            >
                              Review
                            </Button>
                          ) : (
                            <button
                              className="inline-link"
                              onClick={() => setInspect(l.id)}
                            >
                              Source <ArrowUpRight size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                  </>
                )}
                {activeDoc && (
                  <>
                    <div className="source-heading">
                      <h3>{activeDoc.name}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (persisted)
                            downloadUrl(
                              `/api/investigations/${inv.id}/documents?document=${encodeURIComponent(activeDoc.id)}`,
                            );
                          else downloadText(activeDoc.name, activeDoc.text);
                        }}
                      >
                        <Download size={15} />
                        Original
                      </Button>
                    </div>
                    <pre className="source-text">{activeDoc.text}</pre>
                    <div className="source-hash">
                      <strong>SHA-256</strong>
                      <code>
                        {activeDoc.sha256 ||
                          "Synthetic fixture · versioned in the public repository"}
                      </code>
                      {activeDoc.textSha256 && (
                        <>
                          <strong>EXTRACTED TEXT SHA-256</strong>
                          <code>{activeDoc.textSha256}</code>
                        </>
                      )}
                      <p className="small-note">
                        Extraction: {activeDoc.extractionMethod || "synthetic"}.{" "}
                        {activeDoc.textVerified === false
                          ? "Text has not been verified against the original."
                          : "Text provenance reviewed."}
                      </p>
                      {activeDoc.textVerified === false && (
                        <Button
                          variant="outline"
                          disabled={!!busy}
                          onClick={() =>
                            run("Recording text verification", async () => {
                              await update({
                                action: "verify-document",
                                documentId: activeDoc.id,
                                textSha256: activeDoc.textSha256,
                              });
                              toast.success("Text verification recorded.");
                            })
                          }
                        >
                          I compared this text with the original PDF
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <Dialog
        open={!!reviewLink}
        onOpenChange={(v) => !v && setReviewLink(null)}
      >
        <DialogContent className="review-dialog">
          <DialogHeader>
            <DialogTitle>Resolve a lot relationship</DialogTitle>
            <DialogDescription>
              A relationship changes only after a reviewer supplies matching
              source evidence.
            </DialogDescription>
          </DialogHeader>
          {reviewLink &&
            (() => {
              const link = inv.dataset.links.find((l) => l.id === reviewLink);
              if (!link) return null;
              return (
                <div className="dialog-body">
                  <div className="review-pair">
                    <span>{link.from}</span>
                    <ArrowRight size={20} />
                    <span>{link.to}</span>
                    <span className="status-pill amber">Unresolved</span>
                  </div>
                  <blockquote className="evidence-quote">
                    {link.evidence.quote}
                  </blockquote>
                  <p className="small-note">{link.note}</p>
                  {inv.isSample &&
                    inv.documents.some((d) => d.id === "correction") && (
                      <button
                        className="supporting-evidence"
                        onClick={() => {
                          setReviewDoc("correction");
                          setReviewQuote(
                            "10 kg of PB-0901-B was consumed in COO-0904. No PB-0901-A was used in this batch.",
                          );
                          setReviewDecision(
                            link.from === "PB-0901-A"
                              ? "excluded"
                              : "confirmed",
                          );
                          setReviewNote(
                            "The signed batch clarification identifies PB-0901-B and explicitly excludes PB-0901-A for COO-0904.",
                          );
                        }}
                      >
                        <FileText size={19} />
                        <div>
                          <strong>
                            A signed batch clarification is available
                          </strong>
                          <small>
                            Use its exact quote to prepare this review.
                          </small>
                        </div>
                        <ArrowUpRight size={17} />
                      </button>
                    )}
                  <div className="form-grid">
                    <div>
                      <label className="field-label">Decision</label>
                      <Select
                        value={reviewDecision}
                        onValueChange={setReviewDecision}
                      >
                        <SelectTrigger aria-label="Relationship decision">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excluded">
                            Exclude this relationship
                          </SelectItem>
                          <SelectItem value="confirmed">
                            Confirm this relationship
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="field-label">Supporting document</label>
                      <Select value={reviewDoc} onValueChange={setReviewDoc}>
                        <SelectTrigger aria-label="Supporting document">
                          <SelectValue placeholder="Choose a source" />
                        </SelectTrigger>
                        <SelectContent>
                          {inv.documents.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {reviewDoc && (
                    <details>
                      <summary>Read the selected document</summary>
                      <pre className="source-text">
                        {inv.documents.find((d) => d.id === reviewDoc)?.text}
                      </pre>
                    </details>
                  )}
                  <label className="field-label" htmlFor="review-quote">
                    Exact supporting quote
                  </label>
                  <textarea
                    id="review-quote"
                    value={reviewQuote}
                    onChange={(e) => setReviewQuote(e.target.value)}
                    placeholder="Copy the passage that supports your decision."
                  />
                  <label className="field-label" htmlFor="review-note">
                    Reviewer’s reason
                  </label>
                  <textarea
                    id="review-note"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Explain why this evidence resolves the relationship."
                  />
                  <p className="small-note">
                    Excluding an affected link removes that path from the
                    calculation; it does not release stock or certify safety.
                  </p>
                  <Button
                    className="primary"
                    disabled={
                      !!busy ||
                      reviewNote.trim().length < 12 ||
                      !hasEvidence(
                        { documentId: reviewDoc, quote: reviewQuote },
                        inv.documents,
                      )
                    }
                    onClick={() =>
                      run("Saving review decision", async () => {
                        await update({
                          action: "resolve",
                          linkId: reviewLink,
                          decision: reviewDecision,
                          evidence: {
                            documentId: reviewDoc,
                            quote: reviewQuote,
                          },
                          note: reviewNote,
                        });
                        setReviewLink(null);
                        toast.success(
                          "Decision recorded. Recall scope recalculated.",
                        );
                      })
                    }
                  >
                    <Check size={16} />
                    Record decision & recalculate
                  </Button>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user
                ? "Create an investigation"
                : "Your records. Your private workspace."}
            </DialogTitle>
            <DialogDescription>
              {user
                ? "Start with your records or copy the fictional drill to test the complete workflow."
                : "The sample is available without a login. Sign in to upload documents, use Nemotron and save your investigation history."}
            </DialogDescription>
          </DialogHeader>
          {user ? (
            <form
              className="dialog-body"
              onSubmit={(e) => {
                e.preventDefault();
                void run("Creating investigation", async () => {
                  const data = await request("/api/investigations", "POST", {
                    mode: newMode,
                    title: newTitle,
                    organization: organization || "Sunward Foods",
                  });
                  setInv(data.investigation);
                  setNewOpen(false);
                  setView(newMode === "empty" ? "evidence" : "room");
                  await refreshList();
                  toast.success("Private investigation created.");
                });
              }}
            >
              <label className="field-label" htmlFor="new-title">
                Investigation name
              </label>
              <input
                id="new-title"
                required
                minLength={3}
                maxLength={120}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <label className="field-label" htmlFor="organization">
                Organization
              </label>
              <input
                id="organization"
                maxLength={100}
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Sunward Foods"
              />
              <label className="field-label">Starting point</label>
              <Select value={newMode} onValueChange={setNewMode}>
                <SelectTrigger aria-label="Investigation starting point">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">Empty · use my records</SelectItem>
                  <SelectItem value="sample">
                    Synthetic Sunward Foods drill
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="primary" disabled={!!busy}>
                <Plus size={16} />
                Create private investigation
              </Button>
            </form>
          ) : (
            <div className="dialog-body">
              <div className="signin-benefits">
                <LockKeyhole />
                <div>
                  <strong>Private, persistent investigations</strong>
                  <p>
                    Your sources and reviewer decisions are isolated from other
                    accounts. Public visitors see only the synthetic drill.
                  </p>
                </div>
              </div>
              <a
                className="primary signin-button"
                href="/signin-with-chatgpt?return_to=%2Fworkspace"
                target="_top"
              >
                Sign in with ChatGPT <ArrowUpRight size={17} />
              </a>
              <Button
                variant="outline"
                onClick={() => {
                  setInv(sampleInvestigation());
                  setNewOpen(false);
                  setView("room");
                  toast.success("Synthetic drill reset for this visit.");
                }}
              >
                Explore the sample without signing in
              </Button>
              <small className="small-note">
                Uploaded evidence is sent to Nebius only when you run
                extraction. Never upload data you are not authorized to process.
              </small>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set the recalled lots</DialogTitle>
            <DialogDescription>
              Select the lot identifiers listed in your supplier alert. The
              scope will be recalculated from approved records.
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-body">
            <div className="lot-check-list">
              {inv.dataset.lots.map((l) => (
                <label className="check-label" key={l.id}>
                  <Checkbox
                    checked={recallIds.includes(l.id)}
                    onCheckedChange={(v) =>
                      setRecallIds(
                        v
                          ? [...recallIds, l.id]
                          : recallIds.filter((id) => id !== l.id),
                      )
                    }
                  />
                  <span>
                    <strong>{l.id}</strong>
                    <small>
                      {l.name} · {l.quantity} {l.unit}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            <label className="field-label" htmlFor="hazard">
              Supplier alert / hazard
            </label>
            <textarea
              id="hazard"
              value={hazard}
              onChange={(e) => setHazard(e.target.value)}
              maxLength={300}
            />
            <Button
              className="primary"
              disabled={!recallIds.length || hazard.trim().length < 3 || !!busy}
              onClick={() =>
                run("Updating recalled lots", async () => {
                  await update({
                    action: "set-recall",
                    lotIds: recallIds,
                    hazard,
                  });
                  setSettingsOpen(false);
                  toast.success("Recall scope updated.");
                })
              }
            >
              Apply & trace lots <ArrowRight size={16} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {persisted
                ? "Delete this investigation?"
                : "Reset the synthetic drill?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {persisted
                ? "The saved investigation and its uploaded files will be deleted. Export a packet first if you need a copy."
                : "This clears the review decisions made during this visit and restores the fictional source records."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                run(
                  persisted ? "Deleting investigation" : "Resetting drill",
                  async () => {
                    if (persisted) {
                      await request("/api/investigations/" + inv.id, "DELETE");
                      const list = await refreshList();
                      if (list.length)
                        setInv(
                          (await request("/api/investigations/" + list[0].id))
                            .investigation,
                        );
                      else {
                        setInv(sampleInvestigation());
                        setNewOpen(true);
                      }
                    } else setInv(sampleInvestigation());
                    setResetOpen(false);
                    setView("room");
                  },
                )
              }
            >
              {persisted ? "Delete investigation" : "Reset drill"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="mobile-nav">
          <SheetHeader>
            <SheetTitle>RecallRoom</SheetTitle>
            <SheetDescription>Your investigation workspace</SheetDescription>
          </SheetHeader>
          {nav.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${view === n.id ? "active" : ""}`}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={19} />
              {n.label}
            </button>
          ))}
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}

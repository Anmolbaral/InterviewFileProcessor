import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import raw from "./data/bundle.json";
import type { Bundle, Context, Finding } from "./types";
import { buildIndex } from "./lib/index";
import { buildMarkdown } from "./lib/markdown";
import {
  DIMENSIONS, cellFindings, companyName, matrixFindings, splitColumns,
  unprocessedBatches, vendorColumns,
} from "./lib/matrix";
import { EMPLOYMENT_LABELS } from "./lib/format";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Matrix, type Cell } from "./components/Matrix";
import { Drawer } from "./components/Drawer";
import { CellDetail } from "./components/CellDetail";
import { Cases } from "./components/Cases";
import { CaseDetail } from "./components/CaseDetail";
import { BriefPanel } from "./components/BriefPanel";
import { Methods } from "./components/Methods";
import { Toast } from "./components/Toast";
import { Overview } from "./components/Overview";
import { WorkspaceNav, type View } from "./components/WorkspaceNav";

const bundle = raw as unknown as Bundle;
const STORAGE_KEY = `synquery:${bundle.fingerprint}`;

interface Saved { selection: string[]; conclusion: string }

function load(): Saved {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (text) return JSON.parse(text) as Saved;
  } catch { /* storage unavailable: start empty */ }
  return { selection: [], conclusion: "" };
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    document.body.removeChild(area);
    return ok;
  }
}

type Panel =
  | { kind: "cell"; cell: Cell }
  | { kind: "case"; context: Context }
  | { kind: "brief" }
  | { kind: "methods" }
  | null;

export default function App() {
  const index = useMemo(() => buildIndex(bundle), []);
  const initial = useRef(load());
  const [selection, setSelection] = useState<Set<string>>(new Set(initial.current.selection));
  const [conclusion, setConclusion] = useState(initial.current.conclusion);
  const [saved, setSaved] = useState(true);
  const [included, setIncluded] = useState<Set<string>>(new Set(Object.keys(bundle.documents)));
  const [state, setState] = useState("all");
  const [evidence, setEvidence] = useState("all");
  const [topic, setTopic] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarOpener = useRef<HTMLElement | null>(null);
  const [view, setView] = useState<View>("overview");
  const [chosen, setChosen] = useState<Set<string> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setSaved(false);
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ selection: [...selection], conclusion } satisfies Saved));
      } catch { /* disclosed on the panel */ }
      setSaved(true);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [selection, conclusion]);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);
  const copy = useCallback(async (text: string, done: string) => {
    notify((await writeClipboard(text)) ? done : "Copy failed: use Export instead");
  }, [notify]);

  const live = useMemo(() => bundle.findings.filter((f) => f.review_state !== "rejected"), []);
  const reviewedCount = live.filter((f) =>
    f.review_state === "reviewed" || f.review_state === "edited").length;
  const focus = useMemo(() => {
    const answer = bundle.questions.find((q) => q.id === topic)?.answer;
    return answer ? new Set(answer.finding_ids) : null;
  }, [topic]);
  const scoped = useMemo(() => live.filter((f) => included.has(f.document_id)), [live, included]);
  const filtered = useMemo(() => scoped.filter((f: Finding) =>
    (state === "all" || f.review_state === state)
      && (evidence === "all" || f.evidence_type === evidence)
      && (!focus || focus.has(f.id))), [scoped, state, evidence, focus]);
  const unfiltered = useMemo(() => matrixFindings(scoped), [scoped]);
  const visible = useMemo(() => matrixFindings(filtered), [filtered]);
  const columns = useMemo(() => splitColumns(unfiltered, vendorColumns(unfiltered)), [unfiltered]);
  const allVendors = [...columns.main, ...columns.minor];
  const vendors = allVendors.filter((v) => (chosen ? chosen.has(v) : columns.main.includes(v)));
  const toggleVendor = (vendor: string) => setChosen((current) => {
    const next = new Set(current ?? columns.main);
    if (next.has(vendor)) next.delete(vendor); else next.add(vendor);
    return next;
  });
  const unprocessed = useMemo(() => unprocessedBatches(bundle, included), [included]);
  const cell = panel?.kind === "cell" ? panel.cell : null;
  const caseContext = panel?.kind === "case" ? panel.context : null;
  const dimension = cell ? DIMENSIONS.find((d) => d.kind === cell.kind) : null;
  const cellList = cell ? cellFindings(visible, cell.vendor, cell.kind) : [];

  const toggle = (id: string) => setSelection((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const markdown = () => buildMarkdown({ bundle, index, selection: [...selection], conclusion });
  const download = () => {
    if (!selection.size) { notify("Add at least one finding to the brief first"); return; }
    const blob = new Blob([markdown()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), {
      href: url,
      download: `itsm-brief-${bundle.fingerprint.slice(0, 8)}.md`,
    });
    link.click();
    URL.revokeObjectURL(url);
    notify("Brief downloaded as Markdown (analyst draft)");
  };
  const selectedTopic = bundle.questions.find((q) => q.id === topic);
  const gaps = selectedTopic?.answer?.gaps ?? [];
  const close = () => setPanel(null);
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    window.requestAnimationFrame(() => sidebarOpener.current?.focus());
  }, []);
  const toggleSidebar = useCallback(() => {
    if (sidebarOpen) closeSidebar();
    else {
      sidebarOpener.current = document.activeElement as HTMLElement | null;
      setSidebarOpen(true);
    }
  }, [sidebarOpen, closeSidebar]);

  const openCase = (context: Context) => setPanel({ kind: "case", context });

  return (
    <div id="sq-wireframe" data-density="relaxed">
      <div className="sq-app" aria-label="ITSM decisions">
        <WorkspaceNav view={view} onView={setView} />
        <Sidebar
          bundle={bundle}
          index={index}
          live={live}
          open={sidebarOpen}
          onClose={closeSidebar}
          included={included}
          onToggleDocument={(id) => setIncluded((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })}
          state={state} onState={setState} evidence={evidence} onEvidence={setEvidence} />
        <div className="sq-workspace">
          <Header
            bundle={bundle}
            reviewed={reviewedCount}
            total={live.length}
            view={view}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
            topic={topic}
            onTopic={setTopic}
            briefCount={selection.size}
            onBrief={() => setPanel({ kind: "brief" })}
            onExport={download}
            onMethods={() => setPanel({ kind: "methods" })}
          />
          <main className="sq-page">
            {selectedTopic && (
              <div className="sq-topic-banner">
                <p>
                  <strong>Topic:</strong> {selectedTopic.text}{" "}
                  <button type="button" className="sq-link" onClick={() => setTopic("")}>Clear</button>
                </p>
                <p>Showing related extracted findings; review is in progress. This is a filter, not an answer.</p>
                {gaps.length > 0 && (
                  <ul>{gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul>
                )}
              </div>
            )}
            {view === "overview" ? (
              <Overview
                bundle={bundle}
                index={index}
                findings={filtered}
                allFindings={scoped}
                included={included}
                onView={openCase}
              />
            ) : view === "cases" ? (
              <>
                <div className="sq-page-head">
                  <div>
                    <p className="sq-eyebrow">Company by company</p>
                    <h1>Company cases</h1>
                    <p className="sq-lede">
                      Inspect each reported deployment, choice driver, price, and implementation
                      against its source passages.
                    </p>
                  </div>
                </div>
                <Cases bundle={bundle} index={index} findings={filtered} onView={openCase} />
              </>
            ) : (
              <>
                <div className="sq-comp-head">
                  <div>
                    <p className="sq-eyebrow">Cross-case view</p>
                    <h1>Compare vendors</h1>
                    <p className="sq-lede">
                      Compare reported relationships, reasons, pricing, and implementation.
                      Each populated cell opens its findings and exact passages.
                    </p>
                  </div>
                </div>
                <p className="sq-compare-note">{bundle.framing.market_share_unestimated}</p>
                <Matrix
                  findings={visible}
                  unfiltered={unfiltered}
                  vendors={vendors}
                  allVendors={allVendors}
                  onToggleVendor={toggleVendor}
                  index={index}
                  selected={cell}
                  onSelect={(c) => setPanel({ kind: "cell", cell: c })} unprocessed={unprocessed.length > 0}
                  emptyMessage={included.size
                    ? (vendors.length ? "No findings in this view." : "Pick at least one vendor above.")
                    : "Include at least one interview in Sources & filters."}
                />
              </>
            )}
            {unprocessed.length > 0 && (
              <p className="sq-unprocessed">
                {unprocessed.length} transcript section{unprocessed.length > 1 ? "s" : ""}
                {" "}not yet processed; see Methods.
              </p>
            )}
          </main>
          <Drawer
            open={panel?.kind === "cell"}
            kicker={cell?.vendor ?? ""}
            title={dimension?.title ?? ""}
            onClose={close}
          >
            <CellDetail
              bundle={bundle}
              index={index}
              cell={cellList}
              selection={selection}
              onToggle={toggle}
              onCopy={copy}
            />
          </Drawer>
          <Drawer
            open={panel?.kind === "case"}
            kicker={caseContext
              ? `${EMPLOYMENT_LABELS[caseContext.employment]} of ${
                bundle.documents[caseContext.document_id]?.label ?? ""
              }`
              : ""}
            title={caseContext ? companyName(caseContext) : ""}
            onClose={close}
          >
            {caseContext && (
              <CaseDetail
                bundle={bundle}
                index={index}
                context={caseContext}
                findings={filtered}
                selection={selection}
                onToggle={toggle}
                onCopy={copy}
              />
            )}
          </Drawer>
          <Drawer
            open={panel?.kind === "brief"}
            kicker="Analyst draft"
            title={`Brief · ${selection.size} finding${selection.size === 1 ? "" : "s"}`}
            onClose={close}
          >
            <BriefPanel
              bundle={bundle}
              index={index}
              selection={selection}
              conclusion={conclusion}
              onConclusion={setConclusion}
              onToggle={toggle}
              saved={saved}
              onCopyMarkdown={() => void copy(markdown(), "Brief copied as Markdown (analyst draft)")}
              onDownload={download}
            />
          </Drawer>
          <Drawer
            open={panel?.kind === "methods"}
            kicker="Methods and source versions"
            title="How to read this workspace"
            onClose={close}
          >
            <Methods bundle={bundle} unprocessed={unprocessed} />
          </Drawer>
          <Toast message={toast} />
        </div>
      </div>
    </div>
  );
}

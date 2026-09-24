import type { Bundle, Finding } from "../types";
import type { Index } from "../lib/index";
import { EMPLOYMENT_LABELS, EVIDENCE_LABELS } from "../lib/format";
import { companyName, primaryCases, roleLine, scaleLines } from "../lib/matrix";
import { useEffect, useRef } from "react";

interface Props {
  bundle: Bundle;
  index: Index;
  live: Finding[];
  open: boolean;
  onClose: () => void;
  included: Set<string>;
  onToggleDocument: (id: string) => void;
  state: string;
  onState: (value: string) => void;
  evidence: string;
  onEvidence: (value: string) => void;
}

const select = [
  "w-full rounded-md border border-slate-300 bg-white p-2 text-sm",
  "focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
].join(" ");

export function Sidebar({
  bundle, index, live, open, onClose, included, onToggleDocument,
  state, onState, evidence, onEvidence,
}: Props) {
  const panel = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = panel.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, [href], textarea:not(:disabled)",
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  const evidenceTypes = [...new Set(live.map((f) => f.evidence_type))].sort();
  const contexts = bundle.contexts.filter((c) => c.review_state !== "rejected" && included.has(c.document_id));
  const { primary } = primaryCases(contexts, live);
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sources and filters"
          onClick={onClose}
          className="sq-filter-scrim"
        />
      )}
      <aside
        id="sidebar"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Sources and filters"
        aria-hidden={!open}
        className={`sq-filter-drawer ${open ? "open" : ""}`}>
        <div className="sq-filter-head">
          <div>
            <h2>Sources &amp; filters</h2>
            <p>
              {Object.keys(bundle.documents).length} expert interviews · {contexts.length} contexts ·
              {" "}{primary.length} decision cases
            </p>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="Close sources and filters"
            className="sq-close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="sq-filter-content">
          <h3 className="sq-filter-label">Filters</h3>
          <div className="sq-filter-fields">
            <div>
              <label htmlFor="filter-state">Review status</label>
              <select id="filter-state" className={select} value={state} onChange={(e) => onState(e.target.value)}>
                <option value="all">All findings</option>
                <option value="reviewed">Reviewed only</option>
                <option value="proposed">Unreviewed only</option>
                <option value="edited">Analyst-edited only</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-evidence">Evidence type</label>
              <select
                id="filter-evidence"
                className={select}
                value={evidence}
                onChange={(e) => onEvidence(e.target.value)}
              >
                <option value="all">All evidence types</option>
                {evidenceTypes.map((t) => <option key={t} value={t}>{EVIDENCE_LABELS[t] ?? t}</option>)}
              </select>
            </div>
          </div>
          <h3 className="sq-filter-label">Sources included</h3>
          <ul className="sq-filter-sources">
            {Object.entries(bundle.documents).map(([id, document]) => (
              <li key={id}>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={included.has(id)}
                    onChange={() => onToggleDocument(id)}
                  />
                  <span>
                    <span className="sq-filter-source-title">{document.label}</span>
                    <span className="sq-filter-source-meta">
                      {roleLine(bundle, index, id) || document.source_filename}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <details className="sq-context-list">
            <summary>Company contexts ({contexts.length})</summary>
            <ul>
              {contexts.map((context) => {
                const scale = scaleLines(live, context.id);
                return (
                  <li key={context.id}>
                    <p className="sq-filter-context-name">{companyName(context)}</p>
                    <p className="sq-filter-context-meta">
                      {EMPLOYMENT_LABELS[context.employment]} · {bundle.documents[context.document_id]?.label}
                    </p>
                    {scale.length > 0 && <ul>{scale.slice(0, 3).map((s) => <li key={s}>{s}</li>)}</ul>}
                  </li>
                );
              })}
            </ul>
          </details>
        </div>
      </aside>
    </>
  );
}

import type { Bundle, Finding } from "../types";
import type { Index } from "../lib/index";
import { EMPLOYMENT_LABELS, EVIDENCE_LABELS } from "../lib/format";
import { companyName, roleLine, scaleLines } from "../lib/matrix";

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

const select = "w-full rounded-md border border-slate-300 bg-white p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export function Sidebar({ bundle, index, live, open, onClose, included, onToggleDocument, state, onState, evidence, onEvidence }: Props) {
  const evidenceTypes = [...new Set(live.map((f) => f.evidence_type))].sort();
  const contexts = bundle.contexts.filter((c) => c.review_state !== "rejected" && included.has(c.document_id));
  return (
    <>
      {open && <button type="button" aria-label="Close sources and filters" onClick={onClose} className="fixed inset-0 z-20 bg-slate-900/30 md:hidden" />}
      <aside id="sidebar" aria-label="Sources and filters"
        className={`${open ? "fixed inset-y-0 left-0 z-30 flex" : "hidden"} w-72 shrink-0 flex-col border-r border-slate-200 bg-white md:static md:z-auto md:flex`}>
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">ITSM buying decisions</h1>
            <p className="mt-1 text-xs text-slate-500">{Object.keys(bundle.documents).length} expert interviews · {contexts.length} company contexts</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close sources and filters" className="rounded p-1 text-slate-500 hover:bg-slate-100 md:hidden">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Filters</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="filter-state">Review status</label>
              <select id="filter-state" className={select} value={state} onChange={(e) => onState(e.target.value)}>
                <option value="all">All findings</option>
                <option value="reviewed">Reviewed only</option>
                <option value="proposed">Unreviewed only</option>
                <option value="edited">Analyst-edited only</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="filter-evidence">Evidence type</label>
              <select id="filter-evidence" className={select} value={evidence} onChange={(e) => onEvidence(e.target.value)}>
                <option value="all">All evidence types</option>
                {evidenceTypes.map((t) => <option key={t} value={t}>{EVIDENCE_LABELS[t] ?? t}</option>)}
              </select>
            </div>
          </div>
          <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-slate-400">Sources included</h3>
          <ul className="space-y-2">
            {Object.entries(bundle.documents).map(([id, document]) => (
              <li key={id} className="rounded bg-slate-100 p-2 text-sm text-slate-700">
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={included.has(id)} onChange={() => onToggleDocument(id)} />
                  <span>
                    <span className="block font-medium">{document.label}</span>
                    <span className="block text-xs text-slate-500">{roleLine(bundle, index, id) || document.source_filename}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <details className="mt-8">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-slate-400">Company contexts ({contexts.length})</summary>
            <ul className="mt-3 space-y-3">
              {contexts.map((context) => {
                const scale = scaleLines(live, context.id);
                return (
                  <li key={context.id} className="text-sm">
                    <p className="font-medium text-slate-800">{companyName(context)}</p>
                    <p className="text-xs text-slate-500">{EMPLOYMENT_LABELS[context.employment]} · {bundle.documents[context.document_id]?.label}</p>
                    {scale.length > 0 && <ul className="mt-1 list-disc pl-4 text-xs text-slate-600">{scale.slice(0, 3).map((s) => <li key={s}>{s}</li>)}</ul>}
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

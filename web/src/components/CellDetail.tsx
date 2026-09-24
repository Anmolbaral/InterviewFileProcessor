import type { Bundle, Finding, Passage } from "../types";
import type { Index } from "../lib/index";
import { evidenceLabel, formatQuantity, relationshipLabel } from "../lib/format";
import { NOT_ESTABLISHED, STATUS_WORD, attributionNote, bulletText, companyLine, contextOf, quoteText, roleLine, speakingAbout } from "../lib/matrix";

interface Props {
  bundle: Bundle;
  index: Index;
  cell: Finding[];
  selection: Set<string>;
  onToggle: (id: string) => void;
  onCopy: (text: string, done: string) => void;
}

const link = "text-xs font-medium text-indigo-700 hover:text-indigo-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600";
const STATUS_STYLE: Record<string, string> = {
  proposed: "border-amber-300 bg-amber-50 text-amber-900",
  reviewed: "border-emerald-300 bg-emerald-50 text-emerald-900",
  edited: "border-sky-300 bg-sky-50 text-sky-900",
  rejected: "border-slate-300 bg-slate-100 text-slate-600",
};

export function StatusBadge({ finding }: { finding: Pick<Finding, "review_state"> }) {
  return <span className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[finding.review_state]}`}>{STATUS_WORD[finding.review_state]}</span>;
}

function Quote({ passage, role, finding, bundle, index, onCopy }: { passage: Passage; role: "supports" | "qualifies"; finding: Finding; bundle: Bundle; index: Index; onCopy: Props["onCopy"] }) {
  const context = contextOf(finding, index);
  return (
    <article className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-600">
        <span className="font-medium text-slate-800">{passage.speaker_label ?? "unattributed"}</span>
        {context && <> · speaking about {speakingAbout([context])}</>}
        {passage.timestamp_raw && <> · <span className="font-mono">{passage.timestamp_raw}</span></>}
        {role === "qualifies" && <> · <span className="text-amber-900">qualifies the statement</span></>}
      </p>
      <blockquote className={`my-2 whitespace-pre-wrap border-l-2 pl-3 text-sm text-slate-700 ${role === "qualifies" ? "border-amber-300" : "border-indigo-300"}`}>{passage.text}</blockquote>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-slate-400" title="Citation ID in the canonical transcript store">{passage.citation_id ?? passage.id}{roleLine(bundle, index, passage.document_id) ? ` · current role: ${roleLine(bundle, index, passage.document_id)}` : ""}</span>
        <button type="button" className="text-xs font-medium text-slate-600 hover:text-indigo-700" onClick={() => onCopy(quoteText(passage, bundle, index, [context]), "Quote copied with attribution")}>Copy quote</button>
      </div>
    </article>
  );
}

/** The unit of reading is one finding with its supporting and qualifying passages directly beneath it. */
export function FindingUnit({ finding, bundle, index, selection, onToggle, onCopy }: { finding: Finding } & Omit<Props, "cell">) {
  const context = contextOf(finding, index);
  const quantity = formatQuantity(finding.quantity, finding.kind);
  const inBrief = selection.has(finding.id);
  const passages = [...finding.supporting.map((id) => ({ id, role: "supports" as const })), ...finding.qualifying.map((id) => ({ id, role: "qualifies" as const }))];
  return (
    <li className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm leading-relaxed text-slate-900">{finding.statement}</p>
        <StatusBadge finding={finding} />
      </div>
      <p className="mt-2 text-xs text-slate-600">
        {companyLine(context, finding.context_id ?? NOT_ESTABLISHED)} · {bundle.documents[finding.document_id]?.label} · {evidenceLabel(finding.evidence_type)}{finding.kind === "vendor_relationship" ? ` · ${relationshipLabel(finding.relationship)}` : ""}
      </p>
      {attributionNote(finding) && <p className="mt-1 rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-900">{attributionNote(finding)}</p>}
      {quantity && <p className="mt-1 text-xs text-slate-700">{quantity}</p>}
      {finding.qualifications.map((q) => <p key={q} className="mt-1 text-xs text-amber-900">Qualified: {q}</p>)}
      {finding.review_note && <p className="mt-1 text-xs text-emerald-900">Reviewer: {finding.review_note}</p>}
      <div className="mt-3 space-y-2">
        {passages.map(({ id, role }) => {
          const passage = index.passages.get(id);
          return passage ? <Quote key={id} passage={passage} role={role} finding={finding} bundle={bundle} index={index} onCopy={onCopy} />
            : <p key={id} className="rounded border border-red-300 p-2 text-xs text-red-800">{id} is not in this bundle; the statement is unsupported here.</p>;
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        <button type="button" className={link} onClick={() => onCopy(bulletText(finding, bundle, index), "Copied with sources and status")}>Copy as bullet</button>
        <button type="button" className={link} onClick={() => onToggle(finding.id)} aria-pressed={inBrief}>{inBrief ? "Remove from brief" : "Add to brief"}</button>
      </div>
    </li>
  );
}

export function CellDetail({ bundle, index, cell, selection, onToggle, onCopy }: Props) {
  if (!cell.length) return <p className="py-10 text-center text-sm text-slate-500">No findings in this view for this vendor and dimension.</p>;
  const reviewed = cell.filter((f) => f.review_state === "reviewed" || f.review_state === "edited").length;
  return (
    <section>
      <h4 className="text-sm font-semibold text-slate-900">Findings to review</h4>
      <p className="mb-3 mt-1 text-xs text-slate-500">
        {cell.length} finding{cell.length > 1 ? "s" : ""}, {reviewed} reviewed. Each statement sits above the passages it cites. Citation IDs resolve to the transcript store; whether a statement is supported in meaning is what review decides.
      </p>
      <ul className="space-y-3">
        {cell.map((finding) => <FindingUnit key={finding.id} finding={finding} bundle={bundle} index={index} selection={selection} onToggle={onToggle} onCopy={onCopy} />)}
      </ul>
    </section>
  );
}

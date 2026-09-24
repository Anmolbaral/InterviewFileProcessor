import type { Bundle, Finding } from "../types";
import type { Index } from "../lib/index";
import { NOT_ESTABLISHED, STATUS_WORD, companyLine, contextOf } from "../lib/matrix";

interface Props {
  bundle: Bundle;
  index: Index;
  selection: Set<string>;
  conclusion: string;
  onConclusion: (text: string) => void;
  onToggle: (id: string) => void;
  onCopyMarkdown: () => void;
  onDownload: () => void;
  saved: boolean;
}

export function BriefPanel({ bundle: _bundle, index, selection, conclusion, onConclusion, onToggle, onCopyMarkdown, onDownload, saved }: Props) {
  const findings = [...selection].map((id) => index.findings.get(id)).filter((f): f is Finding => Boolean(f));
  return (
    <>
      <section className="mb-6">
        <h4 className="mb-2 text-sm font-semibold text-slate-900">Findings in the brief</h4>
        <p className="mb-2 text-xs text-slate-500">An analyst draft: unreviewed findings stay marked unreviewed in the export.</p>
        {findings.length === 0 ? <p className="text-sm text-slate-500">Nothing yet. Open a cell and use “Add to brief”.</p> : (
          <ul className="space-y-2">
            {findings.map((f) => (
              <li key={f.id} className="flex items-start justify-between gap-3 rounded border border-slate-200 p-3 text-sm">
                <span>• {f.statement}<span className="block text-xs text-slate-500">{companyLine(contextOf(f, index), f.context_id ?? NOT_ESTABLISHED)} · {STATUS_WORD[f.review_state]}</span></span>
                <button type="button" className="shrink-0 text-xs text-slate-500 underline hover:text-indigo-700" onClick={() => onToggle(f.id)}>remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <label className="mb-1 block text-sm font-semibold text-slate-900" htmlFor="conclusion">Conclusion (analyst draft)</label>
        <textarea id="conclusion" value={conclusion} onChange={(e) => onConclusion(e.target.value)} rows={6}
          className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="What the selected bullets support. Exported as an analyst draft, never as evidence." />
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" disabled={!findings.length} onClick={onCopyMarkdown} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-slate-300">Copy Markdown</button>
          <button type="button" disabled={!findings.length} onClick={onDownload} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:text-slate-400">Download .md</button>
        </div>
        <p className="mt-3 text-xs text-slate-500">{saved ? "Saved" : "Saving"} in this browser only, per bundle version. The export carries every citation, quoted passage, unit, and caveat.</p>
      </section>
    </>
  );
}

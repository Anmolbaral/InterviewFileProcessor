import type { Bundle } from "../types";
import { companyName } from "../lib/matrix";

/** Scope, caveats, source versions, processing coverage, and reviewer decisions. */
export function Methods({ bundle, unprocessed }: { bundle: Bundle; unprocessed: string[] }) {
  const runs = bundle.runs.filter((r) => r.batches.length);
  const notes = bundle.contexts.filter((c) => c.review_note);
  return (
    <div className="space-y-6 text-sm text-slate-700">
      <section>
        <h4 className="font-semibold text-slate-900">Scope</h4>
        <p className="mt-1">{bundle.framing.scope}</p>
        <p className="mt-2">{bundle.framing.market_share_unestimated}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">{bundle.framing.caveats.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>
      <section>
        <h4 className="font-semibold text-slate-900">How findings were produced</h4>
        <p className="mt-1">Findings were proposed offline, one model call per transcript section, then every citation was checked mechanically against the canonical store. A record that failed was rejected with a reason; nothing is called at view time. "Reviewed" means a person checked the statement against its passages; "Unreviewed" means only the citations were checked.</p>
        {unprocessed.length > 0 && <p className="mt-2 text-amber-900">Not yet processed: {unprocessed.join(", ")}.</p>}
        {runs.map((run) => (
          <details key={run.id} className="mt-2">
            <summary className="cursor-pointer text-xs">Run {run.id.slice(0, 8)} · {run.model} · prompt {run.prompt_version} · {run.batches.length} sections</summary>
            <table className="mt-2 w-full text-xs">
              <thead><tr><th scope="col" className="text-left">Section</th><th scope="col" className="text-left">Outcome</th><th scope="col" className="text-left">Kept</th><th scope="col" className="text-left">Rejected</th></tr></thead>
              <tbody>
                {[...run.batches].sort((a, b) => a.batch_id.localeCompare(b.batch_id)).map((b) => (
                  <tr key={b.batch_id} className="border-t border-slate-100 align-top">
                    <td className="py-1 font-mono">{b.batch_id}</td>
                    <td className="py-1">{b.status === "findings" ? "completed" : b.status === "no_findings" ? "completed, nothing relevant" : `failed: ${b.error ?? ""}`}</td>
                    <td className="py-1 tabular-nums">{b.finding_ids.length + b.context_ids.length}</td>
                    <td className="py-1">{b.rejected.length ? <details><summary className="cursor-pointer">{b.rejected.length}</summary><ul className="list-disc pl-4">{b.rejected.map((r) => <li key={r}>{r}</li>)}</ul></details> : "0"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </section>
      {notes.length > 0 && (
        <section>
          <h4 className="font-semibold text-slate-900">Reviewer decisions on company names</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5">{notes.map((c) => <li key={c.id}><span className="font-medium">{companyName(c)}</span>: {c.review_note}</li>)}</ul>
        </section>
      )}
      <section>
        <h4 className="font-semibold text-slate-900">Source versions</h4>
        <ul className="mt-1 space-y-1 font-mono text-xs">
          {Object.entries(bundle.documents).map(([id, d]) => <li key={id}>{d.label}: {d.source_filename} · sha256 {d.source_sha256.slice(0, 16)}… · extraction {d.extraction_sha256.slice(0, 16)}…</li>)}
          <li>bundle {bundle.fingerprint.slice(0, 16)}… built {bundle.built} · parser {bundle.versions.parser} · contract {bundle.versions.contract} · dashboard {bundle.versions.dashboard}</li>
        </ul>
      </section>
    </div>
  );
}

import type { Bundle, Context, Finding } from "../types";
import type { Index } from "../lib/index";
import { EMPLOYMENT_LABELS } from "../lib/format";
import { STATUS_WORD, caseSummary, companyName, primaryCases, roleLine } from "../lib/matrix";

interface Props {
  bundle: Bundle;
  index: Index;
  findings: Finding[];
  onView: (context: Context) => void;
}

export function Cases({ bundle, index, findings, onView }: Props) {
  const included = new Set(findings.map((f) => f.document_id));
  const contexts = bundle.contexts.filter((c) => included.has(c.document_id));
  const { primary, background } = primaryCases(contexts, findings);
  return (
    <section aria-labelledby="cases-heading">
      <h2 id="cases-heading" className="text-lg font-semibold text-slate-900">Cases</h2>
      <p className="mt-1 text-sm text-slate-500">One card per company whose platform decision an expert describes. Claims are expert-reported and stay marked unreviewed until a person checks them against the passages.</p>
      {primary.length === 0 && <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No cases in this view.</p>}
      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {primary.map((context) => {
          const c = caseSummary(context, findings);
          return (
            <li key={context.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{companyName(context)}</h3>
                  <p className="text-xs text-slate-500">{EMPLOYMENT_LABELS[context.employment]} of {bundle.documents[context.document_id]?.label}{roleLine(bundle, index, context.document_id) ? `, ${roleLine(bundle, index, context.document_id)}` : ""}</p>
                </div>
                <span className="shrink-0 rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700">{c.reviewed} of {c.total} reviewed</span>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Platform used</dt>
                  <dd className="text-slate-800">{c.platforms.join(", ") || "Not stated"}{c.previously.length > 0 && <span className="text-slate-500"> · previously {c.previously.join(", ")}</span>}</dd>
                </div>
                {c.scale.length > 0 && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scale</dt>
                    <dd className="text-slate-700">{c.scale.slice(0, 2).join(" ")}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reported reason for the choice</dt>
                  {c.reasons.length === 0 ? <dd className="text-slate-500">No selection reason extracted for this case.</dd> : (
                    <dd>
                      <ul className="space-y-1">
                        {c.reasons.slice(0, 2).map((f) => <li key={f.id} className="text-slate-800">{f.statement} <span className="text-xs text-slate-500">· {STATUS_WORD[f.review_state]}</span></li>)}
                      </ul>
                      {c.reasons.length > 2 && <p className="mt-1 text-xs text-slate-500">{c.reasons.length - 2} more in the evidence view.</p>}
                    </dd>
                  )}
                </div>
              </dl>
              <div className="mt-4 flex-1" />
              <button type="button" onClick={() => onView(context)} aria-haspopup="dialog"
                className="self-start rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
                View evidence ({c.total})
              </button>
            </li>
          );
        })}
      </ul>
      {background.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-slate-600">Background contexts ({background.length}): employers mentioned in passing, without a described deployment</summary>
          <ul className="mt-2 space-y-1">
            {background.map((context) => {
              const c = caseSummary(context, findings);
              return <li key={context.id} className="flex flex-wrap items-center gap-2 text-slate-700">{companyName(context)} · {EMPLOYMENT_LABELS[context.employment]} of {bundle.documents[context.document_id]?.label}{c.previously.length ? ` · previously ${c.previously.join(", ")}` : ""} <button type="button" className="text-xs text-indigo-700 underline" onClick={() => onView(context)}>View evidence ({c.total})</button></li>;
            })}
          </ul>
        </details>
      )}
    </section>
  );
}

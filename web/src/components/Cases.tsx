import type { Bundle, Context, Finding } from "../types";
import type { Index } from "../lib/index";
import { EMPLOYMENT_LABELS } from "../lib/format";
import {
  STATUS_WORD, attributionNote, caseSummary, companyName, primaryCases, roleLine,
} from "../lib/matrix";

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
    <section aria-labelledby="cases-heading" className="sq-case-list">
      <h2 id="cases-heading">Company cases</h2>
      <p className="sq-case-intro">
        One case per company context with a described deployment. Findings stay labeled by
        review status and link to their cited passages.
      </p>
      {primary.length === 0 && (
        <p className="sq-empty">No cases in this view.</p>
      )}
      <ul className="sq-case-cards">
        {primary.map((context) => {
          const c = caseSummary(context, findings);
          return (
            <li key={context.id} className="sq-case-card">
              <div className="sq-case-card-head">
                <div>
                  <h3>{companyName(context)}</h3>
                  <p>
                    {EMPLOYMENT_LABELS[context.employment]} of {bundle.documents[context.document_id]?.label}
                    {roleLine(bundle, index, context.document_id)
                      ? `, ${roleLine(bundle, index, context.document_id)}`
                      : ""}
                  </p>
                </div>
                <span className="sq-tag sq-tag-muted">{c.reviewed} of {c.total} reviewed</span>
              </div>
              <dl className="sq-case-facts">
                <div>
                  <dt>Platform used</dt>
                  <dd>
                    {c.platforms.join(", ") || "Not stated"}
                    {c.previously.length > 0 && <span> · previously {c.previously.join(", ")}</span>}
                  </dd>
                </div>
                {c.scale.length > 0 && (
                  <div>
                    <dt>Scale</dt>
                    <dd>{c.scale.slice(0, 2).join(" ")}</dd>
                  </div>
                )}
                <div>
                  <dt>Reported reason for the choice</dt>
                  {c.reasons.length === 0 ? (
                    <dd className="sq-muted">No selection reason extracted for this case.</dd>
                  ) : (
                    <dd>
                      <ul>
                        {c.reasons.slice(0, 2).map((f) => (
                          <li key={f.id}>
                            {f.statement} <span className="sq-muted">· {STATUS_WORD[f.review_state]}</span>
                            {attributionNote(f) && (
                              <span className="sq-warning-text"> · Company attribution needs review</span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {c.reasons.length > 2 && (
                        <p className="sq-muted">{c.reasons.length - 2} more in the evidence view.</p>
                      )}
                    </dd>
                  )}
                </div>
              </dl>
              <div className="sq-case-spacer" />
              <button
                type="button"
                onClick={() => onView(context)}
                aria-haspopup="dialog"
                className="sq-button sq-button-outline"
              >
                View evidence ({c.total})
              </button>
            </li>
          );
        })}
      </ul>
      {background.length > 0 && (
        <details className="sq-background-contexts">
          <summary>
            Background contexts ({background.length}): employers mentioned in passing, without a
            described deployment
          </summary>
          <ul>
            {background.map((context) => {
              const c = caseSummary(context, findings);
              return (
                <li key={context.id}>
                  {companyName(context)} · {EMPLOYMENT_LABELS[context.employment]} of{" "}
                  {bundle.documents[context.document_id]?.label}
                  {c.previously.length ? ` · previously ${c.previously.join(", ")}` : ""}{" "}
                  <button type="button" className="sq-link" onClick={() => onView(context)}>
                    View evidence ({c.total})
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}

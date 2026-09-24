import type { Bundle, Context, Finding } from "../types";
import type { Index } from "../lib/index";
import { EMPLOYMENT_LABELS } from "../lib/format";
import { STATUS_WORD, attributionNote, caseSummary, companyName, primaryCases, roleLine } from "../lib/matrix";

interface Props {
  bundle: Bundle;
  index: Index;
  findings: Finding[];
  allFindings: Finding[];
  included: Set<string>;
  onView: (context: Context) => void;
}

export function Overview({ bundle, index, findings, allFindings, included, onView }: Props) {
  const contexts = bundle.contexts.filter((context) =>
    context.review_state !== "rejected" && included.has(context.document_id));
  const { primary } = primaryCases(contexts, allFindings);

  return (
    <>
      <div className="sq-page-head">
        <div>
          <p className="sq-eyebrow">Decision workspace</p>
          <h1>What drove these ITSM choices?</h1>
          <p className="sq-lede">{bundle.framing.client_question}</p>
        </div>
        <div className="sq-head-number">
          <strong>{Object.keys(bundle.documents).length} interviews</strong>
          {primary.length} company cases in the included sources
        </div>
      </div>

      <section className="sq-limit-card" aria-labelledby="market-share-heading">
        <div className="sq-eyebrow">Market-share answer</div>
        <h2 id="market-share-heading">No defensible vendor shares.</h2>
        <p>{bundle.framing.market_share_unestimated}</p>
      </section>

      <div className="sq-section-title">
        <h2>Observed company choices</h2>
        <span>Interview evidence, not population estimates</span>
      </div>
      <div className="sq-choice-table">
        <div className="sq-choice-head" aria-hidden="true">
          <span>Company context</span><span>Platform relationship</span><span>Reported choice driver</span>
        </div>
        {primary.length === 0 ? (
          <p className="sq-empty">No company cases match the included sources and current filters.</p>
        ) : primary.map((context) => {
          const summary = caseSummary(context, findings);
          const completeSummary = caseSummary(context, allFindings);
          const role = roleLine(bundle, index, context.document_id);
          const platform = summary.platforms.length ? summary.platforms.join(", ")
            : completeSummary.platforms.length ? "Hidden by active filters" : "No deployed platform finding";
          const previous = summary.previously.length ? summary.previously.join(", ")
            : completeSummary.previously.length ? "Hidden by active filters" : "Not stated";
          const reason = summary.reasons[0];
          return (
            <article className="sq-choice-row" key={context.id}>
              <div className="sq-choice-context">
                <button type="button" className="sq-link" onClick={() => onView(context)} aria-haspopup="dialog">
                  {companyName(context)} <span aria-hidden="true">↗</span>
                </button>
                <span>
                  {EMPLOYMENT_LABELS[context.employment]} · {bundle.documents[context.document_id]?.label}
                  {role ? ` · ${role}` : ""}
                </span>
                {summary.scale.length > 0 && <span className="sq-scale">{summary.scale[0]}</span>}
              </div>
              <div className="sq-choice-platform">
                <strong>{platform}</strong>
                <small>Previous platform: {previous}</small>
                {summary.total === 0 && <small>No findings match the active filters.</small>}
              </div>
              <div className="sq-choice-reason">
                {reason ? (
                  <>
                    <p>{reason.statement}</p>
                    <div className="sq-reason-meta">
                      <span className={`sq-tag ${reason.review_state === "reviewed" ? "" : "sq-tag-muted"}`}>
                        {STATUS_WORD[reason.review_state]}
                      </span>
                      {attributionNote(reason) && (
                        <span className="sq-warning-text">Company attribution needs review</span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="sq-muted">
                    {completeSummary.reasons.length
                      ? "No choice driver matches the active filters."
                      : "No selection reason extracted for this case."}
                  </p>
                )}
                <button type="button" className="sq-link" onClick={() => onView(context)} aria-haspopup="dialog">
                  Inspect case evidence ↗
                </button>
              </div>
            </article>
          );
        })}
        <div className="sq-choice-foot">
          <span>{bundle.framing.scope}</span>
          <span>{bundle.framing.caveats[0]}</span>
        </div>
      </div>
    </>
  );
}

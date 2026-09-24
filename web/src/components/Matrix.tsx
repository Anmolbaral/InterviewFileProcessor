import type { Finding, Kind } from "../types";
import type { Index } from "../lib/index";
import { DIMENSIONS, cellFindings, cellSummary, emptyReason, vendorOf } from "../lib/matrix";

export interface Cell {
  vendor: string;
  kind: Kind;
}

interface Props {
  findings: Finding[];
  unfiltered: Finding[];
  vendors: string[];
  allVendors: string[];
  onToggleVendor: (vendor: string) => void;
  index: Index;
  selected: Cell | null;
  onSelect: (cell: Cell) => void;
  unprocessed: boolean;
  emptyMessage: string;
}

function StatusLine({ summary }: { summary: ReturnType<typeof cellSummary> }) {
  const unreviewed = summary.total - summary.reviewed;
  const status = summary.reviewed
    ? `${summary.reviewed} reviewed`
    : "Unreviewed";
  const proposals = unreviewed && summary.reviewed
    ? ` · ${unreviewed} unreviewed proposal${unreviewed > 1 ? "s" : ""}`
    : "";

  return <span className="sq-matrix-status">{status}{proposals} · open</span>;
}

export function Matrix({
  findings, unfiltered, vendors, allVendors, onToggleVendor, index,
  selected, onSelect, unprocessed, emptyMessage,
}: Props) {
  const picker = (
    <fieldset className="sq-vendor-picker">
      <legend className="sr-only">Vendors to compare</legend>
      <span>Vendors</span>
      {allVendors.map((vendor) => {
        const on = vendors.includes(vendor);
        return (
          <label key={vendor} className={`sq-vendor-option ${on ? "selected" : ""}`}>
            <input
              type="checkbox"
              className="sr-only"
              checked={on}
              onChange={() => onToggleVendor(vendor)}
            />
            {vendor}
          </label>
        );
      })}
    </fieldset>
  );

  if (!vendors.length) {
    return (
      <>
        {picker}
        <p className="sq-empty">{emptyMessage}</p>
      </>
    );
  }

  const cards = (
    <ul className="sq-matrix-cards md:hidden">
      {vendors.map((vendor) => (
        <li key={vendor} className="sq-compare-card">
          <h3>{vendor}</h3>
          <dl>
            {DIMENSIONS.map((dimension) => {
              const cell = cellFindings(findings, vendor, dimension.kind);
              const summary = cellSummary(cell, dimension.kind, index);
              const unfilteredCell = cellFindings(unfiltered, vendor, dimension.kind);
              return (
                <div key={dimension.kind} className="sq-matrix-mobile-row">
                  <dt>{dimension.title}</dt>
                  <dd>
                    {cell.length ? (
                      <button
                        type="button"
                        onClick={() => onSelect({ vendor, kind: dimension.kind })}
                        aria-haspopup="dialog"
                        className="sq-matrix-mobile-cell"
                      >
                        {summary.text}
                        <StatusLine summary={summary} />
                      </button>
                    ) : (
                      <span className="sq-matrix-empty">
                        {emptyReason(unfilteredCell, unprocessed)}
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {picker}
      {cards}
      <div className="sq-matrix-table-wrap hidden md:block">
        <table className="sq-matrix-table">
          <caption className="sr-only">
            Vendors named in interviews by comparison dimension. Each cell opens related
            findings and cited passages.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="sq-matrix-dimension-head">Dimension</th>
              {vendors.map((vendor) => {
                const products = [...new Set(unfiltered
                  .filter((finding) => vendorOf(finding) === vendor
                    && finding.vendor
                    && finding.vendor !== vendor)
                  .map((finding) => finding.vendor as string))];
                return (
                  <th key={vendor} scope="col" className="sq-matrix-vendor-head">
                    {vendor}
                    {products.length > 0 && (
                      <span>named as {products.join(", ")}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {DIMENSIONS.map((dimension) => (
              <tr key={dimension.kind}>
                <th scope="row" className="sq-matrix-row-head">
                  {dimension.title}
                  <span>{dimension.hint}</span>
                </th>
                {vendors.map((vendor) => {
                  const cell = cellFindings(findings, vendor, dimension.kind);
                  const active = selected?.vendor === vendor && selected.kind === dimension.kind;
                  const summary = cellSummary(cell, dimension.kind, index);
                  const unfilteredCell = cellFindings(unfiltered, vendor, dimension.kind);
                  return (
                    <td key={vendor} className={active ? "active" : ""}>
                      <button
                        type="button"
                        onClick={() => onSelect({ vendor, kind: dimension.kind })}
                        aria-haspopup="dialog"
                        aria-pressed={active}
                        disabled={!cell.length}
                        className="sq-matrix-cell"
                      >
                        {cell.length ? summary.text : (
                          <span className="sq-matrix-empty">
                            {emptyReason(unfilteredCell, unprocessed)}
                          </span>
                        )}
                        {cell.length > 0 && <StatusLine summary={summary} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

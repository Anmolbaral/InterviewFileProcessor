import type { Finding, Kind } from "../types";
import type { Index } from "../lib/index";
import { DIMENSIONS, cellFindings, cellSummary, emptyReason, vendorOf } from "../lib/matrix";

export interface Cell { vendor: string; kind: Kind }

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
  return <span className="mt-1 block text-xs text-slate-500">{summary.reviewed ? `${summary.reviewed} reviewed` : "Unreviewed"}{unreviewed && summary.reviewed ? ` · ${unreviewed} unreviewed proposal${unreviewed > 1 ? "s" : ""}` : ""} · open</span>;
}

export function Matrix({ findings, unfiltered, vendors, allVendors, onToggleVendor, index, selected, onSelect, unprocessed, emptyMessage }: Props) {
  const picker = (
    <fieldset className="mb-3 flex flex-wrap items-center gap-2">
      <legend className="sr-only">Vendors to compare</legend>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Vendors</span>
      {allVendors.map((vendor) => {
        const on = vendors.includes(vendor);
        return (
          <label key={vendor} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${on ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-slate-300 bg-white text-slate-600"}`}>
            <input type="checkbox" className="sr-only" checked={on} onChange={() => onToggleVendor(vendor)} />
            {vendor}
          </label>
        );
      })}
    </fieldset>
  );
  if (!vendors.length) return <>{picker}<p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{emptyMessage}</p></>;
  const cards = (
    <ul className="space-y-4 md:hidden">
      {vendors.map((vendor) => (
        <li key={vendor} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-bold text-slate-900">{vendor}</h3>
          <dl className="mt-2 divide-y divide-slate-100">
            {DIMENSIONS.map((dimension) => {
              const cell = cellFindings(findings, vendor, dimension.kind);
              const summary = cellSummary(cell, dimension.kind, index);
              return (
                <div key={dimension.kind} className="py-2">
                  <dt className="text-xs font-semibold text-slate-700">{dimension.title}</dt>
                  <dd>
                    {cell.length ? (
                      <button type="button" onClick={() => onSelect({ vendor, kind: dimension.kind })} aria-haspopup="dialog" className="w-full text-left text-sm text-slate-700">
                        {summary.text}<StatusLine summary={summary} />
                      </button>
                    ) : <span className="text-sm italic text-slate-400">{emptyReason(cellFindings(unfiltered, vendor, dimension.kind), unprocessed)}</span>}
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
    <div className="hidden max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <caption className="sr-only">Vendors named in the interviews (columns) by comparison dimension (rows); each cell opens the findings and quotes behind it.</caption>
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="sticky left-0 z-[1] w-48 min-w-48 border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Dimension</th>
            {vendors.map((vendor) => {
              const products = [...new Set(unfiltered.filter((f) => vendorOf(f) === vendor && f.vendor && f.vendor !== vendor).map((f) => f.vendor as string))];
              return (
                <th key={vendor} scope="col" className="w-64 min-w-64 border-r border-slate-200 px-5 py-3 text-left font-bold text-slate-900 last:border-r-0">
                  {vendor}
                  {products.length > 0 && <span className="mt-0.5 block text-xs font-normal text-slate-500">named as {products.join(", ")}</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {DIMENSIONS.map((dimension) => (
            <tr key={dimension.kind}>
              <th scope="row" className="sticky left-0 z-[1] w-48 min-w-48 border-r border-slate-200 bg-slate-50 px-4 py-4 text-left align-top font-medium text-slate-900">
                {dimension.title}
                <span className="mt-1 block text-xs font-normal text-slate-500">{dimension.hint}</span>
              </th>
              {vendors.map((vendor) => {
                const cell = cellFindings(findings, vendor, dimension.kind);
                const active = selected?.vendor === vendor && selected.kind === dimension.kind;
                const summary = cellSummary(cell, dimension.kind, index);
                const reason = cell.length ? null : emptyReason(cellFindings(unfiltered, vendor, dimension.kind), unprocessed);
                return (
                  <td key={vendor} className={`border-r border-slate-200 p-0 align-top last:border-r-0 ${active ? "bg-indigo-50 ring-2 ring-inset ring-indigo-500" : ""}`}>
                    <button type="button" onClick={() => onSelect({ vendor, kind: dimension.kind })} aria-haspopup="dialog" aria-pressed={active} disabled={!cell.length}
                      className="block h-full w-full px-5 py-4 text-left text-slate-700 hover:bg-indigo-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-default disabled:hover:bg-transparent">
                      {cell.length ? summary.text : <span className="italic text-slate-400">{reason}</span>}
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

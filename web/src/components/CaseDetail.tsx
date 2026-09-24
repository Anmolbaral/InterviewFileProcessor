import type { Bundle, Context, Finding } from "../types";
import type { Index } from "../lib/index";
import { CASE_SECTIONS } from "../lib/matrix";
import { FindingUnit } from "./CellDetail";

interface Props {
  bundle: Bundle;
  index: Index;
  context: Context;
  findings: Finding[];
  selection: Set<string>;
  onToggle: (id: string) => void;
  onCopy: (text: string, done: string) => void;
}

/** A case's findings grouped by dimension, each above the passages it cites. */
export function CaseDetail({ bundle, index, context, findings, selection, onToggle, onCopy }: Props) {
  const own = findings.filter((f) => f.context_id === context.id);
  if (!own.length) return <p className="py-10 text-center text-sm text-slate-500">No findings in this view for this case.</p>;
  return (
    <div className="space-y-6">
      {CASE_SECTIONS.map(({ kind, title }) => {
        const list = own.filter((f) => f.kind === kind);
        if (!list.length) return null;
        return (
          <section key={kind}>
            <h4 className="text-sm font-semibold text-slate-900">{title} <span className="font-normal text-slate-500">· {list.length}</span></h4>
            <ul className="mt-2 space-y-3">
              {list.map((f) => <FindingUnit key={f.id} finding={f} bundle={bundle} index={index} selection={selection} onToggle={onToggle} onCopy={onCopy} />)}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

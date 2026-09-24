export type View = "overview" | "cases" | "compare";

interface Props {
  view: View;
  onView: (view: View) => void;
}

const items: { id: View; label: string; mark: string }[] = [
  { id: "overview", label: "Overview", mark: "◈" },
  { id: "cases", label: "Cases", mark: "▤" },
  { id: "compare", label: "Compare vendors", mark: "⇄" },
];

export function WorkspaceNav({ view, onView }: Props) {
  return (
    <aside className="sq-sidebar">
      <div className="sq-brand">
        <span className="sq-wordmark">ITSM decisions</span>
      </div>
      <nav className="sq-nav" aria-label="Workspace views">
        {items.map((item) => (
          <button key={item.id} type="button" className={view === item.id ? "active" : ""}
            aria-current={view === item.id ? "page" : undefined} onClick={() => onView(item.id)}>
            <i aria-hidden="true">{item.mark}</i>{item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

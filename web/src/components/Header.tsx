import type { Bundle } from "../types";
import type { View } from "./WorkspaceNav";

interface Props {
  bundle: Bundle;
  reviewed: number;
  total: number;
  view: View;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  topic: string;
  onTopic: (id: string) => void;
  briefCount: number;
  onBrief: () => void;
  onExport: () => void;
  onMethods: () => void;
}

export function Header({
  bundle, reviewed, total, view, onToggleSidebar, sidebarOpen, topic, onTopic,
  briefCount, onBrief, onExport, onMethods,
}: Props) {
  const viewName = { overview: "Overview", cases: "Cases", compare: "Compare vendors" }[view];
  return (
    <header className="sq-topbar">
      <div className="sq-topbar-line">
        <div className="sq-breadcrumb">
          <span>Research workspace</span>
          <span aria-hidden="true"> / </span>
          <strong>{viewName}</strong>
        </div>
        <div className="sq-top-actions">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
            className="sq-button"
          >
            Sources &amp; filters
          </button>
          <button type="button" onClick={onMethods} className="sq-button">Methods</button>
          <button type="button" onClick={onBrief} className="sq-button">Brief (analyst draft) · {briefCount}</button>
          <button type="button" onClick={onExport} className="sq-button sq-button-primary">Export brief</button>
        </div>
      </div>
      <div className="sq-toolbar">
        <div className="sq-topic-select">
          <label className="sr-only" htmlFor="topic">Explore evidence by topic</label>
          <select id="topic" value={topic} onChange={(e) => onTopic(e.target.value)}>
            <option value="">Explore evidence by topic · all extracted findings</option>
            {bundle.questions.map((q) => <option key={q.id} value={q.id}>{q.text}</option>)}
          </select>
        </div>
        <p className="sq-status">
          {Object.keys(bundle.documents).length} interviews · {total} source-linked findings
        </p>
      </div>
      <p className="sq-review-line">
        {reviewed} of {total} findings reviewed; other records remain marked as proposals or analyst edits.
      </p>
    </header>
  );
}

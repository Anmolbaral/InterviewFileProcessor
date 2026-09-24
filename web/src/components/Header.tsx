import type { Bundle } from "../types";

interface Props {
  bundle: Bundle;
  reviewed: number;
  total: number;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  topic: string;
  onTopic: (id: string) => void;
  briefCount: number;
  onBrief: () => void;
  onExport: () => void;
  onMethods: () => void;
}

const button = "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600";

export function Header({ bundle, reviewed, total, onToggleSidebar, sidebarOpen, topic, onTopic, briefCount, onBrief, onExport, onMethods }: Props) {
  return (
    <header className="z-10 border-b border-slate-200 bg-white px-4 py-4 shadow-sm md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onToggleSidebar} aria-expanded={sidebarOpen} aria-controls="sidebar" className={`${button} md:hidden`}>Sources & filters</button>
        <div className="min-w-0 flex-1 basis-64">
          <label className="sr-only" htmlFor="topic">Explore evidence by topic</label>
          <select id="topic" value={topic} onChange={(e) => onTopic(e.target.value)}
            className="block w-full max-w-2xl rounded-md border border-slate-300 bg-slate-50 py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="">Explore evidence by topic · all extracted findings</option>
            {bundle.questions.map((q) => <option key={q.id} value={q.id}>{q.text}</option>)}
          </select>
        </div>
        <button type="button" onClick={onMethods} className={button}>Methods</button>
        <button type="button" onClick={onBrief} className={button}>Brief (analyst draft) · {briefCount}</button>
        <button type="button" onClick={onExport} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">Export brief</button>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        <span className="font-medium text-slate-800">These three interviews explain specific buying decisions. They do not measure vendor market share.</span>
        {" "}{reviewed} of {total} extracted findings reviewed so far; the rest are unreviewed model proposals.
      </p>
    </header>
  );
}

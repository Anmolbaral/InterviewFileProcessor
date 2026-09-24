import { useEffect, useRef, type ReactNode } from "react";

interface Props { open: boolean; kicker: string; title: string; onClose: () => void; children: ReactNode }

/** A non-modal right panel: the matrix stays clickable while it is open, Escape or Close dismisses it. */
export function Drawer({ open, kicker, title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dialog.show();
      heading.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      opener.current?.focus();
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <dialog ref={ref} aria-labelledby="drawer-title"
      className="fixed inset-y-0 right-0 left-auto z-40 m-0 h-full max-h-none w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-0 text-slate-800 shadow-2xl">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{kicker}</p>
          <h2 id="drawer-title" ref={heading} tabIndex={-1} className="mt-1 text-lg font-semibold text-slate-900 focus:outline-none">{title}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close panel" className="rounded-full p-2 text-slate-500 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}

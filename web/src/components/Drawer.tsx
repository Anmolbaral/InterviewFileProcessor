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
    <dialog ref={ref} aria-labelledby="drawer-title" className="sq-drawer">
      <div className="sq-drawer-top">
        <div>
          <p className="sq-eyebrow">{kicker}</p>
          <h2 id="drawer-title" ref={heading} tabIndex={-1}>{title}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close panel" className="sq-close">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="sq-drawer-content">{children}</div>
    </dialog>
  );
}

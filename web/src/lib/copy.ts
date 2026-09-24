import { useCallback, useState } from "react";

/** Clipboard writes fail in some browsers and contexts; the caller shows the text for manual copy instead. */
export function useCopy() {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.setTimeout(() => setStatus("idle"), 2500);
  }, []);
  return { copy, status };
}

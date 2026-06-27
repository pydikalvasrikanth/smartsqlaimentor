import { useEffect } from "react";

/**
 * Client-side copy/inspect deterrents. These raise the bar for casual users
 * but cannot stop a determined attacker — anything rendered in a browser can
 * still be captured via screenshots or by disabling JS.
 */
export function CopyProtection() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (import.meta.env.DEV) return; // keep DevTools available locally

    const blockKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // F12
      if (k === "f12") {
        e.preventDefault();
        return;
      }
      // Ctrl/Cmd+U (view-source), Ctrl/Cmd+S (save)
      if ((e.ctrlKey || e.metaKey) && (k === "u" || k === "s")) {
        e.preventDefault();
        return;
      }
      // Ctrl/Cmd+Shift+I / J / C  (DevTools, console, inspector)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k)) {
        e.preventDefault();
        return;
      }
    };

    const blockContext = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", blockKey, { capture: true });
    window.addEventListener("contextmenu", blockContext, { capture: true });
    return () => {
      window.removeEventListener("keydown", blockKey, { capture: true } as any);
      window.removeEventListener("contextmenu", blockContext, { capture: true } as any);
    };
  }, []);

  return null;
}
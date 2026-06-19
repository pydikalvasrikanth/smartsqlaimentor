import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { MessageSquarePlus, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const HIDE_ON = ["/auth", "/reset-password", "/feedback", "/sitemap.xml"];
const DISMISS_KEY = "feedback_fab_dismissed_v1";
// Auto-disappears after this many ms on every page load
const AUTO_HIDE_MS = 60_000;

export function FeedbackFab() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    return () => window.clearTimeout(t);
  }, [pathname]);

  if (!user || !visible) return null;
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;

  return (
    <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1 rounded-full border border-border bg-card shadow-lg pl-3 pr-1 py-1">
      <Link
        to="/feedback"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary"
      >
        <MessageSquarePlus className="h-3.5 w-3.5 text-primary" />
        Send feedback
      </Link>
      <button
        onClick={() => {
          setVisible(false);
          try {
            localStorage.setItem(DISMISS_KEY, "1");
          } catch {
            /* ignore */
          }
        }}
        aria-label="Dismiss feedback prompt"
        className="ml-1 grid h-5 w-5 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
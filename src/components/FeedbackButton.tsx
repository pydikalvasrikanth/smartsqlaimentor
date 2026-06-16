import { Link, useRouterState } from "@tanstack/react-router";
import { MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const HIDE_ON = ["/auth", "/reset-password", "/feedback", "/sitemap.xml"];

export function FeedbackButton() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!user) return null;
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;
  return (
    <Link
      to="/feedback"
      aria-label="Send feedback"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
    >
      <MessageSquarePlus className="h-4 w-4" />
      <span className="hidden sm:inline">Feedback</span>
    </Link>
  );
}
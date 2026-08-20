import { Link } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="relative z-50 w-full border-b border-warning/30 bg-gradient-to-r from-warning/20 via-warning/10 to-warning/20 text-warning-foreground">
      <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-3 px-4 py-2.5 text-center">
        <AlertTriangle className="hidden h-4 w-4 shrink-0 text-warning sm:block" />
        <p className="text-xs font-medium leading-relaxed sm:text-sm">
          <span className="font-semibold">We have moved to{" "}</span>
          <a
            href="https://aicodedost.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-bold underline underline-offset-2 hover:text-primary"
          >
            aicodedost.com
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="mx-2 opacity-50">|</span>
          <span className="font-semibold text-destructive">
            This old URL will stop working soon. Please update your bookmarks.
          </span>
        </p>
        <Link
          to="https://aicodedost.com/"
          className="hidden shrink-0 rounded-md bg-warning px-3 py-1 text-xs font-semibold text-warning-foreground transition-colors hover:bg-warning/80 sm:inline-flex"
        >
          Go to new site
        </Link>
      </div>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";

const MESSAGE = (
  <>
    <span className="font-semibold">Trial version</span>
    <span className="opacity-60">•</span>
    <span>
      Found a bug? Please report it on the{" "}
      <Link to="/feedback" className="underline underline-offset-2 font-medium">
        feedback page
      </Link>
      .
    </span>
    <span className="opacity-60">•</span>
    <span>
      Our domain is moving to <span className="font-semibold">www.aicodedost.com</span> very soon —
      same platform, an even better experience.
    </span>
  </>
);

export function AnnouncementBar() {
  return (
    <div className="relative w-full overflow-hidden border-b border-primary/25 bg-gradient-to-r from-primary/12 via-primary/5 to-primary/12 text-foreground">
      <div className="flex items-center gap-2 py-1.5">
        <span className="shrink-0 pl-3 pr-2">
          <Megaphone className="h-3.5 w-3.5 text-primary" />
        </span>
        <div className="marquee-track flex min-w-max items-center gap-6 text-xs">
          <span className="flex items-center gap-2 whitespace-nowrap">{MESSAGE}</span>
          <span aria-hidden className="flex items-center gap-2 whitespace-nowrap">
            {MESSAGE}
          </span>
        </div>
      </div>
    </div>
  );
}

import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Menu, X, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/hooks/use-theme";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/practice", label: "Practice" },
  { to: "/interview", label: "Interview" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  }

  return (
    <header className="border-b border-border bg-surface-2/60 backdrop-blur sticky top-0 z-30">
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Smart AI Code Playground</span>
        </Link>

        <nav aria-label="Main" className="ml-auto hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              activeProps={{ className: "px-3 py-1.5 rounded-md text-sm text-foreground bg-accent" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto md:ml-2 flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-accent"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="md:hidden border-t border-border px-4 py-2">
          <ul className="grid gap-1">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
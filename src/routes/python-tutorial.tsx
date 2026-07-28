import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Info, Menu, Moon, Sun, X } from "lucide-react";
import { SearchPalette } from "@/tutorials/python/components/SearchPalette";
import { TopicSidebar } from "@/tutorials/python/components/TopicSidebar";

export const Route = createFileRoute("/python-tutorial")({
  component: TutorialLayout,
});

const THEME_KEY = "pve-theme";

function TutorialLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const [light, setLight] = useState(false);

  useEffect(() => {
    try {
      setLight(localStorage.getItem(THEME_KEY) === "light");
    } catch {
      /* ignore */
    }
  }, []);

  function toggleTheme() {
    setLight((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(THEME_KEY, next ? "light" : "dark");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className={`tut-python${light ? " light" : ""} min-h-screen bg-background text-foreground`}>
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="Open topic list"
              className="lg:hidden rounded-md border border-border bg-surface p-1.5 text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-4 w-4" />
            </button>
            <Link to="/python-tutorial" className="flex items-center gap-2 group min-w-0">
              <span className="text-2xl group-hover:scale-110 transition-transform">🐍</span>
              <div className="hidden sm:flex flex-col leading-tight min-w-0">
                <span className="text-sm font-bold truncate">Python Visual Explainer</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  interactive · animated · live
                </span>
              </div>
            </Link>
          </div>
          <nav className="flex items-center gap-2">
            <SearchPalette />
            <button
              onClick={toggleTheme}
              aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
              className="rounded-md border border-border bg-surface p-1.5 text-muted-foreground hover:text-foreground transition"
            >
              {light ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>
            <Link
              to="/python-tutorial/about"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <Info className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">About</span>
            </Link>
            <Link
              to="/python"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Playground</span>
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        <TopicSidebar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
          <div className="relative z-10 h-full w-[85vw] max-w-xs bg-background border-r border-border overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-4 py-3">
              <span className="text-sm font-bold">All topics</span>
              <button onClick={() => setNavOpen(false)} aria-label="Close topic list" className="p-1 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <TopicSidebar variant="drawer" onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

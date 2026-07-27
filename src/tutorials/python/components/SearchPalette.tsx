import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { TOPICS } from "@/tutorials/python/data/topics";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fuse = useMemo(
    () =>
      new Fuse(TOPICS, {
        keys: ["title", "tagline", "tags", "levelName"],
        threshold: 0.35,
      }),
    []
  );

  const results = useMemo(() => {
    if (!q.trim()) return TOPICS.slice(0, 8);
    return fuse.search(q).slice(0, 10).map((r) => r.item);
  }, [q, fuse]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    setI(0);
  }, [open, q]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-2 transition"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search topics</span>
        <kbd className="ml-2 hidden sm:inline rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-xl rounded-xl border border-border bg-surface shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setI((n) => Math.min(n + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setI((n) => Math.max(n - 1, 0)); }
              if (e.key === "Enter" && results[i]) {
                setOpen(false);
                navigate({ to: "/learn/$topicId", params: { topicId: results[i].id } });
              }
            }}
            placeholder="Find any topic…"
            className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {results.map((t, idx) => (
            <li key={t.id}>
              <button
                onMouseEnter={() => setI(idx)}
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/learn/$topicId", params: { topicId: t.id } });
                }}
                className={`flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition ${
                  idx === i ? "bg-primary/15" : "hover:bg-surface-2"
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.tagline}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 mt-1">
                  L{t.level}
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No topics match.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
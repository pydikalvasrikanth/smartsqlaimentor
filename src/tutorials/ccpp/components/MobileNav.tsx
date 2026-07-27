import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Curriculum } from "@/tutorials/ccpp/content/types";
import { LessonSidebar } from "./LessonSidebar";

export function MobileNav({ curriculum }: { curriculum: Curriculum }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-4 py-2 backdrop-blur md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-lg border border-border text-foreground"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
          <span
            className="grid h-7 w-7 place-items-center rounded-md text-white text-[11px]"
            style={{ background: curriculum.accent }}
          >
            {curriculum.track === "c" ? "C" : "C++"}
          </span>
          {curriculum.name} Explainer
        </Link>
        <span className="w-9" />
      </div>
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            <LessonSidebar curriculum={curriculum} onNavigate={() => setOpen(false)} />
          </div>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="relative z-10 m-2 h-9 w-9 rounded-lg bg-background text-foreground shadow"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
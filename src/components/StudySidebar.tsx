import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Timer as TimerIcon,
  MessageSquarePlus,
  Play,
  Pause,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const HIDE_ON = ["/auth", "/reset-password", "/feedback", "/sitemap.xml"];
const OPEN_KEY = "study_sidebar_open_v1";
const HIDDEN_KEY = "study_sidebar_hidden_v1";
const TIMER_KEY = "study_sidebar_timer_v1";

const PRESETS = [10, 15, 25, 45, 60];

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function beep() {
  try {
    const AC: typeof AudioContext | undefined =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    o.start();
    o.stop(ctx.currentTime + 0.6);
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* ignore */
  }
}

export function StudySidebar() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState<number>(25);
  const [remaining, setRemaining] = useState<number>(25 * 60);
  const [running, setRunning] = useState(false);
  const tick = useRef<number | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setHidden(localStorage.getItem(HIDDEN_KEY) === "1");
      setOpen(localStorage.getItem(OPEN_KEY) === "1");
      const raw = localStorage.getItem(TIMER_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (typeof v?.minutes === "number") {
          setMinutes(v.minutes);
          setRemaining(v.minutes * 60);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [open]);

  useEffect(() => {
    try {
      localStorage.setItem(HIDDEN_KEY, hidden ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [hidden]);

  useEffect(() => {
    try {
      localStorage.setItem(TIMER_KEY, JSON.stringify({ minutes }));
    } catch {
      /* ignore */
    }
  }, [minutes]);

  // Timer engine
  useEffect(() => {
    if (!running) return;
    tick.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          beep();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, [running]);

  if (!user) return null;
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;

  // Hidden entirely — show only a tiny restore chip.
  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        aria-label="Show focus & feedback panel"
        className="fixed bottom-3 right-3 z-50 h-7 w-7 grid place-items-center rounded-full border border-border bg-background/80 text-muted-foreground shadow hover:text-foreground hover:bg-accent"
      >
        <TimerIcon className="h-3.5 w-3.5" />
      </button>
    );
  }

  function applyMinutes(m: number) {
    const safe = Math.max(1, Math.min(180, Math.round(m)));
    setMinutes(safe);
    setRemaining(safe * 60);
    setRunning(false);
  }

  return (
    <aside
      className={`fixed top-1/2 -translate-y-1/2 right-0 z-50 flex items-stretch transition-transform duration-200 ${
        open ? "translate-x-0" : "translate-x-[calc(100%-28px)]"
      }`}
      aria-label="Focus and feedback sidebar"
    >
      {/* Vertical handle */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Collapse panel" : "Expand panel"}
        className="w-7 self-stretch grid place-items-center rounded-l-md border border-r-0 border-border bg-background/90 backdrop-blur text-muted-foreground hover:text-foreground hover:bg-accent"
      >
        {open ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Panel */}
      <div className="w-60 rounded-l-lg border border-r-0 border-border bg-card shadow-xl p-3 space-y-3">
        <div className="flex items-center gap-2">
          <TimerIcon className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            Focus timer
          </span>
          <button
            onClick={() => setHidden(true)}
            aria-label="Hide panel"
            className="ml-auto text-muted-foreground hover:text-foreground"
            title="Hide until you bring it back"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close panel"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="font-mono text-2xl tabular-nums text-center text-foreground">
          {fmt(remaining)}
        </div>

        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => setRunning((r) => !r)}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setRemaining(minutes * 60);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-accent"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        <div className="flex flex-wrap gap-1 justify-center">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => applyMinutes(p)}
              className={`text-[10px] px-1.5 py-0.5 rounded border ${
                minutes === p
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}m
            </button>
          ))}
        </div>

        <label className="block text-[10px] uppercase tracking-wide text-muted-foreground">
          Custom (1–180 min)
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={180}
            value={minutes}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              setMinutes(Math.max(1, Math.min(180, Math.round(v))));
            }}
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={() => applyMinutes(minutes)}
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
          >
            Set
          </button>
        </div>

        <div className="pt-2 border-t border-border">
          <Link
            to="/feedback"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Send feedback
          </Link>
        </div>
      </div>
    </aside>
  );
}
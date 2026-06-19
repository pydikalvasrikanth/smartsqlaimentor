import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  X,
  GripVertical,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const HIDE_ON = ["/auth", "/reset-password", "/sitemap.xml"];
const POS_KEY = "focus_timer_pos_v1";
const OPEN_KEY = "focus_timer_open_v1";
const MIN_KEY = "focus_timer_min_v1";
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

export function FloatingTimer() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 16, y: 120 });
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const tick = useRef<number | null>(null);
  const dragOffset = useRef<{ dx: number; dy: number } | null>(null);
  const movedRef = useRef(false);

  // Hydrate
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.x === "number" && typeof p?.y === "number") setPos(p);
      } else {
        // default: bottom-left
        setPos({ x: 16, y: window.innerHeight - 80 });
      }
      setOpen(localStorage.getItem(OPEN_KEY) === "1");
      const m = Number(localStorage.getItem(MIN_KEY));
      if (m && m > 0) {
        setMinutes(m);
        setRemaining(m * 60);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(pos));
    } catch {
      /* ignore */
    }
  }, [pos]);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [open]);

  useEffect(() => {
    try {
      localStorage.setItem(MIN_KEY, String(minutes));
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

  // Drag handlers (pointer events for mouse + touch)
  function onPointerDown(e: React.PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    dragOffset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    movedRef.current = false;
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragOffset.current) return;
    const nx = e.clientX - dragOffset.current.dx;
    const ny = e.clientY - dragOffset.current.dy;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const clampedX = Math.max(4, Math.min(w - 56, nx));
    const clampedY = Math.max(4, Math.min(h - 56, ny));
    if (Math.abs(nx - pos.x) + Math.abs(ny - pos.y) > 2) movedRef.current = true;
    setPos({ x: clampedX, y: clampedY });
  }
  function onPointerUp(e: React.PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dragOffset.current = null;
    setDragging(false);
  }

  if (!user) return null;
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;

  function applyMinutes(m: number) {
    const safe = Math.max(1, Math.min(180, Math.round(m)));
    setMinutes(safe);
    setRemaining(safe * 60);
    setRunning(false);
  }

  return (
    <div
      style={{ left: pos.x, top: pos.y }}
      className={`fixed z-50 select-none ${dragging ? "cursor-grabbing" : ""}`}
    >
      {open ? (
        <div className="w-56 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-surface-2 border-b border-border cursor-grab active:cursor-grabbing touch-none"
            title="Drag to move"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            <TimerIcon className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Focus
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Minimize timer"
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-3 space-y-2.5">
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
                placeholder="Custom min"
              />
              <button
                onClick={() => applyMinutes(minutes)}
                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => {
            onPointerUp(e);
            if (!movedRef.current) setOpen(true);
          }}
          aria-label="Open focus timer"
          title={running ? `Focus: ${fmt(remaining)}` : "Focus timer"}
          className="touch-none flex items-center gap-1.5 rounded-full border border-border bg-card pl-2 pr-3 py-1.5 shadow-lg hover:bg-accent cursor-grab active:cursor-grabbing"
        >
          <TimerIcon className={`h-3.5 w-3.5 ${running ? "text-primary" : "text-muted-foreground"}`} />
          <span className="font-mono text-xs tabular-nums text-foreground">
            {fmt(remaining)}
          </span>
        </button>
      )}
    </div>
  );
}
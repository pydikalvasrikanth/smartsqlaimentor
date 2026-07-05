import { useEffect, useRef, useState } from "react";
import { Timer as TimerIcon, Play, Pause, RotateCcw } from "lucide-react";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

const PRESETS = [15, 25, 45, 60];

/**
 * Compact, inline timer that lives in the page header (matches the
 * "25:00" position shown in the reference screenshot). Persists preset +
 * remaining time to localStorage per-subject key so a refresh resumes it.
 */
export function HeaderTimer({ storageKey = "header_timer" }: { storageKey?: string }) {
  const KEY_MIN = `${storageKey}:min`;
  const KEY_REM = `${storageKey}:rem`;
  const KEY_RUN = `${storageKey}:runAt`;
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const tick = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const m = Number(localStorage.getItem(KEY_MIN));
      const r = Number(localStorage.getItem(KEY_REM));
      const runAt = Number(localStorage.getItem(KEY_RUN));
      if (Number.isFinite(m) && m > 0) setMinutes(m);
      if (runAt > 0 && Number.isFinite(r)) {
        const elapsed = Math.floor((Date.now() - runAt) / 1000);
        const next = Math.max(0, r - elapsed);
        setRemaining(next);
        if (next > 0) setRunning(true);
      } else if (Number.isFinite(r) && r > 0) {
        setRemaining(r);
      } else if (Number.isFinite(m) && m > 0) {
        setRemaining(m * 60);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running) {
      try {
        localStorage.removeItem(KEY_RUN);
        localStorage.setItem(KEY_REM, String(remaining));
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      localStorage.setItem(KEY_RUN, String(Date.now()));
      localStorage.setItem(KEY_REM, String(remaining));
    } catch {
      /* ignore */
    }
    tick.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          try {
            localStorage.removeItem(KEY_RUN);
          } catch {
            /* ignore */
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_REM, String(remaining));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  function applyMinutes(m: number) {
    const safe = Math.max(1, Math.min(180, Math.round(m)));
    setMinutes(safe);
    setRemaining(safe * 60);
    setRunning(false);
    try {
      localStorage.setItem(KEY_MIN, String(safe));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2/60 px-2.5 py-1 font-mono text-sm tabular-nums hover:bg-accent ${
          running ? "text-primary border-primary/40" : "text-foreground"
        }`}
        title="Focus timer"
        aria-label="Focus timer"
      >
        <TimerIcon className="h-3.5 w-3.5" />
        {fmt(remaining)}
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-30 mt-1 w-56 -translate-x-1/2 rounded-md border border-border bg-card p-2 shadow-xl">
          <div className="mb-2 text-center font-mono text-2xl tabular-nums">{fmt(remaining)}</div>
          <div className="mb-2 flex items-center justify-center gap-1.5">
            <button
              onClick={() => setRunning((r) => !r)}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => {
                setRunning(false);
                setRemaining(minutes * 60);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-1">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => applyMinutes(p)}
                className={`rounded border px-1.5 py-0.5 text-[10px] ${
                  minutes === p
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}m
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
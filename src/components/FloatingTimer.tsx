import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  X,
  GripVertical,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const HIDE_ON = ["/auth", "/reset-password", "/sitemap.xml"];
const POS_KEY = "focus_timer_pos_v1";
const OPEN_KEY = "focus_timer_open_v1";
const MIN_KEY = "focus_timer_min_v1";
const PRESETS = [10, 15, 25, 45, 60];
const CHALLENGE_KEY = "daily_challenge_v1";
const REWARD_KEY = "daily_reward_v1";
const POINTS_KEY = "user_points_v1";
const CHALLENGE_DURATION = 60 * 60; // 1 hour in seconds
const REWARD_POINTS = 50;

type Difficulty = "beginner" | "intermediate" | "hard";
const QUOTAS: Record<Difficulty, number> = {
  beginner: 10,
  intermediate: 8,
  hard: 5,
};

type ChallengeState = {
  difficulty: Difficulty;
  startedAt: number; // epoch ms
  solved: number;
  date: string; // YYYY-MM-DD
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDifficulty(d: string): Difficulty | null {
  const x = (d || "").toLowerCase();
  if (x === "beginner" || x === "easy") return "beginner";
  if (x === "intermediate" || x === "medium") return "intermediate";
  if (x === "hard" || x === "advanced" || x === "expert") return "hard";
  return null;
}

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

  // Daily challenge state
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [challengeRemaining, setChallengeRemaining] = useState(0);
  const [rewardedToday, setRewardedToday] = useState(false);
  const [points, setPoints] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [tab, setTab] = useState<"focus" | "challenge">("focus");

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

  // Hydrate challenge + reward + points
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CHALLENGE_KEY);
      if (raw) {
        const c: ChallengeState = JSON.parse(raw);
        if (c.date === today()) setChallenge(c);
        else localStorage.removeItem(CHALLENGE_KEY);
      }
      setRewardedToday(localStorage.getItem(REWARD_KEY) === today());
      const p = Number(localStorage.getItem(POINTS_KEY));
      if (Number.isFinite(p)) setPoints(p);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist challenge
  useEffect(() => {
    try {
      if (challenge) localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
    } catch {
      /* ignore */
    }
  }, [challenge]);

  // Challenge countdown tick
  useEffect(() => {
    if (!challenge) {
      setChallengeRemaining(0);
      return;
    }
    function compute() {
      if (!challenge) return 0;
      const elapsed = Math.floor((Date.now() - challenge.startedAt) / 1000);
      return Math.max(0, CHALLENGE_DURATION - elapsed);
    }
    setChallengeRemaining(compute());
    const id = window.setInterval(() => {
      setChallengeRemaining(compute());
    }, 1000);
    return () => window.clearInterval(id);
  }, [challenge]);

  // Listen for solved questions
  useEffect(() => {
    function onSolved(e: Event) {
      const detail = (e as CustomEvent).detail || {};
      const diff = normalizeDifficulty(String(detail.difficulty || ""));
      if (!diff) return;
      setChallenge((prev) => {
        if (!prev) return prev;
        if (prev.difficulty !== diff) return prev; // only same difficulty counts
        const elapsed = Math.floor((Date.now() - prev.startedAt) / 1000);
        if (elapsed >= CHALLENGE_DURATION) return prev; // timer ended
        const solved = prev.solved + 1;
        const quota = QUOTAS[prev.difficulty];
        const next = { ...prev, solved };
        if (solved >= quota && !rewardedToday) {
          // Award!
          try {
            localStorage.setItem(REWARD_KEY, today());
            const np = points + REWARD_POINTS;
            localStorage.setItem(POINTS_KEY, String(np));
            setPoints(np);
          } catch {
            /* ignore */
          }
          setRewardedToday(true);
          setShowReward(true);
          setOpen(true);
          setTab("challenge");
        }
        return next;
      });
    }
    window.addEventListener("practice:solved", onSolved as EventListener);
    return () =>
      window.removeEventListener("practice:solved", onSolved as EventListener);
  }, [rewardedToday, points]);

  function startChallenge(d: Difficulty) {
    setChallenge({
      difficulty: d,
      startedAt: Date.now(),
      solved: 0,
      date: today(),
    });
    setShowReward(false);
  }

  function cancelChallenge() {
    setChallenge(null);
    try {
      localStorage.removeItem(CHALLENGE_KEY);
    } catch {
      /* ignore */
    }
  }

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
        <div className="w-64 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
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
              {tab === "focus" ? "Focus" : "Daily Challenge"}
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Minimize timer"
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex border-b border-border text-[11px]">
            <button
              onClick={() => setTab("focus")}
              className={`flex-1 py-1.5 ${tab === "focus" ? "bg-card text-foreground font-medium" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}
            >
              Focus
            </button>
            <button
              onClick={() => setTab("challenge")}
              className={`flex-1 py-1.5 inline-flex items-center justify-center gap-1 ${tab === "challenge" ? "bg-card text-foreground font-medium" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}
            >
              <Trophy className="h-3 w-3" /> Challenge
              {challenge && !rewardedToday && (
                <span className="ml-0.5 inline-flex items-center justify-center text-[9px] rounded-full bg-primary text-primary-foreground w-3.5 h-3.5">
                  {challenge.solved}
                </span>
              )}
            </button>
          </div>
          {tab === "focus" ? (
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
          ) : (
          <div className="p-3 space-y-2.5">
            <div className="text-[10px] text-muted-foreground text-center">
              Solve in 1 hour to earn <span className="text-primary font-semibold">{REWARD_POINTS} pts</span>
            </div>
            {!challenge ? (
              <>
                <div className="space-y-1">
                  {(Object.keys(QUOTAS) as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => startChallenge(d)}
                      disabled={rewardedToday}
                      className="w-full flex items-center justify-between rounded-md border border-border px-2 py-1.5 text-xs hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="capitalize font-medium">{d}</span>
                      <span className="text-muted-foreground">
                        {QUOTAS[d]} questions
                      </span>
                    </button>
                  ))}
                </div>
                {rewardedToday && (
                  <div className="text-[10px] text-center text-green-500">
                    ✓ Today's reward already earned
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground capitalize">
                    {challenge.difficulty}
                  </div>
                  <div className="font-mono text-xl tabular-nums text-foreground">
                    {fmt(challengeRemaining)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">
                      {challenge.solved} / {QUOTAS[challenge.difficulty]}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, (challenge.solved / QUOTAS[challenge.difficulty]) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                {showReward && rewardedToday ? (
                  <div className="rounded-md bg-primary/10 border border-primary/30 p-2 text-center">
                    <Trophy className="h-4 w-4 text-primary mx-auto mb-0.5" />
                    <div className="text-xs font-semibold text-primary">
                      +{REWARD_POINTS} points earned!
                    </div>
                    <button
                      onClick={() => setShowReward(false)}
                      className="mt-1 text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : challengeRemaining === 0 && challenge.solved < QUOTAS[challenge.difficulty] ? (
                  <div className="rounded-md border border-border p-2 text-center text-[11px] text-muted-foreground">
                    Time's up — try again tomorrow.
                  </div>
                ) : null}
                <button
                  onClick={cancelChallenge}
                  className="w-full rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  {challengeRemaining === 0 || rewardedToday ? "Close" : "Cancel challenge"}
                </button>
              </>
            )}
            <div className="pt-1 border-t border-border flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Total points</span>
              <span className="font-semibold text-foreground">{points}</span>
            </div>
          </div>
          )}
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
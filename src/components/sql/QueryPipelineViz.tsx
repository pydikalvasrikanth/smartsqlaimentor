import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Database,
  Filter,
  Layers,
  Columns3,
  ArrowDownUp,
  Scissors,
  Link2,
  FunctionSquare,
  SkipForward,
  SkipBack,
} from "lucide-react";

export interface VizStage {
  step: number;
  clause: string;
  operation: string;
  explanation: string;
  narration?: string;
  rows_in: string;
  rows_out: string;
  columns?: string[];
  sample_rows?: string[][];
  highlight?: string;
}

interface Props {
  stages: VizStage[];
  summary?: string;
}

const CLAUSE_META: Record<
  string,
  { icon: any; color: string; tint: string; label: string }
> = {
  FROM:      { icon: Database,       color: "#7c6cff", tint: "rgba(124,108,255,0.18)", label: "Load tables"     },
  JOIN:      { icon: Link2,          color: "#22d3ee", tint: "rgba(34,211,238,0.18)",  label: "Combine rows"    },
  WHERE:     { icon: Filter,         color: "#f59e0b", tint: "rgba(245,158,11,0.20)",  label: "Filter rows"     },
  "GROUP BY":{ icon: Layers,         color: "#a78bfa", tint: "rgba(167,139,250,0.20)", label: "Bucket rows"     },
  HAVING:    { icon: Filter,         color: "#fb7185", tint: "rgba(251,113,133,0.20)", label: "Filter groups"   },
  WINDOW:    { icon: FunctionSquare, color: "#34d399", tint: "rgba(52,211,153,0.20)",  label: "Window function" },
  SELECT:    { icon: Columns3,       color: "#60a5fa", tint: "rgba(96,165,250,0.20)",  label: "Pick columns"    },
  "ORDER BY":{ icon: ArrowDownUp,    color: "#f472b6", tint: "rgba(244,114,182,0.20)", label: "Sort rows"       },
  LIMIT:     { icon: Scissors,       color: "#facc15", tint: "rgba(250,204,21,0.22)",  label: "Take top N"      },
};

function metaFor(clause: string) {
  const key = (clause || "").toUpperCase().trim();
  return (
    CLAUSE_META[key] ||
    { icon: Database, color: "#7c6cff", tint: "rgba(124,108,255,0.18)", label: clause }
  );
}

export function QueryPipelineViz({ stages, summary }: Props) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1); // 1x, 1.5x, 2x
  const timer = useRef<number | null>(null);

  const total = stages.length;

  useEffect(() => {
    if (!playing || total === 0) return;
    timer.current = window.setTimeout(() => {
      setActive((a) => (a + 1 < total ? a + 1 : a));
      if (active + 1 >= total - 1) setPlaying(false);
    }, 3200 / speed) as unknown as number;
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [playing, active, total, speed]);

  const restart = () => {
    setActive(0);
    setPlaying(true);
  };

  const current = stages[active];
  const m = current ? metaFor(current.clause) : null;
  const progress = total > 0 ? ((active + 1) / total) * 100 : 0;

  return (
    <div className="space-y-4">
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border bg-gradient-to-br from-surface to-background px-3.5 py-2.5 text-xs text-foreground/85 leading-relaxed"
        >
          <span className="text-[10px] uppercase tracking-widest text-primary-glow mr-2 font-semibold">
            ✦ What this query does
          </span>
          {summary}
        </motion.div>
      )}

      {/* Player controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => {
            setPlaying(false);
            setActive((a) => Math.max(0, a - 1));
          }}
          className="inline-flex items-center justify-center rounded-md border border-border bg-surface w-8 h-8 hover:bg-surface-2 transition active:scale-95 disabled:opacity-40"
          disabled={active === 0}
          aria-label="Previous step"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition active:scale-95 shadow-lg shadow-primary/20"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {playing ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setActive((a) => Math.min(total - 1, a + 1));
          }}
          className="inline-flex items-center justify-center rounded-md border border-border bg-surface w-8 h-8 hover:bg-surface-2 transition active:scale-95 disabled:opacity-40"
          disabled={active >= total - 1}
          aria-label="Next step"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={restart}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium hover:bg-surface-2 transition active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5">
          {[1, 1.5, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 text-[10px] font-mono rounded transition ${
                speed === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        <div className="ml-auto text-[11px] font-mono text-muted-foreground">
          Step {Math.min(active + 1, total)} / {total}
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="h-1 rounded-full bg-surface overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-primary-glow to-primary"
          style={{ backgroundSize: "200% 100%" }}
          animate={{
            width: `${progress}%`,
            backgroundPosition: ["0% 0%", "200% 0%"],
          }}
          transition={{
            width: { duration: 0.5, ease: "easeOut" },
            backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" },
          }}
        />
      </div>

      {/* Pipeline timeline */}
      <div className="relative">
        <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
          {stages.map((s, i) => {
            const sm = metaFor(s.clause);
            const Icon = sm.icon;
            const isActive = i === active;
            const isDone = i < active;
            return (
              <div key={s.step} className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setPlaying(false);
                    setActive(i);
                  }}
                  className="group relative flex flex-col items-center"
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.08 : 1,
                      borderColor: isActive ? sm.color : "var(--border)",
                      y: isActive ? -2 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="relative w-[124px] rounded-lg border-2 px-3 py-2.5 text-left"
                    style={{
                      background: isActive
                        ? sm.tint
                        : isDone
                        ? "color-mix(in oklab, var(--success) 8%, var(--surface))"
                        : "var(--surface)",
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-glow"
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{ boxShadow: `0 0 0 2px ${sm.color}, 0 0 32px ${sm.color}88` }}
                        transition={{ type: "spring", stiffness: 220, damping: 22 }}
                      />
                    )}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        animate={{ opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                          background: `radial-gradient(circle at 50% 50%, ${sm.color}30, transparent 70%)`,
                        }}
                      />
                    )}
                    <div className="flex items-center gap-1.5 relative z-10">
                      <Icon
                        className="h-3.5 w-3.5"
                        style={{ color: isActive || isDone ? sm.color : "var(--muted-foreground)" }}
                      />
                      <span className="text-[10px] uppercase tracking-widest font-mono"
                        style={{ color: isActive ? sm.color : "var(--muted-foreground)" }}>
                        Step {s.step}
                      </span>
                      {isDone && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto text-[9px]"
                          style={{ color: sm.color }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </div>
                    <div className="text-xs font-semibold mt-1 relative z-10">{s.clause}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5 relative z-10">
                      {s.rows_in} → {s.rows_out}
                    </div>
                  </motion.div>
                </button>
                {i < total - 1 && (
                  <div className="relative w-8 h-6 flex items-center justify-center">
                    <div
                      className="absolute inset-y-1/2 -translate-y-1/2 h-px w-full"
                      style={{
                        background:
                          i < active
                            ? `linear-gradient(90deg, ${sm.color}, ${metaFor(stages[i + 1].clause).color})`
                            : "var(--border)",
                      }}
                    />
                    {i === active && (
                      <>
                        {[0, 0.4, 0.8].map((delay) => (
                          <motion.div
                            key={delay}
                            className="absolute h-1.5 w-1.5 rounded-full"
                            style={{ background: sm.color, boxShadow: `0 0 8px ${sm.color}` }}
                            initial={{ x: -16, opacity: 0 }}
                            animate={{ x: 16, opacity: [0, 1, 1, 0] }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              delay,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </>
                    )}
                    <ChevronRight
                      className="h-4 w-4 relative z-10"
                      style={{
                        color:
                          i < active
                            ? metaFor(stages[i + 1].clause).color
                            : "var(--muted-foreground)",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active stage detail */}
      {current && m && (
        <AnimatePresence mode="wait">
          <motion.div
            key={current.step}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-lg border-2 overflow-hidden"
            style={{
              borderColor: m.color,
              background: "var(--surface)",
              boxShadow: `0 12px 40px -16px ${m.color}66`,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-4 py-3 relative overflow-hidden"
              style={{ background: m.tint }}
            >
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <m.icon className="h-4 w-4" style={{ color: m.color }} />
              </motion.div>
              <span className="text-xs font-bold tracking-wide" style={{ color: m.color }}>
                {m.label.toUpperCase()} · {current.clause}
              </span>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-background/40 rounded px-1.5 py-0.5">
                {current.operation}
              </span>
            </div>

            {/* Narration */}
            <div className="px-4 pt-3.5">
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-sm font-medium leading-relaxed flex gap-1.5"
              >
                <motion.span
                  style={{ color: m.color }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                >
                  ▸
                </motion.span>
                <span>{current.narration || current.explanation}</span>
              </motion.p>
              {current.narration && current.explanation && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="text-xs text-foreground/70 mt-2 leading-relaxed pl-3.5"
                >
                  {current.explanation}
                </motion.p>
              )}
            </div>

            {/* Animated row table */}
            {current.columns && current.columns.length > 0 && (
              <div className="px-4 pt-3 pb-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
                  Result after this step
                </div>
                <AnimatedTable
                  key={current.step}
                  columns={current.columns}
                  rows={current.sample_rows || []}
                  accent={m.color}
                />
              </div>
            )}

            {/* Highlight pill */}
            {current.highlight && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.55, type: "spring", stiffness: 280 }}
                className="mx-4 mb-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold border"
                style={{
                  background: m.tint,
                  color: m.color,
                  borderColor: `${m.color}55`,
                }}
              >
                ✦ {current.highlight}
              </motion.div>
            )}

            {/* Footer rows */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border bg-background/40 text-[11px] font-mono">
              <span className="text-muted-foreground">rows in:</span>
              <AnimatedCounter value={current.rows_in} />
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <ChevronRight className="h-3 w-3" style={{ color: m.color }} />
              </motion.div>
              <span className="text-muted-foreground">rows out:</span>
              <AnimatedCounter value={current.rows_out} color={m.color} bold />
              {(() => {
                const inN = parseFloat(String(current.rows_in).replace(/[^\d.]/g, ""));
                const outN = parseFloat(String(current.rows_out).replace(/[^\d.]/g, ""));
                if (!isFinite(inN) || !isFinite(outN) || inN === 0 || inN === outN) return null;
                const delta = outN - inN;
                const pct = Math.round((delta / inN) * 100);
                const positive = delta > 0;
                return (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold"
                    style={{
                      background: positive
                        ? "color-mix(in oklab, var(--success) 18%, transparent)"
                        : "color-mix(in oklab, var(--warning) 18%, transparent)",
                      color: positive ? "var(--success)" : "var(--warning)",
                    }}
                  >
                    {positive ? "+" : ""}
                    {pct}%
                  </motion.span>
                );
              })()}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function AnimatedCounter({
  value,
  color,
  bold,
}: {
  value: string;
  color?: string;
  bold?: boolean;
}) {
  const numericPart = parseFloat(String(value).replace(/[^\d.]/g, ""));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isFinite(numericPart)) {
      setDisplay(0);
      return;
    }
    const duration = 700;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(numericPart * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [numericPart]);

  if (!isFinite(numericPart)) {
    return (
      <span style={{ color }} className={bold ? "font-semibold" : ""}>
        {value}
      </span>
    );
  }
  const rounded =
    numericPart >= 100 ? Math.round(display) : Math.round(display * 10) / 10;
  return (
    <span style={{ color }} className={bold ? "font-semibold tabular-nums" : "tabular-nums"}>
      {rounded}
    </span>
  );
}

function AnimatedTable({
  columns,
  rows,
  accent,
}: {
  columns: string[];
  rows: string[][];
  accent: string;
}) {
  const safeRows = useMemo(() => rows.slice(0, 6), [rows]);
  return (
    <div
      className="rounded-md border overflow-hidden bg-background"
      style={{ borderColor: `${accent}44` }}
    >
      <div
        className="grid text-[10px] uppercase tracking-widest font-mono"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
          background: `linear-gradient(180deg, ${accent}22, ${accent}08)`,
        }}
      >
        {columns.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="px-2.5 py-1.5 border-r border-border last:border-r-0 truncate"
            style={{ color: accent }}
          >
            {c}
          </motion.div>
        ))}
      </div>
      <AnimatePresence initial={true}>
        {safeRows.map((row, ri) => (
          <motion.div
            key={ri}
            initial={{ opacity: 0, x: -24, backgroundColor: `${accent}55` }}
            animate={{ opacity: 1, x: 0, backgroundColor: "rgba(0,0,0,0)" }}
            transition={{
              delay: 0.25 + ri * 0.09,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="grid border-t border-border text-xs"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns.length }).map((_, ci) => (
              <div
                key={ci}
                className="px-2.5 py-1.5 border-r border-border last:border-r-0 font-mono truncate"
                title={row[ci] ?? ""}
              >
                {row[ci] ?? <span className="text-muted-foreground">·</span>}
              </div>
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
      {safeRows.length === 0 && (
        <div className="px-3 py-2 text-[11px] text-muted-foreground italic">
          (No sample rows for this stage)
        </div>
      )}
    </div>
  );
}

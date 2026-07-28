import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from "lucide-react";
import type { TraceFrame } from "@/tutorials/python/data/topics";
import { CodeBlock } from "./CodeBlock";

const SPEEDS = [0.5, 1, 1.5, 2];

export function StepVisualizer({ code, trace }: { code: string; trace: TraceFrame[] }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef<number | null>(null);
  const lineCount = code.split("\n").length;

  // Reset whenever a different trace is rendered (topic navigation).
  useEffect(() => {
    setI(0);
    setPlaying(false);
  }, [trace]);

  useEffect(() => {
    if (!playing || trace.length < 2) return;
    timer.current = window.setInterval(() => {
      setI((n) => {
        if (n >= trace.length - 1) {
          setPlaying(false);
          return n;
        }
        return n + 1;
      });
    }, 900 / speed);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, speed, trace.length]);

  const safeIndex = Math.min(i, trace.length - 1);
  const frame = trace[safeIndex];
  const prevFrame = safeIndex > 0 ? trace[safeIndex - 1] : undefined;
  if (!frame) return <CodeBlock code={code} />;
  const highlightLine = frame.line >= 1 && frame.line <= lineCount ? frame.line : undefined;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-2/60">
        <div className="text-xs text-muted-foreground mono min-w-0">
          step {safeIndex + 1} / {trace.length}
          {frame.note && <span className="ml-3 text-foreground/80">// {frame.note}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded hover:bg-surface-2"
            onClick={() => {
              setPlaying(false);
              setI(0);
            }}
            aria-label="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1.5 rounded hover:bg-surface-2 disabled:opacity-40"
            onClick={() => {
              setPlaying(false);
              setI((n) => Math.max(0, n - 1));
            }}
            disabled={safeIndex === 0}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 rounded hover:bg-surface-2"
            onClick={() =>
              setPlaying((p) => {
                if (!p && safeIndex >= trace.length - 1) setI(0);
                return !p;
              })
            }
            aria-label="Play/Pause"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            className="p-1.5 rounded hover:bg-surface-2 disabled:opacity-40"
            onClick={() => {
              setPlaying(false);
              setI((n) => Math.min(trace.length - 1, n + 1));
            }}
            disabled={safeIndex >= trace.length - 1}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            className="ml-1 rounded px-1.5 py-1 mono text-[10px] text-muted-foreground hover:bg-surface-2"
            onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
            aria-label="Playback speed"
          >
            {speed}×
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-3 border-b md:border-b-0 md:border-r border-border">
          <CodeBlock code={code} highlightLine={highlightLine} />
        </div>
        <div className="p-4 space-y-4 bg-surface-2/30">
          <Panel title="Variables">
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {Object.entries(frame.vars).map(([k, v]) => {
                  const changed = !prevFrame || prevFrame.vars[k] !== v;
                  return (
                  <motion.div
                    key={k}
                    layout
                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className={`flex items-center gap-2 rounded-md border bg-surface px-2 py-1 ${
                      changed ? "border-primary/60" : "border-border"
                    }`}
                  >
                    <span className="mono text-xs text-muted-foreground">{k}</span>
                    <span className="mono text-xs text-primary">→</span>
                    <motion.span
                      key={`${k}-${v}`}
                      initial={{ backgroundColor: changed ? "rgba(245,200,66,0.35)" : "rgba(245,200,66,0)" }}
                      animate={{ backgroundColor: "rgba(245,200,66,0)" }}
                      transition={{ duration: 0.7 }}
                      className="mono text-xs px-1.5 py-0.5 rounded"
                    >
                      {v}
                    </motion.span>
                  </motion.div>
                  );
                })}
              </AnimatePresence>
              {Object.keys(frame.vars).length === 0 && (
                <span className="text-xs text-muted-foreground">— none yet —</span>
              )}
            </div>
          </Panel>

          {frame.stack && frame.stack.length > 0 && (
            <Panel title="Call stack">
              <div className="flex flex-col-reverse gap-1">
                <AnimatePresence>
                  {frame.stack.map((f, idx) => (
                    <motion.div
                      key={`${f}-${idx}`}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className={`mono text-xs rounded border px-2 py-1 ${
                        idx === frame.stack!.length - 1
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border bg-surface"
                      }`}
                    >
                      {f}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Panel>
          )}

          {frame.heap && Object.keys(frame.heap).length > 0 && (
            <Panel title="Heap">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(frame.heap).map(([k, v]) => (
                  <div key={k} className="rounded border border-border bg-surface p-2">
                    <div className="mono text-[10px] text-muted-foreground">{k}</div>
                    <div className="mono text-xs">{v}</div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>

      <div className="h-1 bg-surface-2">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${((safeIndex + 1) / trace.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        />
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}
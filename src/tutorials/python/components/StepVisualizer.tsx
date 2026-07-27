import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from "lucide-react";
import type { TraceFrame } from "@/data/topics";
import { CodeBlock } from "./CodeBlock";

export function StepVisualizer({ code, trace }: { code: string; trace: TraceFrame[] }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setI((n) => {
        if (n >= trace.length - 1) {
          setPlaying(false);
          return n;
        }
        return n + 1;
      });
    }, 900);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, trace.length]);

  const frame = trace[i];

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-2/60">
        <div className="text-xs text-muted-foreground mono">
          step {i + 1} / {trace.length}
          {frame.note && <span className="ml-3 text-foreground/80">// {frame.note}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded hover:bg-surface-2" onClick={() => setI(0)} aria-label="Reset">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1.5 rounded hover:bg-surface-2 disabled:opacity-40"
            onClick={() => setI((n) => Math.max(0, n - 1))}
            disabled={i === 0}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 rounded hover:bg-surface-2"
            onClick={() => setPlaying((p) => !p)}
            aria-label="Play/Pause"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            className="p-1.5 rounded hover:bg-surface-2 disabled:opacity-40"
            onClick={() => setI((n) => Math.min(trace.length - 1, n + 1))}
            disabled={i >= trace.length - 1}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-3 border-r border-border">
          <CodeBlock code={code} highlightLine={frame.line} />
        </div>
        <div className="p-4 space-y-4 bg-surface-2/30">
          <Panel title="Variables">
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {Object.entries(frame.vars).map(([k, v]) => (
                  <motion.div
                    key={k}
                    layout
                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1"
                  >
                    <span className="mono text-xs text-muted-foreground">{k}</span>
                    <span className="mono text-xs text-primary">→</span>
                    <motion.span
                      key={v}
                      initial={{ backgroundColor: "rgba(245,200,66,0.35)" }}
                      animate={{ backgroundColor: "rgba(245,200,66,0)" }}
                      transition={{ duration: 0.7 }}
                      className="mono text-xs px-1.5 py-0.5 rounded"
                    >
                      {v}
                    </motion.span>
                  </motion.div>
                ))}
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
          animate={{ width: `${((i + 1) / trace.length) * 100}%` }}
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
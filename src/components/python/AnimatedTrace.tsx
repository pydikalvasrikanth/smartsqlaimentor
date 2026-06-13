import { useEffect, useRef, useState } from "react";
import { Workflow, Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";

interface Step {
  line: string;
  action: string;
  state: string;
}
interface Props {
  sample_input?: string;
  steps: Step[];
  final_output?: string;
  summary?: string;
}

export function AnimatedTrace({ sample_input, steps, final_output, summary }: Props) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1100);
  const listRef = useRef<HTMLOListElement | null>(null);

  const total = steps.length;
  const done = idx >= total - 1;

  useEffect(() => {
    setIdx(0);
    setPlaying(true);
  }, [steps]);

  useEffect(() => {
    if (!playing || done) return;
    const t = setTimeout(() => setIdx((i) => Math.min(i + 1, total - 1)), speed);
    return () => clearTimeout(t);
  }, [idx, playing, done, speed, total]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-step="${idx}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [idx]);

  if (!total) return null;
  const current = steps[idx];
  const pct = ((idx + 1) / total) * 100;

  return (
    <div className="rounded-lg border border-border bg-surface-1 p-4 space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-primary-glow" />
        <div className="font-semibold text-sm">Execution Trace</div>
        <div className="ml-auto text-[11px] font-mono text-muted-foreground">
          step {idx + 1} / {total}
        </div>
      </div>

      {sample_input && (
        <div className="text-[11px] font-mono text-muted-foreground">
          input: <code className="text-foreground">{sample_input}</code>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-surface-2 rounded overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Live focus panel */}
      <div
        key={idx}
        className="rounded-md border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-3 space-y-1.5 animate-scale-in"
      >
        <div className="text-[10px] uppercase tracking-widest text-primary-glow font-mono">
          executing line
        </div>
        <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">{current.line}</pre>
        <div className="text-xs text-muted-foreground">→ {current.action}</div>
        <div className="mt-2 rounded bg-surface-2 p-2 font-mono text-[11px]">
          <span className="text-primary-glow">state</span> = {current.state}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setIdx(0);
            setPlaying(true);
          }}
          className="p-1.5 rounded border border-border hover:bg-accent"
          title="Restart"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setIdx((i) => Math.max(i - 1, 0))}
          className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-40"
          disabled={idx === 0}
        >
          <SkipBack className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            if (done) {
              setIdx(0);
              setPlaying(true);
            } else setPlaying((p) => !p);
          }}
          className="p-1.5 rounded bg-primary text-primary-foreground hover:opacity-90"
        >
          {playing && !done ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => setIdx((i) => Math.min(i + 1, total - 1))}
          className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-40"
          disabled={done}
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>
        <div className="ml-auto flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          speed
          {[1800, 1100, 500].map((s, i) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-1.5 py-0.5 rounded border ${speed === s ? "border-primary text-primary-glow" : "border-border hover:bg-accent"}`}
            >
              {["0.5x", "1x", "2x"][i]}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline list */}
      <ol ref={listRef} className="space-y-1 text-xs font-mono max-h-64 overflow-auto pr-1">
        {steps.map((s, i) => {
          const state = i < idx ? "past" : i === idx ? "now" : "future";
          return (
            <li
              key={i}
              data-step={i}
              onClick={() => {
                setIdx(i);
                setPlaying(false);
              }}
              className={`cursor-pointer p-2 rounded border transition-all duration-300 ${
                state === "now"
                  ? "border-primary bg-primary/10 translate-x-1"
                  : state === "past"
                    ? "border-border bg-surface-2 opacity-60"
                    : "border-border/50 bg-surface-2/40 opacity-40"
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 inline-block h-1.5 w-1.5 rounded-full ${
                    state === "now"
                      ? "bg-primary-glow animate-pulse"
                      : state === "past"
                        ? "bg-primary/50"
                        : "bg-muted-foreground/30"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className={state === "now" ? "text-primary-glow" : "text-foreground"}>
                    {i + 1}. {s.line}
                  </div>
                  <div className="text-muted-foreground">→ {s.action}</div>
                  <div className="text-[10px] text-muted-foreground">state: {s.state}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {done && final_output && (
        <div className="text-[11px] font-mono animate-fade-in">
          output: <code className="text-success">{final_output}</code>
        </div>
      )}
      {done && summary && (
        <p className="text-sm text-muted-foreground animate-fade-in">{summary}</p>
      )}
    </div>
  );
}
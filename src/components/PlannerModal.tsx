import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { generatePlan } from "@/lib/plan.functions";

const LEVELS = [
  { v: "beginner", label: "Beginner", desc: "SELECT, JOINs, GROUP BY basics." },
  { v: "intermediate", label: "Intermediate", desc: "Subqueries, CTEs, simple windows." },
  { v: "advanced", label: "Advanced", desc: "Recursive CTEs, ranking, performance." },
  { v: "professional", label: "Professional", desc: "Optimization, 3VL, MVCC, indexing." },
] as const;

const DAYS = [14, 30, 60, 90];

export function PlannerModal({ onCreated }: { onCreated: () => void }) {
  const create = useServerFn(generatePlan);
  const [days, setDays] = useState(30);
  const [level, setLevel] = useState<(typeof LEVELS)[number]["v"]>("intermediate");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await create({ data: { days, target_level: level } });
      toast.success(`Plan ready — ${days} days of ${level} practice`);
      onCreated();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate plan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur p-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 space-y-5 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Target className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Build your practice plan</h2>
            <p className="text-xs text-muted-foreground">
              We'll generate a day-wise curriculum across all SQL topics, ramping to your target level.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Timeframe
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-2 rounded-md text-sm font-mono border transition-colors ${
                  days === d
                    ? "border-primary bg-primary/10 text-primary-glow"
                    : "border-border hover:bg-accent"
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Target level
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.v}
                onClick={() => setLevel(l.v)}
                className={`text-left p-3 rounded-md border transition-colors ${
                  level === l.v
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                }`}
              >
                <div className="text-sm font-semibold">{l.label}</div>
                <div className="text-[11px] text-muted-foreground">{l.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-2.5 rounded-md text-sm font-semibold disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Generate {days}-day plan
        </button>
      </div>
    </div>
  );
}

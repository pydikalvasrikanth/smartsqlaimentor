import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Flame, AlertTriangle } from "lucide-react";
import { TOPIC_BY_SLUG } from "@/lib/topic-catalog";

interface PlanDay {
  id: string;
  day_index: number;
  topic_slug: string;
  target_concept: string;
  difficulty: string;
  completed: boolean;
}

interface Props {
  plan: { id: string; days: number; target_level: string } | null;
  days: PlanDay[];
  today: PlanDay | null;
  dayNumber: number | null;
  weak: Array<{ concept: string; success_rate: number; tries: number }>;
  onReplan: () => void;
}

export function PlanDashboard({ plan, days, today, dayNumber, weak, onReplan }: Props) {
  if (!plan || !today) return null;
  const topic = TOPIC_BY_SLUG[today.topic_slug];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      {/* Today card */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-card to-surface-2 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-primary-glow" />
            Day {dayNumber} of {plan.days} · {plan.target_level} track
          </div>
          <button
            onClick={onReplan}
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground"
          >
            Replan
          </button>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Today's focus
          </div>
          <h2 className="text-2xl font-bold mt-1">
            {topic?.emoji} {topic?.name ?? today.topic_slug}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {topic?.description} · concept:{" "}
            <span className="font-mono text-primary-glow">{today.target_concept}</span> ·{" "}
            <span className="font-mono">{today.difficulty}</span>
          </p>
        </div>

        <Link
          to="/topic/$slug"
          params={{ slug: today.topic_slug }}
          search={{ concept: today.target_concept, difficulty: today.difficulty }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold"
        >
          Start today's session <ArrowRight className="h-4 w-4" />
        </Link>

        {/* Calendar strip */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            <Calendar className="h-3 w-3" /> Schedule
          </div>
          <div className="flex flex-wrap gap-1">
            {days.map((d) => {
              const isToday = d.day_index === dayNumber;
              const isPast = dayNumber !== null && d.day_index < dayNumber;
              return (
                <div
                  key={d.id}
                  title={`Day ${d.day_index}: ${TOPIC_BY_SLUG[d.topic_slug]?.name} (${d.difficulty})`}
                  className={`h-6 w-6 rounded text-[10px] grid place-items-center font-mono border ${
                    d.completed
                      ? "bg-primary/30 border-primary text-primary-glow"
                      : isToday
                      ? "bg-primary text-primary-foreground border-primary"
                      : isPast
                      ? "border-border bg-surface text-muted-foreground"
                      : "border-border/40 text-muted-foreground/60"
                  }`}
                >
                  {d.day_index}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weak spots */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <AlertTriangle className="h-3 w-3 text-orange-400" /> Weak spots
        </div>
        {weak.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No weak concepts yet — answer a few questions to build a learning state.
          </p>
        ) : (
          <ul className="space-y-2">
            {weak.map((w) => (
              <li key={w.concept} className="text-xs flex items-center justify-between gap-2">
                <span className="font-mono text-primary-glow truncate">{w.concept}</span>
                <span className="text-muted-foreground font-mono shrink-0">
                  {Math.round(w.success_rate * 100)}% · {w.tries} tries
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

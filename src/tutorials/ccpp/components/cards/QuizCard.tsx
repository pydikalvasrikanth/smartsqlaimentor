import { useState } from "react";

export function QuizCard({
  question,
  options,
  correct,
  explain,
}: {
  question: string;
  options: string[];
  correct: number;
  explain: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const revealed = picked !== null;
  const right = picked === correct;
  return (
    <div className="rounded-lg border border-[color:var(--pink)]/40 bg-[color:var(--surface2)] p-3">
      <div className="mono mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[color:var(--pink)]">
        <span>Quick check</span>
        {revealed && (
          <span className={right ? "text-[color:var(--teal)]" : "text-[color:var(--destructive)]"}>
            {right ? "✓ correct" : "✗ try again"}
          </span>
        )}
      </div>
      <div className="mb-3 text-sm font-semibold text-foreground">{question}</div>
      <div className="grid gap-1.5">
        {options.map((opt, i) => {
          const isPick = picked === i;
          const isRight = revealed && i === correct;
          const isWrong = revealed && isPick && !right;
          return (
            <button
              key={i}
              onClick={() => setPicked(i)}
              disabled={revealed && right}
              className={`mono flex items-start gap-2 rounded-md border px-3 py-2 text-left text-xs transition ${
                isRight
                  ? "border-[color:var(--teal)] bg-[color:var(--teal)]/10 text-foreground"
                  : isWrong
                    ? "border-[color:var(--destructive)] bg-[color:var(--destructive)]/10 text-foreground"
                    : "border-border text-foreground/80 hover:border-[color:var(--pink)] hover:bg-[color:var(--surface3)]"
              }`}
            >
              <span className="mt-[1px] text-[10px] opacity-60">{String.fromCharCode(65 + i)}.</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className="mt-3 animate-fade-in rounded-md bg-[color:var(--surface3)] p-2 text-xs text-foreground/90">
          <span className="mono font-bold text-[color:var(--pink)]">Why: </span>
          {explain}
        </div>
      )}
    </div>
  );
}
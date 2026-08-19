import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

const STEPS = [
  "Analysing your topic and level…",
  "Designing a realistic business scenario…",
  "Building the dataset and schema…",
  "Writing the question and starter code…",
  "Almost ready — final checks…",
];

interface Props {
  /** When true the overlay is visible. */
  active: boolean;
  /** Optional label, e.g. "Generating your next question". */
  label?: string;
}

export function GeneratingOverlay({ active, label = "Generating your question" }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const id = window.setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 2200);
    return () => window.clearInterval(id);
  }, [active]);

  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] grid place-items-center bg-background/70 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-card/95 p-6 shadow-2xl text-center space-y-4">
        <div className="mx-auto h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground min-h-8">{STEPS[step]}</p>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-700"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> This usually takes a few seconds
        </p>
      </div>
    </div>
  );
}

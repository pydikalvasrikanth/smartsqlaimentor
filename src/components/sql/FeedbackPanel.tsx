import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Bug, Lightbulb, Sparkles, Zap, Workflow } from "lucide-react";
import { ErdDiagram } from "./ErdDiagram";
import { QueryPipelineViz } from "./QueryPipelineViz";

export type FeedbackKind = "evaluation" | "debug" | "hint" | "solution" | "optimize" | "visualize" | null;

export interface FeedbackData {
  kind: FeedbackKind;
  payload?: any;
}

interface Props {
  feedback: FeedbackData;
}

export function FeedbackPanel({ feedback }: Props) {
  if (!feedback.kind) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Submit your query to get feedback from your AI mentor.
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={feedback.kind + JSON.stringify(feedback.payload).slice(0, 40)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="rounded-lg border border-border bg-card overflow-hidden"
      >
        {feedback.kind === "evaluation" && <Evaluation data={feedback.payload} />}
        {feedback.kind === "debug" && <Debug data={feedback.payload} />}
        {feedback.kind === "hint" && <Hint data={feedback.payload} />}
        {feedback.kind === "solution" && <Solution data={feedback.payload} />}
        {feedback.kind === "optimize" && <Optimize data={feedback.payload} />}
        {feedback.kind === "visualize" && <Visualize data={feedback.payload} />}
      </motion.div>
    </AnimatePresence>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-t border-border first:border-t-0">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </div>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

function Evaluation({ data }: { data: any }) {
  const ok = data?.is_correct;
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <>
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{
          background: ok
            ? "color-mix(in oklab, var(--success) 18%, transparent)"
            : "color-mix(in oklab, var(--destructive) 18%, transparent)",
        }}
      >
        <Icon className={`h-5 w-5 ${ok ? "text-success" : "text-destructive"}`} />
        <span className="font-semibold text-sm">{data?.status_title || (ok ? "Correct" : "Not quite")}</span>
      </div>
      <Section label="Mentor">{data?.feedback_message}</Section>
      {(data?.user_result_preview || data?.expected_result_preview) && (
        <Section label="Results">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Your output</div>
              <ResultTable text={data?.user_result_preview} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Expected output</div>
              <ResultTable text={data?.expected_result_preview} />
            </div>
          </div>
        </Section>
      )}
      {data?.performance_note && <Section label="Performance">{data.performance_note}</Section>}
      {data?.best_practice_tip && <Section label="Best practice">{data.best_practice_tip}</Section>}
    </>
  );
}

function Debug({ data }: { data: any }) {
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 bg-[color-mix(in_oklab,var(--warning)_18%,transparent)]">
        <Bug className="h-5 w-5 text-warning" />
        <span className="font-semibold text-sm">Debugger</span>
      </div>
      <Section label="What's wrong">{data?.error_analysis}</Section>
      <Section label="Educational fix">{data?.educational_fix}</Section>
    </>
  );
}

function Hint({ data }: { data: any }) {
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 bg-accent">
        <Lightbulb className="h-5 w-5 text-primary-glow" />
        <span className="font-semibold text-sm">Hint</span>
      </div>
      <Section label="Nudge">{data?.hint_text}</Section>
    </>
  );
}

function Solution({ data }: { data: any }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 bg-accent">
        <Sparkles className="h-5 w-5 text-primary-glow" />
        <span className="font-semibold text-sm">Reference solution</span>
      </div>
      {!revealed ? (
        <div className="p-4">
          <button
            onClick={() => setRevealed(true)}
            className="text-sm text-primary-glow hover:underline"
          >
            Click to reveal the full SQL solution
          </button>
        </div>
      ) : (
        <>
          <Section label="SQL">
            <pre className="font-mono text-xs bg-background rounded p-3 overflow-auto whitespace-pre-wrap">
              {data?.correct_sql}
            </pre>
          </Section>
          <Section label="Walkthrough">
            <ol className="list-decimal pl-5 space-y-1.5">
              {(data?.explanation_steps || []).map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </Section>
        </>
      )}
    </>
  );
}

function Optimize({ data }: { data: any }) {
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 bg-[color-mix(in_oklab,var(--primary)_18%,transparent)]">
        <Zap className="h-5 w-5 text-primary-glow" />
        <span className="font-semibold text-sm">AI Query Optimizer</span>
      </div>
      <Section label="Optimized SQL">
        <pre className="font-mono text-xs bg-background rounded p-3 overflow-auto whitespace-pre-wrap">
          {data?.optimized_sql}
        </pre>
      </Section>
      {data?.improvements?.length > 0 && (
        <Section label="What changed">
          <ul className="list-disc pl-5 space-y-1.5">
            {data.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}
          </ul>
        </Section>
      )}
      {data?.estimated_gain && <Section label="Estimated gain">{data.estimated_gain}</Section>}
      {data?.explain_diff && (
        <Section label="EXPLAIN diff">
          <pre className="font-mono text-[11px] bg-background rounded p-3 overflow-auto whitespace-pre-wrap">
            {data.explain_diff}
          </pre>
        </Section>
      )}
    </>
  );
}

function Visualize({ data }: { data: any }) {
  const stages: any[] = data?.logical_order || [];
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 bg-[color-mix(in_oklab,var(--primary)_18%,transparent)]">
        <Workflow className="h-5 w-5 text-primary-glow" />
        <span className="font-semibold text-sm">Query Execution Visualization</span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Animated pipeline
        </span>
      </div>
      <div className="p-4">
        <QueryPipelineViz stages={stages} summary={data?.summary} />
      </div>
    </>
  );
}


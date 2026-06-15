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

function parseMarkdownTable(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const pipeLines = lines.filter((l) => l.startsWith("|"));
  if (pipeLines.length < 2) return null;
  const split = (l: string) =>
    l.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const headers = split(pipeLines[0]);
  const sepIdx = pipeLines.findIndex((l) => /^\|?\s*:?-{2,}/.test(l));
  const bodyStart = sepIdx >= 0 ? sepIdx + 1 : 1;
  const rows = pipeLines.slice(bodyStart).map(split);
  if (!headers.length) return null;
  return { headers, rows };
}

function ResultTable({ text }: { text?: string }) {
  if (!text || !text.trim()) {
    return (
      <div className="font-mono text-[11px] bg-background rounded p-3 text-muted-foreground border border-border">—</div>
    );
  }
  const parsed = parseMarkdownTable(text);
  if (!parsed) {
    return (
      <pre className="font-mono text-[11px] bg-background rounded p-3 overflow-auto whitespace-pre-wrap leading-relaxed border border-border text-foreground">
        {text}
      </pre>
    );
  }
  const { headers, rows } = parsed;
  return (
    <div className="overflow-auto rounded-md border border-border bg-background">
      <table className="w-full text-[11px] font-mono border-collapse">
        <thead className="bg-surface-2">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left px-2.5 py-1.5 font-semibold text-foreground border-b border-border whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-2.5 py-2 text-muted-foreground text-center">
                No rows
              </td>
            </tr>
          ) : (
            rows.map((r, ri) => (
              <tr key={ri} className="odd:bg-background even:bg-surface-2/40 border-t border-border/40">
                {headers.map((_, ci) => (
                  <td key={ci} className="px-2.5 py-1 text-foreground/90 whitespace-nowrap">
                    {r[ci] ?? ""}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
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
  const rawSql: string = data?.correct_sql ?? "";
  // Models occasionally emit literal escape sequences (\n, \t, \") instead of
  // real characters, which makes the SQL show up as one long unreadable line.
  // Normalize those before rendering, then lightly format the SQL.
  const formattedSql = formatSql(
    rawSql
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "  ")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\s+\n/g, "\n")
      .trim(),
  );
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
            <pre className="font-mono text-xs bg-background rounded p-3 overflow-auto whitespace-pre border border-border leading-relaxed text-foreground">
              <code>{formattedSql}</code>
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

// Lightweight SQL formatter: puts major clauses on their own line and
// indents items after SELECT / lists. Good enough for display when the
// model returns a single-line query.
function formatSql(sql: string): string {
  if (!sql) return "";
  // If it already has multiple lines, keep them but trim trailing spaces.
  if (sql.includes("\n")) {
    return sql
      .split("\n")
      .map((l) => l.replace(/\s+$/g, ""))
      .join("\n");
  }
  const KEYWORDS = [
    "WITH",
    "SELECT",
    "FROM",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "FULL JOIN",
    "CROSS JOIN",
    "JOIN",
    "WHERE",
    "GROUP BY",
    "HAVING",
    "ORDER BY",
    "LIMIT",
    "OFFSET",
    "UNION ALL",
    "UNION",
    "INTERSECT",
    "EXCEPT",
    "ON",
  ];
  let out = sql.replace(/\s+/g, " ").trim();
  for (const kw of KEYWORDS) {
    const re = new RegExp(`\\s+${kw.replace(/ /g, "\\s+")}\\s+`, "gi");
    out = out.replace(re, `\n${kw} `);
  }
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
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


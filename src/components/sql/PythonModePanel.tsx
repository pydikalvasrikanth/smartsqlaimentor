import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Loader2, Play, Lightbulb, Eye, GitCompareArrows, AlertTriangle,
  CheckCircle2, XCircle, FileCode2, Sparkles,
} from "lucide-react";

import { runPythonFromSql } from "@/lib/python-sql.functions";

type Loading =
  | null
  | "convert"
  | "run"
  | "hint"
  | "reveal"
  | "compare";

interface ConvertResult {
  python_task: string;
  dataframe_setup: string;
  starter_code: string;
  expected_python: string;
  is_runnable: boolean;
  not_runnable_reason: string;
}

type View =
  | { kind: "none" }
  | { kind: "run"; data: any }
  | { kind: "hint"; data: any }
  | { kind: "reveal"; data: any }
  | { kind: "compare"; data: any };

interface Props {
  sessionQuestionId: string;
  schema_sql: string;
  seed_data_sql: string;
  sql_task: string;
  expected_sql?: string;
}

/**
 * Self-contained Python practice panel. Given the active SQL question,
 * it converts it to a pandas problem and lets the user run / hint / reveal /
 * compare. Cached per `sessionQuestionId` so toggling SQL ↔ Python is instant
 * after the first conversion.
 */
export function PythonModePanel({
  sessionQuestionId, schema_sql, seed_data_sql, sql_task, expected_sql,
}: Props) {
  const run = useServerFn(runPythonFromSql);
  const [loading, setLoading] = useState<Loading>(null);
  const [ctx, setCtx] = useState<ConvertResult | null>(null);
  const [userPy, setUserPy] = useState<string>("");
  const [view, setView] = useState<View>({ kind: "none" });

  // Re-convert when the active question changes
  useEffect(() => {
    let alive = true;
    setCtx(null);
    setUserPy("");
    setView({ kind: "none" });
    setLoading("convert");
    (async () => {
      try {
        const res: any = await run({
          data: {
            command: "CONVERT_TO_PYTHON",
            payload: {
              schema_sql,
              seed_data_sql,
              sql_task,
              expected_sql: expected_sql ?? "",
            },
          },
        });
        if (!alive) return;
        if (res?.error) { toast.error(res.error); setLoading(null); return; }
        const data = res?.data as ConvertResult;
        setCtx(data);
        setUserPy(data.starter_code || "");
      } catch (e: any) {
        if (!alive) return;
        toast.error(e?.message ?? "Could not convert to Python.");
      } finally {
        if (alive) setLoading(null);
      }
    })();
    return () => { alive = false; };
  }, [sessionQuestionId, run, schema_sql, seed_data_sql, sql_task, expected_sql]);

  async function call<T = any>(command: string, payload: any): Promise<T | null> {
    try {
      const res: any = await run({ data: { command, payload } });
      if (res?.error) { toast.error(res.error); return null; }
      return res?.data ?? null;
    } catch (e: any) {
      toast.error(e?.message ?? "Network error.");
      return null;
    }
  }

  async function onRun() {
    if (!ctx) return;
    setLoading("run");
    const data = await call("EVALUATE_PYTHON", {
      python_task: ctx.python_task,
      dataframe_setup: ctx.dataframe_setup,
      expected_python: ctx.expected_python,
      user_python: userPy,
    });
    setLoading(null);
    if (data) {
      setView({ kind: "run", data });
      if (data.is_correct) toast.success("Correct — pandas solution matches.");
    }
  }

  async function onHint() {
    if (!ctx) return;
    setLoading("hint");
    const data = await call("HINT_PYTHON", { python_task: ctx.python_task, user_python: userPy });
    setLoading(null);
    if (data) setView({ kind: "hint", data });
  }

  async function onReveal() {
    if (!ctx) return;
    setLoading("reveal");
    const data = await call("REVEAL_PYTHON", {
      python_task: ctx.python_task,
      expected_python: ctx.expected_python,
    });
    setLoading(null);
    if (data) setView({ kind: "reveal", data });
  }

  async function onCompare() {
    if (!ctx) return;
    setLoading("compare");
    const data = await call("COMPARE_SQL_PYTHON", {
      sql_task,
      expected_sql: expected_sql ?? "(derived from session — not provided)",
      expected_python: ctx.expected_python,
    });
    setLoading(null);
    if (data) setView({ kind: "compare", data });
  }

  if (loading === "convert" && !ctx) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 grid place-items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Translating this MySQL question into a Python (pandas) task…
        </div>
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Could not load Python version. Try toggling back to SQL and again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Python task card */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface-2">
          <FileCode2 className="h-3.5 w-3.5 text-primary-glow" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Python (pandas) task
          </span>
          {!ctx.is_runnable && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-amber-400">
              <AlertTriangle className="h-3 w-3" /> Reference only
            </span>
          )}
        </div>
        <div className="p-4 space-y-2">
          <p className="text-sm leading-relaxed text-foreground/90">{ctx.python_task}</p>
          {!ctx.is_runnable && ctx.not_runnable_reason && (
            <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/30 rounded p-2">
              {ctx.not_runnable_reason}
            </p>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Python editor (assign your answer to `result`)
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">pandas as pd · numpy as np</span>
        </div>
        <div className="rounded-md border border-border overflow-hidden bg-[#1d2238]">
          <Editor
            height="320px"
            defaultLanguage="python"
            value={userPy}
            onChange={(v) => setUserPy(v ?? "")}
            theme="vs-dark"
            options={{
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <ActionBtn primary onClick={onRun} loading={loading === "run"} icon={<Play className="h-3.5 w-3.5" />} disabled={!ctx.is_runnable}>
            Run
          </ActionBtn>
          <ActionBtn onClick={onHint} loading={loading === "hint"} icon={<Lightbulb className="h-3.5 w-3.5" />} disabled={!ctx.is_runnable}>
            Hint
          </ActionBtn>
          <ActionBtn onClick={onReveal} loading={loading === "reveal"} icon={<Eye className="h-3.5 w-3.5" />}>
            Reveal answer
          </ActionBtn>
          <ActionBtn onClick={onCompare} loading={loading === "compare"} icon={<GitCompareArrows className="h-3.5 w-3.5" />}>
            MySQL ↔ Python
          </ActionBtn>
        </div>
      </div>

      {/* Output */}
      {view.kind === "run" && <RunView data={view.data} />}
      {view.kind === "hint" && <HintView data={view.data} />}
      {view.kind === "reveal" && <RevealView data={view.data} />}
      {view.kind === "compare" && <CompareView data={view.data} />}

      {/* Reference dataframe setup */}
      <details className="rounded-lg border border-border bg-card overflow-hidden">
        <summary className="px-4 py-2.5 text-xs font-mono text-muted-foreground cursor-pointer hover:bg-accent">
          Show DataFrame setup (built from seed data)
        </summary>
        <pre className="p-4 text-[11px] font-mono whitespace-pre-wrap text-foreground/85 bg-background border-t border-border overflow-auto">
          {ctx.dataframe_setup}
        </pre>
      </details>
    </div>
  );
}

/* ---------- shared bits ---------- */

function ActionBtn({
  children, onClick, loading, icon, primary, disabled,
}: { children: React.ReactNode; onClick: () => void; loading?: boolean; icon?: React.ReactNode; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-50 ${
        primary
          ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground"
          : "border border-border bg-surface hover:bg-accent"
      }`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-lg border border-border bg-card overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-t border-border first:border-t-0">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</div>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="font-mono text-xs bg-background rounded p-3 overflow-auto whitespace-pre-wrap border border-border text-foreground">
      {code}
    </pre>
  );
}

function parseMdTable(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const pipe = lines.filter((l) => l.startsWith("|"));
  if (pipe.length < 2) return null;
  const split = (l: string) => l.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const headers = split(pipe[0]);
  const sepIdx = pipe.findIndex((l) => /^\|?\s*:?-{2,}/.test(l));
  const rows = pipe.slice(sepIdx >= 0 ? sepIdx + 1 : 1).map(split);
  return { headers, rows };
}

function ResultTable({ text }: { text?: string }) {
  if (!text || !text.trim()) {
    return <div className="font-mono text-[11px] bg-background rounded p-3 text-muted-foreground border border-border">—</div>;
  }
  const parsed = parseMdTable(text);
  if (!parsed) {
    return (
      <pre className="font-mono text-[11px] bg-background rounded p-3 overflow-auto whitespace-pre-wrap border border-border text-foreground">
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
              <th key={i} className="text-left px-2.5 py-1.5 font-semibold text-foreground border-b border-border whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="px-2.5 py-2 text-muted-foreground text-center">No rows</td></tr>
          ) : rows.map((r, ri) => (
            <tr key={ri} className="odd:bg-background even:bg-surface-2/40 border-t border-border/40">
              {headers.map((_, ci) => (
                <td key={ci} className="px-2.5 py-1 text-foreground/90 whitespace-nowrap">{r[ci] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RunView({ data }: { data: any }) {
  const ok = data?.is_correct;
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <Card>
      <div className="flex items-center gap-2 px-4 py-3"
        style={{ background: ok
          ? "color-mix(in oklab, var(--success) 18%, transparent)"
          : "color-mix(in oklab, var(--destructive) 18%, transparent)" }}>
        <Icon className={`h-5 w-5 ${ok ? "text-success" : "text-destructive"}`} />
        <span className="font-semibold text-sm">{data?.status_title || (ok ? "Correct" : "Not quite")}</span>
      </div>
      <Section label="Mentor">{data?.feedback_message}</Section>
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
      {data?.best_practice_tip && <Section label="Best practice">{data.best_practice_tip}</Section>}
    </Card>
  );
}

function HintView({ data }: { data: any }) {
  return (
    <Card>
      <div className="flex items-center gap-2 px-4 py-3 bg-accent">
        <Lightbulb className="h-5 w-5 text-primary-glow" />
        <span className="font-semibold text-sm">Hint</span>
      </div>
      <Section label="Nudge">{data?.hint_text}</Section>
      {data?.suggested_apis?.length > 0 && (
        <Section label="Look up these pandas APIs">
          <div className="flex flex-wrap gap-1.5">
            {data.suggested_apis.map((a: string, i: number) => (
              <code key={i} className="px-2 py-0.5 rounded bg-background border border-border text-[11px] font-mono text-primary-glow">
                {a}
              </code>
            ))}
          </div>
        </Section>
      )}
    </Card>
  );
}

function RevealView({ data }: { data: any }) {
  const steps: any[] = data?.steps || [];
  return (
    <Card>
      <div className="flex items-center gap-2 px-4 py-3 bg-accent">
        <Sparkles className="h-5 w-5 text-primary-glow" />
        <span className="font-semibold text-sm">Step-by-step Python solution</span>
      </div>
      <Section label="Walkthrough">
        <ol className="space-y-3 list-decimal pl-5">
          {steps.map((s, i) => (
            <li key={i} className="space-y-1.5">
              <div className="font-medium text-foreground">{s.title}</div>
              <CodeBlock code={s.code} />
              <p className="text-xs text-foreground/80">{s.explanation}</p>
            </li>
          ))}
        </ol>
      </Section>
      <Section label="Full solution">
        <CodeBlock code={data?.full_solution || ""} />
      </Section>
    </Card>
  );
}

function CompareView({ data }: { data: any }) {
  const mapping: any[] = data?.mapping || [];
  const diffs: string[] = data?.key_differences || [];
  return (
    <Card>
      <div className="flex items-center gap-2 px-4 py-3 bg-[color-mix(in_oklab,var(--primary)_18%,transparent)]">
        <GitCompareArrows className="h-5 w-5 text-primary-glow" />
        <span className="font-semibold text-sm">MySQL ↔ Python side-by-side</span>
      </div>
      <Section label="Clause-by-clause mapping">
        <div className="overflow-auto rounded-md border border-border bg-background">
          <table className="w-full text-[11px] font-mono border-collapse">
            <thead className="bg-surface-2">
              <tr>
                <th className="text-left px-2.5 py-1.5 font-semibold border-b border-border">MySQL</th>
                <th className="text-left px-2.5 py-1.5 font-semibold border-b border-border">Python (pandas)</th>
                <th className="text-left px-2.5 py-1.5 font-semibold border-b border-border">Note</th>
              </tr>
            </thead>
            <tbody>
              {mapping.map((m, i) => (
                <tr key={i} className="border-t border-border/40 align-top">
                  <td className="px-2.5 py-2 whitespace-pre-wrap text-primary-glow">{m.sql_snippet}</td>
                  <td className="px-2.5 py-2 whitespace-pre-wrap text-emerald-300">{m.python_snippet}</td>
                  <td className="px-2.5 py-2 text-foreground/80 font-sans">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      {diffs.length > 0 && (
        <Section label="Key differences">
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            {diffs.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </Section>
      )}
      {data?.when_to_use_which && <Section label="When to use which">{data.when_to_use_which}</Section>}
    </Card>
  );
}
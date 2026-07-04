import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { runSqlEngine } from "@/lib/sql-engine.functions";
import { ErdDiagram } from "./ErdDiagram";
import { TheoryContent } from "./TheoryContent";

interface Props {
  schemaSql: string;
  seedSql: string;
  erdMermaid: string;
  description: string;
  /** Current question — enables the Theory tab when present. */
  question?: { task: string; concept?: string; difficulty?: string } | null;
}

type Tab = "erd" | "schema" | "data" | "about" | "theory";

export function SchemaPanel({ schemaSql, seedSql, erdMermaid, description, question }: Props) {
  const [tab, setTab] = useState<Tab>("erd");
  const engine = useServerFn(runSqlEngine);
  const [theory, setTheory] = useState<string>("");
  const [theoryFor, setTheoryFor] = useState<string>("");
  const [theoryLoading, setTheoryLoading] = useState(false);
  const [theoryError, setTheoryError] = useState<string | null>(null);

  const taskKey = question?.task ?? "";

  // Invalidate cached theory whenever the current question changes.
  useEffect(() => {
    if (taskKey !== theoryFor) {
      setTheory("");
      setTheoryError(null);
    }
  }, [taskKey, theoryFor]);

  async function loadTheory() {
    if (!question) return;
    setTheoryLoading(true);
    setTheoryError(null);
    try {
      const res: any = await engine({
        data: {
          command: "EXPLAIN_THEORY",
          payload: {
            task: question.task,
            concept: question.concept,
            difficulty: question.difficulty,
            schema_sql: schemaSql,
          },
        },
      });
      if (res?.error) {
        setTheoryError(res.error);
      } else if (res?.data?.theory_markdown) {
        setTheory(res.data.theory_markdown);
        setTheoryFor(question.task);
      } else {
        setTheoryError("No theory returned. Try again.");
      }
    } catch (e: any) {
      setTheoryError(e?.message ?? "Could not load theory.");
    } finally {
      setTheoryLoading(false);
    }
  }

  // Auto-fetch when the Theory tab is opened for a new question.
  useEffect(() => {
    if (tab !== "theory") return;
    if (!question) return;
    if (theory && theoryFor === taskKey) return;
    if (theoryLoading) return;
    loadTheory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, taskKey]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "erd", label: "ERD" },
    { id: "schema", label: "Schema" },
    { id: "data", label: "Seed" },
    { id: "about", label: "About" },
    ...(question ? [{ id: "theory" as const, label: "Theory" }] : []),
  ];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col h-full min-h-0">
      <div className="flex border-b border-border bg-surface-2 text-xs font-mono">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 transition-colors ${
              tab === t.id
                ? "text-foreground border-b-2 border-primary-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.id === "theory" ? (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> {t.label}
              </span>
            ) : (
              t.label
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3 min-h-0">
        {tab === "erd" && (
          erdMermaid ? <ErdDiagram chart={erdMermaid} /> : <Empty />
        )}
        {tab === "schema" && (
          <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/85">
            {schemaSql || "—"}
          </pre>
        )}
        {tab === "data" && (
          <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/85">
            {seedSql || "—"}
          </pre>
        )}
        {tab === "about" && (
          <p className="text-sm text-foreground/85 leading-relaxed">
            {description || "No environment loaded yet."}
          </p>
        )}
        {tab === "theory" && (
          <div className="space-y-3">
            {!question ? (
              <p className="text-xs text-muted-foreground">
                Theory will appear once a question is loaded.
              </p>
            ) : theoryLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Preparing an in-depth explanation for this question…
              </div>
            ) : theoryError ? (
              <div className="space-y-2">
                <p className="text-xs text-destructive">{theoryError}</p>
                <button
                  onClick={loadTheory}
                  className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-accent"
                >
                  Retry
                </button>
              </div>
            ) : theory ? (
              <>
                <TheoryContent content={theory} />
                <button
                  onClick={loadTheory}
                  className="text-[11px] px-2 py-1 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  Regenerate
                </button>
              </>
            ) : (
              <button
                onClick={loadTheory}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-medium"
              >
                <Sparkles className="h-3.5 w-3.5" /> Explain the theory
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="text-xs text-muted-foreground p-4">
      Initialize an environment to see the entity-relationship diagram.
    </div>
  );
}

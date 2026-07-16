import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { runJavaEngine } from "@/lib/java-engine.functions";
import { TheoryContent } from "@/components/sql/TheoryContent";

interface Props {
  sessionQuestionId: string;
  /** Small badge to display alongside the header (concept name). */
  concept?: string;
}

// In-memory cache so switching tabs / re-mounting doesn't re-cost tokens.
const cache = new Map<string, string>();

/**
 * In-depth Java theory panel, shown below the question card. Fetches an
 * AI-generated markdown guide (with an animated mermaid flow diagram + a
 * worked mini-example) tailored to the current question.
 */
export function JavaTheoryPanel({ sessionQuestionId, concept }: Props) {
  const engine = useServerFn(runJavaEngine);
  const [content, setContent] = useState<string>(() => cache.get(sessionQuestionId) ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(force = false) {
    if (!sessionQuestionId) return;
    if (!force && cache.has(sessionQuestionId)) {
      setContent(cache.get(sessionQuestionId)!);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res: any = await engine({
        data: {
          command: "JAVA_THEORY",
          payload: { session_question_id: sessionQuestionId },
        },
      });
      if (res?.error) {
        setError(res.error);
      } else {
        const md = res?.data?.theory_markdown ?? "";
        cache.set(sessionQuestionId, md);
        setContent(md);
      }
    } catch (e: any) {
      setError(e?.message ?? "Could not load theory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setContent(cache.get(sessionQuestionId) ?? "");
    setError(null);
    if (sessionQuestionId && !cache.has(sessionQuestionId)) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionQuestionId]);

  return (
    <div className="rounded-lg border border-border bg-surface-1 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface-2">
        <Sparkles className="h-3.5 w-3.5 text-primary-glow" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Theory & worked example
        </span>
        {concept && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-border text-primary-glow">
            {concept}
          </span>
        )}
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-border hover:bg-accent disabled:opacity-50"
          title="Regenerate theory"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Regenerate
        </button>
      </div>
      <div className="p-4 min-h-[120px]">
        {loading && !content && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Generating an in-depth explanation for this question…
          </div>
        )}
        {error && !loading && (
          <div className="text-sm text-destructive">
            {error}{" "}
            <button className="underline" onClick={() => load(true)}>
              Retry
            </button>
          </div>
        )}
        {content && <TheoryContent content={content} />}
      </div>
    </div>
  );
}
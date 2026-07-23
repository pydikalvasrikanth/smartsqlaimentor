import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useResumableState } from "@/lib/resume";
import { ResumePrompt } from "@/components/ResumePrompt";
import { useAuth } from "@/hooks/use-auth";
import { Toaster, toast } from "sonner";
import {
  Cloud, ArrowLeft, ArrowRight, Eye, EyeOff, LogOut,
  CheckCircle2, XCircle, Filter, Check, RotateCcw, ChevronDown, ChevronRight,
} from "lucide-react";
import { GCP_BANK, type GcpDifficulty, type GcpQuestion } from "@/lib/gcp-bank";
import { AiAssistant } from "@/components/AiAssistant";
import { ThemeToggle } from "@/hooks/use-theme";

export const Route = createFileRoute("/gcp")({
  head: () => ({
    meta: [
      { title: "GCP Data Engineer Interview Bank — 100+ MNC questions" },
      { name: "description", content: "Curated GCP Data Engineer interview questions from top MNCs with answers, explanations, and follow-ups." },
      { property: "og:title", content: "GCP Data Engineer Interview Bank — 100+ MNC Questions" },
      { property: "og:description", content: "100+ curated GCP Data Engineer interview questions from top MNCs with answers and explanations." },
      { property: "og:url", content: "https://smartsqlaimentor.lovable.app/gcp" },
    ],
    links: [
      { rel: "canonical", href: "https://smartsqlaimentor.lovable.app/gcp" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          name: "GCP Data Engineer Interview Bank",
          url: "https://smartsqlaimentor.lovable.app/gcp",
          mainEntity: GCP_BANK.slice(0, 20).map((q) => ({
            "@type": "Question",
            name: q.question,
            acceptedAnswer: { "@type": "Answer", text: q.answer },
          })),
        }),
      },
    ],
  }),
  component: GcpWorkspace,
});

const LEVELS: GcpDifficulty[] = ["beginner", "intermediate", "advanced", "professional"];
const LEVEL_LABEL: Record<GcpDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  professional: "Professional",
};
// Focus areas the user asked about — surface these first, then "All" for the rest.
const FOCUS_TOPICS = ["BigQuery", "SQL Modeling", "Warehousing", "ETL/ELT", "Power BI"];
const OTHER_TOPICS = Array.from(new Set(GCP_BANK.map((q) => q.topic)))
  .filter((t) => !FOCUS_TOPICS.includes(t))
  .sort();
const TOPICS = ["All", ...FOCUS_TOPICS, ...OTHER_TOPICS];

function GcpWorkspace() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [topic, setTopic] = useState<string>("BigQuery");
  const [level, setLevel] = useState<GcpDifficulty>("beginner");
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [marks, setMarks] = useState<Record<number, "right" | "wrong">>({});
  const [covered, setCovered] = useState<number[]>([]);
  const [showCovered, setShowCovered] = useState(false);

  const resume = useResumableState<{
    topic: string;
    level: GcpDifficulty;
    index: number;
    marks: Record<number, "right" | "wrong">;
    covered: number[];
  }>(
    "gcp",
    { topic: "BigQuery", level: "beginner", index: 0, marks: {}, covered: [] },
    {
      isEmpty: (s: any) =>
        !s ||
        (s.index === 0 &&
          s.topic === "BigQuery" &&
          s.level === "beginner" &&
          Object.keys(s.marks ?? {}).length === 0 &&
          (s.covered ?? []).length === 0),
    },
  );

  useEffect(() => {
    if (!resume.ready) return;
    resume.setState({ topic, level, index, marks, covered });
  }, [topic, level, index, marks, covered, resume.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!authLoading && !user) navigate({ to: "/auth" }); }, [authLoading, user, navigate]);

  const coveredSet = useMemo(() => new Set(covered), [covered]);

  const scopeAll = useMemo(
    () => GCP_BANK.filter((q) => q.difficulty === level && (topic === "All" || q.topic === topic)),
    [topic, level],
  );
  const active = useMemo(() => scopeAll.filter((q) => !coveredSet.has(q.id)), [scopeAll, coveredSet]);
  const coveredQs = useMemo(() => scopeAll.filter((q) => coveredSet.has(q.id)), [scopeAll, coveredSet]);
  const topicCounts = useMemo(() => {
    const total = new Map<string, number>();
    const done = new Map<string, number>();
    for (const q of GCP_BANK) {
      if (q.difficulty !== level) continue;
      total.set(q.topic, (total.get(q.topic) ?? 0) + 1);
      if (coveredSet.has(q.id)) done.set(q.topic, (done.get(q.topic) ?? 0) + 1);
    }
    return { total, done };
  }, [level, coveredSet]);

  useEffect(() => { setIndex(0); setShowAnswer(false); }, [topic, level]);
  useEffect(() => {
    if (index >= active.length) setIndex(Math.max(0, active.length - 1));
  }, [active.length, index]);

  const q: GcpQuestion | undefined = active[index];
  const total = active.length;
  const correctCount = Object.values(marks).filter((m) => m === "right").length;

  function go(delta: number) {
    if (!total) return;
    setIndex((i) => (i + delta + total) % total);
    setShowAnswer(false);
  }
  function mark(v: "right" | "wrong") {
    if (!q) return;
    setMarks((m) => ({ ...m, [q.id]: v }));
    toast.success(v === "right" ? "Marked correct" : "Marked to review");
  }
  function markDone(qid: number) {
    if (!coveredSet.has(qid)) setCovered((c) => [...c, qid]);
    setShowAnswer(false);
    toast.success("Moved to Covered — won't repeat");
  }
  function restore(qid: number) {
    setCovered((c) => c.filter((x) => x !== qid));
    toast.success("Restored to active questions");
  }
  function resetLevel() {
    const scopeIds = new Set(scopeAll.map((q) => q.id));
    setCovered((c) => c.filter((id) => !scopeIds.has(id)));
    setIndex(0);
    toast.success("Reset — all questions active again");
  }

  if (authLoading || !user) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster theme="dark" position="top-right" richColors />
      <header className="border-b border-border bg-surface-2/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-wrap items-center gap-2 sm:gap-3">
          <Link to="/" aria-label="Back to subjects" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="h-8 w-8 shrink-0 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Cloud className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight min-w-0 max-w-[45vw] sm:max-w-none">
            <h1 className="text-sm font-semibold tracking-tight truncate">
              <span className="sm:hidden">GCP Bank</span>
              <span className="hidden sm:inline">GCP Data Engineer Bank</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-mono truncate">{GCP_BANK.length} questions · top MNCs</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground">{correctCount} correct</span>
            <ThemeToggle />
            <button onClick={() => signOut()} aria-label="Sign out" title="Sign out" className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border hover:bg-accent">
              <LogOut className="h-3 w-3" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto p-4 space-y-4">
        {resume.hasResumable && resume.savedSnapshot && (
          <ResumePrompt
            updatedAt={resume.savedSnapshot.updatedAt}
            meta={`Question ${(resume.savedSnapshot.state.index ?? 0) + 1} · ${(resume.savedSnapshot.state.covered ?? []).length} covered`}
            onResume={() => {
              const s = resume.savedSnapshot!.state;
              setTopic(s.topic ?? "BigQuery");
              setLevel(s.level ?? "beginner");
              setMarks(s.marks ?? {});
              setCovered(s.covered ?? []);
              setTimeout(() => setIndex(s.index ?? 0), 0);
              resume.hydrate(resume.savedSnapshot);
            }}
            onDismiss={resume.dismiss}
          />
        )}
        {/* Level tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2">
          {LEVELS.map((lv) => {
            const isActive = lv === level;
            const tot = GCP_BANK.filter((qq) => qq.difficulty === lv).length;
            const done = GCP_BANK.filter((qq) => qq.difficulty === lv && coveredSet.has(qq.id)).length;
            return (
              <button
                key={lv}
                onClick={() => setLevel(lv)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface-2 border-border hover:bg-accent"}`}
              >
                {LEVEL_LABEL[lv]} <span className="opacity-70 font-mono ml-1">{done}/{tot}</span>
              </button>
            );
          })}
        </div>

        {/* Topic filter + counters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <label htmlFor="gcp-topic" className="text-muted-foreground">Topic</label>
          <select
            id="gcp-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-surface-2 border border-border rounded px-2 py-1"
          >
            {TOPICS.map((t) => {
              const tot = t === "All"
                ? Array.from(topicCounts.total.values()).reduce((a, b) => a + b, 0)
                : topicCounts.total.get(t) ?? 0;
              const done = t === "All"
                ? Array.from(topicCounts.done.values()).reduce((a, b) => a + b, 0)
                : topicCounts.done.get(t) ?? 0;
              return <option key={t} value={t}>{t} ({done}/{tot})</option>;
            })}
          </select>
          <span className="ml-auto text-muted-foreground">
            {total ? `${Math.min(index + 1, total)} / ${total} active` : "all covered ✓"}
          </span>
        </div>

        {q ? (
          <article className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground">{q.topic}</span>
              <span className="px-2 py-0.5 rounded border border-border">{q.difficulty}</span>
              <span className="text-muted-foreground">asked at: {q.companies.join(", ")}</span>
              {marks[q.id] === "right" && <span className="ml-auto text-green-500 inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> correct</span>}
              {marks[q.id] === "wrong" && <span className="ml-auto text-yellow-500 inline-flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> review</span>}
            </div>

            <h2 className="text-lg font-semibold leading-snug">{q.question}</h2>

            {!showAnswer ? (
              <button onClick={() => setShowAnswer(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm hover:opacity-90">
                <Eye className="h-3.5 w-3.5" /> Reveal answer
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-mono uppercase text-muted-foreground mb-1">Answer</div>
                  <p className="text-sm whitespace-pre-wrap">{q.answer}</p>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase text-muted-foreground mb-1">Why interviewers ask</div>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{q.explanation}</p>
                </div>
                {q.follow_ups && q.follow_ups.length > 0 && (
                  <div>
                    <div className="text-[11px] font-mono uppercase text-muted-foreground mb-1">Follow-ups</div>
                    <ul className="list-disc pl-5 text-sm space-y-0.5">
                      {q.follow_ups.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button onClick={() => { mark("right"); markDone(q.id); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm hover:opacity-90">
                    <Check className="h-3.5 w-3.5" /> Done — don't repeat
                  </button>
                  <button onClick={() => mark("right")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-green-500/40 text-green-500 text-sm hover:bg-green-500/10">
                    <CheckCircle2 className="h-3.5 w-3.5" /> I knew this
                  </button>
                  <button onClick={() => mark("wrong")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-yellow-500/40 text-yellow-500 text-sm hover:bg-yellow-500/10">
                    <XCircle className="h-3.5 w-3.5" /> Review later
                  </button>
                  <button onClick={() => setShowAnswer(false)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border text-sm hover:bg-accent">
                    <EyeOff className="h-3.5 w-3.5" /> Hide
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button onClick={() => go(-1)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border text-sm hover:bg-accent">
                <ArrowLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button onClick={() => go(1)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm hover:opacity-90">
                Next <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ) : (
          <div className="rounded-xl border border-border bg-surface-1 p-8 text-center space-y-3">
            <div className="text-sm">
              {coveredQs.length > 0
                ? `You covered all ${coveredQs.length} ${LEVEL_LABEL[level]} question${coveredQs.length === 1 ? "" : "s"} in "${topic}". Nice work.`
                : "No questions match this filter."}
            </div>
            {coveredQs.length > 0 && (
              <button onClick={resetLevel} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border text-xs hover:bg-accent">
                <RotateCcw className="h-3.5 w-3.5" /> Reset this level
              </button>
            )}
          </div>
        )}

        {/* Covered questions section */}
        <section className="rounded-xl border border-border bg-surface-1/60">
          <button
            onClick={() => setShowCovered((s) => !s)}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold hover:bg-accent/40 rounded-xl"
          >
            {showCovered ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Covered questions
            <span className="text-xs font-mono text-muted-foreground">
              {LEVEL_LABEL[level]} · {topic} · {coveredQs.length}
            </span>
            {coveredQs.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); resetLevel(); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); resetLevel(); } }}
                className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-[11px] font-normal hover:bg-accent cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </span>
            )}
          </button>
          {showCovered && (
            <div className="px-4 pb-4 space-y-2">
              {coveredQs.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2">
                  Nothing covered yet. Click <b>Done — don't repeat</b> on a question to move it here.
                </div>
              ) : (
                coveredQs.map((cq) => (
                  <details key={cq.id} className="rounded border border-border bg-background/40 open:bg-background/60">
                    <summary className="cursor-pointer px-3 py-2 text-sm flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                      <span className="flex-1">{cq.question}</span>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">{cq.topic}</span>
                    </summary>
                    <div className="px-3 pb-3 pt-1 text-sm space-y-2">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Answer</div>
                        <p className="whitespace-pre-wrap">{cq.answer}</p>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Why it's asked</div>
                        <p className="whitespace-pre-wrap text-muted-foreground">{cq.explanation}</p>
                      </div>
                      <button
                        onClick={() => restore(cq.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-xs hover:bg-accent"
                      >
                        <RotateCcw className="h-3 w-3" /> Restore to active
                      </button>
                    </div>
                  </details>
                ))
              )}
            </div>
          )}
        </section>
      </main>
      <AiAssistant
        context="GCP Data Engineer interview prep — BigQuery, Dataflow, Pub/Sub, Composer, IAM & cost optimization"
        suggestions={[
          "Explain BigQuery partitioning vs clustering",
          "When should I use Dataflow vs Dataproc?",
          "How does Pub/Sub guarantee delivery?",
        ]}
      />
    </div>
  );
}
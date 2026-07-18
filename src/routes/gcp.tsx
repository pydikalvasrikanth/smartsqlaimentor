import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useResumableState } from "@/lib/resume";
import { ResumePrompt } from "@/components/ResumePrompt";
import { useAuth } from "@/hooks/use-auth";
import { Toaster, toast } from "sonner";
import { Cloud, ArrowLeft, ArrowRight, Eye, EyeOff, LogOut, CheckCircle2, XCircle, Filter } from "lucide-react";
import { GCP_BANK, type GcpDifficulty, type GcpQuestion } from "@/lib/gcp-bank";
import { AiAssistant } from "@/components/AiAssistant";
import { ThemeToggle } from "@/hooks/use-theme";

export const Route = createFileRoute("/gcp")({
  head: () => ({
    meta: [
      { title: "GCP Data Engineer Interview Bank — 100+ MNC questions" },
      { name: "description", content: "Curated GCP Data Engineer interview questions from top MNCs with answers, explanations, and follow-ups." },
      { property: "og:title", content: "GCP Data Engineer Interview Bank" },
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

const TOPICS = ["All", ...Array.from(new Set(GCP_BANK.map((q) => q.topic)))];
const DIFFS: ("All" | GcpDifficulty)[] = ["All", "beginner", "intermediate", "advanced", "professional"];

function GcpWorkspace() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [topic, setTopic] = useState<string>("All");
  const [diff, setDiff] = useState<("All" | GcpDifficulty)>("All");
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [marks, setMarks] = useState<Record<number, "right" | "wrong">>({});

  const resume = useResumableState<{
    topic: string;
    diff: "All" | GcpDifficulty;
    index: number;
    marks: Record<number, "right" | "wrong">;
  }>(
    "gcp",
    { topic: "All", diff: "All", index: 0, marks: {} },
    {
      isEmpty: (s: any) =>
        !s || (s.index === 0 && s.topic === "All" && s.diff === "All" && Object.keys(s.marks ?? {}).length === 0),
    },
  );

  useEffect(() => {
    if (!resume.ready) return;
    resume.setState({ topic, diff, index, marks });
  }, [topic, diff, index, marks, resume.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!authLoading && !user) navigate({ to: "/auth" }); }, [authLoading, user, navigate]);

  const filtered = useMemo(() => {
    return GCP_BANK.filter((q) =>
      (topic === "All" || q.topic === topic) &&
      (diff === "All" || q.difficulty === diff)
    );
  }, [topic, diff]);

  useEffect(() => { setIndex(0); setShowAnswer(false); }, [topic, diff]);

  const q: GcpQuestion | undefined = filtered[index];
  const total = filtered.length;
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
            meta={`Question ${(resume.savedSnapshot.state.index ?? 0) + 1}`}
            onResume={() => {
              const s = resume.savedSnapshot!.state;
              setTopic(s.topic);
              setDiff(s.diff);
              setMarks(s.marks ?? {});
              // topic/diff change triggers a reset effect that clears the index;
              // restore the saved index after that reset flushes.
              setTimeout(() => setIndex(s.index), 0);
              resume.hydrate(resume.savedSnapshot);
            }}
            onDismiss={resume.dismiss}
          />
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <label htmlFor="gcp-topic" className="text-muted-foreground">Topic</label>
          <select id="gcp-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="bg-surface-2 border border-border rounded px-2 py-1">
            {TOPICS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <label htmlFor="gcp-level" className="text-muted-foreground ml-2">Level</label>
          <select id="gcp-level" value={diff} onChange={(e) => setDiff(e.target.value as any)} className="bg-surface-2 border border-border rounded px-2 py-1">
            {DIFFS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <span className="ml-auto text-muted-foreground">{total ? `${index + 1} / ${total}` : "no questions"}</span>
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
                <div className="flex gap-2 pt-2">
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
          <div className="text-center text-muted-foreground py-12">No questions match this filter.</div>
        )}
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
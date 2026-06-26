import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Loader2, Play, Lightbulb, Bug, Eye, ArrowRight, Zap, Workflow } from "lucide-react";
import { z } from "zod";

import { useAuth } from "@/hooks/use-auth";
import { runSqlEngine } from "@/lib/sql-engine.functions";
import { getLearningState, logAttempt, initPractice, nextPractice, revealSolution, awardPoints, getProfilePoints } from "@/lib/plan.functions";
import { TOPIC_BY_SLUG, TOPICS, TIER_ORDER, type Tier } from "@/lib/topic-catalog";
import { SchemaPanel } from "@/components/sql/SchemaPanel";
import { QuestionCard } from "@/components/sql/QuestionCard";
import { SqlEditor } from "@/components/sql/SqlEditor";
import { FeedbackPanel, type FeedbackData } from "@/components/sql/FeedbackPanel";
import { PythonModePanel } from "@/components/sql/PythonModePanel";
import { PythonToggle } from "@/components/sql/PythonToggle";
import { AiAssistant } from "@/components/AiAssistant";


const search = z.object({
  concept: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "professional"]).optional(),
});

export const Route = createFileRoute("/topic/$slug")({
  validateSearch: (s) => search.parse(s),
  head: ({ params }) => {
    const topic = TOPIC_BY_SLUG[params.slug];
    const name = topic?.name ?? "Topic";
    const desc = topic?.description ?? "Adaptive MySQL practice on this topic.";
    const url = `https://smartsqlaimentor.lovable.app/topic/${params.slug}`;
    const title = `${name} — SQL practice & mastery`;
    const description = `${desc} Practice ${name} with AI-generated schemas, semantic evaluation, hints, and tier-based mastery progression.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LearningResource",
            name: `${name} — SQL practice`,
            description,
            url,
            learningResourceType: "Interactive practice",
            educationalLevel: "Beginner to Professional",
            inLanguage: "en",
            teaches: name,
          }),
        },
      ],
    };
  },
  component: TopicPage,
});

interface Question {
  question_id: number;
  difficulty: string;
  concept?: string;
  business_context: string;
  task: string;
}
interface Session {
  schema_sql: string;
  seed_data_sql: string;
  erd_mermaid: string;
  tables_description: string;
}

const TOTAL_QUESTIONS = 50;
const ENGINE_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

function difficultyForQuestion(index: number): "beginner" | "intermediate" | "advanced" {
  const stage = Math.floor((index - 1) / 5);
  if (stage <= 1) return "beginner";
  if (stage <= 5) return "intermediate";
  return "advanced";
}

function complexityStage(index: number) {
  return Math.min(10, Math.floor((index - 1) / 5) + 1);
}

function conceptsForEngineDifficulty(difficulty: "beginner" | "intermediate" | "advanced") {
  const tier = difficulty as Tier;
  return TOPICS.flatMap((t) => t.concepts[tier].map((concept) => `${t.slug}:${concept}`));
}

function pickMixedConcept(index: number, covered: string[]) {
  const difficulty = difficultyForQuestion(index);
  const tierPool = conceptsForEngineDifficulty(difficulty);
  const allPool = ENGINE_DIFFICULTIES.flatMap((d) => conceptsForEngineDifficulty(d));
  const remainingTier = tierPool.filter((concept) => !covered.includes(concept));
  if (remainingTier.length) return remainingTier[(index * 7) % remainingTier.length];
  const remainingAny = allPool.filter((concept) => !covered.includes(concept));
  if (remainingAny.length) return remainingAny[(index * 11) % remainingAny.length];
  return tierPool[index % tierPool.length];
}

function conceptLabel(concept: string) {
  const [topicSlug, tag] = concept.includes(":") ? concept.split(":") : ["", concept];
  const topicName = TOPIC_BY_SLUG[topicSlug]?.name;
  return topicName ? `${topicName} / ${tag}` : tag;
}

function TopicPage() {
  const { slug } = Route.useParams();
  const sp = Route.useSearch();
  const topic = TOPIC_BY_SLUG[slug];
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const engine = useServerFn(runSqlEngine);
  const log = useServerFn(logAttempt);
  const initFn = useServerFn(initPractice);
  const nextFn = useServerFn(nextPractice);
  const revealFn = useServerFn(revealSolution);
  const learning = useServerFn(getLearningState);
  const awardFn = useServerFn(awardPoints);
  const pointsFn = useServerFn(getProfilePoints);

  const learningQ = useQuery({
    queryKey: ["learning", user?.id],
    queryFn: () => learning(),
    enabled: !!user,
  });

  const pointsQ = useQuery({
    queryKey: ["points", user?.id],
    queryFn: () => pointsFn(),
    enabled: !!user,
  });

  const [tier, setTier] = useState<Tier>(
    (sp.difficulty as Tier) ?? "beginner",
  );
  const [session, setSession] = useState<Session | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [sessionQuestionId, setSessionQuestionId] = useState<string | null>(null);
  const [pastIds, setPastIds] = useState<number[]>([]);
  const [coveredConcepts, setCoveredConcepts] = useState<string[]>([]);
  const [userSql, setUserSql] = useState("-- Write your SQL here\n");
  const [feedback, setFeedback] = useState<FeedbackData>({ kind: null });
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [history, setHistory] = useState<
    { question: Question; sessionQuestionId: string; userSql: string }[]
  >([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [liveStats, setLiveStats] = useState<{ attempted: number; correct: number } | null>(null);
  const [pythonMode, setPythonMode] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  const storageKey = user ? `practice:progress:${user.id}:${slug}` : "";

  // Detect saved progress for this topic so we can offer Resume.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      setHasSavedProgress(!!raw);
    } catch {}
  }, [storageKey]);

  // Persist progress whenever it changes mid-session.
  useEffect(() => {
    if (!storageKey || !session || !question || !sessionQuestionId) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          questionCount,
          session,
          question,
          sessionQuestionId,
          pastIds,
          coveredConcepts,
          userSql,
          history,
          historyIndex,
          savedAt: Date.now(),
        }),
      );
      setHasSavedProgress(true);
    } catch {}
  }, [storageKey, session, question, sessionQuestionId, questionCount, pastIds, coveredConcepts, userSql, history, historyIndex]);


  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const mastery = learningQ.data?.mastery?.find((m: any) => m.topic_slug === slug);
  const weakConcepts: string[] = (learningQ.data?.weak ?? []).map((w: any) => w.concept);
  const attempted = Math.max(liveStats?.attempted ?? 0, mastery?.questions_attempted ?? 0);
  const correct = Math.max(liveStats?.correct ?? 0, mastery?.questions_correct ?? 0);
  const successPct = attempted ? Math.round((correct / attempted) * 100) : 0;
  const currentTier: Tier = (mastery?.current_tier as Tier) ?? tier;

  const call = useCallback(
    async (command: any, payload: any) => {
      const res: any = await engine({ data: { command, payload } });
      if (res?.error) {
        toast.error(res.error);
        return null;
      }
      return res?.data;
    },
    [engine],
  );

  if (!topic) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
        Unknown topic. <Link to="/" className="ml-2 underline">Back home</Link>
      </div>
    );
  }
  if (authLoading || !user) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  async function handleStart() {
    setLoading("init");
    setFeedback({ kind: null });
    setAttempt(0);
    setQuestionCount(1);
    const firstConcept = sp.concept ? `${slug}:${sp.concept}` : pickMixedConcept(1, []);
    const firstDifficulty = difficultyForQuestion(1);
    const res: any = await initFn({
      data: {
        topic_slug: slug,
        topic_prompt: `Mixed SQL curriculum starting from ${topic.name}. Use one realistic business schema, but questions must cover varied SQL topics and concepts across the 50-question session.`,
        difficulty: firstDifficulty,
        target_concept: `Complexity stage ${complexityStage(1)}/10. Primary concept: ${conceptLabel(firstConcept)}`,
      },
    });
    setLoading(null);
    if (res?.error) { toast.error(res.error); return; }
    const data = res?.data;
    if (!data) return;
    setSession({
      schema_sql: data.schema_sql,
      seed_data_sql: data.seed_data_sql,
      erd_mermaid: data.erd_mermaid,
      tables_description: data.tables_description,
    });
    setQuestion(data.question);
    setSessionQuestionId(data.session_question_id);
    setPastIds([data.question.question_id]);
    setCoveredConcepts(data.question.concept ? [firstConcept, data.question.concept] : [firstConcept]);
    const initialSql = "-- " + data.question.task + "\n\n";
    setUserSql(initialSql);
    setHistory([{ question: data.question, sessionQuestionId: data.session_question_id, userSql: initialSql }]);
    setHistoryIndex(0);
  }

  function handleResume() {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const s = JSON.parse(raw);
      setSession(s.session);
      setQuestion(s.question);
      setSessionQuestionId(s.sessionQuestionId);
      setPastIds(s.pastIds ?? []);
      setCoveredConcepts(s.coveredConcepts ?? []);
      setUserSql(s.userSql ?? "-- Write your SQL here\n");
      setHistory(s.history ?? []);
      setHistoryIndex(s.historyIndex ?? 0);
      setQuestionCount(s.questionCount ?? 1);
      setFeedback({ kind: null });
      setAttempt(0);
      toast.success(`Resumed at question ${s.questionCount} / ${TOTAL_QUESTIONS}`);
    } catch (e) {
      toast.error("Could not resume — starting fresh.");
      handleStart();
    }
  }

  function handleRestart() {
    if (storageKey) {
      try { localStorage.removeItem(storageKey); } catch {}
    }
    setHasSavedProgress(false);
    handleStart();
  }

  async function handleRun() {
    if (!session || !question || !sessionQuestionId) return;
    setLoading("evaluate");
    setAttempt((a) => a + 1);
    let res: any;
    try {
      res = await log({
        data: { session_question_id: sessionQuestionId, user_sql: userSql },
      });
    } catch (e) {
      console.error(e);
      setLoading(null);
      toast.error("Could not evaluate submission.");
      return;
    }
    setLoading(null);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    const evaluation = res?.evaluation;
    if (!evaluation) return;
    setFeedback({ kind: "evaluation", payload: evaluation });
    if (typeof res?.attempted === "number") {
      setLiveStats({ attempted: res.attempted, correct: res.correct ?? 0 });
    }
    if (evaluation.is_correct) toast.success("Correct");
    learningQ.refetch();
  }

  async function handleHint() {
    if (!question) return;
    setLoading("hint");
    const data = await call("GET_HINT", { task: question.task, user_attempt_sql: userSql });
    setLoading(null);
    if (data) setFeedback({ kind: "hint", payload: data });
  }
  async function handleDebug() {
    if (!session || !question) return;
    setLoading("debug");
    const data = await call("DEBUG_QUERY", { schema_sql: session.schema_sql, user_sql: userSql });
    setLoading(null);
    if (data) setFeedback({ kind: "debug", payload: data });
  }
  async function handleReveal() {
    if (!sessionQuestionId) return;
    setLoading("solution");
    const res: any = await revealFn({ data: { session_question_id: sessionQuestionId } });
    setLoading(null);
    if (res?.error) { toast.error(res.error); return; }
    if (res?.data) setFeedback({ kind: "solution", payload: res.data });
  }
  async function handleOptimize() {
    if (!session) return;
    setLoading("optimize");
    const data = await call("OPTIMIZE_QUERY", {
      schema_sql: session.schema_sql,
      user_sql: userSql,
      task: question?.task,
    });
    setLoading(null);
    if (data) setFeedback({ kind: "optimize", payload: data });
  }
  async function handleVisualize() {
    if (!session) return;
    setLoading("visualize");
    const data = await call("VISUALIZE_QUERY", {
      schema_sql: session.schema_sql,
      user_sql: userSql,
    });
    setLoading(null);
    if (data) setFeedback({ kind: "visualize", payload: data });
  }
  async function handleNext() {
    if (!session) return;
    // If we're back in history, just step forward instead of generating new.
    if (historyIndex >= 0 && historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const h = history[nextIdx];
      setHistoryIndex(nextIdx);
      setQuestion(h.question);
      setSessionQuestionId(h.sessionQuestionId);
      setUserSql(h.userSql);
      setQuestionCount(nextIdx + 1);
      setFeedback({ kind: null });
      setAttempt(0);
      return;
    }
    setLoading("next");
    const nextIndex = questionCount + 1;
    if (nextIndex > TOTAL_QUESTIONS) {
      setLoading(null);
      toast.success(`Session complete — you finished all ${TOTAL_QUESTIONS} questions.`);
      return;
    }
    const targetDifficulty = difficultyForQuestion(nextIndex);
    const targetConcept = pickMixedConcept(nextIndex, coveredConcepts);
    const res: any = await nextFn({
      data: {
        topic_slug: slug,
        schema_sql: session.schema_sql,
        seed_data_sql: session.seed_data_sql,
        schema_context: session.tables_description + "\n\n" + session.schema_sql,
        previous_question_ids: pastIds,
        covered_concepts: coveredConcepts,
        weak_concepts: weakConcepts,
        target_difficulty: targetDifficulty,
        target_concept: `Complexity stage ${complexityStage(nextIndex)}/10. Primary concept: ${conceptLabel(targetConcept)}`,
      },
    });
    setLoading(null);
    if (res?.error) { toast.error(res.error); return; }
    const data = res?.data;
    if (!data || !data.question || !data.question.task) {
      toast.error("Could not load next question. Please try again.");
      return;
    }
    setQuestion(data.question);
    setSessionQuestionId(data.session_question_id);
    setQuestionCount(nextIndex);
    setPastIds((ids) => [...ids, data.question.question_id]);
    if (data.question.concept) {
      setCoveredConcepts((cs) =>
        Array.from(new Set([...cs, targetConcept, data.question.concept])),
      );
    } else {
      setCoveredConcepts((cs) => (cs.includes(targetConcept) ? cs : [...cs, targetConcept]));
    }
    setFeedback({ kind: null });
    setAttempt(0);
    const newSql = "-- " + data.question.task + "\n\n";
    setUserSql(newSql);
    setHistory((h) => [
      ...h,
      { question: data.question, sessionQuestionId: data.session_question_id, userSql: newSql },
    ]);
    setHistoryIndex((i) => i + 1);
    toast.success(`Question ${nextIndex} / ${TOTAL_QUESTIONS} · stage ${complexityStage(nextIndex)}/10 · ${targetDifficulty}`);

    // Reward: every 5 questions advanced, award 25 points.
    if (nextIndex > 1 && (nextIndex - 1) % 5 === 0) {
      try {
        const res: any = await awardFn();
        if (res?.data) {
          toast.success(`🎉 +25 points! You're at ${res.data.points} pts.`);
          pointsQ.refetch();
        }
      } catch {}
    }

    // Clear saved progress once the session is complete.
    if (nextIndex >= TOTAL_QUESTIONS && storageKey) {
      try { localStorage.removeItem(storageKey); } catch {}
      setHasSavedProgress(false);
    }
  }

  function handlePrevious() {
    if (historyIndex <= 0) return;
    // Save current edits to history before going back
    setHistory((h) => {
      const copy = h.slice();
      if (copy[historyIndex]) copy[historyIndex] = { ...copy[historyIndex], userSql };
      return copy;
    });
    const prevIdx = historyIndex - 1;
    const h = history[prevIdx];
    setHistoryIndex(prevIdx);
    setQuestion(h.question);
    setSessionQuestionId(h.sessionQuestionId);
    setUserSql(h.userSql);
    setQuestionCount(prevIdx + 1);
    setFeedback({ kind: null });
    setAttempt(0);
  }

  const tierIdx = TIER_ORDER.indexOf(currentTier);
  const masteryPct = Math.min(100, Math.round((attempted / TOTAL_QUESTIONS) * 100));

  return (
    <div className="min-h-screen bg-background">
      <Toaster theme="dark" position="top-right" richColors />

      <header className="border-b border-border bg-surface-2/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Dashboard
          </Link>
          <div className="leading-tight ml-2">
            <h1 className="text-sm font-semibold">{topic.emoji} {topic.name}</h1>
            <p className="text-[11px] text-muted-foreground">{topic.description}</p>
          </div>
          <div className="ml-auto flex items-center gap-3 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-accent">{currentTier}</span>
            {session && (
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary-glow">
                Q {questionCount || 1}/{TOTAL_QUESTIONS}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-400">
              ⭐ {pointsQ.data?.points ?? 0} pts
            </span>
            <span className="text-muted-foreground">{correct}/{attempted} correct ({successPct}%)</span>
          </div>
        </div>
        {/* Mastery bar */}
        <div className="max-w-[1400px] mx-auto px-4 pb-2">
          <div className="h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-glow"
              style={{ width: `${masteryPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
            <span>{attempted}/{TOTAL_QUESTIONS} questions toward mastery</span>
            <span>
              tier {tierIdx + 1}/4 · {currentTier === "professional" ? "max tier" : "≥10 attempts at ≥70% unlocks next"}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 space-y-4">
        <h2 className="sr-only">Practice session</h2>
        {!session && (
          <div className="rounded-lg border border-dashed border-border p-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {hasSavedProgress
                ? "You have an unfinished session on "
                : "Press start to generate a fresh schema and your first question on "}
              <span className="text-foreground">{topic.name}</span>
              {sp.concept && <> — concept <span className="font-mono text-primary-glow">{sp.concept}</span></>}.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {hasSavedProgress && (
                <button
                  onClick={handleResume}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold"
                >
                  Resume where you left off
                </button>
              )}
              <button
                onClick={hasSavedProgress ? handleRestart : handleStart}
                disabled={loading === "init"}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50 ${
                  hasSavedProgress
                    ? "border border-border bg-surface hover:bg-accent"
                    : "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground"
                }`}
              >
                {loading === "init" && <Loader2 className="h-4 w-4 animate-spin" />}
                {hasSavedProgress ? "Start over" : "Start practice"}
              </button>
            </div>
          </div>
        )}

        {session && (
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
            <aside className="lg:sticky lg:top-[100px] lg:h-[calc(100vh-120px)]">
              <SchemaPanel
                schemaSql={session.schema_sql}
                seedSql={session.seed_data_sql}
                erdMermaid={session.erd_mermaid}
                description={session.tables_description}
              />
            </aside>
            <section className="space-y-4 min-w-0">
              <QuestionCard
                question={question}
                attempt={attempt}
                rightSlot={
                  question && sessionQuestionId ? (
                    <PythonToggle active={pythonMode} onToggle={() => setPythonMode((v) => !v)} />
                  ) : null
                }
              />
              {pythonMode && question && sessionQuestionId && session ? (
                <PythonModePanel
                  sessionQuestionId={sessionQuestionId}
                  schema_sql={session.schema_sql}
                  seed_data_sql={session.seed_data_sql}
                  sql_task={question.task}
                />
              ) : (
                <>
                  <SqlEditor value={userSql} onChange={setUserSql} />
                  <div className="flex flex-wrap gap-2 items-center">
                    <Btn primary onClick={handleRun} loading={loading === "evaluate"} icon={<Play className="h-3.5 w-3.5" />}>Run</Btn>
                    <Btn onClick={handleVisualize} loading={loading === "visualize"} icon={<Workflow className="h-3.5 w-3.5" />}>Visualize</Btn>
                    <Btn onClick={handleHint} loading={loading === "hint"} icon={<Lightbulb className="h-3.5 w-3.5" />}>Hint</Btn>
                    <Btn onClick={handleDebug} loading={loading === "debug"} icon={<Bug className="h-3.5 w-3.5" />}>Debug</Btn>
                    <Btn onClick={handleReveal} loading={loading === "solution"} icon={<Eye className="h-3.5 w-3.5" />}>Reveal</Btn>
                    <Btn onClick={handleOptimize} loading={loading === "optimize"} icon={<Zap className="h-3.5 w-3.5" />}>AI Review</Btn>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent text-accent-foreground">
                        Q {questionCount || 1} / {TOTAL_QUESTIONS}
                      </span>
                      <Btn
                        onClick={handlePrevious}
                        icon={<ArrowLeft className="h-3.5 w-3.5" />}
                        disabled={historyIndex <= 0}
                      >
                        Previous
                      </Btn>
                      <Btn onClick={handleNext} loading={loading === "next"} icon={<ArrowRight className="h-3.5 w-3.5" />}>Next question</Btn>
                    </div>
                  </div>
                  <FeedbackPanel feedback={feedback} />
                </>
              )}
            </section>
          </div>
        )}
      </main>

      <AiAssistant
        context={`SQL daily-plan session — topic: ${topic.name} (${topic.description}). MySQL 8, tier: ${currentTier}.`}
        suggestions={[
          `Explain the key concepts of ${topic.name}`,
          "Give me a hint for this question",
          "Review my SQL and suggest improvements",
        ]}
      />
    </div>
  );
}


function Btn({
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


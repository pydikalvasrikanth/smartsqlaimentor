import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast, Toaster } from "sonner";
import { Loader2, Play, Lightbulb, Bug, Eye, ArrowRight, Terminal, Database, LogOut, Calendar, Wrench, Zap, Workflow, ArrowLeft, BookOpen, Target, Sparkles, Square, Trophy, AlertTriangle, Boxes } from "lucide-react";

import { runSqlEngine } from "@/lib/sql-engine.functions";
import {
  getPlanState,
  getLearningState,
  initPractice,
  nextPractice,
  logAttempt,
  revealSolution,
  planFocus,
  analyzeFocus,
} from "@/lib/plan.functions";
import { PlannerModal } from "@/components/PlannerModal";
import { PlanDashboard } from "@/components/PlanDashboard";
import { Toolbar, INTERVIEW_TOPIC } from "@/components/sql/Toolbar";
import { SchemaPanel } from "@/components/sql/SchemaPanel";
import { QuestionCard } from "@/components/sql/QuestionCard";
import { SqlEditor } from "@/components/sql/SqlEditor";
import { FeedbackPanel, type FeedbackData } from "@/components/sql/FeedbackPanel";
import { AiAssistant } from "@/components/AiAssistant";
import { PythonModePanel } from "@/components/sql/PythonModePanel";
import { PythonToggle } from "@/components/sql/PythonToggle";
import { ThemeToggle, useTheme } from "@/hooks/use-theme";
import {
  SQL_TOPICS,
  SQL_TOPIC_BY_SLUG,
  CATEGORY_INFO,
  CATEGORY_ORDER,
  QUESTIONS_PER_TOPIC,
} from "@/lib/sql-topics";
import {
  pickNextInterviewProblem,
  COMPANIES,
  type InterviewProblem,
} from "@/lib/interview-bank";
import {
  DE_LEVELS,
  DE_CATEGORIES,
  DE_LEVEL_BY_NUMBER,
  pickDeConcept,
  buildDePrompt,
} from "@/lib/data-engineering";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "SQL Intelligence Engine — Practice with an AI mentor" },
      {
        name: "description",
        content:
          "Interactive SQL practice with an AI Senior Data Engineer: generated schemas, ERDs, semantic query evaluation, hints, and debugging.",
      },
      { property: "og:title", content: "SQL Intelligence Engine" },
      {
        property: "og:description",
        content: "Practice MySQL with realistic schemas and AI mentor feedback.",
      },
      { property: "og:url", content: "https://smartsqlaimentor.lovable.app/practice" },
    ],
    links: [
      { rel: "canonical", href: "https://smartsqlaimentor.lovable.app/practice" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: "SQL Intelligence Engine — Practice",
          description: "Interactive MySQL practice with AI-generated schemas, ERDs, semantic evaluation, hints, and debugging.",
          url: "https://smartsqlaimentor.lovable.app/practice",
          learningResourceType: "Interactive practice",
          educationalLevel: "Beginner to Advanced",
          teaches: "MySQL, joins, window functions, query optimization",
        }),
      },
    ],
  }),
  component: Workspace,
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
  topic: string;
  difficulty: string;
}

const CONCEPTS_BY_DIFFICULTY: Record<string, string[]> = {
  beginner: [
    "select-where", "order-limit", "distinct", "basic-aggregates", "group-by",
    "having", "inner-join", "left-join", "string-functions", "date-functions",
    "case-expression", "null-handling", "in-operator", "between-like", "union",
  ],
  intermediate: [
    "multi-join", "self-join", "subquery", "correlated-subquery", "exists",
    "group-concat", "rollup", "cte", "window-row-number", "window-rank",
    "window-sum-over", "lag-lead", "pivot-with-case", "regexp", "date-arithmetic",
  ],
  advanced: [
    "recursive-cte", "ntile", "running-total", "moving-average", "gap-and-island",
    "median-percentile", "second-highest-per-group", "json-extract", "explain-tuning",
    "index-strategy", "transactions", "triggers-views", "anti-join", "set-difference",
    "complex-pivot",
  ],
};

function pickConcept(difficulty: string, covered: string[]): string {
  const pool = CONCEPTS_BY_DIFFICULTY[difficulty] || CONCEPTS_BY_DIFFICULTY.beginner;
  const remaining = pool.filter((c) => !covered.includes(c));
  const arr = remaining.length ? remaining : pool;
  return arr[Math.floor(Math.random() * arr.length)];
}

// 50-question curriculum: difficulty ramps every 5 questions, concepts rotate across topics.
const TOTAL_QUESTIONS = 50;
function difficultyForIndex(i: number): string {
  // i = 1..50. Stages of 5 each → 10 stages mapped to beginner/intermediate/advanced.
  const stage = Math.floor((i - 1) / 5); // 0..9
  if (stage <= 1) return "beginner";       // Q 1-10
  if (stage <= 5) return "intermediate";    // Q 11-30
  return "advanced";                        // Q 31-50
}
function pickMixedConcept(i: number, covered: string[]): string {
  // Always offer concepts from the current tier, but rotate across the WHOLE pool for variety.
  const tier = difficultyForIndex(i);
  const tierPool = CONCEPTS_BY_DIFFICULTY[tier];
  // First try uncovered in tier, then any uncovered across all tiers, then random.
  const allConcepts = [
    ...CONCEPTS_BY_DIFFICULTY.beginner,
    ...CONCEPTS_BY_DIFFICULTY.intermediate,
    ...CONCEPTS_BY_DIFFICULTY.advanced,
  ];
  const uncoveredTier = tierPool.filter((c) => !covered.includes(c));
  if (uncoveredTier.length) return uncoveredTier[(i * 7) % uncoveredTier.length];
  const uncoveredAny = allConcepts.filter((c) => !covered.includes(c));
  if (uncoveredAny.length) return uncoveredAny[(i * 11) % uncoveredAny.length];
  return tierPool[Math.floor(Math.random() * tierPool.length)];
}

type Loading =
  | null
  | "init"
  | "evaluate"
  | "hint"
  | "debug"
  | "solution"
  | "next"
  | "optimize"
  | "visualize"
  | "plan"
  | "analyze";

interface FocusPlan {
  focus_title: string;
  difficulty: string;
  concepts: string[];
  domain_prompt: string;
  intro: string;
}

function Workspace() {
  const engine = useServerFn(runSqlEngine);
  const planFn = useServerFn(getPlanState);
  const learningFn = useServerFn(getLearningState);
  const initFn = useServerFn(initPractice);
  const nextFn = useServerFn(nextPractice);
  const logFn = useServerFn(logAttempt);
  const revealFn = useServerFn(revealSolution);
  const planFocusFn = useServerFn(planFocus);
  const analyzeFocusFn = useServerFn(analyzeFocus);
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const planQ = useQuery({
    queryKey: ["plan-state", user?.id],
    queryFn: () => planFn(),
    enabled: !!user,
  });
  const learnQ = useQuery({
    queryKey: ["learning", user?.id],
    queryFn: () => learningFn(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);
  const [tab, setTab] = useState<"today" | "free" | "topics" | "targeted" | "data-eng">("today");
  const [showPlanner, setShowPlanner] = useState(false);
  const [topic, setTopic] = useState("E-commerce orders");
  const [difficulty, setDifficulty] = useState("beginner");
  const [company, setCompany] = useState<string>("Any");

  // Topic-wise practice state
  const [topicSlug, setTopicSlug] = useState<string | null>(null);
  const [topicQ, setTopicQ] = useState(0); // 1..QUESTIONS_PER_TOPIC within current topic

  // Targeted (goal-driven) practice state
  const [focusGoal, setFocusGoal] = useState("");
  const [focusPlan, setFocusPlan] = useState<FocusPlan | null>(null);
  const [focusSlug, setFocusSlug] = useState<string | null>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  const [focusCount, setFocusCount] = useState(0);
  const [focusAnalysis, setFocusAnalysis] = useState<any | null>(null);

  // Data Engineering practice state
  const [deLevel, setDeLevel] = useState(1);
  const [deCategory, setDeCategory] = useState("mix");
  const [deConceptIdx, setDeConceptIdx] = useState(0);
  const [deCount, setDeCount] = useState(0);
  const [deActive, setDeActive] = useState(false);

  const [session, setSession] = useState<Session | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [sessionQuestionId, setSessionQuestionId] = useState<string | null>(null);
  const [pastIds, setPastIds] = useState<number[]>([]);
  const [coveredConcepts, setCoveredConcepts] = useState<string[]>([]);
  const [askedInterviewIds, setAskedInterviewIds] = useState<number[]>([]);

  const [userSql, setUserSql] = useState("-- Write your SQL here\n");
  const [attempt, setAttempt] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackData>({ kind: null });
  const [loading, setLoading] = useState<Loading>(null);
  const [questionCount, setQuestionCount] = useState(0); // 1..50 over the session
  const [pythonMode, setPythonMode] = useState(false);

  const isInterviewMode = topic === INTERVIEW_TOPIC;

  const call = useCallback(
    async (command: any, payload: any) => {
      try {
        const res: any = await engine({ data: { command, payload } });
        if (res?.error) {
          toast.error(res.error);
          return null;
        }
        return res?.data;
      } catch (e: any) {
        console.error("SQL engine call failed", e);
        toast.error(e?.message ?? "Network error — please try again.");
        return null;
      }
    },
    [engine],
  );

  function buildInterviewTopic(p: InterviewProblem): { topic: string; concept: string } {
    const companyList = p.companies.join(", ");
    return {
      topic: `Interview Preparation — "${p.title}" (asked at ${companyList}). Build a realistic schema that fits this exact problem; the question MUST be the canonical FAANG-style version of "${p.title}".`,
      concept: p.concept,
    };
  }

  async function handleStart() {
    setLoading("init");
    setFeedback({ kind: null });
    setAttempt(0);
    setQuestionCount(1);

    let payloadTopic = topic;
    let payloadDifficulty = difficulty;
    let target_concept = isInterviewMode
      ? pickConcept(difficulty, [])
      : pickMixedConcept(1, []);
    let problem: InterviewProblem | null = null;

    if (isInterviewMode) {
      problem = pickNextInterviewProblem({
        askedIds: [],
        difficulty,
        company: company === "Any" ? null : company,
      });
      const built = buildInterviewTopic(problem);
      payloadTopic = built.topic;
      target_concept = built.concept;
      payloadDifficulty = problem.difficulty;
    } else {
      payloadDifficulty = difficultyForIndex(1);
    }

    const topicSlug = isInterviewMode ? "interview" : "free-practice";
    let res: any;
    try {
      res = await initFn({
        data: {
          topic_slug: topicSlug,
          topic_prompt: payloadTopic,
          difficulty: payloadDifficulty as any,
          target_concept,
        },
      });
    } catch (e: any) {
      console.error(e);
      setLoading(null);
      toast.error(e?.message ?? "Could not start session.");
      return;
    }
    setLoading(null);
    if (res?.error) { toast.error(res.error); return; }
    const data = res?.data;
    if (!data) return;
    setSession({
      schema_sql: data.schema_sql,
      seed_data_sql: data.seed_data_sql,
      erd_mermaid: data.erd_mermaid,
      tables_description: data.tables_description,
      topic: isInterviewMode ? `Interview: ${problem!.title}` : topic,
      difficulty: payloadDifficulty,
    });
    setQuestion(data.question);
    setSessionQuestionId(data.session_question_id);
    setPastIds([data.question.question_id]);
    setCoveredConcepts(data.question.concept ? [data.question.concept] : []);
    setAskedInterviewIds(problem ? [problem.id] : []);
    setUserSql("-- " + data.question.task + "\n\n");
    toast.success(isInterviewMode ? `Loaded: ${problem!.title}` : `Question 1 / ${TOTAL_QUESTIONS}`);
  }

  function handleReset() {
    setSession(null);
    setQuestion(null);
    setSessionQuestionId(null);
    setPastIds([]);
    setCoveredConcepts([]);
    setAskedInterviewIds([]);
    setFeedback({ kind: null });
    setAttempt(0);
    setQuestionCount(0);
    setUserSql("-- Write your SQL here\n");
  }

  async function handleRun() {
    if (!session || !question || !sessionQuestionId) return;
    setLoading("evaluate");
    setAttempt((a) => a + 1);
    let res: any;
    try {
      res = await logFn({ data: { session_question_id: sessionQuestionId, user_sql: userSql } });
    } catch (e: any) {
      console.error(e);
      setLoading(null);
      toast.error(e?.message ?? "Could not evaluate submission.");
      return;
    }
    setLoading(null);
    if (res?.error) { toast.error(res.error); return; }
    const evaluation = res?.evaluation;
    if (!evaluation) return;
    setFeedback({ kind: "evaluation", payload: evaluation });
    if (evaluation.is_correct) toast.success("Nice — query is correct");
  }

  async function handleHint() {
    if (!question) return;
    setLoading("hint");
    const data = await call("GET_HINT", {
      task: question.task,
      user_attempt_sql: userSql,
    });
    setLoading(null);
    if (data) setFeedback({ kind: "hint", payload: data });
  }

  async function handleDebug() {
    if (!session || !question) return;
    setLoading("debug");
    const data = await call("DEBUG_QUERY", {
      schema_sql: session.schema_sql,
      user_sql: userSql,
    });
    setLoading(null);
    if (data) setFeedback({ kind: "debug", payload: data });
  }

  async function handleReveal() {
    if (!sessionQuestionId) return;
    setLoading("solution");
    let res: any;
    try {
      res = await revealFn({ data: { session_question_id: sessionQuestionId } });
    } catch (e: any) {
      console.error(e);
      setLoading(null);
      toast.error(e?.message ?? "Could not reveal solution.");
      return;
    }
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
    setLoading("next");

    if (isInterviewMode) {
      const problem = pickNextInterviewProblem({
        askedIds: askedInterviewIds,
        difficulty,
        company: company === "Any" ? null : company,
      });
      const built = buildInterviewTopic(problem);
      let res: any;
      try {
        res = await initFn({
          data: {
            topic_slug: "interview",
            topic_prompt: built.topic,
            difficulty: problem.difficulty as any,
            target_concept: built.concept,
          },
        });
      } catch (e: any) {
        console.error(e);
        setLoading(null);
        toast.error(e?.message ?? "Could not load next interview question.");
        return;
      }
      setLoading(null);
      if (res?.error) { toast.error(res.error); return; }
      const data = res?.data;
      if (!data) return;
      setSession({
        schema_sql: data.schema_sql,
        seed_data_sql: data.seed_data_sql,
        erd_mermaid: data.erd_mermaid,
        tables_description: data.tables_description,
        topic: `Interview: ${problem.title}`,
        difficulty: problem.difficulty,
      });
      setQuestion(data.question);
      setSessionQuestionId(data.session_question_id);
      setPastIds((ids) => [...ids, data.question.question_id]);
      setAskedInterviewIds((ids) => [...ids, problem.id]);
      if (data.question.concept) {
        setCoveredConcepts((cs) =>
          cs.includes(data.question.concept) ? cs : [...cs, data.question.concept],
        );
      }
      setFeedback({ kind: null });
      setAttempt(0);
      setUserSql("-- " + data.question.task + "\n\n");
      toast.success(`Loaded: ${problem.title}`);
      return;
    }

    // Cap free-practice sessions at 50 questions and ramp difficulty every 5.
    const nextIndex = questionCount + 1;
    if (nextIndex > TOTAL_QUESTIONS) {
      setLoading(null);
      toast.success(`Session complete — you finished all ${TOTAL_QUESTIONS} questions. Reset to start over.`);
      return;
    }
    const target_difficulty = difficultyForIndex(nextIndex);
    const target_concept = pickMixedConcept(nextIndex, coveredConcepts);
    let res: any;
    try {
      res = await nextFn({
        data: {
          topic_slug: "free-practice",
          schema_sql: session.schema_sql,
          seed_data_sql: session.seed_data_sql,
          schema_context: session.tables_description + "\n\n" + session.schema_sql,
          previous_question_ids: pastIds,
          covered_concepts: coveredConcepts,
          weak_concepts: [],
          target_difficulty: target_difficulty as any,
          target_concept,
        },
      });
    } catch (e: any) {
      console.error(e);
      setLoading(null);
      toast.error(e?.message ?? "Could not load next question.");
      return;
    }
    setLoading(null);
    if (res?.error) { toast.error(res.error); return; }
    const data = res?.data;
    if (!data) return;
    setQuestion(data.question);
    setSessionQuestionId(data.session_question_id);
    setQuestionCount(nextIndex);
    setPastIds((ids) => [...ids, data.question.question_id]);
    if (data.question.concept) {
      setCoveredConcepts((cs) =>
        cs.includes(data.question.concept) ? cs : [...cs, data.question.concept],
      );
    }
    setFeedback({ kind: null });
    setAttempt(0);
    setUserSql("-- " + data.question.task + "\n\n");
    if (nextIndex % 5 === 1 && nextIndex > 1) {
      toast.success(`Difficulty up → ${target_difficulty} (Q ${nextIndex}/${TOTAL_QUESTIONS})`);
    } else {
      toast.success(`Question ${nextIndex} / ${TOTAL_QUESTIONS}`);
    }
  }

  // ---- Topic-wise practice (DDL / DML / DCL / TCL / DQL) --------------------
  async function startTopic(slug: string) {
    const t = SQL_TOPIC_BY_SLUG[slug];
    if (!t) return;
    setLoading("init");
    setFeedback({ kind: null });
    setAttempt(0);
    setTopicSlug(slug);
    setTopicQ(1);
    let res: any;
    try {
      res = await initFn({
        data: {
          topic_slug: `topic-${t.slug}`,
          topic_prompt: t.prompt,
          difficulty: t.difficulty as any,
          target_concept: t.concept,
        },
      });
    } catch (e: any) {
      console.error(e);
      setLoading(null);
      toast.error(e?.message ?? "Could not start topic session.");
      return;
    }
    setLoading(null);
    if (res?.error) { toast.error(res.error); return; }
    const data = res?.data;
    if (!data) return;
    setSession({
      schema_sql: data.schema_sql,
      seed_data_sql: data.seed_data_sql,
      erd_mermaid: data.erd_mermaid,
      tables_description: data.tables_description,
      topic: t.name,
      difficulty: t.difficulty,
    });
    setQuestion(data.question);
    setSessionQuestionId(data.session_question_id);
    setPastIds([data.question.question_id]);
    setCoveredConcepts(data.question.concept ? [data.question.concept] : []);
    setUserSql("-- " + data.question.task + "\n\n");
    toast.success(`${t.name} — Question 1 / ${QUESTIONS_PER_TOPIC}`);
  }

  async function handleTopicNext() {
    if (!session || !topicSlug) return;
    const t = SQL_TOPIC_BY_SLUG[topicSlug];
    const nextWithin = topicQ + 1;

    // Finished 25 questions → auto-switch to the next topic.
    if (nextWithin > QUESTIONS_PER_TOPIC) {
      const idx = SQL_TOPICS.findIndex((x) => x.slug === topicSlug);
      const nextTopic = SQL_TOPICS[idx + 1];
      if (!nextTopic) {
        toast.success("🎉 You've completed every topic. Pick any topic to revise.");
        return;
      }
      toast.success(`Topic complete → switching to ${nextTopic.name}`);
      await startTopic(nextTopic.slug);
      return;
    }

    setLoading("next");
    let res: any;
    try {
      res = await nextFn({
        data: {
          topic_slug: `topic-${t.slug}`,
          schema_sql: session.schema_sql,
          seed_data_sql: session.seed_data_sql,
          schema_context: session.tables_description + "\n\n" + session.schema_sql,
          previous_question_ids: pastIds,
          covered_concepts: coveredConcepts,
          weak_concepts: [],
          target_difficulty: t.difficulty as any,
          target_concept: t.concept,
        },
      });
    } catch (e: any) {
      console.error(e);
      setLoading(null);
      toast.error(e?.message ?? "Could not load next question.");
      return;
    }
    setLoading(null);
    if (res?.error) { toast.error(res.error); return; }
    const data = res?.data;
    if (!data) return;
    setQuestion(data.question);
    setSessionQuestionId(data.session_question_id);
    setTopicQ(nextWithin);
    setPastIds((ids) => [...ids, data.question.question_id]);
    if (data.question.concept) {
      setCoveredConcepts((cs) => (cs.includes(data.question.concept) ? cs : [...cs, data.question.concept]));
    }
    setFeedback({ kind: null });
    setAttempt(0);
    setUserSql("-- " + data.question.task + "\n\n");
    toast.success(`${t.name} — Question ${nextWithin} / ${QUESTIONS_PER_TOPIC}`);
  }

  function handleTopicReset() {
    setTopicSlug(null);
    setTopicQ(0);
    setSession(null);
    setQuestion(null);
    setSessionQuestionId(null);
    setPastIds([]);
    setCoveredConcepts([]);
    setFeedback({ kind: null });
    setAttempt(0);
    setUserSql("-- Write your SQL here\n");
  }

  // ---- Targeted (goal-driven) practice -------------------------------------
  async function handleFocusStart() {
    const goal = focusGoal.trim();
    if (goal.length < 2) {
      toast.error("Tell me what you'd like to practice, e.g. \"test my basic commands\".");
      return;
    }
    setLoading("plan");
    setFocusAnalysis(null);
    setFeedback({ kind: null });
    setAttempt(0);

    let planRes: any;
    try {
      planRes = await planFocusFn({ data: { goal } });
    } catch (e: any) {
      console.error(e);
      setLoading(null);
      toast.error(e?.message ?? "Could not build a plan.");
      return;
    }
    if (planRes?.error) { setLoading(null); toast.error(planRes.error); return; }
    const plan: FocusPlan | undefined = planRes?.data;
    if (!plan?.concepts?.length) { setLoading(null); toast.error("Couldn't build a plan from that goal."); return; }

    const slug = `focus-${Date.now()}`;
    setLoading("init");
    let res: any;
    try {
      res = await initFn({
        data: {
          topic_slug: slug,
          topic_prompt: plan.domain_prompt,
          difficulty: plan.difficulty as any,
          target_concept: plan.concepts[0],
        },
      });
    } catch (e: any) {
      console.error(e);
      setLoading(null);
      toast.error(e?.message ?? "Could not start session.");
      return;
    }
    setLoading(null);
    if (res?.error) { toast.error(res.error); return; }
    const data = res?.data;
    if (!data) return;
    setFocusPlan(plan);
    setFocusSlug(slug);
    setFocusIdx(0);
    setFocusCount(1);
    setSession({
      schema_sql: data.schema_sql,
      seed_data_sql: data.seed_data_sql,
      erd_mermaid: data.erd_mermaid,
      tables_description: data.tables_description,
      topic: plan.focus_title,
      difficulty: plan.difficulty,
    });
    setQuestion(data.question);
    setSessionQuestionId(data.session_question_id);
    setPastIds([data.question.question_id]);
    setCoveredConcepts(data.question.concept ? [data.question.concept] : []);
    setUserSql("-- " + data.question.task + "\n\n");
    toast.success(plan.intro || `${plan.focus_title} — let's go!`);
  }

  async function handleFocusNext() {
    if (!session || !focusPlan || !focusSlug) return;
    const nextIdx = (focusIdx + 1) % focusPlan.concepts.length;
    const concept = focusPlan.concepts[nextIdx];
    setLoading("next");
    let res: any;
    try {
      res = await nextFn({
        data: {
          topic_slug: focusSlug,
          schema_sql: session.schema_sql,
          seed_data_sql: session.seed_data_sql,
          schema_context: session.tables_description + "\n\n" + session.schema_sql,
          previous_question_ids: pastIds,
          covered_concepts: coveredConcepts,
          weak_concepts: [],
          target_difficulty: focusPlan.difficulty as any,
          target_concept: concept,
        },
      });
    } catch (e: any) {
      console.error(e);
      setLoading(null);
      toast.error(e?.message ?? "Could not load next question.");
      return;
    }
    setLoading(null);
    if (res?.error) { toast.error(res.error); return; }
    const data = res?.data;
    if (!data) return;
    setQuestion(data.question);
    setSessionQuestionId(data.session_question_id);
    setFocusIdx(nextIdx);
    setFocusCount((c) => c + 1);
    setPastIds((ids) => [...ids, data.question.question_id]);
    if (data.question.concept) {
      setCoveredConcepts((cs) => (cs.includes(data.question.concept) ? cs : [...cs, data.question.concept]));
    }
    setFeedback({ kind: null });
    setAttempt(0);
    setUserSql("-- " + data.question.task + "\n\n");
    if (nextIdx === 0) {
      toast.success("You've covered every area — keep going or hit End to see your analysis.");
    } else {
      toast.success(`Focus: ${concept}`);
    }
  }

  async function handleEndFocus() {
    if (!focusSlug || !focusPlan) return;
    setLoading("analyze");
    let res: any;
    try {
      res = await analyzeFocusFn({ data: { topic_slug: focusSlug, goal: focusGoal.trim() || focusPlan.focus_title } });
    } catch (e: any) {
      console.error(e);
      setLoading(null);
      toast.error(e?.message ?? "Could not analyze your session.");
      return;
    }
    setLoading(null);
    if (res?.error) { toast.error(res.error); return; }
    if (res?.data) setFocusAnalysis(res.data);
  }

  function handleFocusReset() {
    setFocusPlan(null);
    setFocusSlug(null);
    setFocusIdx(0);
    setFocusCount(0);
    setFocusAnalysis(null);
    setSession(null);
    setQuestion(null);
    setSessionQuestionId(null);
    setPastIds([]);
    setCoveredConcepts([]);
    setFeedback({ kind: null });
    setAttempt(0);
    setUserSql("-- Write your SQL here\n");
  }

  // ---- Data Engineering practice (level-based, production scenarios) ---------
  async function handleDeStart(level: number) {
    const lvl = DE_LEVEL_BY_NUMBER[level] ?? DE_LEVELS[0];
    setLoading("init");
    setFeedback({ kind: null });
    setAttempt(0);
    setDeLevel(level);
    setDeConceptIdx(0);
    setDeCount(1);
    const concept = pickDeConcept(level, [], 0);
    let res: any;
    try {
      res = await initFn({
        data: {
          topic_slug: `data-eng-l${level}`,
          topic_prompt: buildDePrompt(level, deCategory),
          difficulty: lvl.difficulty as any,
          target_concept: concept,
        },
      });
    } catch (e: any) {
      console.error(e);
      setLoading(null);
      toast.error(e?.message ?? "Could not start Data Engineering session.");
      return;
    }
    setLoading(null);
    if (res?.error) { toast.error(res.error); return; }
    const data = res?.data;
    if (!data) return;
    setDeActive(true);
    setSession({
      schema_sql: data.schema_sql,
      seed_data_sql: data.seed_data_sql,
      erd_mermaid: data.erd_mermaid,
      tables_description: data.tables_description,
      topic: `DE · L${level} ${lvl.name}`,
      difficulty: lvl.difficulty,
    });
    setQuestion(data.question);
    setSessionQuestionId(data.session_question_id);
    setPastIds([data.question.question_id]);
    setCoveredConcepts(data.question.concept ? [data.question.concept] : []);
    setUserSql("-- " + data.question.task + "\n\n");
    toast.success(`Level ${level} · ${lvl.name} — Exercise 1`);
  }

  async function handleDeNext() {
    if (!session) return;
    const lvl = DE_LEVEL_BY_NUMBER[deLevel] ?? DE_LEVELS[0];
    const nextWithin = deConceptIdx + 1;

    // Finished a level's concepts → auto-advance to the next level (with a fresh schema).
    if (nextWithin >= lvl.concepts.length) {
      const nextLevel = DE_LEVEL_BY_NUMBER[deLevel + 1];
      if (!nextLevel) {
        toast.success("🎉 You've completed all 5 Data Engineering levels. Pick any level to revise.");
        return;
      }
      toast.success(`Level ${deLevel} complete → promoting to Level ${nextLevel.level} · ${nextLevel.name}`);
      await handleDeStart(nextLevel.level);
      return;
    }

    const concept = pickDeConcept(deLevel, coveredConcepts, nextWithin);
    setLoading("next");
    let res: any;
    try {
      res = await nextFn({
        data: {
          topic_slug: `data-eng-l${deLevel}`,
          schema_sql: session.schema_sql,
          seed_data_sql: session.seed_data_sql,
          schema_context:
            buildDePrompt(deLevel, deCategory) +
            "\n\n" +
            session.tables_description +
            "\n\n" +
            session.schema_sql,
          previous_question_ids: pastIds,
          covered_concepts: coveredConcepts,
          weak_concepts: [],
          target_difficulty: lvl.difficulty as any,
          target_concept: concept,
        },
      });
    } catch (e: any) {
      console.error(e);
      setLoading(null);
      toast.error(e?.message ?? "Could not load next exercise.");
      return;
    }
    setLoading(null);
    if (res?.error) { toast.error(res.error); return; }
    const data = res?.data;
    if (!data) return;
    setQuestion(data.question);
    setSessionQuestionId(data.session_question_id);
    setDeConceptIdx(nextWithin);
    setDeCount((c) => c + 1);
    setPastIds((ids) => [...ids, data.question.question_id]);
    if (data.question.concept) {
      setCoveredConcepts((cs) => (cs.includes(data.question.concept) ? cs : [...cs, data.question.concept]));
    }
    setFeedback({ kind: null });
    setAttempt(0);
    setUserSql("-- " + data.question.task + "\n\n");
    toast.success(`Focus: ${concept}`);
  }

  function handleDeReset() {
    setDeActive(false);
    setDeConceptIdx(0);
    setDeCount(0);
    setSession(null);
    setQuestion(null);
    setSessionQuestionId(null);
    setPastIds([]);
    setCoveredConcepts([]);
    setFeedback({ kind: null });
    setAttempt(0);
    setUserSql("-- Write your SQL here\n");
  }

  const pool = CONCEPTS_BY_DIFFICULTY[difficulty] || [];



  const coverageInLevel = pool.filter((c) => coveredConcepts.includes(c)).length;

  if (authLoading || !user) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster theme={theme} position="top-right" richColors />

      <header className="border-b border-border bg-surface-2/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground" aria-label="Back to subjects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Terminal className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight">SQL Intelligence Engine</h1>
            <p className="text-[11px] text-muted-foreground font-mono">
              senior data engineer · in your browser
            </p>
          </div>
          {session ? (
            <div className="ml-auto flex items-center gap-2 text-[11px] font-mono">
              <span className="text-muted-foreground">{difficulty} coverage</span>
              <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground">
                {coverageInLevel}/{pool.length}
              </span>
              {question?.concept && (
                <span className="px-2 py-0.5 rounded border border-border text-primary-glow">
                  {question.concept}
                </span>
              )}
              <Link to="/tutorial" className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border hover:bg-accent">
                <BookOpen className="h-3 w-3" /> Tutorial
              </Link>
              <Link to="/engine" className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border hover:bg-accent">
                <Database className="h-3 w-3" /> Intelligence Engine
              </Link>
              <ThemeToggle />
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border hover:bg-accent"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              <Link to="/tutorial" className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border border-border hover:bg-accent">
                <BookOpen className="h-3 w-3" /> Tutorial
              </Link>
              <Link to="/engine" className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border border-border hover:bg-accent">
                <Database className="h-3 w-3" /> Intelligence Engine
              </Link>
              <ThemeToggle />
              <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border border-border hover:bg-accent"
              >
                <LogOut className="h-3 w-3" /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {showPlanner && <PlannerModal onCreated={() => { setShowPlanner(false); planQ.refetch(); }} />}

      <main className="max-w-[1400px] mx-auto p-4 space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          <TabBtn active={tab === "today"} onClick={() => setTab("today")} icon={<Calendar className="h-3.5 w-3.5" />}>
            Today
          </TabBtn>
          <TabBtn active={tab === "free"} onClick={() => setTab("free")} icon={<Wrench className="h-3.5 w-3.5" />}>
            Free practice
          </TabBtn>
          <TabBtn active={tab === "topics"} onClick={() => setTab("topics")} icon={<BookOpen className="h-3.5 w-3.5" />}>
            Topic-wise
          </TabBtn>
          <TabBtn active={tab === "targeted"} onClick={() => setTab("targeted")} icon={<Target className="h-3.5 w-3.5" />}>
            Targeted
          </TabBtn>
          <TabBtn active={tab === "data-eng"} onClick={() => setTab("data-eng")} icon={<Boxes className="h-3.5 w-3.5" />}>
            Data Engineering
          </TabBtn>
        </div>

        {tab === "today" && (
          planQ.isLoading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading your plan…</div>
          ) : planQ.data?.plan ? (
            <PlanDashboard
              plan={planQ.data.plan}
              days={planQ.data.days}
              today={planQ.data.today}
              dayNumber={planQ.data.day_number ?? null}
              weak={learnQ.data?.weak ?? []}
              onReplan={() => setShowPlanner(true)}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border p-10 text-center space-y-3">
              <h2 className="text-lg font-semibold">No active practice plan</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Build a personalized day-wise curriculum across all SQL topics, ramping to your target proficiency.
              </p>
              <button
                onClick={() => setShowPlanner(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold"
              >
                Build my plan
              </button>
            </div>
          )
        )}

        {tab === "free" && (
        <>
        <Toolbar
          topic={topic}
          onTopic={setTopic}
          difficulty={difficulty}
          onDifficulty={setDifficulty}
          onStart={handleStart}
          onReset={handleReset}
          hasSession={!!session}
          loading={loading === "init"}
          showCompany={isInterviewMode}
          company={company}
          onCompany={setCompany}
          companies={["Any", ...COMPANIES]}
        />
        {isInterviewMode && (
          <div className="text-[11px] font-mono text-muted-foreground -mt-2 px-1">
            Interview mode: cycling through {120}+ canonical FAANG SQL questions
            (Meta, Google, Amazon, Microsoft, Netflix, Uber, Stripe, Bloomberg…). Press{" "}
            <span className="text-foreground">Next question</span> after each to draw a new one.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
          <aside className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-92px)]">
            <SchemaPanel
              schemaSql={session?.schema_sql || ""}
              seedSql={session?.seed_data_sql || ""}
              erdMermaid={session?.erd_mermaid || ""}
              description={session?.tables_description || ""}
            />
          </aside>

          <section className="space-y-4 min-w-0">
            <QuestionCard
              question={question}
              attempt={attempt}
              rightSlot={session && question && sessionQuestionId ? (
                <PythonToggle active={pythonMode} onToggle={() => setPythonMode(v => !v)} />
              ) : null}
            />

            {session && question && (
              <>
                {pythonMode && sessionQuestionId ? (
                  <PythonModePanel
                    sessionQuestionId={sessionQuestionId}
                    schema_sql={session.schema_sql}
                    seed_data_sql={session.seed_data_sql}
                    sql_task={question.task}
                  />
                ) : (<>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      MySQL editor
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      cmd+enter to run
                    </span>
                  </div>
                  <SqlEditor value={userSql} onChange={setUserSql} />
                  <ActionBar
                    loading={loading}
                    onRun={handleRun}
                    onHint={handleHint}
                    onDebug={handleDebug}
                    onReveal={handleReveal}
                    onOptimize={handleOptimize}
                    onVisualize={handleVisualize}
                    onNext={handleNext}
                    questionCount={questionCount}
                  />

                </div>

                <FeedbackPanel feedback={feedback} />
                </>)}
              </>
            )}

            {!session && (
              <div className="rounded-lg border border-dashed border-border p-10 text-center">
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Choose a topic and difficulty above, then press{" "}
                  <span className="text-foreground font-semibold">Start session</span>. Your
                  AI mentor will generate a realistic schema, seed data, and your first
                  challenge.
                </p>
              </div>
            )}
          </section>
        </div>
        </>
        )}

        {tab === "topics" && (
          <TopicWise
            activeSlug={topicSlug}
            topicQ={topicQ}
            loading={loading}
            session={session}
            question={question}
            attempt={attempt}
            userSql={userSql}
            feedback={feedback}
            sessionQuestionId={sessionQuestionId}
            pythonMode={pythonMode}
            setPythonMode={setPythonMode}
            onPickTopic={startTopic}
            onSetSql={setUserSql}
            onRun={handleRun}
            onHint={handleHint}
            onDebug={handleDebug}
            onReveal={handleReveal}
            onOptimize={handleOptimize}
            onVisualize={handleVisualize}
            onNext={handleTopicNext}
            onReset={handleTopicReset}
          />
        )}

        {tab === "targeted" && (
          <FocusPractice
            goal={focusGoal}
            onGoal={setFocusGoal}
            plan={focusPlan}
            focusIdx={focusIdx}
            focusCount={focusCount}
            analysis={focusAnalysis}
            loading={loading}
            session={session}
            question={question}
            attempt={attempt}
            userSql={userSql}
            feedback={feedback}
            sessionQuestionId={sessionQuestionId}
            pythonMode={pythonMode}
            setPythonMode={setPythonMode}
            onStart={handleFocusStart}
            onSetSql={setUserSql}
            onRun={handleRun}
            onHint={handleHint}
            onDebug={handleDebug}
            onReveal={handleReveal}
            onOptimize={handleOptimize}
            onVisualize={handleVisualize}
            onNext={handleFocusNext}
            onEnd={handleEndFocus}
            onReset={handleFocusReset}
          />
        )}

        {tab === "data-eng" && (
          <DataEngineering
            level={deLevel}
            category={deCategory}
            conceptIdx={deConceptIdx}
            count={deCount}
            active={deActive}
            loading={loading}
            session={session}
            question={question}
            attempt={attempt}
            userSql={userSql}
            feedback={feedback}
            sessionQuestionId={sessionQuestionId}
            pythonMode={pythonMode}
            setPythonMode={setPythonMode}
            onLevel={setDeLevel}
            onCategory={setDeCategory}
            onStart={handleDeStart}
            onSetSql={setUserSql}
            onRun={handleRun}
            onHint={handleHint}
            onDebug={handleDebug}
            onReveal={handleReveal}
            onOptimize={handleOptimize}
            onVisualize={handleVisualize}
            onNext={handleDeNext}
            onReset={handleDeReset}
          />
        )}
      </main>


      <AiAssistant
        context="SQL practice (MySQL 8) — DDL, DML, DCL, TCL and DQL"
        suggestions={[
          "Explain the difference between DELETE and TRUNCATE",
          "Show an example of a window function",
          "How do GRANT and REVOKE work?",
        ]}
      />
    </div>
  );
}

function TopicWise({
  activeSlug,
  topicQ,
  loading,
  session,
  question,
  attempt,
  userSql,
  feedback,
  onPickTopic,
  onSetSql,
  onRun,
  onHint,
  onDebug,
  onReveal,
  onOptimize,
  onVisualize,
  onNext,
  onReset,
}: {
  activeSlug: string | null;
  topicQ: number;
  loading: Loading;
  session: Session | null;
  question: Question | null;
  attempt: number;
  userSql: string;
  feedback: FeedbackData;
  sessionQuestionId: string | null;
  pythonMode: boolean;
  setPythonMode: React.Dispatch<React.SetStateAction<boolean>>;
  onPickTopic: (slug: string) => void;
  onSetSql: (v: string) => void;
  onRun: () => void;
  onHint: () => void;
  onDebug: () => void;
  onReveal: () => void;
  onOptimize: () => void;
  onVisualize: () => void;
  onNext: () => void;
  onReset: () => void;
}) {
  const active = activeSlug ? SQL_TOPIC_BY_SLUG[activeSlug] : null;
  const activeIdx = activeSlug ? SQL_TOPICS.findIndex((t) => t.slug === activeSlug) : -1;
  const nextTopic = activeIdx >= 0 ? SQL_TOPICS[activeIdx + 1] : undefined;

  return (
    <div className="space-y-4">
      {/* Topic catalog */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold">Practice by topic</h2>
            <p className="text-[11px] text-muted-foreground">
              Pick a topic — you'll get up to {QUESTIONS_PER_TOPIC} questions, then it auto-advances to the next one. Switch any time.
            </p>
          </div>
          {active && (
            <button onClick={onReset} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent">
              End session
            </button>
          )}
        </div>

        <div className="space-y-4">
          {CATEGORY_ORDER.map((cat) => {
            const info = CATEGORY_INFO[cat];
            const topics = SQL_TOPICS.filter((t) => t.category === cat);
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{info.emoji}</span>
                  <span className="text-xs font-semibold">{info.label}</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">— {info.blurb}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topics.map((t) => {
                    const isActive = t.slug === activeSlug;
                    return (
                      <button
                        key={t.slug}
                        onClick={() => onPickTopic(t.slug)}
                        disabled={loading === "init"}
                        className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors disabled:opacity-50 ${
                          isActive
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-surface hover:bg-accent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active topic session */}
      {active && (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2.5">
            <span className="text-xs font-semibold">{CATEGORY_INFO[active.category].emoji} {active.name}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent text-accent-foreground">
              {active.category}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-border">
              Q {topicQ} / {QUESTIONS_PER_TOPIC}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Switch</label>
              <select
                value={activeSlug ?? ""}
                onChange={(e) => onPickTopic(e.target.value)}
                className="bg-background border border-input rounded-md px-2 py-1 text-xs font-mono max-w-[200px]"
              >
                {SQL_TOPICS.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.category} · {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
            <aside className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-92px)]">
              <SchemaPanel
                schemaSql={session?.schema_sql || ""}
                seedSql={session?.seed_data_sql || ""}
                erdMermaid={session?.erd_mermaid || ""}
                description={session?.tables_description || ""}
              />
            </aside>

            <section className="space-y-4 min-w-0">
              <QuestionCard
                question={question}
                attempt={attempt}
                rightSlot={session && question && sessionQuestionId ? (
                  <PythonToggle active={pythonMode} onToggle={() => setPythonMode(v => !v)} />
                ) : null}
              />

              {session && question && (
                <>
                  {pythonMode && sessionQuestionId ? (
                    <PythonModePanel
                      sessionQuestionId={sessionQuestionId}
                      schema_sql={session.schema_sql}
                      seed_data_sql={session.seed_data_sql}
                      sql_task={question.task}
                    />
                  ) : (<>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">MySQL editor</span>
                      <span className="text-[10px] font-mono text-muted-foreground">cmd+enter to run</span>
                    </div>
                    <SqlEditor value={userSql} onChange={onSetSql} />
                    <div className="flex flex-wrap gap-2 items-center">
                      <ActionBtn primary onClick={onRun} loading={loading === "evaluate"} icon={<Play className="h-3.5 w-3.5" />}>
                        Run
                      </ActionBtn>
                      <ActionBtn onClick={onVisualize} loading={loading === "visualize"} icon={<Workflow className="h-3.5 w-3.5" />}>
                        Visualize
                      </ActionBtn>
                      <ActionBtn onClick={onHint} loading={loading === "hint"} icon={<Lightbulb className="h-3.5 w-3.5" />}>
                        Hint
                      </ActionBtn>
                      <ActionBtn onClick={onDebug} loading={loading === "debug"} icon={<Bug className="h-3.5 w-3.5" />}>
                        Debug
                      </ActionBtn>
                      <ActionBtn onClick={onReveal} loading={loading === "solution"} icon={<Eye className="h-3.5 w-3.5" />}>
                        Reveal
                      </ActionBtn>
                      <ActionBtn onClick={onOptimize} loading={loading === "optimize"} icon={<Zap className="h-3.5 w-3.5" />}>
                        AI Review
                      </ActionBtn>
                      <div className="ml-auto">
                        <ActionBtn onClick={onNext} loading={loading === "next"} icon={<ArrowRight className="h-3.5 w-3.5" />}>
                          {topicQ >= QUESTIONS_PER_TOPIC ? `Next topic${nextTopic ? `: ${nextTopic.name}` : ""}` : "Next question"}
                        </ActionBtn>
                      </div>
                    </div>
                  </div>

                  <FeedbackPanel feedback={feedback} />
                  </>)}
                </>
              )}
            </section>
          </div>
        </>
      )}

      {!active && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Select any topic above to begin. Questions are generated to match the chosen SQL category.
          </p>
        </div>
      )}
    </div>
  );
}

function FocusPractice({
  goal,
  onGoal,
  plan,
  focusIdx,
  focusCount,
  analysis,
  loading,
  session,
  question,
  attempt,
  userSql,
  feedback,
  onStart,
  onSetSql,
  onRun,
  onHint,
  onDebug,
  onReveal,
  onOptimize,
  onVisualize,
  onNext,
  onEnd,
  onReset,
}: {
  goal: string;
  onGoal: (v: string) => void;
  plan: FocusPlan | null;
  focusIdx: number;
  focusCount: number;
  analysis: any | null;
  loading: Loading;
  session: Session | null;
  question: Question | null;
  attempt: number;
  userSql: string;
  feedback: FeedbackData;
  onStart: () => void;
  onSetSql: (v: string) => void;
  onRun: () => void;
  onHint: () => void;
  onDebug: () => void;
  onReveal: () => void;
  onOptimize: () => void;
  onVisualize: () => void;
  onNext: () => void;
  onEnd: () => void;
  onReset: () => void;
  sessionQuestionId?: string | null;
  pythonMode?: boolean;
  setPythonMode?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const busy = loading === "plan" || loading === "init";
  const currentConcept = plan ? plan.concepts[focusIdx] : null;

  const EXAMPLES = [
    "Test my SQL basic commands",
    "I want to be a professional at joins",
    "Drill me on GROUP BY and aggregates",
    "Make me confident with subqueries and CTEs",
    "Practice window functions like a pro",
  ];

  return (
    <div className="space-y-4">
      {/* Goal composer */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Tell me what to test you on</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Describe your goal in plain English. I'll build a focused set of questions that covers it end-to-end,
          track every mistake, and when you press <span className="text-foreground font-semibold">End &amp; analyze</span> I'll
          tell you exactly where you're strong and where you need work.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={goal}
            onChange={(e) => onGoal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !busy) onStart(); }}
            placeholder='e.g. "Test my basic commands" or "I want to be a pro at joins"'
            className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm"
            disabled={busy}
          />
          <button
            onClick={onStart}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {plan ? "Restart with this goal" : "Start"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => onGoal(ex)}
              disabled={busy}
              className="text-[11px] px-2 py-1 rounded-full border border-border bg-surface hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Active focus session */}
      {plan && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2.5">
          <span className="text-xs font-semibold">🎯 {plan.focus_title}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent text-accent-foreground capitalize">
            {plan.difficulty}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-border">
            {focusCount} answered
          </span>
          {currentConcept && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-border text-primary-glow">
              now: {currentConcept}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onEnd}
              disabled={loading === "analyze"}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-50"
            >
              {loading === "analyze" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
              End &amp; analyze
            </button>
            <button onClick={onReset} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent">
              New goal
            </button>
          </div>
        </div>
      )}

      {/* Coverage chips */}
      {plan && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {plan.concepts.map((c, i) => (
            <span
              key={c}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                i === focusIdx
                  ? "border-primary bg-primary/10 text-foreground"
                  : i < focusIdx
                    ? "border-border bg-surface text-muted-foreground"
                    : "border-dashed border-border text-muted-foreground/60"
              }`}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Analysis */}
      {analysis && <FocusAnalysisPanel analysis={analysis} />}

      {plan && session && question && (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
          <aside className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-92px)]">
            <SchemaPanel
              schemaSql={session?.schema_sql || ""}
              seedSql={session?.seed_data_sql || ""}
              erdMermaid={session?.erd_mermaid || ""}
              description={session?.tables_description || ""}
            />
          </aside>

          <section className="space-y-4 min-w-0">
            <QuestionCard
              question={question}
              attempt={attempt}
              rightSlot={session && question && sessionQuestionId ? (
                <PythonToggle active={pythonMode} onToggle={() => setPythonMode(v => !v)} />
              ) : null}
            />
            {pythonMode && sessionQuestionId ? (
              <PythonModePanel
                sessionQuestionId={sessionQuestionId}
                schema_sql={session.schema_sql}
                seed_data_sql={session.seed_data_sql}
                sql_task={question.task}
              />
            ) : (<>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">MySQL editor</span>
                <span className="text-[10px] font-mono text-muted-foreground">cmd+enter to run</span>
              </div>
              <SqlEditor value={userSql} onChange={onSetSql} />
              <div className="flex flex-wrap gap-2 items-center">
                <ActionBtn primary onClick={onRun} loading={loading === "evaluate"} icon={<Play className="h-3.5 w-3.5" />}>
                  Run
                </ActionBtn>
                <ActionBtn onClick={onVisualize} loading={loading === "visualize"} icon={<Workflow className="h-3.5 w-3.5" />}>
                  Visualize
                </ActionBtn>
                <ActionBtn onClick={onHint} loading={loading === "hint"} icon={<Lightbulb className="h-3.5 w-3.5" />}>
                  Hint
                </ActionBtn>
                <ActionBtn onClick={onDebug} loading={loading === "debug"} icon={<Bug className="h-3.5 w-3.5" />}>
                  Debug
                </ActionBtn>
                <ActionBtn onClick={onReveal} loading={loading === "solution"} icon={<Eye className="h-3.5 w-3.5" />}>
                  Reveal
                </ActionBtn>
                <ActionBtn onClick={onOptimize} loading={loading === "optimize"} icon={<Zap className="h-3.5 w-3.5" />}>
                  AI Review
                </ActionBtn>
                <div className="ml-auto">
                  <ActionBtn onClick={onNext} loading={loading === "next"} icon={<ArrowRight className="h-3.5 w-3.5" />}>
                    Next question
                  </ActionBtn>
                </div>
              </div>
            </div>
            <FeedbackPanel feedback={feedback} />
            </>)}
          </section>
        </div>
      )}

      {!plan && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Type what you want to be tested on above and press <span className="text-foreground font-semibold">Start</span>.
            The AI mentor plans a focused path, asks targeted questions, and analyzes your mistakes when you finish.
          </p>
        </div>
      )}
    </div>
  );
}

function FocusAnalysisPanel({ analysis }: { analysis: any }) {
  const a = analysis?.analysis;
  const total = analysis?.total ?? 0;
  const correct = analysis?.correct ?? 0;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const stats: any[] = analysis?.stats ?? [];

  return (
    <div className="rounded-lg border border-primary/40 bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Session analysis</h2>
        <span className="ml-auto text-[11px] font-mono px-2 py-0.5 rounded bg-accent text-accent-foreground">
          {correct}/{total} correct · {pct}%
        </span>
      </div>

      {a?.verdict && (
        <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm font-medium">
          {a.verdict}
        </div>
      )}
      {a?.overall_summary && <p className="text-sm text-muted-foreground">{a.overall_summary}</p>}
      {a?.accuracy_note && <p className="text-[12px] text-muted-foreground">{a.accuracy_note}</p>}

      {analysis?.analysis_error && (
        <p className="text-[12px] text-muted-foreground">
          (AI summary unavailable — showing your raw stats below.)
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.isArray(a?.strengths) && a.strengths.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Trophy className="h-3.5 w-3.5" /> Strengths
            </div>
            {a.strengths.map((s: any, i: number) => (
              <div key={i} className="rounded-md border border-border bg-surface px-3 py-2">
                <div className="text-[12px] font-mono text-foreground">{s.concept}</div>
                <div className="text-[12px] text-muted-foreground">{s.note}</div>
              </div>
            ))}
          </div>
        )}
        {Array.isArray(a?.weaknesses) && a.weaknesses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Needs work
            </div>
            {a.weaknesses.map((w: any, i: number) => (
              <div key={i} className="rounded-md border border-amber-500/30 bg-surface px-3 py-2">
                <div className="text-[12px] font-mono text-foreground">{w.concept}</div>
                <div className="text-[12px] text-muted-foreground">{w.note}</div>
                {w.fix && <div className="text-[12px] text-primary-glow mt-1">→ {w.fix}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {a?.recommendation && (
        <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-[12px]">
          <span className="font-semibold">Next:</span> {a.recommendation}
        </div>
      )}

      {/* Raw per-concept stats */}
      {stats.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Per-concept accuracy</div>
          <div className="flex flex-wrap gap-1.5">
            {stats.map((s) => (
              <span
                key={s.concept}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  s.accuracy >= 0.7
                    ? "border-emerald-500/40 text-emerald-400"
                    : s.accuracy >= 0.4
                      ? "border-amber-500/40 text-amber-400"
                      : "border-red-500/40 text-red-400"
                }`}
              >
                {s.concept}: {s.correct}/{s.tries}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DataEngineering({
  level,
  category,
  conceptIdx,
  count,
  active,
  loading,
  session,
  question,
  attempt,
  userSql,
  feedback,
  onLevel,
  onCategory,
  onStart,
  onSetSql,
  onRun,
  onHint,
  onDebug,
  onReveal,
  onOptimize,
  onVisualize,
  onNext,
  onReset,
}: {
  level: number;
  category: string;
  conceptIdx: number;
  count: number;
  active: boolean;
  loading: Loading;
  session: Session | null;
  question: Question | null;
  attempt: number;
  userSql: string;
  feedback: FeedbackData;
  onLevel: (v: number) => void;
  onCategory: (v: string) => void;
  onStart: (level: number) => void;
  onSetSql: (v: string) => void;
  onRun: () => void;
  onHint: () => void;
  onDebug: () => void;
  onReveal: () => void;
  onOptimize: () => void;
  onVisualize: () => void;
  onNext: () => void;
  onReset: () => void;
}) {
  const lvl = DE_LEVEL_BY_NUMBER[level] ?? DE_LEVELS[0];
  const nextLevel = DE_LEVEL_BY_NUMBER[level + 1];
  const atLevelEnd = conceptIdx + 1 >= lvl.concepts.length;

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Data Engineering — MySQL mentor</h2>
        </div>
        <p className="text-[11px] text-muted-foreground max-w-3xl">
          Train like a production Data Engineer. A senior mentor generates realistic day-to-day work — ETL/ELT loads,
          warehouse modeling, SCD Type 1/2, CDC merges, data validation, KPI reporting and incident RCA — one exercise
          at a time, ramping from <span className="text-foreground">Junior</span> to <span className="text-foreground">Staff</span>.
        </p>

        {/* Category selector */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Category</label>
          <button
            onClick={() => onCategory("mix")}
            disabled={loading === "init"}
            className={`text-[11px] px-2 py-1 rounded-full border transition-colors disabled:opacity-50 ${
              category === "mix"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-surface hover:bg-accent text-muted-foreground hover:text-foreground"
            }`}
          >
            🎲 Mixed
          </button>
          {DE_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => onCategory(c.key)}
              disabled={loading === "init"}
              className={`text-[11px] px-2 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                category === c.key
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-surface hover:bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Level cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {DE_LEVELS.map((l) => {
          const isActive = active && l.level === level;
          return (
            <button
              key={l.level}
              onClick={() => onStart(l.level)}
              disabled={loading === "init"}
              className={`text-left rounded-lg border p-3 transition-colors disabled:opacity-50 ${
                isActive
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface hover:bg-accent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                  L{l.level}
                </span>
                <span className="text-[10px] font-mono capitalize text-muted-foreground">{l.difficulty}</span>
              </div>
              <div className="mt-1.5 text-xs font-semibold">{l.name}</div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{l.blurb}</p>
            </button>
          );
        })}
      </div>

      {/* Active session */}
      {active && session && question ? (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2.5">
            <span className="text-xs font-semibold">📦 Level {lvl.level} · {lvl.name}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent text-accent-foreground capitalize">
              {lvl.difficulty}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-border">
              {count} exercise{count === 1 ? "" : "s"}
            </span>
            {question?.concept && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-border text-primary-glow">
                now: {question.concept}
              </span>
            )}
            <button onClick={onReset} className="ml-auto text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent">
              End session
            </button>
          </div>

          {/* Concept coverage chips */}
          <div className="flex flex-wrap gap-1.5 px-1">
            {lvl.concepts.map((c, i) => (
              <span
                key={c}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  i === conceptIdx
                    ? "border-primary bg-primary/10 text-foreground"
                    : i < conceptIdx
                      ? "border-border bg-surface text-muted-foreground"
                      : "border-dashed border-border text-muted-foreground/60"
                }`}
              >
                {c}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
            <aside className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-92px)]">
              <SchemaPanel
                schemaSql={session?.schema_sql || ""}
                seedSql={session?.seed_data_sql || ""}
                erdMermaid={session?.erd_mermaid || ""}
                description={session?.tables_description || ""}
              />
            </aside>

            <section className="space-y-4 min-w-0">
              <QuestionCard
                question={question}
                attempt={attempt}
                rightSlot={session && question && sessionQuestionId ? (
                  <PythonToggle active={pythonMode} onToggle={() => setPythonMode(v => !v)} />
                ) : null}
              />
              {pythonMode && sessionQuestionId ? (
                <PythonModePanel
                  sessionQuestionId={sessionQuestionId}
                  schema_sql={session.schema_sql}
                  seed_data_sql={session.seed_data_sql}
                  sql_task={question.task}
                />
              ) : (<>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">MySQL editor</span>
                  <span className="text-[10px] font-mono text-muted-foreground">cmd+enter to run</span>
                </div>
                <SqlEditor value={userSql} onChange={onSetSql} />
                <div className="flex flex-wrap gap-2 items-center">
                  <ActionBtn primary onClick={onRun} loading={loading === "evaluate"} icon={<Play className="h-3.5 w-3.5" />}>
                    Run
                  </ActionBtn>
                  <ActionBtn onClick={onVisualize} loading={loading === "visualize"} icon={<Workflow className="h-3.5 w-3.5" />}>
                    Visualize
                  </ActionBtn>
                  <ActionBtn onClick={onHint} loading={loading === "hint"} icon={<Lightbulb className="h-3.5 w-3.5" />}>
                    Hint
                  </ActionBtn>
                  <ActionBtn onClick={onDebug} loading={loading === "debug"} icon={<Bug className="h-3.5 w-3.5" />}>
                    Debug
                  </ActionBtn>
                  <ActionBtn onClick={onReveal} loading={loading === "solution"} icon={<Eye className="h-3.5 w-3.5" />}>
                    Reveal
                  </ActionBtn>
                  <ActionBtn onClick={onOptimize} loading={loading === "optimize"} icon={<Zap className="h-3.5 w-3.5" />}>
                    AI Review
                  </ActionBtn>
                  <div className="ml-auto">
                    <ActionBtn onClick={onNext} loading={loading === "next"} icon={<ArrowRight className="h-3.5 w-3.5" />}>
                      {atLevelEnd
                        ? nextLevel
                          ? `Promote: L${nextLevel.level} ${nextLevel.name}`
                          : "Finish"
                        : "Next exercise"}
                    </ActionBtn>
                  </div>
                </div>
              </div>
              <FeedbackPanel feedback={feedback} />
              </>)}
            </section>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Pick a level above to start. You begin at <span className="text-foreground font-semibold">Level 1 (Junior)</span> and
            get promoted to the next level automatically as you work through each level's exercises.
          </p>
        </div>
      )}
    </div>
  );
}




function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
        active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function ActionBar({
  loading,
  onRun,
  onHint,
  onDebug,
  onReveal,
  onOptimize,
  onVisualize,
  onNext,
  questionCount,
}: {
  loading: Loading;
  onRun: () => void;
  onHint: () => void;
  onDebug: () => void;
  onReveal: () => void;
  onOptimize: () => void;
  onVisualize: () => void;
  onNext: () => void;
  questionCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <ActionBtn primary onClick={onRun} loading={loading === "evaluate"} icon={<Play className="h-3.5 w-3.5" />}>
        Run
      </ActionBtn>
      <ActionBtn onClick={onVisualize} loading={loading === "visualize"} icon={<Workflow className="h-3.5 w-3.5" />}>
        Visualize
      </ActionBtn>
      <ActionBtn onClick={onHint} loading={loading === "hint"} icon={<Lightbulb className="h-3.5 w-3.5" />}>
        Hint
      </ActionBtn>
      <ActionBtn onClick={onDebug} loading={loading === "debug"} icon={<Bug className="h-3.5 w-3.5" />}>
        Debug
      </ActionBtn>
      <ActionBtn onClick={onReveal} loading={loading === "solution"} icon={<Eye className="h-3.5 w-3.5" />}>
        Reveal
      </ActionBtn>
      <ActionBtn onClick={onOptimize} loading={loading === "optimize"} icon={<Zap className="h-3.5 w-3.5" />}>
        AI Review
      </ActionBtn>
      <div className="ml-auto flex items-center gap-2">
        {questionCount > 0 && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent text-accent-foreground">
            Q {questionCount} / {TOTAL_QUESTIONS}
          </span>
        )}
        <ActionBtn onClick={onNext} loading={loading === "next"} icon={<ArrowRight className="h-3.5 w-3.5" />}>
          Next question
        </ActionBtn>
      </div>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  loading,
  icon,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  icon?: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-50 ${
        primary
          ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[0_6px_18px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
          : "border border-border bg-surface hover:bg-accent"
      }`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
}

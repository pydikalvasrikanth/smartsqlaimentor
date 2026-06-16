import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { toast, Toaster } from "sonner";
import { Loader2, Play, Lightbulb, Eye, ArrowRight, Code2, LogOut, ArrowLeft, CheckCircle2, XCircle, Bug, Workflow, Zap, Target, Calendar, Wrench, Flame, AlertTriangle, Building2 } from "lucide-react";
import { runPythonEngine } from "@/lib/python-engine.functions";
import { AnimatedTrace } from "@/components/python/AnimatedTrace";
import { AiAssistant } from "@/components/AiAssistant";

export const Route = createFileRoute("/python")({
  head: () => ({
    meta: [
      { title: "Python Interview Engine — AI mentor practice" },
      { name: "description", content: "Python coding interview practice with AI-graded feedback, hints, and complexity analysis." },
      { property: "og:title", content: "Python Interview Engine" },
      { property: "og:description", content: "AI-graded Python coding practice: hints, complexity analysis, and progressive 50-question sessions." },
      { property: "og:url", content: "https://smartsqlaimentor.lovable.app/python" },
    ],
    links: [
      { rel: "canonical", href: "https://smartsqlaimentor.lovable.app/python" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: "Python Interview Engine",
          description: "AI-graded Python coding interview practice with hints, complexity analysis, and difficulty ramping.",
          url: "https://smartsqlaimentor.lovable.app/python",
          learningResourceType: "Interactive practice",
          educationalLevel: "Beginner to Advanced",
          teaches: "Python, data structures, algorithms, OOP, system design",
        }),
      },
    ],
  }),
  component: PythonWorkspace,
});

const PY_CONCEPTS: Record<string, string[]> = {
  beginner: ["lists", "dict", "set", "strings", "loops", "comprehensions", "tuple", "slicing", "basic-recursion", "sorting", "two-pointers-easy", "hashing-easy", "math-basic", "input-parsing", "file-io-basic"],
  intermediate: ["sliding-window", "two-pointers", "binary-search", "stack", "queue", "deque", "heap", "hashmap-counting", "recursion", "backtracking-easy", "linked-list", "tree-traversal", "regex", "decorators", "generators"],
  advanced: ["dp-1d", "dp-2d", "graph-bfs", "graph-dfs", "dijkstra", "union-find", "trie", "segment-tree", "topological-sort", "kmp", "bit-manipulation", "system-design-mini", "concurrency-asyncio", "oop-design", "pandas-numpy"],
};

const TOTAL = 50;
type Level = "beginner" | "intermediate" | "advanced";
const LEVEL_ORDER: Level[] = ["beginner", "intermediate", "advanced"];

// Top employers that commonly run Python coding interviews.
const PY_COMPANIES: string[] = [
  "Google","Amazon","Meta","Microsoft","Apple","Netflix","Uber","Airbnb","LinkedIn","Twitter / X",
  "Stripe","Shopify","Square","Pinterest","Reddit","Snap","Spotify","Dropbox","Salesforce","Adobe",
  "Oracle","IBM","Intel","NVIDIA","AMD","Cisco","SAP","ServiceNow","Atlassian","GitHub",
  "GitLab","HashiCorp","Cloudflare","Datadog","Snowflake","Databricks","MongoDB","Elastic","Twilio","Coinbase",
  "Robinhood","PayPal","eBay","Walmart Labs","Target Tech","Best Buy","DoorDash","Instacart","Lyft","Grubhub",
  "Tesla","SpaceX","Booking.com","Expedia","Airwallex","Revolut","Wise","Plaid","Brex","Ramp",
  "Affirm","Klarna","Goldman Sachs","JPMorgan","Morgan Stanley","Citadel","Two Sigma","Jane Street","Jump Trading","DRW",
  "Bloomberg","Capital One","American Express","Mastercard","Visa","Wells Fargo","Bank of America","HSBC","Barclays","Deutsche Bank",
  "TCS","Infosys","Wipro","HCL","Tech Mahindra","Cognizant","Accenture","Capgemini","Deloitte","EY",
  "Flipkart","Swiggy","Zomato","Paytm","Razorpay","PhonePe","Ola","BYJU's","Freshworks","Zoho",
  "Samsung","Sony","Huawei","Alibaba","Tencent","Baidu","Rakuten","LINE","Yandex","Mercado Libre",
];

interface PyPlan {
  days: number;
  level: Level;
  startedAt: number;
  completedDays: number[];
}
const PLAN_KEY = "py_plan_v1";
function loadPlan(): PyPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? (JSON.parse(raw) as PyPlan) : null;
  } catch {
    return null;
  }
}
function savePlan(p: PyPlan | null) {
  if (typeof window === "undefined") return;
  if (p) localStorage.setItem(PLAN_KEY, JSON.stringify(p));
  else localStorage.removeItem(PLAN_KEY);
}
function dayNumberFor(p: PyPlan) {
  const elapsed = Date.now() - p.startedAt;
  return Math.min(p.days, Math.floor(elapsed / 86_400_000) + 1);
}
function difficultyForDay(day: number, totalDays: number, target: Level): string {
  // Ramp difficulty proportional to plan progress, capped by target.
  const cap = LEVEL_ORDER.indexOf(target);
  const pct = day / Math.max(1, totalDays);
  let tier = 0;
  if (pct > 0.66) tier = 2;
  else if (pct > 0.33) tier = 1;
  return LEVEL_ORDER[Math.min(tier, cap)];
}
function conceptForDay(day: number, target: Level): string {
  const tier = difficultyForDay(day, day, target) as Level;
  const pool = PY_CONCEPTS[tier];
  return pool[(day - 1) % pool.length];
}

function diffForIndex(i: number, target: Level = "advanced"): string {
  const cap = LEVEL_ORDER.indexOf(target);
  const stage = Math.floor((i - 1) / 5);
  let tier: number;
  if (stage <= 1) tier = 0;
  else if (stage <= 5) tier = 1;
  else tier = 2;
  return LEVEL_ORDER[Math.min(tier, cap)];
}
function pickConcept(i: number, covered: string[]): string {
  const tier = diffForIndex(i) as Level;
  const pool = PY_CONCEPTS[tier];
  const fresh = pool.filter((c) => !covered.includes(c));
  if (fresh.length) return fresh[(i * 7) % fresh.length];
  return pool[Math.floor(Math.random() * pool.length)];
}

interface PyQuestion {
  question_id: number;
  difficulty: string;
  concept?: string;
  business_context?: string;
  task: string;
  function_signature: string;
  starter_code: string;
  test_cases: Array<{ input_repr: string; expected_repr: string; explanation?: string }>;
  expected_solution?: string;
  time_complexity?: string;
  space_complexity?: string;
}

function PythonWorkspace() {
  const engine = useServerFn(runPythonEngine);
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [planDays, setPlanDays] = useState(30);
  const [planLevel, setPlanLevel] = useState<Level>("intermediate");
  const [plan, setPlan] = useState<PyPlan | null>(null);
  const [tab, setTab] = useState<"today" | "free" | "interview">("today");
  const [interviewCompany, setInterviewCompany] = useState<string>("Google");
  const [interviewLevel, setInterviewLevel] = useState<Level>("intermediate");
  const [interviewMode, setInterviewMode] = useState(false);
  const [question, setQuestion] = useState<PyQuestion | null>(null);
  const [sessionQid, setSessionQid] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [pastIds, setPastIds] = useState<number[]>([]);
  const [covered, setCovered] = useState<string[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [feedback, setFeedback] = useState<any>(null);
  const [hint, setHint] = useState<any>(null);
  const [solution, setSolution] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [visual, setVisual] = useState<any>(null);
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const p = loadPlan();
    if (p) { setPlan(p); setPlanDays(p.days); setPlanLevel(p.level); }
  }, []);

  const call = useCallback(async (command: string, payload: any) => {
    try {
      const res: any = await engine({ data: { command, payload } });
      if (res?.error) { toast.error(res.error); return null; }
      return res?.data;
    } catch (e: any) {
      console.error("Python engine call failed", e);
      toast.error(e?.message ?? "Network error — please try again.");
      return null;
    }
  }, [engine]);

  function clearPanels() {
    setFeedback(null); setHint(null); setSolution(null);
    setDebugInfo(null); setVisual(null); setReview(null);
  }

  function handleCreatePlan() {
    const p: PyPlan = { days: planDays, level: planLevel, startedAt: Date.now(), completedDays: [] };
    savePlan(p);
    setPlan(p);
    setTab("today");
    toast.success(`Plan ready — ${planDays} days of ${planLevel} practice`);
  }

  function handleReplan() {
    savePlan(null);
    setPlan(null);
    setQuestion(null);
    clearPanels();
    setQIndex(0);
    setPastIds([]);
    setCovered([]);
  }

  async function handleStart(opts?: { difficulty?: string; concept?: string }) {
    setLoading("init");
    clearPanels();
    setInterviewMode(false);
    const startDiff = opts?.difficulty ?? diffForIndex(1, planLevel);
    const concept = opts?.concept ?? pickConcept(1, []);
    const data = await call("INIT_PYTHON_ENVIRONMENT", { difficulty: startDiff, target_concept: concept });
    setLoading(null);
    if (!data) return;
    setQuestion(data.question);
    setSessionQid(data.session_question_id ?? null);
    setCode(data.question.starter_code);
    setQIndex(1);
    setPastIds([data.question.question_id]);
    if (data.question.concept) setCovered([data.question.concept]);
    toast.success(`Q 1 / ${TOTAL} · ${startDiff}`);
  }

  async function handleStartInterview() {
    setLoading("init");
    clearPanels();
    const concept = pickConcept(1, []);
    const data = await call("INIT_PYTHON_ENVIRONMENT", {
      difficulty: interviewLevel,
      target_concept: concept,
      company: interviewCompany,
    });
    setLoading(null);
    if (!data) return;
    setInterviewMode(true);
    setQuestion(data.question);
    setSessionQid(data.session_question_id ?? null);
    setCode(data.question.starter_code);
    setQIndex(1);
    setPastIds([data.question.question_id]);
    if (data.question.concept) setCovered([data.question.concept]);
    toast.success(`${interviewCompany} · ${interviewLevel} interview question`);
  }

  function handleStartToday() {
    if (!plan) return;
    const day = dayNumberFor(plan);
    handleStart({
      difficulty: difficultyForDay(day, plan.days, plan.level),
      concept: conceptForDay(day, plan.level),
    });
  }

  async function handleNext() {
    const next = qIndex + 1;
    if (next > TOTAL) { toast.success("Session complete!"); return; }
    setLoading("next"); clearPanels();
    const tgt = interviewMode ? interviewLevel : diffForIndex(next, planLevel);
    const data = await call("NEXT_PYTHON_QUESTION", {
      target_difficulty: tgt,
      target_concept: pickConcept(next, covered),
      covered_concepts: covered,
      previous_question_ids: pastIds,
      ...(interviewMode ? { company: interviewCompany } : {}),
    });
    setLoading(null);
    if (!data) return;
    setQuestion(data.question);
    setSessionQid(data.session_question_id ?? null);
    setCode(data.question.starter_code);
    setQIndex(next);
    setPastIds((ids) => [...ids, data.question.question_id]);
    if (data.question.concept) setCovered((cs) => cs.includes(data.question.concept) ? cs : [...cs, data.question.concept]);
    if (interviewMode) toast.success(`${interviewCompany} · Q ${next}/${TOTAL}`);
    else if (next % 5 === 1) toast.success(`Difficulty up → ${tgt} (Q ${next}/${TOTAL})`);
    else toast.success(`Question ${next} / ${TOTAL}`);
  }

  async function handleRun() {
    if (!question || !sessionQid) return;
    setLoading("eval");
    const data = await call("EVALUATE_PYTHON", {
      session_question_id: sessionQid,
      user_code: code,
    });
    setLoading(null);
    if (!data) return;
    setFeedback(data);
    if (data.is_correct) toast.success("All tests pass");
    else toast.error(`${data.passed}/${data.total} tests passed`);
  }

  async function handleHint() {
    if (!question) return;
    setLoading("hint");
    const data = await call("PYTHON_HINT", { task: question.task, user_code: code });
    setLoading(null);
    if (data) setHint(data);
  }

  async function handleReveal() {
    if (!question || !sessionQid) return;
    setLoading("solution");
    const data = await call("REVEAL_PYTHON_SOLUTION", { session_question_id: sessionQid });
    setLoading(null);
    if (data) setSolution(data);
  }

  async function handleDebug() {
    if (!question) return;
    setLoading("debug");
    const data = await call("PYTHON_DEBUG", { task: question.task, user_code: code });
    setLoading(null);
    if (data) setDebugInfo(data);
  }
  async function handleVisualize() {
    if (!question) return;
    setLoading("visualize");
    const data = await call("PYTHON_VISUALIZE", { task: question.task, user_code: code });
    setLoading(null);
    if (data) setVisual(data);
  }
  async function handleReview() {
    if (!question || !sessionQid) return;
    setLoading("review");
    const data = await call("PYTHON_OPTIMIZE", { session_question_id: sessionQid, user_code: code });
    setLoading(null);
    if (data) setReview(data);
  }

  if (authLoading || !user) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster theme="dark" position="top-right" richColors />
      <header className="border-b border-border bg-surface-2/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Code2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight">Python Interview Engine</h1>
            <p className="text-[11px] text-muted-foreground font-mono">AI-graded · MNC-style questions</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[11px] font-mono">
            {question && (
              <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground">
                Day {Math.max(1, Math.ceil((qIndex / TOTAL) * planDays))}/{planDays} · Q {qIndex}/{TOTAL}
              </span>
            )}
            {question && <span className="px-2 py-0.5 rounded border border-border">{question.difficulty}</span>}
            {question?.concept && <span className="px-2 py-0.5 rounded border border-border text-primary-glow">{question.concept}</span>}
            <button onClick={() => signOut()} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border hover:bg-accent">
              <LogOut className="h-3 w-3" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 space-y-4">
        {!question && (
          <div className="flex items-center gap-1 border-b border-border">
            <button onClick={() => setTab("today")} className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${tab === "today" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Calendar className="h-3.5 w-3.5" /> Today
            </button>
            <button onClick={() => setTab("free")} className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${tab === "free" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Wrench className="h-3.5 w-3.5" /> Free practice
            </button>
            <button onClick={() => setTab("interview")} className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${tab === "interview" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Building2 className="h-3.5 w-3.5" /> Interview ({PY_COMPANIES.length} companies)
            </button>
          </div>
        )}

        {!question && tab === "today" && plan && (
          <PyPlanDashboard plan={plan} onStartToday={handleStartToday} onReplan={handleReplan} loading={loading === "init"} />
        )}

        {!question && tab === "interview" && (
          <div className="rounded-xl border border-border bg-surface-1 p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Company-style Python interview</h2>
                <p className="text-xs text-muted-foreground">Pick a company + difficulty. AI generates a question in that company's typical style.</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {LEVEL_ORDER.map((l) => (
                  <button key={l} onClick={() => setInterviewLevel(l)} className={`text-left p-3 rounded-md border transition-colors ${interviewLevel === l ? "border-primary bg-primary/10" : "border-border hover:bg-accent"}`}>
                    <div className="text-sm font-semibold capitalize">{l}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Company ({PY_COMPANIES.length})</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 max-h-72 overflow-y-auto p-1">
                {PY_COMPANIES.map((c) => (
                  <button key={c} onClick={() => setInterviewCompany(c)} className={`text-xs px-2.5 py-1.5 rounded border text-left truncate transition-colors ${interviewCompany === c ? "border-primary bg-primary/10 text-primary-glow" : "border-border hover:bg-accent"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleStartInterview} disabled={loading === "init"} className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-2.5 rounded-md text-sm font-semibold disabled:opacity-50">
              {loading === "init" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Start {interviewCompany} interview
            </button>
            <p className="text-[11px] text-muted-foreground">Topic-wise, Targeted and Data Engineering tabs (matching the SQL practice page) are coming next.</p>
          </div>
        )}

        {!question && (tab === "free" || (!plan && tab !== "interview")) && (
          <div className="grid place-items-center min-h-[50vh]">
            <div className="w-full max-w-xl rounded-xl border border-border bg-surface-1 p-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
                  <Target className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{plan ? "Free practice session" : "Build your Python practice plan"}</h2>
                  <p className="text-xs text-muted-foreground">{plan ? "Jump into a session at any level." : "50 questions ramping every 5 — capped at your target level."}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{plan ? "Plan timeframe (saved)" : "Timeframe"}</label>
                <div className="grid grid-cols-4 gap-2">
                  {[14, 30, 60, 90].map((d) => (
                    <button key={d} onClick={() => setPlanDays(d)} className={`px-3 py-2 rounded-md text-sm font-mono border transition-colors ${planDays === d ? "border-primary bg-primary/10 text-primary-glow" : "border-border hover:bg-accent"}`}>
                      {d} days
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Target level</label>
                <div className="grid grid-cols-3 gap-2">
                  {LEVEL_ORDER.map((l) => (
                    <button key={l} onClick={() => setPlanLevel(l)} className={`text-left p-3 rounded-md border transition-colors ${planLevel === l ? "border-primary bg-primary/10" : "border-border hover:bg-accent"}`}>
                      <div className="text-sm font-semibold capitalize">{l}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {l === "beginner" && "Syntax, lists, dicts, loops."}
                        {l === "intermediate" && "Sliding window, recursion, trees."}
                        {l === "advanced" && "DP, graphs, system design."}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {plan ? (
                <button onClick={() => handleStart()} disabled={loading === "init"} className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-2.5 rounded-md text-sm font-semibold disabled:opacity-50">
                  {loading === "init" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Start free session
                </button>
              ) : (
                <button onClick={handleCreatePlan} className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-2.5 rounded-md text-sm font-semibold">
                  <Play className="h-4 w-4" /> Create {planDays}-day plan
                </button>
              )}
            </div>
          </div>
        )}

        {question && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="space-y-3">
              <div className="rounded-lg border border-border bg-surface-1 p-4 space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground">{question.difficulty}</span>
                  {question.concept && <span className="text-muted-foreground">{question.concept}</span>}
                </div>
                <h2 className="text-base font-semibold">Question {qIndex}</h2>
                {question.business_context && <p className="text-sm text-muted-foreground">{question.business_context}</p>}
                <p className="text-sm whitespace-pre-wrap">{question.task}</p>
                <pre className="text-xs bg-surface-2 p-2 rounded font-mono">{question.function_signature}</pre>
                <div className="text-[11px] font-mono text-muted-foreground space-y-1">
                  <div className="font-semibold">Examples:</div>
                  {question.test_cases.slice(0, 3).map((tc, i) => (
                    <div key={i} className="pl-2 border-l border-border">
                      <div>input: <code>{tc.input_repr}</code></div>
                      <div>output: <code>{tc.expected_repr}</code></div>
                    </div>
                  ))}
                </div>
              </div>

              {feedback && (
                <div className="rounded-lg border border-border bg-surface-1 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {feedback.is_correct ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-yellow-500" />}
                    <span className="text-sm font-semibold">{feedback.passed}/{feedback.total} tests passed</span>
                  </div>
                  <p className="text-sm">{feedback.explanation}</p>
                  {feedback.per_test && (
                    <div className="space-y-1 text-[11px] font-mono">
                      {feedback.per_test.map((t: any, i: number) => (
                        <div key={i} className={`p-2 rounded ${t.passed ? "bg-green-500/10" : "bg-yellow-500/10"}`}>
                          <div>in: {t.input_repr}</div>
                          <div>expected: {t.expected_repr}</div>
                          <div>got: {t.actual_repr}</div>
                          {t.note && <div className="text-muted-foreground">{t.note}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {feedback.improvements?.length > 0 && (
                    <ul className="list-disc pl-5 text-xs space-y-1">
                      {feedback.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {hint && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm space-y-2">
                  <div className="font-semibold text-amber-400">Hint</div>
                  <p>{hint.hint}</p>
                  {hint.leading_question && <p className="text-muted-foreground italic">{hint.leading_question}</p>}
                </div>
              )}

              {solution && (
                <div className="rounded-lg border border-border bg-surface-1 p-4 space-y-2">
                  <div className="font-semibold text-sm">Reference Solution</div>
                  <pre className="text-xs bg-surface-2 p-3 rounded font-mono overflow-auto">{solution.solution}</pre>
                  <p className="text-sm whitespace-pre-wrap">{solution.walkthrough}</p>
                  <div className="text-[11px] font-mono text-muted-foreground">
                    Time: {solution.time_complexity} · Space: {solution.space_complexity}
                  </div>
                </div>
              )}

              {debugInfo && (
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4 text-sm space-y-2">
                  <div className="font-semibold text-orange-400 flex items-center gap-1"><Bug className="h-4 w-4" /> Debugger</div>
                  <p>{debugInfo.error_analysis}</p>
                  {debugInfo.suspected_line && (
                    <pre className="text-[11px] bg-surface-2 p-2 rounded font-mono">{debugInfo.suspected_line}</pre>
                  )}
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Concept to apply</div>
                  <p className="text-sm text-muted-foreground">{debugInfo.educational_fix}</p>
                </div>
              )}

              {visual && (
                <AnimatedTrace
                  sample_input={visual.sample_input}
                  steps={visual.steps || []}
                  final_output={visual.final_output}
                  summary={visual.summary}
                />
              )}

              {review && (
                <div className="rounded-lg border border-border bg-surface-1 p-4 space-y-2">
                  <div className="font-semibold text-sm flex items-center gap-1"><Zap className="h-4 w-4 text-primary-glow" /> AI Senior Review</div>
                  <pre className="text-xs bg-surface-2 p-3 rounded font-mono overflow-auto">{review.optimized_code}</pre>
                  {review.improvements?.length > 0 && (
                    <ul className="list-disc pl-5 text-xs space-y-1">
                      {review.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  )}
                  {(review.time_complexity_before || review.time_complexity_after) && (
                    <div className="text-[11px] font-mono text-muted-foreground">
                      Before: {review.time_complexity_before} → After: {review.time_complexity_after}
                    </div>
                  )}
                  {review.idiomatic_notes && <p className="text-xs text-muted-foreground">{review.idiomatic_notes}</p>}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="rounded-lg border border-border bg-surface-1 overflow-hidden">
                <div className="px-3 py-2 border-b border-border text-[11px] font-mono text-muted-foreground">solution.py</div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="w-full h-[420px] bg-surface-2 text-sm font-mono p-3 outline-none resize-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleRun} disabled={!!loading} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50">
                  {loading === "eval" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Run
                </button>
                <button onClick={handleVisualize} disabled={!!loading} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border text-sm hover:bg-accent disabled:opacity-50">
                  {loading === "visualize" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Workflow className="h-3.5 w-3.5" />} Visualize
                </button>
                <button onClick={handleHint} disabled={!!loading} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border text-sm hover:bg-accent disabled:opacity-50">
                  {loading === "hint" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5" />} Hint
                </button>
                <button onClick={handleDebug} disabled={!!loading} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border text-sm hover:bg-accent disabled:opacity-50">
                  {loading === "debug" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bug className="h-3.5 w-3.5" />} Debug
                </button>
                <button onClick={handleReveal} disabled={!!loading} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border text-sm hover:bg-accent disabled:opacity-50">
                  {loading === "solution" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />} Reveal
                </button>
                <button onClick={handleReview} disabled={!!loading} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border text-sm hover:bg-accent disabled:opacity-50">
                  {loading === "review" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} AI Review
                </button>
                <button onClick={handleNext} disabled={!!loading} className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border text-sm hover:bg-accent disabled:opacity-50">
                  {loading === "next" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />} Next
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
      <AiAssistant
        context="Python coding interview practice — data structures, algorithms, OOP & system design"
        suggestions={[
          "Explain time complexity of binary search",
          "Give me a sliding window example",
          "How do Python decorators work?",
        ]}
      />
    </div>
  );
}

function PyPlanDashboard({ plan, onStartToday, onReplan, loading }: { plan: PyPlan; onStartToday: () => void; onReplan: () => void; loading: boolean }) {
  const day = dayNumberFor(plan);
  const diff = difficultyForDay(day, plan.days, plan.level);
  const concept = conceptForDay(day, plan.level);
  const days = Array.from({ length: plan.days }, (_, i) => i + 1);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <div className="rounded-xl border border-border bg-gradient-to-br from-card to-surface-2 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-primary-glow" />
            Day {day} of {plan.days} · {plan.level} track
          </div>
          <button onClick={onReplan} className="text-[11px] font-mono text-muted-foreground hover:text-foreground">
            Replan
          </button>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Today's focus</div>
          <h2 className="text-2xl font-bold mt-1">🐍 Python · {concept}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            50-question session ramping every 5 · starts at{" "}
            <span className="font-mono text-primary-glow">{diff}</span>
          </p>
        </div>
        <button
          onClick={onStartToday}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Start today's session
        </button>
        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            <Calendar className="h-3 w-3" /> Schedule
          </div>
          <div className="flex flex-wrap gap-1">
            {days.map((d) => {
              const isToday = d === day;
              const isPast = d < day;
              const done = plan.completedDays.includes(d);
              return (
                <div
                  key={d}
                  title={`Day ${d}: ${conceptForDay(d, plan.level)} (${difficultyForDay(d, plan.days, plan.level)})`}
                  className={`h-6 w-6 rounded text-[10px] grid place-items-center font-mono border ${
                    done
                      ? "bg-primary/30 border-primary text-primary-glow"
                      : isToday
                      ? "bg-primary text-primary-foreground border-primary"
                      : isPast
                      ? "border-border bg-surface text-muted-foreground"
                      : "border-border/40 text-muted-foreground/60"
                  }`}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <AlertTriangle className="h-3 w-3 text-orange-400" /> Weak spots
        </div>
        <p className="text-xs text-muted-foreground">
          No weak concepts yet — answer a few questions to build a learning state.
        </p>
      </div>
    </div>
  );
}
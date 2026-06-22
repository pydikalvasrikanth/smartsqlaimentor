import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { toast, Toaster } from "sonner";
import { Loader2, Play, Lightbulb, Eye, ArrowRight, Code2, LogOut, ArrowLeft, CheckCircle2, XCircle, Bug, Workflow, Zap, Target, Calendar, Wrench, Flame, AlertTriangle, Building2, Library, Sparkles, Square } from "lucide-react";
import { runPythonEngine } from "@/lib/python-engine.functions";
import { planPythonFocus } from "@/lib/python-plan.functions";
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

// Topic-wise practice catalog focused on what a Data Engineer must know.
// Each topic = a target_concept passed to the AI engine.
const DE_TOPIC_GROUPS: Array<{
  group: string;
  blurb: string;
  topics: Array<{ slug: string; label: string; level: Level }>;
}> = [
  {
    group: "Core Python",
    blurb: "Language fundamentals every DE writes daily.",
    topics: [
      { slug: "lists", label: "Lists & slicing", level: "beginner" },
      { slug: "dict", label: "Dictionaries", level: "beginner" },
      { slug: "set", label: "Sets & dedup", level: "beginner" },
      { slug: "tuple", label: "Tuples & unpacking", level: "beginner" },
      { slug: "strings", label: "String manipulation", level: "beginner" },
      { slug: "comprehensions", label: "List/dict comprehensions", level: "beginner" },
      { slug: "loops", label: "Loops & control flow", level: "beginner" },
      { slug: "functions-args", label: "Functions, *args, **kwargs", level: "beginner" },
      { slug: "exception-handling", label: "Exceptions & try/except", level: "beginner" },
      { slug: "oop-design", label: "Classes & OOP", level: "intermediate" },
      { slug: "dataclasses", label: "Dataclasses & typing", level: "intermediate" },
      { slug: "decorators", label: "Decorators", level: "intermediate" },
      { slug: "generators", label: "Generators & yield", level: "intermediate" },
      { slug: "iterators", label: "Iterators & __iter__", level: "intermediate" },
      { slug: "context-managers", label: "Context managers (with)", level: "intermediate" },
      { slug: "concurrency-asyncio", label: "asyncio & async/await", level: "advanced" },
      { slug: "multiprocessing", label: "multiprocessing & threading", level: "advanced" },
      { slug: "logging", label: "Logging best practices", level: "intermediate" },
    ],
  },
  {
    group: "Std Library",
    blurb: "Batteries-included modules pipelines rely on.",
    topics: [
      { slug: "collections", label: "collections (Counter, defaultdict, deque)", level: "intermediate" },
      { slug: "itertools", label: "itertools", level: "intermediate" },
      { slug: "functools", label: "functools (lru_cache, reduce)", level: "intermediate" },
      { slug: "datetime", label: "datetime & timezones", level: "intermediate" },
      { slug: "json", label: "json parsing", level: "beginner" },
      { slug: "csv", label: "csv read/write", level: "beginner" },
      { slug: "regex", label: "Regular expressions (re)", level: "intermediate" },
      { slug: "pathlib", label: "pathlib & filesystem", level: "beginner" },
      { slug: "os-sys", label: "os & sys", level: "beginner" },
      { slug: "subprocess", label: "subprocess", level: "intermediate" },
      { slug: "hashlib", label: "hashlib & hashing", level: "intermediate" },
      { slug: "io-streams", label: "io streams & buffering", level: "intermediate" },
    ],
  },
  {
    group: "Pandas",
    blurb: "Tabular data wrangling — the DE workhorse.",
    topics: [
      { slug: "pandas-io", label: "read_csv / read_parquet / to_sql", level: "beginner" },
      { slug: "pandas-filtering", label: "Filtering & boolean masks", level: "beginner" },
      { slug: "pandas-groupby", label: "groupby & aggregations", level: "intermediate" },
      { slug: "pandas-merge", label: "merge / join / concat", level: "intermediate" },
      { slug: "pandas-pivot", label: "pivot_table / melt / stack", level: "intermediate" },
      { slug: "pandas-apply", label: "apply / map / vectorization", level: "intermediate" },
      { slug: "pandas-window", label: "Rolling & expanding windows", level: "advanced" },
      { slug: "pandas-timeseries", label: "Time series & resample", level: "advanced" },
      { slug: "pandas-missing", label: "Missing data & fillna", level: "beginner" },
      { slug: "pandas-perf", label: "Memory & performance tuning", level: "advanced" },
    ],
  },
  {
    group: "NumPy",
    blurb: "Numerical arrays & vectorized math.",
    topics: [
      { slug: "numpy-arrays", label: "Arrays, dtypes, shape", level: "beginner" },
      { slug: "numpy-indexing", label: "Indexing & slicing", level: "beginner" },
      { slug: "numpy-broadcasting", label: "Broadcasting", level: "intermediate" },
      { slug: "numpy-vectorization", label: "Vectorization vs loops", level: "intermediate" },
      { slug: "numpy-linalg", label: "Linear algebra basics", level: "advanced" },
    ],
  },
  {
    group: "PySpark & Big Data",
    blurb: "Distributed processing at TB scale.",
    topics: [
      { slug: "pyspark-dataframe", label: "DataFrame API basics", level: "intermediate" },
      { slug: "pyspark-transformations", label: "Transformations vs actions", level: "intermediate" },
      { slug: "pyspark-joins", label: "Joins & broadcast joins", level: "advanced" },
      { slug: "pyspark-window", label: "Window functions", level: "advanced" },
      { slug: "pyspark-udf", label: "UDFs & pandas UDFs", level: "advanced" },
      { slug: "pyspark-partitioning", label: "Partitioning & shuffles", level: "advanced" },
      { slug: "pyspark-optimization", label: "Catalyst & performance tuning", level: "advanced" },
      { slug: "pyspark-streaming", label: "Structured streaming", level: "advanced" },
    ],
  },
  {
    group: "SQL with Python",
    blurb: "Bridging Python and warehouses.",
    topics: [
      { slug: "sqlalchemy", label: "SQLAlchemy core & ORM", level: "intermediate" },
      { slug: "psycopg2", label: "psycopg2 / Postgres client", level: "intermediate" },
      { slug: "duckdb-python", label: "DuckDB in Python", level: "intermediate" },
      { slug: "bigquery-client", label: "BigQuery Python client", level: "intermediate" },
      { slug: "snowflake-connector", label: "Snowflake connector", level: "intermediate" },
      { slug: "pandas-to-sql", label: "Pandas ↔ SQL round-tripping", level: "intermediate" },
    ],
  },
  {
    group: "Orchestration & Pipelines",
    blurb: "Scheduling, DAGs, and workflow tooling.",
    topics: [
      { slug: "airflow-dag", label: "Airflow DAG authoring", level: "intermediate" },
      { slug: "airflow-operators", label: "Airflow operators & XCom", level: "advanced" },
      { slug: "airflow-sensors", label: "Sensors & deferrable tasks", level: "advanced" },
      { slug: "prefect-flows", label: "Prefect flows & tasks", level: "intermediate" },
      { slug: "dagster-assets", label: "Dagster software-defined assets", level: "advanced" },
      { slug: "dbt-python", label: "dbt Python models", level: "intermediate" },
      { slug: "luigi", label: "Luigi pipelines", level: "intermediate" },
    ],
  },
  {
    group: "Streaming & Messaging",
    blurb: "Real-time event ingestion & processing.",
    topics: [
      { slug: "kafka-python", label: "Kafka producer/consumer (confluent-kafka)", level: "advanced" },
      { slug: "kafka-streams-py", label: "Faust / Kafka streams in Python", level: "advanced" },
      { slug: "pubsub", label: "GCP Pub/Sub client", level: "intermediate" },
      { slug: "kinesis", label: "AWS Kinesis client", level: "intermediate" },
      { slug: "rabbitmq-pika", label: "RabbitMQ / pika", level: "intermediate" },
    ],
  },
  {
    group: "Cloud SDKs",
    blurb: "Talking to S3, GCS, ADLS, and friends.",
    topics: [
      { slug: "boto3-s3", label: "boto3 S3 (upload/download/list)", level: "intermediate" },
      { slug: "boto3-glue", label: "boto3 Glue & Athena", level: "advanced" },
      { slug: "gcs-client", label: "google-cloud-storage", level: "intermediate" },
      { slug: "azure-blob", label: "azure-storage-blob", level: "intermediate" },
      { slug: "fsspec", label: "fsspec / s3fs / gcsfs", level: "intermediate" },
    ],
  },
  {
    group: "File Formats",
    blurb: "Columnar, row, and serialization formats.",
    topics: [
      { slug: "parquet-pyarrow", label: "Parquet with pyarrow", level: "intermediate" },
      { slug: "avro", label: "Avro (fastavro)", level: "intermediate" },
      { slug: "orc", label: "ORC files", level: "intermediate" },
      { slug: "json-lines", label: "JSON Lines / NDJSON", level: "beginner" },
      { slug: "delta-lake", label: "Delta Lake (delta-rs / deltalake)", level: "advanced" },
      { slug: "iceberg", label: "Apache Iceberg (pyiceberg)", level: "advanced" },
      { slug: "protobuf", label: "Protobuf serialization", level: "advanced" },
    ],
  },
  {
    group: "Data Quality & Testing",
    blurb: "Trustworthy pipelines need tests.",
    topics: [
      { slug: "pytest", label: "pytest fundamentals", level: "intermediate" },
      { slug: "great-expectations", label: "Great Expectations", level: "advanced" },
      { slug: "pandera", label: "Pandera schema validation", level: "intermediate" },
      { slug: "pydantic", label: "Pydantic models & validation", level: "intermediate" },
      { slug: "mocking", label: "unittest.mock & fixtures", level: "intermediate" },
    ],
  },
  {
    group: "APIs, Web & Scraping",
    blurb: "Ingesting data from HTTP sources.",
    topics: [
      { slug: "requests", label: "requests / HTTP", level: "beginner" },
      { slug: "httpx-async", label: "httpx & async clients", level: "intermediate" },
      { slug: "rest-pagination", label: "REST pagination & retries", level: "intermediate" },
      { slug: "fastapi", label: "FastAPI data services", level: "intermediate" },
      { slug: "beautifulsoup", label: "BeautifulSoup scraping", level: "intermediate" },
      { slug: "selenium", label: "Selenium / Playwright", level: "advanced" },
    ],
  },
  {
    group: "DevOps for DE",
    blurb: "Ship and operate pipelines safely.",
    topics: [
      { slug: "docker-python", label: "Dockerizing Python jobs", level: "intermediate" },
      { slug: "venv-poetry", label: "venv / poetry / uv", level: "beginner" },
      { slug: "ci-cd", label: "CI/CD for data pipelines", level: "intermediate" },
      { slug: "secrets-mgmt", label: "Secrets & config management", level: "intermediate" },
      { slug: "observability", label: "Logging, metrics, tracing", level: "advanced" },
    ],
  },
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
  const planFocusFn = useServerFn(planPythonFocus);
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [planDays, setPlanDays] = useState(30);
  const [planLevel, setPlanLevel] = useState<Level>("intermediate");
  const [plan, setPlan] = useState<PyPlan | null>(null);
  const [tab, setTab] = useState<"today" | "free" | "topic" | "targeted" | "interview">("today");
  const [topicLevel, setTopicLevel] = useState<Level>("intermediate");
  const [interviewCompany, setInterviewCompany] = useState<string>("Google");
  const [interviewLevel, setInterviewLevel] = useState<Level>("intermediate");
  const [interviewMode, setInterviewMode] = useState(false);

  // Targeted (goal-driven) practice state
  type FocusPlan = { focus_title: string; difficulty: Level; concepts: string[]; intro: string };
  const [focusGoal, setFocusGoal] = useState("");
  const [focusPlan, setFocusPlan] = useState<FocusPlan | null>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  const [focusCount, setFocusCount] = useState(0);

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

  async function handleStartTopic(topicSlug: string, topicLabel: string, difficulty: Level) {
    setLoading("init");
    clearPanels();
    setInterviewMode(false);
    setFocusPlan(null);
    const data = await call("INIT_PYTHON_ENVIRONMENT", {
      difficulty,
      target_concept: topicSlug,
      topic: topicLabel,
    });
    setLoading(null);
    if (!data) return;
    setQuestion(data.question);
    setSessionQid(data.session_question_id ?? null);
    setCode(data.question.starter_code);
    setQIndex(1);
    setPastIds([data.question.question_id]);
    if (data.question.concept) setCovered([data.question.concept]);
    toast.success(`${topicLabel} · ${difficulty}`);
  }

  async function handleStartFocus() {
    const goal = focusGoal.trim();
    if (goal.length < 2) {
      toast.error('Tell me what you\'d like to practice, e.g. "drill me on decorators".');
      return;
    }
    setLoading("init");
    clearPanels();
    setInterviewMode(false);
    let planRes: any;
    try {
      planRes = await planFocusFn({ data: { goal } });
    } catch (e: any) {
      setLoading(null);
      toast.error(e?.message ?? "Could not build a plan.");
      return;
    }
    if (planRes?.error) { setLoading(null); toast.error(planRes.error); return; }
    const fp = planRes?.data as FocusPlan | undefined;
    if (!fp?.concepts?.length) { setLoading(null); toast.error("Couldn't build a plan from that goal."); return; }
    const data = await call("INIT_PYTHON_ENVIRONMENT", {
      difficulty: fp.difficulty,
      target_concept: fp.concepts[0],
      topic: fp.focus_title,
    });
    setLoading(null);
    if (!data) return;
    setFocusPlan(fp);
    setFocusIdx(0);
    setFocusCount(1);
    setQuestion(data.question);
    setSessionQid(data.session_question_id ?? null);
    setCode(data.question.starter_code);
    setQIndex(1);
    setPastIds([data.question.question_id]);
    if (data.question.concept) setCovered([data.question.concept]);
    toast.success(fp.intro || `${fp.focus_title} — let's go!`);
  }

  async function handleFocusNext() {
    if (!focusPlan) return;
    const nextIdx = (focusIdx + 1) % focusPlan.concepts.length;
    const concept = focusPlan.concepts[nextIdx];
    setLoading("next"); clearPanels();
    const data = await call("NEXT_PYTHON_QUESTION", {
      target_difficulty: focusPlan.difficulty,
      target_concept: concept,
      covered_concepts: covered,
      previous_question_ids: pastIds,
    });
    setLoading(null);
    if (!data) return;
    setQuestion(data.question);
    setSessionQid(data.session_question_id ?? null);
    setCode(data.question.starter_code);
    setQIndex((i) => i + 1);
    setFocusIdx(nextIdx);
    setFocusCount((c) => c + 1);
    setPastIds((ids) => [...ids, data.question.question_id]);
    if (data.question.concept) setCovered((cs) => cs.includes(data.question.concept) ? cs : [...cs, data.question.concept]);
    toast.success(`Focus: ${concept}`);
  }

  function handleFocusReset() {
    setFocusPlan(null);
    setFocusIdx(0);
    setFocusCount(0);
    setQuestion(null);
    setSessionQid(null);
    setPastIds([]);
    setCovered([]);
    setQIndex(0);
    clearPanels();
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
          <Link to="/" aria-label="Back to subjects" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
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
            <button onClick={() => setTab("topic")} className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${tab === "topic" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Library className="h-3.5 w-3.5" /> Topic-wise (DE)
            </button>
            <button onClick={() => setTab("interview")} className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${tab === "interview" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Building2 className="h-3.5 w-3.5" /> Interview ({PY_COMPANIES.length} companies)
            </button>
          </div>
        )}

        {!question && tab === "today" && plan && (
          <PyPlanDashboard plan={plan} onStartToday={handleStartToday} onReplan={handleReplan} loading={loading === "init"} />
        )}

        {!question && tab === "topic" && (
          <div className="rounded-xl border border-border bg-surface-1 p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
                <Library className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Topic-wise Python practice for Data Engineers</h2>
                <p className="text-xs text-muted-foreground">
                  Pick any topic or library. AI generates a focused question and grades your solution.
                  Covers core Python, pandas, PySpark, Airflow, Kafka, cloud SDKs, file formats & more.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {LEVEL_ORDER.map((l) => (
                  <button
                    key={l}
                    onClick={() => setTopicLevel(l)}
                    className={`text-left p-2.5 rounded-md border transition-colors ${topicLevel === l ? "border-primary bg-primary/10" : "border-border hover:bg-accent"}`}
                  >
                    <div className="text-sm font-semibold capitalize">{l}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-5">
              {DE_TOPIC_GROUPS.map((g) => (
                <div key={g.group} className="space-y-2">
                  <div>
                    <div className="text-xs font-semibold text-primary-glow">{g.group}</div>
                    <div className="text-[11px] text-muted-foreground">{g.blurb}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                    {g.topics.map((t) => (
                      <button
                        key={t.slug}
                        onClick={() => handleStartTopic(t.slug, t.label, topicLevel)}
                        disabled={loading === "init"}
                        className="text-left text-xs px-2.5 py-2 rounded border border-border hover:bg-accent hover:border-primary/50 transition-colors disabled:opacity-50 flex items-start justify-between gap-2"
                      >
                        <span className="truncate">{t.label}</span>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground shrink-0">{t.level[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
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

        {!question && (tab === "free" || (!plan && tab !== "interview" && tab !== "topic")) && (
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
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, ChevronDown, ChevronRight, Sparkles } from "lucide-react";

type Subject = "sql" | "python" | "java";

interface Solved {
  id: string;
  created_at: string;
  topic_slug: string;
  difficulty: string;
  question_text: string | null;
  user_sql: string | null;
  user_answer: string | null;
}

// SQL functions we recognise. Matched case-insensitively as WORD(
const KNOWN_FUNCTIONS = [
  "COUNT","SUM","AVG","MIN","MAX","ROUND","CEIL","CEILING","FLOOR","ABS","MOD","POWER","SQRT","GREATEST","LEAST",
  "ROW_NUMBER","RANK","DENSE_RANK","NTILE","LAG","LEAD","FIRST_VALUE","LAST_VALUE","NTH_VALUE","PERCENT_RANK","CUME_DIST",
  "COALESCE","IFNULL","NULLIF","IF","CASE","CAST","CONVERT",
  "CONCAT","CONCAT_WS","SUBSTRING","SUBSTR","LEFT","RIGHT","LENGTH","CHAR_LENGTH","LOWER","UPPER","TRIM","LTRIM","RTRIM","REPLACE","REVERSE","REPEAT","LPAD","RPAD","INSTR","LOCATE","FORMAT",
  "NOW","CURDATE","CURTIME","CURRENT_DATE","CURRENT_TIMESTAMP","DATE","YEAR","MONTH","DAY","HOUR","MINUTE","SECOND","WEEK","QUARTER","DAYOFWEEK","DAYNAME","MONTHNAME","DATE_ADD","DATE_SUB","DATEDIFF","TIMESTAMPDIFF","DATE_FORMAT","STR_TO_DATE","UNIX_TIMESTAMP","FROM_UNIXTIME","LAST_DAY","EXTRACT",
  "GROUP_CONCAT","JSON_EXTRACT","JSON_OBJECT","JSON_ARRAY","JSON_ARRAYAGG","JSON_OBJECTAGG",
  "REGEXP_LIKE","REGEXP_REPLACE","REGEXP_SUBSTR",
  "EXISTS","IN","BETWEEN","LIKE","ANY","ALL","DISTINCT",
];

function extractFunctions(sql: string): string[] {
  const found = new Set<string>();
  const upper = sql.toUpperCase();
  for (const fn of KNOWN_FUNCTIONS) {
    // word boundary + optional whitespace + (
    const re = new RegExp(`\\b${fn}\\s*\\(`);
    if (re.test(upper)) found.add(fn);
  }
  // CASE ... END pattern (no paren)
  if (/\bCASE\b[\s\S]*?\bEND\b/.test(upper)) found.add("CASE");
  return Array.from(found).sort();
}

function highlightSql(sql: string): string {
  const keywords = [
    "SELECT","FROM","WHERE","GROUP BY","ORDER BY","HAVING","LIMIT","OFFSET","JOIN","INNER JOIN","LEFT JOIN","RIGHT JOIN","FULL JOIN","CROSS JOIN","ON","AS","AND","OR","NOT","IN","EXISTS","BETWEEN","LIKE","IS NULL","IS NOT NULL","UNION","UNION ALL","WITH","RECURSIVE","OVER","PARTITION BY","CASE","WHEN","THEN","ELSE","END","DISTINCT","INSERT INTO","VALUES","UPDATE","SET","DELETE","CREATE TABLE","ALTER TABLE","DROP TABLE","PRIMARY KEY","FOREIGN KEY","REFERENCES","INDEX",
  ];
  let escaped = sql
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // strings
  escaped = escaped.replace(/'([^']*)'/g, `<span class="text-emerald-300">'$1'</span>`);
  // numbers
  escaped = escaped.replace(/\b(\d+)\b/g, `<span class="text-orange-300">$1</span>`);
  // keywords (longest first to catch multi-word)
  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  for (const kw of sorted) {
    const re = new RegExp(`\\b(${kw.replace(/ /g, "\\s+")})\\b`, "gi");
    escaped = escaped.replace(re, `<span class="text-sky-300 font-semibold">$1</span>`);
  }
  // comments -- ...
  escaped = escaped.replace(/(--[^\n]*)/g, `<span class="text-slate-500 italic">$1</span>`);
  return escaped;
}

const PY_KEYWORDS = [
  "def","return","if","elif","else","for","while","in","not","and","or","is","None","True","False",
  "import","from","as","class","try","except","finally","raise","with","lambda","yield","pass","break","continue","global","nonlocal","assert","async","await",
];
const PY_BUILTINS = [
  "len","range","print","enumerate","zip","map","filter","sorted","sum","min","max","abs","round","any","all","list","dict","set","tuple","str","int","float","bool","type","isinstance","open","input","reversed","iter","next","hash","id","repr","format","divmod","pow","frozenset","bytes","bytearray","memoryview","object","super","property","staticmethod","classmethod","getattr","setattr","hasattr","delattr","vars","dir","callable","chr","ord","bin","oct","hex","complex","slice","zip",
];
// Common library/method names Python engineers use
const PY_LIBS = [
  "Counter","defaultdict","deque","OrderedDict","namedtuple","heapq","bisect","itertools","functools","math","re","json","os","sys","random","datetime","time","collections","string","copy","typing","pandas","pd","numpy","np","DataFrame","Series","array","zeros","ones","concat","merge","groupby","apply","read_csv","to_csv","read_parquet","reduce","lru_cache","partial","chain","permutations","combinations","product","accumulate",
];

function extractPythonSymbols(code: string): string[] {
  const found = new Set<string>();
  const all = [...PY_BUILTINS, ...PY_LIBS];
  for (const name of all) {
    const re = new RegExp(`\\b${name}\\b`);
    if (re.test(code)) found.add(name);
  }
  return Array.from(found).sort();
}

function highlightPython(code: string): string {
  let escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // triple + single strings
  escaped = escaped.replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\n]*"|'[^'\n]*')/g, `<span class="text-emerald-300">$1</span>`);
  // comments
  escaped = escaped.replace(/(#[^\n]*)/g, `<span class="text-slate-500 italic">$1</span>`);
  // numbers
  escaped = escaped.replace(/\b(\d+(?:\.\d+)?)\b/g, `<span class="text-orange-300">$1</span>`);
  for (const kw of PY_KEYWORDS.sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b(${kw})\\b`, "g");
    escaped = escaped.replace(re, `<span class="text-sky-300 font-semibold">$1</span>`);
  }
  for (const b of PY_BUILTINS) {
    const re = new RegExp(`\\b(${b})\\b`, "g");
    escaped = escaped.replace(re, `<span class="text-fuchsia-300">$1</span>`);
  }
  return escaped;
}

// Java keywords + common types/APIs
const JAVA_KEYWORDS = [
  "abstract","assert","boolean","break","byte","case","catch","char","class","const","continue","default","do","double","else","enum","extends","final","finally","float","for","goto","if","implements","import","instanceof","int","interface","long","native","new","package","private","protected","public","return","short","static","strictfp","super","switch","synchronized","this","throw","throws","transient","try","void","volatile","while","yield","record","sealed","permits","non-sealed","var","true","false","null",
];
const JAVA_TYPES = [
  "String","Integer","Long","Double","Float","Boolean","Character","Byte","Short","Object","Number","Math","System","List","ArrayList","LinkedList","Map","HashMap","LinkedHashMap","TreeMap","ConcurrentHashMap","Set","HashSet","LinkedHashSet","TreeSet","Queue","Deque","ArrayDeque","PriorityQueue","Stack","Optional","Stream","IntStream","LongStream","DoubleStream","Collectors","Collection","Collections","Arrays","Comparator","Comparable","Iterator","Iterable","Function","BiFunction","Consumer","BiConsumer","Supplier","Predicate","BiPredicate","Runnable","Callable","CompletableFuture","Executor","ExecutorService","Executors","Thread","AtomicInteger","AtomicLong","AtomicReference","ReentrantLock","LocalDate","LocalDateTime","LocalTime","ZonedDateTime","Instant","Duration","Period","DateTimeFormatter","Files","Path","Paths","Scanner","BufferedReader","InputStream","OutputStream","IOException","RuntimeException","IllegalArgumentException","IllegalStateException","NullPointerException","NumberFormatException",
];
const JAVA_APIS = [
  "stream","parallelStream","map","filter","reduce","collect","toList","toSet","toMap","forEach","sorted","distinct","limit","skip","count","min","max","sum","average","findFirst","findAny","anyMatch","allMatch","noneMatch","groupingBy","partitioningBy","joining","summingInt","averagingInt","mapToInt","mapToLong","mapToObj","flatMap","peek","of","ofNullable","isPresent","isEmpty","get","orElse","orElseGet","orElseThrow","ifPresent","asList","copyOf","sort","reverseOrder","comparing","comparingInt","thenComparing","binarySearch","asMap","entrySet","keySet","values","getOrDefault","putIfAbsent","computeIfAbsent","compute","merge","forEachOrdered",
];

function extractJavaSymbols(code: string): string[] {
  const found = new Set<string>();
  for (const name of [...JAVA_TYPES, ...JAVA_APIS]) {
    const re = new RegExp(`\\b${name}\\b`);
    if (re.test(code)) found.add(name);
  }
  return Array.from(found).sort();
}

function highlightJava(code: string): string {
  let escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // text blocks + strings + chars
  escaped = escaped.replace(/("""[\s\S]*?"""|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/g, `<span class="text-emerald-300">$1</span>`);
  // block comments
  escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, `<span class="text-slate-500 italic">$1</span>`);
  // line comments
  escaped = escaped.replace(/(\/\/[^\n]*)/g, `<span class="text-slate-500 italic">$1</span>`);
  // numbers
  escaped = escaped.replace(/\b(\d+(?:\.\d+)?[LlFfDd]?)\b/g, `<span class="text-orange-300">$1</span>`);
  // annotations
  escaped = escaped.replace(/(@[A-Za-z_][A-Za-z0-9_]*)/g, `<span class="text-amber-300">$1</span>`);
  for (const kw of [...JAVA_KEYWORDS].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b(${kw})\\b`, "g");
    escaped = escaped.replace(re, `<span class="text-sky-300 font-semibold">$1</span>`);
  }
  for (const t of JAVA_TYPES) {
    const re = new RegExp(`\\b(${t})\\b`, "g");
    escaped = escaped.replace(re, `<span class="text-fuchsia-300">$1</span>`);
  }
  return escaped;
}

export function SolvedLibrary({ subject = "sql" }: { subject?: Subject } = {}) {
  const isPython = subject === "python";
  const isJava = subject === "java";
  const [rows, setRows] = useState<Solved[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("attempts")
        .select("id, created_at, topic_slug, difficulty, question_text, user_sql, user_answer")
        .eq("subject", subject)
        .eq("is_correct", true)
        .order("created_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error) setErr(error.message);
      else setRows((data ?? []) as Solved[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [subject]);

  const codeOf = (r: Solved) => (isPython || isJava ? r.user_answer : r.user_sql) ?? "";
  const extractFns = (code: string) =>
    isJava ? extractJavaSymbols(code) : isPython ? extractPythonSymbols(code) : extractFunctions(code);
  const highlight = (code: string) =>
    isJava ? highlightJava(code) : isPython ? highlightPython(code) : highlightSql(code);

  // Dedup: keep latest correct submission per question text
  const unique = useMemo(() => {
    if (!rows) return [];
    const seen = new Set<string>();
    const out: Solved[] = [];
    for (const r of rows) {
      const key = (r.question_text ?? "").trim().slice(0, 200);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  }, [rows]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return unique;
    const q = filter.toLowerCase();
    return unique.filter(
      (r) =>
        r.question_text?.toLowerCase().includes(q) ||
        codeOf(r).toLowerCase().includes(q) ||
        r.topic_slug.toLowerCase().includes(q),
    );
  }, [unique, filter]);

  const allFunctions = useMemo(() => {
    const set = new Set<string>();
    for (const r of unique) {
      const code = codeOf(r);
      if (!code) continue;
      for (const fn of extractFns(code)) set.add(fn);
    }
    return Array.from(set).sort();
  }, [unique]);

  if (rows === null && !err) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your solved queries…
      </div>
    );
  }
  if (err) {
    return <div className="p-8 text-sm text-destructive">Could not load solved queries: {err}</div>;
  }
  if (unique.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center space-y-2">
        <h2 className="text-lg font-semibold">No solved queries yet</h2>
        <p className="text-sm text-muted-foreground">
          Solve a question in any tab — it will appear here with the exact query you wrote.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Functions covered */}
      <div className="rounded-xl border border-border bg-surface-2/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">
            {isPython ? "Functions & libraries you've used" : "Functions you've used"}
          </h3>
          <span className="text-[11px] font-mono text-muted-foreground">
            {allFunctions.length} unique
          </span>
        </div>
        {allFunctions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recognisable functions yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {allFunctions.map((fn) => (
              <span
                key={fn}
                className="px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary text-[11px] font-mono font-semibold"
              >
                {fn}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search + list */}
      <div className="flex items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search questions, SQL, topics…"
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        <span className="text-xs font-mono text-muted-foreground">
          {filtered.length} / {unique.length}
        </span>
      </div>

      <ul className="space-y-2">
        {filtered.map((r) => {
          const isOpen = !!open[r.id];
          const code = codeOf(r);
          const fns = code ? extractFns(code) : [];
          return (
            <li key={r.id} className="rounded-lg border border-border bg-surface-1 overflow-hidden">
              <button
                onClick={() => setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))}
                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-surface-2/50"
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                )}
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-foreground line-clamp-2">
                    {r.question_text || "(no question text saved)"}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px] font-mono text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-border">
                      {r.topic_slug}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-border">
                      {r.difficulty}
                    </span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    {fns.slice(0, 4).map((fn) => (
                      <span
                        key={fn}
                        className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary"
                      >
                        {fn}
                      </span>
                    ))}
                    {fns.length > 4 && (
                      <span className="text-muted-foreground">+{fns.length - 4}</span>
                    )}
                  </div>
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-border bg-background/40">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide mt-2 mb-1">
                    Your solution
                  </p>
                  <pre className="text-[11px] font-bold bg-background rounded-md p-3 border border-border overflow-x-auto leading-relaxed">
                    <code
                      className="font-mono text-foreground"
                      dangerouslySetInnerHTML={{ __html: highlight(code) }}
                    />
                  </pre>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, ChevronDown, ChevronRight, Sparkles } from "lucide-react";

interface Solved {
  id: string;
  created_at: string;
  topic_slug: string;
  difficulty: string;
  question_text: string | null;
  user_sql: string | null;
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

export function SolvedLibrary() {
  const [rows, setRows] = useState<Solved[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("attempts")
        .select("id, created_at, topic_slug, difficulty, question_text, user_sql")
        .eq("subject", "sql")
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
  }, []);

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
        r.user_sql?.toLowerCase().includes(q) ||
        r.topic_slug.toLowerCase().includes(q),
    );
  }, [unique, filter]);

  const allFunctions = useMemo(() => {
    const set = new Set<string>();
    for (const r of unique) {
      if (!r.user_sql) continue;
      for (const fn of extractFunctions(r.user_sql)) set.add(fn);
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
          <h3 className="text-sm font-semibold tracking-tight">Functions you've used</h3>
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
          const fns = r.user_sql ? extractFunctions(r.user_sql) : [];
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
                  <p className="text-sm text-foreground line-clamp-2">
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
                  <pre className="text-xs bg-background rounded-md p-3 border border-border overflow-x-auto">
                    <code
                      className="font-mono text-foreground"
                      dangerouslySetInnerHTML={{ __html: highlightSql(r.user_sql ?? "") }}
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
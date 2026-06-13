import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { toast, Toaster } from "sonner";
import {
  Database, Sparkles, ShieldCheck, FlaskConical, Cloud,
  Loader2, AlertTriangle, Zap, ArrowLeft,
} from "lucide-react";

import { runSqlEngine } from "@/lib/sql-engine.functions";
import { ThemeToggle, useTheme } from "@/hooks/use-theme";
import { ErdDiagram } from "@/components/sql/ErdDiagram";
import { SqlEditor } from "@/components/sql/SqlEditor";
import {
  customers, orders, orderItems, dataQuality,
  SCHEMA_SQL, ERD_MERMAID, TOTAL_ROWS,
} from "@/lib/mock-dataset";

export const Route = createFileRoute("/engine")({
  head: () => ({
    meta: [
      { title: "MySQL Intelligence Engine — AI SQL Lab" },
      { name: "description", content: "Senior data engineering practice: 1000-row dataset, AI text-to-SQL with EXPLAIN, BigQuery shift, data quality dashboard, and advanced labs." },
      { property: "og:title", content: "MySQL Intelligence Engine — AI SQL Lab" },
      { property: "og:description", content: "Text-to-SQL with EXPLAIN, BigQuery shift, data quality checks, and advanced window/CTE/index labs on a realistic dataset." },
      { property: "og:url", content: "https://clever-sql-coach.lovable.app/engine" },
    ],
    links: [
      { rel: "canonical", href: "https://clever-sql-coach.lovable.app/engine" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "MySQL Intelligence Engine",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          description: "Interactive AI-powered SQL compiler, data quality dashboard, and advanced labs.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: EnginePage,
});

type Tab = "preview" | "ai" | "quality" | "lab";

function EnginePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);
  const [tab, setTab] = useState<Tab>("preview");
  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Toaster theme={theme} position="top-right" richColors />

      <header className="border-b border-border bg-surface-2/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Database className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight">MySQL Intelligence Engine</h1>
            <p className="text-[11px] text-muted-foreground font-mono">
              {TOTAL_ROWS} rows · CUSTOMERS · ORDERS · ORDER_ITEMS
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Practice mode
            </Link>
          </div>
        </div>
        <nav className="max-w-[1400px] mx-auto px-4 flex gap-1 text-xs font-mono">
          <TabBtn active={tab === "preview"} onClick={() => setTab("preview")} icon={<Database className="h-3.5 w-3.5" />}>Data Preview</TabBtn>
          <TabBtn active={tab === "ai"} onClick={() => setTab("ai")} icon={<Sparkles className="h-3.5 w-3.5" />}>AI SQL Compiler</TabBtn>
          <TabBtn active={tab === "quality"} onClick={() => setTab("quality")} icon={<ShieldCheck className="h-3.5 w-3.5" />}>Data Quality</TabBtn>
          <TabBtn active={tab === "lab"} onClick={() => setTab("lab")} icon={<FlaskConical className="h-3.5 w-3.5" />}>Advanced Lab</TabBtn>
        </nav>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 space-y-4">
        <h2 className="sr-only">
          {tab === "preview" ? "Data preview" : tab === "ai" ? "AI SQL compiler" : tab === "quality" ? "Data quality" : "Advanced lab"}
        </h2>
        {tab === "preview" && <PreviewTab />}
        {tab === "ai" && <AITab />}
        {tab === "quality" && <QualityTab />}
        {tab === "lab" && <LabTab />}
      </main>
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-2 inline-flex items-center gap-1.5 border-b-2 transition-colors ${
        active ? "border-primary-glow text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}{children}
    </button>
  );
}

/* ---------- Data Preview ---------- */
function PreviewTab() {
  const [which, setWhich] = useState<"customers" | "orders" | "items">("customers");
  const rows: any[] =
    which === "customers" ? customers : which === "orders" ? orders : orderItems;
  const cols = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-4">
      <aside className="rounded-lg border border-border bg-card p-3 h-[calc(100vh-180px)] overflow-auto">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">ERD</div>
        <ErdDiagram chart={ERD_MERMAID} />
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-4 mb-2">Schema</div>
        <pre className="text-[11px] font-mono whitespace-pre-wrap text-foreground/85">{SCHEMA_SQL}</pre>
      </aside>

      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-border bg-surface-2 text-xs">
          {(["customers", "orders", "items"] as const).map((k) => (
            <button key={k} onClick={() => setWhich(k)}
              className={`px-2.5 py-1 rounded ${which === k ? "bg-primary/20 text-primary-glow" : "hover:bg-accent"}`}>
              {k.toUpperCase()} ({k === "customers" ? customers.length : k === "orders" ? orders.length : orderItems.length})
            </button>
          ))}
        </div>
        <div className="overflow-auto h-[calc(100vh-235px)]">
          <table className="text-xs font-mono w-full">
            <thead className="bg-surface-2 sticky top-0">
              <tr>{cols.map((c) => <th key={c} className="text-left px-3 py-2 text-muted-foreground">{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-border/40 hover:bg-accent/20">
                  {cols.map((c) => (
                    <td key={c} className="px-3 py-1.5">
                      {row[c] === null ? <span className="text-destructive">NULL</span> : String(row[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ---------- AI SQL Compiler ---------- */
function AITab() {
  const engine = useServerFn(runSqlEngine);
  const [nl, setNl] = useState("Find the top 5 customers by total order amount in 2024.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showBQ, setShowBQ] = useState(false);

  // Local 3VL pre-check on the result SQL
  const local3VL = useMemo(() => {
    const s = (result?.mysql_sql || "").toUpperCase();
    return /NOT\s+IN\s*\(/.test(s);
  }, [result]);

  async function go() {
    setLoading(true);
    const res: any = await engine({ data: { command: "TEXT_TO_SQL", payload: { schema_sql: SCHEMA_SQL, nl_question: nl } } });
    setLoading(false);
    if (res?.error) { toast.error(res.error); return; }
    setResult(res.data);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Ask in plain English</label>
        <textarea value={nl} onChange={(e) => setNl(e.target.value)}
          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-mono min-h-[80px]" />
        <div className="flex gap-2">
          <button onClick={go} disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-primary to-primary-glow text-primary-foreground disabled:opacity-50">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Compile to SQL
          </button>
          {result && (
            <button onClick={() => setShowBQ((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-border hover:bg-accent">
              <Cloud className="h-3.5 w-3.5" /> {showBQ ? "Show MySQL" : "GCP Shift → BigQuery"}
            </button>
          )}
        </div>
      </div>

      {result && (
        <>
          {(local3VL || result.three_valued_logic_warning) && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Senior Pitfall — Three-Valued Logic (3VL)
              </div>
              <p className="text-amber-100/90">
                {result.three_valued_logic_warning ||
                  "NOT IN with a list/subquery containing NULL evaluates to UNKNOWN and silently returns zero rows. Prefer NOT EXISTS or filter NULLs in the subquery."}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {showBQ ? "BigQuery Standard SQL" : "MySQL 8.0"}
              </span>
            </div>
            <SqlEditor value={showBQ ? result.bigquery_sql : result.mysql_sql} onChange={() => {}} height="220px" />
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              <Zap className="h-3.5 w-3.5" /> Explain Plan
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/85">{result.explain_plan}</pre>
          </div>

          {result.notes && (
            <div className="rounded-lg border border-border bg-card p-4 text-xs text-foreground/80">
              {result.notes}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Data Quality ---------- */
function QualityTab() {
  const q = useMemo(() => dataQuality(), []);
  const cards = [
    { label: "Email completeness", value: `${q.emailCompleteness.toFixed(1)}%`, hint: "non-NULL emails", good: q.emailCompleteness > 80 },
    { label: "Email validity", value: `${q.emailValidity.toFixed(1)}%`, hint: "regex-valid", good: q.emailValidity > 80 },
    { label: "Date validity", value: `${q.dateValidity.toFixed(1)}%`, hint: "in [2000–2030]", good: q.dateValidity > 90 },
    { label: "Duplicate customer_ids", value: String(q.duplicateCustomerIds), hint: "rows w/ repeated PK", good: q.duplicateCustomerIds === 0 },
    { label: "Customers", value: String(q.customers), hint: "rows", good: true },
    { label: "Orders", value: String(q.orders), hint: "rows", good: true },
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-border bg-card p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.label}</div>
          <div className={`text-2xl font-semibold mt-1 ${c.good ? "text-foreground" : "text-destructive"}`}>{c.value}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{c.hint}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Advanced Lab ---------- */
function LabTab() {
  const [which, setWhich] = useState<"window" | "cte" | "index">("window");

  return (
    <div className="space-y-3">
      <div className="flex gap-1 text-xs font-mono">
        {(["window", "cte", "index"] as const).map((k) => (
          <button key={k} onClick={() => setWhich(k)}
            className={`px-3 py-1.5 rounded ${which === k ? "bg-primary/20 text-primary-glow" : "border border-border hover:bg-accent"}`}>
            {k === "window" ? "Window Functions" : k === "cte" ? "Recursive CTEs" : "Index Optimization"}
          </button>
        ))}
      </div>

      {which === "window" && (
        <LabCard
          title="ROW_NUMBER / LAG / LEAD"
          body="Rank each customer's orders by date and compare consecutive order amounts."
          sql={`SELECT customer_id, order_date, total_amount,
       ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS rn,
       LAG(total_amount)  OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_amt,
       LEAD(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS next_amt
FROM ORDERS;`}
        />
      )}
      {which === "cte" && (
        <LabCard
          title="Recursive CTE — order sequence ladder"
          body="Walk consecutive orders per customer using a recursive CTE."
          sql={`WITH RECURSIVE chain AS (
  SELECT customer_id, order_id, order_date, 1 AS step
  FROM ORDERS
  WHERE order_id IN (SELECT MIN(order_id) FROM ORDERS GROUP BY customer_id)
  UNION ALL
  SELECT o.customer_id, o.order_id, o.order_date, c.step + 1
  FROM chain c
  JOIN ORDERS o ON o.customer_id = c.customer_id AND o.order_id > c.order_id
)
SELECT * FROM chain ORDER BY customer_id, step LIMIT 50;`}
        />
      )}
      {which === "index" && <IndexLab />}
    </div>
  );
}

function LabCard({ title, body, sql }: { title: string; body: string; sql: string }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface-2">
        <div className="text-sm font-semibold">{title}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
      </div>
      <SqlEditor value={sql} onChange={() => {}} height="220px" />
    </div>
  );
}

function IndexLab() {
  const [indexed, setIndexed] = useState(false);
  // Simulated benchmark: timing email lookup with/without index
  const target = "user42@mail.com";
  const t0 = performance.now();
  customers.find((c) => c.email === target);
  const linear = performance.now() - t0;
  const map = useMemo(() => new Map(customers.filter((c) => c.email).map((c) => [c.email!, c])), []);
  const t1 = performance.now();
  map.get(target);
  const indexed_ms = performance.now() - t1;

  const ms = indexed ? indexed_ms : linear;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Indexed vs Non-Indexed lookup</div>
          <p className="text-xs text-muted-foreground">SELECT * FROM CUSTOMERS WHERE email = '{target}';</p>
        </div>
        <button onClick={() => setIndexed((v) => !v)}
          className="px-3 py-1.5 rounded-md text-xs border border-border hover:bg-accent">
          Toggle: {indexed ? "INDEX ON" : "INDEX OFF"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border p-3">
          <div className="text-[10px] uppercase text-muted-foreground">Strategy</div>
          <div className="text-lg font-semibold mt-1">{indexed ? "Index Seek (B-Tree)" : "Full Table Scan"}</div>
        </div>
        <div className="rounded-md border border-border p-3">
          <div className="text-[10px] uppercase text-muted-foreground">Simulated time</div>
          <div className={`text-lg font-semibold mt-1 ${indexed ? "text-emerald-400" : "text-amber-400"}`}>
            {ms.toFixed(3)} ms
          </div>
        </div>
      </div>
      <pre className="text-[11px] font-mono whitespace-pre-wrap text-foreground/85 bg-surface-2 p-3 rounded">
{indexed
  ? `-- EXPLAIN
type=ref  key=idx_email  rows=1
USING INDEX
-- Suggestion: CREATE INDEX idx_email ON CUSTOMERS(email);`
  : `-- EXPLAIN
type=ALL   key=NULL   rows=${customers.length}
NO INDEX USED — full scan of CUSTOMERS
-- Add: CREATE INDEX idx_email ON CUSTOMERS(email);`}
      </pre>
    </div>
  );
}

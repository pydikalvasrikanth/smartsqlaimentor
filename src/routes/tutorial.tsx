import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useResumableState } from "@/lib/resume";
import { ResumePrompt } from "@/components/ResumePrompt";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, BookOpen, ArrowRight, Layers } from "lucide-react";

export const Route = createFileRoute("/tutorial")({
  head: () => ({
    meta: [
      { title: "MySQL Visual Learning — Interactive Tutorials" },
      {
        name: "description",
        content:
          "Learn MySQL visually: DDL, DML, joins, window functions, CTEs and indexes with animated, step-by-step explanations.",
      },
      { property: "og:title", content: "MySQL Visual Learning" },
      {
        property: "og:description",
        content: "Interactive, animated MySQL tutorials covering every topic from basics to advanced.",
      },
      { property: "og:url", content: "https://smartsqlaimentor.lovable.app/tutorial" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.lovable.app/tutorial" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: "MySQL Visual Learning — Interactive Tutorials",
          description:
            "Learn MySQL visually: DDL, DML, joins, window functions, CTEs and indexes with animated, step-by-step explanations.",
          learningResourceType: "Interactive tutorial",
          teaches: "MySQL",
          url: "https://smartsqlaimentor.lovable.app/tutorial",
          inLanguage: "en",
          educationalLevel: "Beginner to Advanced",
        }),
      },
    ],
  }),
  component: TutorialPage,
});

interface Module {
  id: string;
  file: string;
  badge: string;
  title: string;
  desc: string;
  topics: string[];
  accent: string;
}

const MODULES: Module[] = [
  {
    id: "core",
    file: "/mysql-tutorial.html",
    badge: "PART 1 · QUERY ENGINE",
    title: "Core Query Topics",
    desc: "The heavy-hitters of SQL interviews — combine, rank and aggregate data with fully animated row matching.",
    topics: ["JOINs", "Window Functions", "GROUP BY", "CTEs", "Indexes", "Subqueries", "Quiz"],
    accent: "from-cyan-500 to-violet-500",
  },
  {
    id: "foundations",
    file: "/mysql-tutorial-foundations.html",
    badge: "PART 2 · FOUNDATIONS & BEYOND",
    title: "DDL · DML · DCL · TCL & More",
    desc: "Everything else, basics to advanced: building & changing tables, modifying data, permissions, transactions and pivots.",
    topics: [
      "CREATE / ALTER / DROP",
      "Data Types & Constraints",
      "INSERT / UPDATE / DELETE",
      "Upserts",
      "GRANT / REVOKE & Roles",
      "Transactions & Savepoints",
      "Isolation Levels",
      "SELECT / WHERE & Pivot",
      "Quiz",
    ],
    accent: "from-emerald-500 to-orange-500",
  },
  {
    id: "functions",
    file: "/mysql-tutorial-functions.html",
    badge: "PART 3 · FUNCTIONS & TYPES LAB",
    title: "Data Types & All Functions",
    desc: "The complete reference: every data type explained with 3D flip cards, plus live input→output demos for string, date, math, aggregate, window, control-flow, CAST and operator functions.",
    topics: [
      "Data Type Explorer",
      "String Functions",
      "Date & Time Functions",
      "Numeric & Math",
      "Aggregate & Window",
      "IF / CASE / COALESCE",
      "CAST & CONVERT",
      "Operators & LIKE",
      "Quiz",
    ],
    accent: "from-violet-500 to-pink-500",
  },
];

function TutorialPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<Module | null>(null);

  const resume = useResumableState<{ moduleId: string | null }>(
    "tutorial",
    { moduleId: null },
    { isEmpty: (s: any) => !s || !s.moduleId },
  );

  useEffect(() => {
    if (!resume.ready) return;
    resume.setState({ moduleId: active?.id ?? null });
  }, [active, resume.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (active) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="border-b border-border bg-surface-2/60 backdrop-blur z-10 shrink-0">
          <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setActive(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Back to tutorial list"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold tracking-tight">{active.title}</h1>
              <p className="text-[11px] text-muted-foreground font-mono">{active.badge.toLowerCase()}</p>
            </div>
          </div>
        </header>
        <iframe
          src={active.file}
          title={active.title}
          className="flex-1 w-full border-0"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface-2/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/practice"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Back to SQL practice"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight">MySQL Visual Learning</h1>
            <p className="text-[11px] text-muted-foreground font-mono">
              interactive tutorials · basics to advanced
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 py-12">
        {resume.hasResumable && resume.savedSnapshot && (
          <ResumePrompt
            updatedAt={resume.savedSnapshot.updatedAt}
            meta={
              MODULES.find((m) => m.id === resume.savedSnapshot!.state.moduleId)?.title ??
              "Last module"
            }
            onResume={() => {
              const id = resume.savedSnapshot!.state.moduleId;
              const mod = MODULES.find((m) => m.id === id);
              if (mod) setActive(mod);
              resume.hydrate(resume.savedSnapshot);
            }}
            onDismiss={resume.dismiss}
          />
        )}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Learn MySQL, visually</h2>
          <p className="text-muted-foreground">
            Step through every concept with animated, interactive explanations. Pick a module —
            together they cover the whole language from defining tables to advanced queries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => setActive(m)}
              className="group text-left rounded-2xl border border-border bg-surface-1 p-6 hover:border-primary/60 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.3)] transition-all flex flex-col"
            >
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${m.accent} grid place-items-center mb-4`}>
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <p className="text-[11px] font-mono text-muted-foreground mb-1">{m.badge}</p>
              <h3 className="text-xl font-semibold mb-2">{m.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{m.desc}</p>
              <ul className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground mb-6 mt-auto">
                {m.topics.map((t) => (
                  <li key={t} className="px-2 py-0.5 rounded border border-border bg-surface-2/60 font-mono">
                    {t}
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                Start learning <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

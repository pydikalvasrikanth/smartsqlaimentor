import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Database, Code2, Cloud, ArrowRight, LogOut, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Interview Intelligence — SQL, Python & GCP practice" },
      { name: "description", content: "Pick a subject and practice with an AI mentor: SQL, Python, or GCP Data Engineer interview questions from top MNCs." },
      { property: "og:title", content: "Interview Intelligence Engine" },
      { property: "og:description", content: "AI-powered interview practice for SQL, Python and GCP Data Engineering." },
      { property: "og:url", content: "https://smartsqlaimentor.lovable.app/" },
    ],
    links: [
      { rel: "canonical", href: "https://smartsqlaimentor.lovable.app/" },
    ],
  }),
  component: SubjectPicker,
});

interface Subject {
  id: string;
  to: "/practice" | "/python" | "/gcp";
  title: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  highlights: string[];
}

const SUBJECTS: Subject[] = [
  {
    id: "sql",
    to: "/practice",
    title: "SQL",
    tagline: "MySQL 8 · AI mentor",
    description: "Generated schemas, ERDs, semantic grading, hints, debug & query visualization across 50-question sessions.",
    icon: Database,
    accent: "from-blue-500 to-cyan-500",
    highlights: ["Schema + seed generated per question", "Semantic AI evaluation", "Interview mode (FAANG-style)"],
  },
  {
    id: "python",
    to: "/python",
    title: "Python",
    tagline: "Coding interviews · AI graded",
    description: "Data structures, algorithms, OOP & system design micros. AI mentally executes your code against hidden tests.",
    icon: Code2,
    accent: "from-yellow-500 to-emerald-500",
    highlights: ["50-question progressive session", "AI hints + complexity analysis", "Beginner → Advanced ramp"],
  },
  {
    id: "gcp",
    to: "/gcp",
    title: "GCP Data Engineer",
    tagline: "100+ MNC interview Q&A",
    description: "Curated BigQuery, Dataflow, Pub/Sub, Composer, IAM & cost-optimization questions asked at Google, Stripe, Uber & top Indian MNCs.",
    icon: Cloud,
    accent: "from-orange-500 to-pink-500",
    highlights: ["Answer + interviewer rationale", "Filter by topic & level", "Self-mark progress"],
  },
];

function SubjectPicker() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface-2/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight">Interview Intelligence Engine</h1>
            <p className="text-[11px] text-muted-foreground font-mono">pick a subject · practice with AI</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[11px] font-mono">
            <span className="text-muted-foreground hidden sm:inline">{user.email}</span>
            <button onClick={() => signOut()} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border hover:bg-accent">
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <h2 className="text-4xl font-bold tracking-tight">Choose your subject</h2>
          <p className="text-muted-foreground">Each track is powered by an AI mentor that generates questions, grades your work, and tracks weak spots. Plans, mastery, and difficulty ramps are personal to you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SUBJECTS.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.id}
                to={s.to}
                className="group rounded-2xl border border-border bg-surface-1 p-6 hover:border-primary/60 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.3)] transition-all flex flex-col"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.accent} grid place-items-center mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="text-[11px] font-mono text-muted-foreground mb-3">{s.tagline}</p>
                <p className="text-sm text-muted-foreground mb-4">{s.description}</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground mb-6 mt-auto">
                  {s.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span> {h}
                    </li>
                  ))}
                </ul>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  Start practicing <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-1 px-5 py-3 hover:border-primary/60 transition-all text-sm"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Open AI Chat — attach images, files & videos
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/interview"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-5 py-3 hover:border-primary/70 transition-all text-sm"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Take a live AI Interview — voice + camera mock interview
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Database, Code2, Cloud, Coffee, ArrowRight, LogOut, Sparkles, Mic, Terminal } from "lucide-react";
import { ThemeToggle } from "@/hooks/use-theme";
import { HeaderTimer } from "@/components/HeaderTimer";
import { SubjectSeoShell, SUBJECT_SEO_CONTENT } from "@/components/SubjectSeoShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart AI Code Playground — AI-Graded Coding Practice" },
      { name: "description", content: "Smart AI Code Playground: AI-graded coding practice and mock interviews for SQL, Python, Java, PySpark and GCP Data Engineering roles at top MNCs." },
      { property: "og:title", content: "Smart AI Code Playground — AI-Graded Coding Practice" },
      { property: "og:description", content: "AI-graded practice for SQL, Python, Java, PySpark and GCP Data Engineering interviews — with live voice interviews and resumable sessions." },
      { property: "og:url", content: "https://smartsqlaimentor.live/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://smartsqlaimentor.live/" },
    ],
  }),
  component: SubjectPicker,
});

interface Subject {
  id: string;
  to: "/mysql" | "/python" | "/java" | "/gcp" | "/pyspark" | "/cpp";
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  highlights: string[];
}

const SUBJECTS: Subject[] = [
  {
    id: "sql",
    to: "/mysql",
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
    id: "java",
    to: "/java",
    title: "Java",
    tagline: "Java 17/21 · AI graded",
    description: "Modern Java coding practice: records, streams, concurrency, Spring Boot & JPA. AI grades your code against hidden tests.",
    icon: Coffee,
    accent: "from-red-500 to-amber-500",
    highlights: ["Records, sealed types, virtual threads", "Collections, Streams & concurrency drills", "Backend & Spring Boot scenarios"],
  },
  {
    id: "pyspark",
    to: "/pyspark",
    title: "PySpark",
    tagline: "Apache Spark 3.5 · AI graded",
    description: "PySpark DataFrame API practice: joins, window functions, UDFs, partitioning & streaming. Real data-engineering scenarios graded by AI.",
    icon: Sparkles,
    accent: "from-amber-500 to-rose-500",
    highlights: ["DataFrame + Spark SQL fluency", "Window, joins & broadcast tuning", "Structured streaming & Delta"],
  },
  {
    id: "cpp",
    to: "/cpp",
    title: "C / C++",
    tagline: "C11 & C++17 · AI graded",
    description: "One playground for C and C++. Toggle the language per question and drill pointers, memory, STL, templates and classic DSA — all AI-graded.",
    icon: Terminal,
    accent: "from-indigo-500 to-blue-500",
    highlights: ["C ↔ C++ language toggle", "Pointers, memory & STL fluency", "Beginner → Advanced ramp"],
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
    return <SubjectSeoShell {...SUBJECT_SEO_CONTENT.home} />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle ambient background — refines existing look without changing palette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl animate-pulse [animation-duration:8s]" />
        <div className="absolute top-1/3 -right-32 h-[22rem] w-[22rem] rounded-full bg-primary-glow/15 blur-3xl animate-pulse [animation-duration:11s]" />
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>
      <header className="border-b border-border bg-surface-2/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <span className="text-sm font-semibold tracking-tight block">Smart AI Code Playground</span>
            <p className="text-[11px] text-muted-foreground font-mono">pick a subject · practice with AI</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[11px] font-mono">
            <span className="text-muted-foreground hidden md:inline">{user.email}</span>
            <HeaderTimer storageKey="subject_timer" />
            <ThemeToggle />
            <button
              onClick={() => signOut()}
              aria-label="Sign out"
              title="Sign out"
              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border hover:bg-accent whitespace-nowrap"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 pt-14 pb-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto space-y-5 mb-14"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            AI mentor · live grading
          </span>
          <h1 className="text-4xl md:text-6xl leading-[1.05] tracking-tight text-foreground">
            Smart AI Code{" "}
            <em className="text-primary not-italic bg-linear-to-r from-primary to-primary-glow bg-clip-text text-transparent italic">
              Playground
            </em>{" "}
            <span className="block mt-2 text-2xl md:text-3xl font-semibold text-muted-foreground">
              AI-graded coding practice for SQL, Python, Java, PySpark & GCP
            </span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Adaptive SQL, Python, and GCP tracks with an AI mentor that generates questions,
            grades your work, and tracks weak spots — personal to you.
          </p>
        </motion.div>

        <h2 className="sr-only">Practice tracks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {SUBJECTS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.08, ease: "easeOut" }}
              >
                <Link
                  to={s.to}
                  preload="intent"
                  className="group relative block h-full rounded-2xl border border-border bg-surface-1/70 backdrop-blur-sm p-6 hover:border-primary/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  <div
                    className={`absolute inset-x-0 -top-px h-px bg-gradient-to-r ${s.accent} opacity-40 group-hover:opacity-100 transition-opacity`}
                  />
                  <div
                    className={`absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${s.accent} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`}
                  />
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.accent} grid place-items-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{s.title}</h3>
                  <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-3">{s.tagline}</p>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{s.description}</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground mb-6 mt-auto">
                    {s.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <span className="text-primary mt-1 h-1 w-1 rounded-full bg-primary shrink-0" /> {h}
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    Start practicing <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.42 }}
          className="mt-10 grid grid-cols-1 sm:grid-cols-1 gap-4"
        >
          <Link
            to="/interview"
            preload="intent"
            className="group flex items-center gap-3 rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 to-primary-glow/5 px-5 py-4 hover:border-primary/70 transition-all"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/20 grid place-items-center shrink-0">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Live AI Interview</div>
              <div className="text-[11px] text-muted-foreground">Voice + camera mock interview</div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>
        </motion.div>
      </main>

      <footer className="border-t border-border bg-surface-2/40 mt-8">
        <div className="max-w-[1200px] mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Practice</h2>
            <ul className="space-y-2">
              <li><Link to="/mysql" className="hover:text-primary">MySQL Practice</Link></li>
              <li><Link to="/python" className="hover:text-primary">Python Coding</Link></li>
              <li><Link to="/java" className="hover:text-primary">Java Coding</Link></li>
              <li><Link to="/pyspark" className="hover:text-primary">PySpark</Link></li>
              <li><Link to="/cpp" className="hover:text-primary">C / C++ Coding</Link></li>
              <li><Link to="/gcp" className="hover:text-primary">GCP Data Engineer</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Learn</h2>
            <ul className="space-y-2">
              <li><Link to="/tutorial" className="hover:text-primary">MySQL Tutorial</Link></li>
              <li><Link to="/engine" className="hover:text-primary">Interview Engine</Link></li>
              <li><Link to="/chat" className="hover:text-primary">AI Chat Mentor</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Interview</h2>
            <ul className="space-y-2">
              <li><Link to="/interview" className="hover:text-primary">Live AI Interview</Link></li>
              <li><Link to="/feedback" className="hover:text-primary">Feedback</Link></li>
              <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Company</h2>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-primary">About</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary">Terms of Use</Link></li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              AI-graded practice for SQL, Python, Java, PySpark, C/C++ and GCP Data Engineering interviews.
            </p>
          </div>
        </div>
        <div className="border-t border-border/60 py-4 text-center text-[11px] font-mono text-muted-foreground">
          © {new Date().getFullYear()} Smart AI Code Playground
        </div>
      </footer>
    </div>
  );
}
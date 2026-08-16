import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  Wrench,
  BookOpen,
  Target,
  Boxes,
  Trophy,
  Mic,
  Database,
  Code2,
  Coffee,
  Cloud,
  Terminal,
  Sparkles,
  Brain,
  Save,
  LineChart,
  Video,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

type Icon = React.ComponentType<{ className?: string }>;

const TABS: Array<{ icon: Icon; name: string; purpose: string; use: string }> = [
  {
    icon: Calendar,
    name: "Today",
    purpose: "Your daily warm-up. One fresh, level-appropriate question every day so practice becomes a habit instead of a weekend cram.",
    use: "Use it for a 15-minute daily streak.",
  },
  {
    icon: Wrench,
    name: "Free practice",
    purpose: "An open 15-question session on any business domain you type in (e-commerce, banking, logistics…). Difficulty ramps from beginner to advanced as you go.",
    use: "Use it when you just want volume and variety.",
  },
  {
    icon: BookOpen,
    name: "Topic-wise",
    purpose: "Pick a single concept — joins, window functions, CTEs, indexes, pointers, streams, DataFrames — and drill a focused set of questions on only that concept.",
    use: "Use it to turn one weak topic into a strength.",
  },
  {
    icon: Target,
    name: "Targeted",
    purpose: "Tell the mentor your goal or the company you're interviewing at, and it builds a personalised plan of questions matched to that hiring bar.",
    use: "Use it in the last week before an interview.",
  },
  {
    icon: Boxes,
    name: "Data Engineering",
    purpose: "Real-world pipeline and warehouse scenarios: modeling, SCDs, ETL/ELT, quality checks, partitioning and cost-aware SQL — the questions data teams actually ask.",
    use: "Use it for DE / analytics-engineer roles.",
  },
  {
    icon: Trophy,
    name: "Solved",
    purpose: "Your personal library. Every question you solve is saved with your answer, the model solution and the unique functions you used, so revision is instant.",
    use: "Use it to revise the night before.",
  },
];

const SUBJECTS: Array<{ to: "/mysql" | "/python" | "/java" | "/pyspark" | "/cpp" | "/gcp"; icon: Icon; title: string; blurb: string }> = [
  { to: "/mysql", icon: Database, title: "SQL / MySQL", blurb: "Generated schemas, seed data, ERDs and semantic query grading." },
  { to: "/python", icon: Code2, title: "Python", blurb: "DSA, OOP and system-design micros graded against hidden tests." },
  { to: "/java", icon: Coffee, title: "Java", blurb: "Collections, streams, concurrency, records and Spring Boot scenarios." },
  { to: "/pyspark", icon: Sparkles, title: "PySpark", blurb: "DataFrames, joins, windows, tuning and structured streaming." },
  { to: "/cpp", icon: Terminal, title: "C / C++", blurb: "Pointers, memory, STL and templates with a per-question language toggle." },
  { to: "/gcp", icon: Cloud, title: "GCP Data Engineer", blurb: "BigQuery, Dataflow, Pub/Sub, Composer, IAM and cost optimization Q&A." },
];

const INTERVIEW: Array<{ icon: Icon; title: string; body: string }> = [
  { icon: FileText, title: "Paste the job description", body: "Add the role, stack and JD. The interviewer calibrates its questions and its scoring bar to that exact job instead of asking generic trivia." },
  { icon: Mic, title: "Speak your answers", body: "A real voice conversation with an animated AI interviewer. Voice activity detection means it pauses the moment you start talking — you can interrupt, just like a real call." },
  { icon: Video, title: "Camera + scratchpad", body: "Your webcam preview keeps it realistic, and a live scratchpad lets you write code or sketch a design while you explain." },
  { icon: LineChart, title: "Full scorecard at the end", body: "A written report with per-skill radar scores, strengths, gaps, better phrasings for weak answers and a clear next-step study plan." },
];

const WHY: Array<{ icon: Icon; title: string; body: string }> = [
  { icon: Brain, title: "Graded on meaning, not string match", body: "The mentor traces your logic line by line against the test data, so a different-but-correct solution still passes and a lucky guess doesn't." },
  { icon: BookOpen, title: "Theory built around your question", body: "Every question comes with a 7-part explainer — mental model, syntax patterns, schema strategy, an end-to-end trace, edge cases and a sanity checklist — plus animated flow diagrams." },
  { icon: Save, title: "Resume exactly where you stopped", body: "Autosave checkpoints per subject. Close the tab mid-question, come back on another device, and your question and code are still there." },
];

export function HomeLanding() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="aurora -top-40 -left-32 h-[26rem] w-[26rem] bg-primary/25" />
          <div className="aurora -bottom-40 -right-24 h-[22rem] w-[22rem] bg-primary-glow/25" style={{ animationDelay: "-6s" }} />
          <div className="aurora top-10 left-1/2 h-[18rem] w-[18rem] bg-primary/15" style={{ animationDelay: "-11s" }} />
          <div className="perspective-grid absolute inset-x-0 bottom-0 h-56 opacity-60" />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="fade-up">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            All-in-one AI playground · 6 subjects
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            One AI playground for{" "}
            <span className="shimmer-text">SQL, Python, Java, C/C++, PySpark &amp; GCP</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Practice every coding interview subject in one place. The AI generates questions, grades your real code,
            explains the theory, and resumes exactly where you left off — across every language and device.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="shine inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_-18px_var(--color-primary)] transition-transform hover:-translate-y-0.5"
            >
              Create your free account <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#tracks"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-card/60 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:border-primary/60 hover:bg-accent"
            >
              See all tracks
            </a>
          </div>

          {/* Quick track chips */}
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { to: "/mysql", label: "SQL" },
              { to: "/python", label: "Python" },
              { to: "/java", label: "Java" },
              { to: "/cpp", label: "C / C++" },
              { to: "/pyspark", label: "PySpark" },
              { to: "/gcp", label: "GCP" },
            ].map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className="inline-flex items-center rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
              >
                {t.label}
              </Link>
            ))}
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["6 subjects", "6 practice modes per subject", "Live AI voice interview", "Progress saved across devices"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
              </li>
            ))}
          </ul>
          </div>

          {/* 3D centerpiece */}
          <div aria-hidden className="relative hidden h-[340px] place-items-center lg:grid">
            <div className="orbit-ring absolute h-[300px] w-[300px] rounded-full border border-dashed border-primary/30" />
            <div className="absolute h-[210px] w-[210px] rounded-full bg-primary/10 blur-2xl" />
            <div className="cube-stage float-slow">
              <div className="cube h-40 w-40">
                <div className="cube-face" style={{ transform: "translateZ(80px)" }}>SELECT</div>
                <div className="cube-face" style={{ transform: "rotateY(90deg) translateZ(80px)" }}>def()</div>
                <div className="cube-face" style={{ transform: "rotateY(180deg) translateZ(80px)" }}>class</div>
                <div className="cube-face" style={{ transform: "rotateY(-90deg) translateZ(80px)" }}>df.agg</div>
                <div className="cube-face" style={{ transform: "rotateX(90deg) translateZ(80px)" }}>int*</div>
                <div className="cube-face" style={{ transform: "rotateX(-90deg) translateZ(80px)" }}>BigQuery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4">
        {/* Tabs explained */}
        <section id="tabs" className="scroll-mt-20 border-b border-border py-14 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Every practice tab, and what it's for
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Each subject opens into the same six tabs, so once you learn one workspace you know them all. Pick the tab that
            matches what you need today.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.name}
                  className="rounded-2xl border border-border bg-surface-1/70 p-5 transition-colors hover:border-primary/50"
                >
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{t.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.purpose}</p>
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-primary">{t.use}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Alongside the tabs, every question ships with an <strong className="text-foreground">ERD, schema, seed data, an About
            panel and a Theory panel</strong> on a resizable side pane — plus hints, debugging help and an AI chat mentor you can
            ask anything, including screenshots.
          </p>
        </section>

        {/* Live interview */}
        <section className="border-b border-border py-14 sm:py-20">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Live AI Interview — the closest thing to the real call
            </h2>
          </div>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Most people can solve the problem but freeze when they have to explain it out loud. The live interview fixes
            exactly that: a spoken, timed, JD-aware mock interview that ends with a written scorecard.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {INTERVIEW.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.07] to-transparent p-5">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              );
            })}
          </div>
          <Link
            to="/interview"
            className="mt-7 inline-flex items-center gap-2 rounded-lg border border-primary/50 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            Explore the live interview <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Subjects */}
        <section id="tracks" className="scroll-mt-20 border-b border-border py-14 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Six tracks. One account. Zero switching cost.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every track has its own AI question engine, visual tutorials, solved library, and progress state — switching
            between SQL, Python, Java, C/C++, PySpark or GCP never overwrites another one.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SUBJECTS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className="group rounded-2xl border border-border p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50"
                >
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.blurb}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    Open track <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Why */}
        <section className="border-b border-border py-14 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Why it's different</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {WHY.map((w) => {
              const Icon = w.icon;
              return (
                <div key={w.title} className="border-l-2 border-primary pl-4">
                  <Icon className="mb-2 h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Who it's for + steps */}
        <section className="border-b border-border py-14 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Who it's for</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Students and freshers building fundamentals from zero",
              "Data analysts and engineers moving into SQL / BigQuery / Spark roles",
              "Backend and DSA candidates preparing for MNC and FAANG-style rounds",
              "Working engineers with 30 minutes a day and an interview next month",
            ].map((w) => (
              <li key={w} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {w}
              </li>
            ))}
          </ul>

          <h3 className="mt-12 text-xl font-semibold text-foreground">Getting started takes a minute</h3>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              "Create a free account with email or Google.",
              "Pick a subject, then pick the tab that matches your goal — Today for habit, Topic-wise for a weak area, Targeted before an interview.",
              "Solve, read the theory, review the AI feedback, and book a live mock interview when you're ready.",
            ].map((s, i) => (
              <li key={s} className="border-l-2 border-primary pl-4">
                <p className="font-mono text-xs text-primary">Step {i + 1}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section className="py-14 sm:py-20">
          <div className="rounded-3xl border border-border bg-surface-2 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Start practicing today — it's free
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Sign in once and your questions, code, theory and progress follow you across every device.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Create your free account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent"
              >
                Read the FAQ
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
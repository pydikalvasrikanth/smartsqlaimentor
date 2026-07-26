import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const APP_NAME = "Smart AI Code Playground";
const SITE = "https://smartsqlaimentor.lovable.app";
const EMAIL = "pydikalvasrikanth@gmail.com";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How does the AI grading work?",
    a: "When you submit a query or program, the app sends your code, the question, and the generated schema or test cases to a large language model. The model reasons through your solution semantically rather than just string-matching, then returns a verdict, an explanation of what passed or failed, and where relevant a performance note and a best-practice tip. Because it grades meaning, a correct answer written differently from the reference solution still passes.",
  },
  {
    q: "Which SQL dialect is used?",
    a: "MySQL 8 is the default dialect for schemas, seed data, and reference solutions, including window functions and CTEs. Most answers written in standard ANSI SQL will also be accepted, and the mentor will point out where a construct is MySQL-specific.",
  },
  {
    q: "Which languages and tracks are available?",
    a: "SQL, Python, Java, PySpark, C and C++ (in one shared playground with a language toggle), plus a curated GCP Data Engineer question bank covering BigQuery, Dataflow, Pub/Sub, Composer, IAM, data modelling, warehousing and ETL/ELT.",
  },
  {
    q: "Is it free?",
    a: "Yes — every track, the AI mentor, the theory explanations, and the live AI interview are free to use with an account. There is no payment step and no card is required. Usage may be rate-limited during heavy load to keep the app responsive for everyone.",
  },
  {
    q: "Do I need an account, and can I sign in with Google?",
    a: "An account is required so your progress, solved library, and resume checkpoints can be saved and synced. You can sign up with email and password or with Google Sign-In.",
  },
  {
    q: "Does my progress save if I close the tab?",
    a: "Yes. Each track autosaves checkpoints of your active question, your editor buffer, and your session progress. When you return, a Resume prompt offers to drop you back exactly where you left off. Each subject has its own separate slot, so Python work never overwrites SQL work.",
  },
  {
    q: "How does the live AI interview score me?",
    a: "The interview runs in phases — introduction, technical depth, problem solving and wrap-up — with voice input and barge-in so you can interrupt naturally. Afterwards you get a scorecard rating technical accuracy, communication, problem-solving approach and depth, plus specific strengths and areas to work on. Scores are practice signals, not certifications.",
  },
  {
    q: "Does the code I write actually run?",
    a: "Submissions are evaluated by AI reasoning against expected outputs and hidden test cases rather than being executed on a real server runtime. That makes feedback fast and lets it explain your logic, but it also means edge cases can occasionally be judged imperfectly — treat a verdict as strong guidance rather than a compiler result.",
  },
  {
    q: "Can I see my solved questions again later?",
    a: "Yes. Each track has a Solved tab that stores every question you have completed together with your answer, the explanation, and the unique functions you used, so you can revise them before an interview.",
  },
  {
    q: "How do I report a bug or request a topic?",
    a: `Use the in-app feedback button, the contact page, or email ${EMAIL} directly. Please mention the track, the question you were on, and what you expected to happen — that makes fixes much faster.`,
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: `FAQ — ${APP_NAME}` },
      {
        name: "description",
        content: `Answers to common questions about ${APP_NAME}: how AI grading works, supported SQL dialects and languages, pricing, saved progress, and reporting bugs.`,
      },
      { property: "og:title", content: `FAQ — ${APP_NAME}` },
      {
        property: "og:description",
        content: `How AI grading works, which languages and SQL dialects are supported, whether it's free, and how progress is saved.`,
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/faq` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/faq` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="px-4 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
            Everything people usually ask before their first practice session.
          </p>

          <div className="mt-8 space-y-3">
            {FAQS.map((f, i) => (
              <details
                key={f.q}
                open={i === 0}
                className="group rounded-2xl border border-border bg-card p-5 open:border-primary/40"
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-foreground marker:hidden">
                  <span className="flex items-start justify-between gap-4">
                    <span>
                      <h2 className="inline text-base font-semibold">{f.q}</h2>
                    </span>
                    <span className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Still stuck?{" "}
            <Link to="/contact" className="text-primary hover:underline">
              Contact us
            </Link>{" "}
            — or read the{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Use
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
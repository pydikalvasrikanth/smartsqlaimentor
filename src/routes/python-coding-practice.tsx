import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/python-coding-practice")({
  head: () => ({
    meta: [
      { title: "Python Coding Practice with AI Grading — Smart AI Code Playground" },
      { name: "description", content: "Practice Python coding interviews with an AI mentor: data structures, algorithms, OOP and system design. Instant hints, complexity analysis and hidden-test grading." },
      { property: "og:title", content: "Python Coding Practice with AI Grading" },
      { property: "og:description", content: "AI-graded Python coding practice — DSA, OOP and system design. Beginner to advanced." },
      { property: "og:url", content: "https://smartsqlaimentor.live/python-coding-practice" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.live/python-coding-practice" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: "Python Coding Practice",
          learningResourceType: "Interactive practice",
          teaches: "Python data structures, algorithms, OOP and system design for coding interviews",
          url: "https://smartsqlaimentor.live/python-coding-practice",
        }),
      },
    ],
  }),
  component: PyLanding,
});

const TOPICS = [
  "Arrays, strings & hashing", "Two pointers & sliding window", "Binary search patterns",
  "Recursion & backtracking", "Dynamic programming", "Graphs (BFS, DFS, Dijkstra)",
  "Trees & tries", "OOP & design patterns", "Concurrency & asyncio",
  "System design micros", "Testing with pytest", "Complexity analysis",
];

function PyLanding() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Python practice</p>
        <h1 className="mb-4">Python Coding Practice — AI-Graded</h1>
        <p className="text-muted-foreground text-lg mb-8">
          A 50-question adaptive Python session that ramps from beginner to advanced. The AI mentor mentally executes your code against hidden tests, calls out complexity issues, and offers targeted hints — without spoiling the answer.
        </p>
        <div className="flex flex-wrap gap-3 mb-12">
          <Link to="/python" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90">
            Start Python playground <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/interview" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent">
            Try live interview
          </Link>
        </div>

        <h2 className="mb-4">What you'll drill</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-12">
          {TOPICS.map((t) => (
            <li key={t} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> {t}
            </li>
          ))}
        </ul>

        <h2 className="mb-4">Multi-language editor</h2>
        <p className="text-muted-foreground mb-12">
          Same playground, four languages: Python, Java, C and C++. Switch languages mid-session without losing your in-progress code — every buffer is autosaved locally and to the cloud.
        </p>

        <div className="rounded-2xl border border-border bg-surface-2 p-8 text-center">
          <h2 className="mb-3">Ready to code?</h2>
          <Link to="/python" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium">
            Open Python Playground <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
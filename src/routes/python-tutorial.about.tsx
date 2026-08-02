import { createFileRoute, Link } from "@tanstack/react-router";
import { resetProgress } from "@/tutorials/python/lib/progress";

export const Route = createFileRoute("/python-tutorial/about")({
  head: () => ({
    meta: [
      { title: "About the Python Visual Explainer" },
      {
        name: "description",
        content:
          "How this interactive Python curriculum works: animated step-throughs, a live in-browser Python runtime, quizzes, and where your progress is stored.",
      },
      { property: "og:title", content: "About the Python Visual Explainer — how the lessons work" },
      {
        property: "og:description",
        content: "35 animated Python lessons with a live in-browser Python runtime and quizzes.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://smartsqlaimentor.live/python-tutorial/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.live/python-tutorial/about" }],
  }),
  component: AboutTutorial,
});

function AboutTutorial() {
  return (
    <div className="px-5 sm:px-6 lg:px-10 py-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold tracking-tight">About this Python tutorial</h1>
      <p className="mt-3 text-muted-foreground">
        The Python Visual Explainer is a hands-on curriculum covering 35 topics across six levels — from
        your first <code className="mono text-primary">print</code> to metaclasses and the GIL.
      </p>

      <h2 className="mt-8 text-lg font-bold">How each lesson works</h2>
      <ul className="mt-2 space-y-2 text-sm text-foreground/85">
        <li>
          · <b>Explanation</b> — a few short sections framing the concept.
        </li>
        <li>
          · <b>Animated step-through</b> — advance through the example one line at a time and watch
          variables, the call stack and the heap update.
        </li>
        <li>
          · <b>Live playground</b> — real Python running in your browser via Pyodide (WebAssembly).
        </li>
        <li>
          · <b>Quiz</b> — 2–3 questions per topic. Scoring 80% or higher marks the topic complete.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-bold">Your data</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Progress and quiz scores are stored only in your browser's localStorage. Nothing is sent to a
        server, and clearing your browser data clears your progress.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          to="/python-tutorial"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Back to all topics
        </Link>
        <Link
          to="/python"
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface"
        >
          Open the coding playground
        </Link>
        <button
          onClick={() => {
            if (window.confirm("Reset all tutorial progress?")) resetProgress();
          }}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface"
        >
          Reset progress
        </button>
      </div>
    </div>
  );
}
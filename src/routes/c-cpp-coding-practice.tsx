import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/c-cpp-coding-practice")({
  head: () => ({
    meta: [
      { title: "C & C++ Coding Interview Practice — Smart AI Code Playground" },
      { name: "description", content: "Practice C and C++ coding interviews with an AI mentor: pointers, memory management, STL, algorithms and systems programming. Instant hints, complexity analysis and hidden-test grading." },
      { property: "og:title", content: "C & C++ Coding Interview Practice" },
      { property: "og:description", content: "AI-graded C and C++ coding practice — pointers, memory, STL and DSA. Beginner to advanced with a language toggle." },
      { property: "og:url", content: "https://smartsqlaimentor.live/c-cpp-coding-practice" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.live/c-cpp-coding-practice" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: "C & C++ Coding Interview Practice",
          learningResourceType: "Interactive practice",
          teaches: "C, C++, pointers, memory management, STL, data structures, algorithms, systems programming",
          url: "https://smartsqlaimentor.live/c-cpp-coding-practice",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Can I switch between C and C++ in the same session?",
              acceptedAnswer: { "@type": "Answer", text: "Yes. A single playground powers both languages with a C ↔ C++ toggle. Each language keeps its own autosaved code buffer, so switching never wipes your in-progress solution." },
            },
            {
              "@type": "Question",
              name: "Which topics does the C / C++ playground cover?",
              acceptedAnswer: { "@type": "Answer", text: "Pointers, memory management, arrays and strings, dynamic allocation, structs, classes and OOP, templates, STL containers, iterators, algorithms, and classic DSA problems from beginner to advanced." },
            },
            {
              "@type": "Question",
              name: "How is my code graded?",
              acceptedAnswer: { "@type": "Answer", text: "The AI mentally executes your code against hidden test cases, verifies output equivalence, and reports complexity plus any bugs — without spoiling the answer." },
            },
          ],
        }),
      },
    ],
  }),
  component: CppLanding,
});

const TOPICS = [
  "Pointers & references",
  "Dynamic memory (malloc/new)",
  "Arrays, strings & buffers",
  "Structs, classes & OOP",
  "Templates & generics (C++)",
  "STL containers & iterators",
  "STL algorithms (<algorithm>)",
  "Recursion & backtracking",
  "Dynamic programming",
  "Graphs (BFS, DFS, Dijkstra)",
  "Trees, tries & heaps",
  "Competitive-programming patterns",
];

function CppLanding() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">C / C++ practice</p>
        <h1 className="mb-4">C &amp; C++ Coding Interview Practice — AI-Graded</h1>
        <p className="text-muted-foreground text-lg mb-8">
          One adaptive 50-question playground for both C and C++. Toggle the language for any question, and the AI mentor generates idiomatic starter code, hidden tests, and complexity feedback for the language you picked — from pointers and manual memory to STL, templates and systems-style problems.
        </p>
        <div className="flex flex-wrap gap-3 mb-12">
          <Link to="/cpp" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90">
            Start C / C++ playground <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/python" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent">
            Try Python instead
          </Link>
          <Link to="/java" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent">
            Try Java instead
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

        <h2 className="mb-4">One playground, both languages</h2>
        <p className="text-muted-foreground mb-6">
          The C / C++ playground uses the same AI grading pipeline as the rest of the app. For C, the mentor emits C11 with <code>{"#include <stdio.h>"}</code> plus a working <code>main()</code>. For C++, it emits C++17 with a <code>class Solution</code> skeleton and STL headers. Every hint, debug trace, complexity note and reference solution respects the language you picked.
        </p>
        <p className="text-muted-foreground mb-12">
          Your session is autosaved, so if you close the tab you'll resume where you left off — including your language choice and unsaved code.
        </p>

        <div className="rounded-2xl border border-border bg-surface-2 p-8 text-center">
          <h2 className="mb-3">Ready to code?</h2>
          <Link to="/cpp" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium">
            Open C / C++ Playground <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
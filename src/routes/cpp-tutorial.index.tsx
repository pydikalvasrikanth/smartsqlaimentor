import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cCurriculum } from "@/tutorials/ccpp/content/c-lessons";
import { cppCurriculum } from "@/tutorials/ccpp/content/cpp-lessons";
import { flatLessons } from "@/tutorials/ccpp/content/types";

export const Route = createFileRoute("/cpp-tutorial/")({
  head: () => ({
    meta: [
      { title: "C & C++ Visual Explainer — Basics to Job-Ready" },
      {
        name: "description",
        content:
          "Interactive infographic-style tutorials for C and C++ — from Hello World to threads, sockets and modern C++20.",
      },
      { property: "og:title", content: "C & C++ Visual Explainer" },
      {
        property: "og:description",
        content: "Infographic lessons: pointers, memory, RAII, templates, STL, concurrency.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://smartsqlaimentor.live/cpp-tutorial" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.live/cpp-tutorial" }],
  }),
  component: Landing,
});

function Landing() {
  const cTotal = flatLessons(cCurriculum).length;
  const cppTotal = flatLessons(cppCurriculum).length;
  const tracks = [
    { curr: cCurriculum, total: cTotal, to: "/cpp-tutorial/c" as const, tint: "var(--java-blue)" },
    { curr: cppCurriculum, total: cppTotal, to: "/cpp-tutorial/cpp" as const, tint: "var(--purple)" },
  ];
  return (
    <div className="tut-dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[color:var(--java-blue)] text-white">C</span>
            C / C++ Visual Explainer
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/cpp-tutorial/c" className="rounded-lg bg-[color:var(--java-blue)] px-4 py-2 font-semibold text-white hover:opacity-90">Learn C →</Link>
            <Link to="/cpp-tutorial/cpp" className="rounded-lg bg-[color:var(--purple)] px-4 py-2 font-semibold text-white hover:opacity-90">Learn C++ →</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <Link
          to="/cpp"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to C / C++ playground
        </Link>
        <div className="font-mono mb-3 text-xs uppercase tracking-widest text-[color:var(--java-orange)]">
          Infographic · Card-based · {cTotal + cppTotal} lessons
        </div>
        <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
          Learn <span className="text-[color:var(--java-blue)]">C</span> and{" "}
          <span className="text-[color:var(--purple)]">C++</span> the visual way.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Every concept broken into a grid of numbered cards — syntax, example, output, diagram — inspired by SQL infographic slides. From Hello World to threads, sockets, RAII and templates.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {tracks.map(({ curr, total, to, tint }) => (
            <Link key={curr.track} to={to}
              className="rounded-2xl border p-6 transition hover:-translate-y-1"
              style={{ borderColor: `color-mix(in oklab, ${tint} 35%, var(--border))`, background: "var(--card)" }}>
              <div className="font-mono mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: tint }}>
                {curr.modules.length} modules · {total} lessons
              </div>
              <h2 className="text-3xl font-bold" style={{ color: tint }}>{curr.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{curr.tagline}</p>
              <div className="mt-4 text-sm font-semibold" style={{ color: tint }}>Start learning →</div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Built with TanStack Start · infographic-style lessons for C & C++.
      </footer>
    </div>
  );
}

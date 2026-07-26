import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Linkedin,
  Mail,
  Database,
  Sparkles,
  Code2,
  GraduationCap,
  BadgeCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const PROFILE = {
  name: "Srikanth Pydikalva",
  role: "Data Engineer · Creator of Smart AI Code Playground",
  email: "pydikalvasrikanth@gmail.com",
  linkedin: "https://www.linkedin.com/in/srikanth-pydikalva/",
  photo: "/founder.jpg",
};

const APP_NAME = "Smart AI Code Playground";
const SITE = "https://smartsqlaimentor.lovable.app";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About — ${APP_NAME}` },
      {
        name: "description",
        content: `Meet the creator of ${APP_NAME} and learn why it was built to help people master SQL, Python, Java, PySpark and GCP with an AI mentor.`,
      },
      { property: "og:title", content: `About — ${APP_NAME}` },
      {
        property: "og:description",
        content: `Meet the creator of ${APP_NAME} and learn why it was built to help people master coding interviews with AI.`,
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/about` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE}/about` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          name: `About — ${APP_NAME}`,
          url: `${SITE}/about`,
          mainEntity: {
            "@type": "Person",
            name: PROFILE.name,
            jobTitle: PROFILE.role,
            email: `mailto:${PROFILE.email}`,
            sameAs: [PROFILE.linkedin],
            url: `${SITE}/about`,
          },
        }),
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const [imgFailed, setImgFailed] = useState(false);

  const initials = PROFILE.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="px-4 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-3xl">
          <header className="mb-10">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              The story behind {APP_NAME}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              About
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
              A personal project turned learning companion, built to make coding practice feel less
              like studying and more like pair programming.
            </p>
          </header>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                {imgFailed ? (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-secondary text-2xl font-bold text-secondary-foreground">
                    {initials}
                  </div>
                ) : (
                  <img
                    src={PROFILE.photo}
                    alt={`${PROFILE.name}, ${PROFILE.role}`}
                    width={96}
                    height={96}
                    loading="lazy"
                    onError={() => setImgFailed(true)}
                    className="h-24 w-24 rounded-2xl border border-border object-cover"
                  />
                )}
                <span className="absolute -bottom-1 -right-1 rounded-full bg-card p-1">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                </span>
              </div>

              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-foreground">{PROFILE.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{PROFILE.role}</p>

                <div className="mt-4 flex flex-col gap-2 text-sm">
                  <a
                    href={PROFILE.linkedin}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 font-medium text-foreground transition-colors hover:text-primary"
                  >
                    <Linkedin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    LinkedIn profile
                  </a>
                  <a
                    href={`mailto:${PROFILE.email}`}
                    className="inline-flex items-center gap-2 font-medium text-foreground transition-colors hover:text-primary break-all"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {PROFILE.email}
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-foreground">Why {APP_NAME}?</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                I built {APP_NAME} because the fastest way to learn a language is to write it — and
                the fastest way to write more is to get instant, helpful feedback. Most tutorials
                stop after the example; this app keeps going with you, generating questions, grading
                answers, and explaining why a query or program works or fails.
              </p>
              <p>
                The goal is simple: turn SQL, Python, Java, PySpark, C/C++ and GCP data engineering
                from memorization exercises into skills you can use confidently. Whether you are
                preparing for interviews, writing reports, or just curious about databases,{" "}
                {APP_NAME} is designed to be the mentor you open on the side of your screen while
                you practice.
              </p>
            </div>
          </section>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-6">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <h3 className="mt-3 text-base font-semibold text-foreground">AI-powered practice</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Questions and hints are generated dynamically, so every session feels fresh and
                tailored to the topic you choose.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <Database className="h-5 w-5 text-muted-foreground" />
              <h3 className="mt-3 text-base font-semibold text-foreground">Real interview patterns</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Practice covers joins, aggregations, window functions, data structures, algorithms
                and real-world data engineering scenarios.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <Code2 className="h-5 w-5 text-muted-foreground" />
              <h3 className="mt-3 text-base font-semibold text-foreground">Built with modern tools</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                React, TanStack Start, Tailwind CSS, and AI-assisted grading come together for a
                fast, focused practice experience.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <h3 className="mt-3 text-base font-semibold text-foreground">Always learning</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                The app is updated regularly with new questions, better explanations, and feedback
                from the people who use it.
              </p>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href={PROFILE.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Linkedin className="h-4 w-4" />
              Connect on LinkedIn
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Mail className="h-4 w-4" />
              Get in touch
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
## Context

I verified the audit you pasted against this project. Most of it is already done here — branded root metadata, `public/robots.txt`, the dynamic `src/routes/sitemap[.]xml.ts`, `public/favicon.png` + apple-touch-icon, a real landing page in `src/routes/index.tsx`, and root `notFoundComponent`/`errorComponent`. That audit was written against a different, near-empty workbench.

What is genuinely missing: the five content pages and consistent site chrome.

## What I'll build

### 1. Shared chrome

- `src/components/SiteHeader.tsx` — wordmark + nav (Home, Practice, Interview, About, FAQ, Contact), existing theme toggle, mobile sheet menu. Uses current design tokens only, no new colors.
- `src/components/SiteFooter.tsx` — copyright, Privacy, Terms, FAQ, Contact, plus the existing practice-track links.
- Applied to the five new routes only. The landing page and practice/engine routes keep their existing purpose-built headers so I don't disturb the timer, tour, or resume behaviour already wired into them.

### 2. New routes

- `src/routes/about.tsx` — project story, who it's for, the tracks covered, your profile block.
- `src/routes/contact.tsx` — email, LinkedIn, and a link to the existing feedback flow.
- `src/routes/privacy.tsx` — what's collected (account email, practice attempts, feedback messages), that submitted code/questions are processed by an AI provider for grading, retention, and deletion/access rights.
- `src/routes/terms.tsx` — acceptable use, "learning tool, not a production SQL evaluator", no warranty, liability limits, account termination.
- `src/routes/faq.tsx` — 10 Q&As (how AI grading works, supported SQL dialects, is it free, does progress save across devices, how the mock interview scores you, how to report a bug, etc.) plus `FAQPage` JSON-LD.

Each route gets its own `head()` with unique title, description, `og:title`, `og:description`, `og:url`, and a self-referencing canonical.

### 3. Wiring

- `src/routes/sitemap[.]xml.ts` — add `/about`, `/contact`, `/faq`, `/privacy`, `/terms`.
- `src/routes/index.tsx` — add the five pages to the existing footer link groups.

## Two things I need from you

1. **About page code** — you mentioned "this is my about page code" but nothing came through. Paste it and I'll use it verbatim as the About page instead of writing my own.
  Code 
  import { createFileRoute, Link } from "@tanstack/react-router";
2. import { useState } from "react";
3. import {
4.   ArrowLeft,
5.   Linkedin,
6.   Mail,
7.   Database,
8.   Sparkles,
9.   Code2,
10.   GraduationCap,
11.   BadgeCheck,
12. } from "lucide-react";

/**

 * -------------------------------------------------------------------

 * EDIT THESE 5 VALUES ONLY — everything else can stay as-is.

 * -------------------------------------------------------------------

 */

const PROFILE = {

  name: "Srikanth Pydikalva",

  role: "Data Engineer · Creator of SmartSQL AI Mentor",

  email: "pydikalvasrikanth@gmail.com",

  linkedin: "https://www.linkedin.com/in/srikanth-pydikalva/",

  // Put your photo at public/founder.jpg (or paste a full https:// URL here).

  photo: "/founder.jpg",

};

&nbsp;

const APP_NAME = "SmartSQL AI Mentor";

&nbsp;

export const Route = createFileRoute("/about")({

  head: () => ({

    meta: [

      { title: `About — ${APP_NAME}` },

      {

        name: "description",

        content: `Meet the creator of ${APP_NAME} and learn why it was built to help people master SQL with AI.`,

      },

      { property: "og:title", content: `About — ${APP_NAME}` },

      {

        property: "og:description",

        content: `Meet the creator of ${APP_NAME} and learn why it was built to help people master SQL with AI.`,

      },

      { property: "og:type", content: "website" },

      { property: "og:url", content: "/about" },

      { name: "twitter:card", content: "summary_large_image" },

    ],

    links: [{ rel: "canonical", href: "/about" }],

    scripts: [

      {

        type: "application/ld+json",

        children: JSON.stringify({

          "@context": "https://schema.org",

          "@type": "ProfilePage",

          name: `About — ${APP_NAME}`,

          mainEntity: {

            "@type": "Person",

            name: PROFILE.name,

            jobTitle: PROFILE.role,

            email: `mailto:${PROFILE.email}`,

            sameAs: [PROFILE.linkedin],

            url: "/about",

          },

        }),

      },

    ],

  }),

  component: AboutPage,

});

&nbsp;

function AboutPage() {

  const [imgFailed, setImgFailed] = useState(false);

&nbsp;

  const initials = PROFILE.name

    .split(" ")

    .map((p) => p[0])

    .join("")

    .slice(0, 2)

    .toUpperCase();

&nbsp;

  return (

    <main className="min-h-screen bg-background px-4 py-10 sm:py-16">

      <div className="mx-auto w-full max-w-3xl">

        <Link

          to="/"

          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"

        >

          <ArrowLeft className="h-4 w-4" />

          Back to home

        </Link>

&nbsp;

        <header className="mb-10">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">

            The story behind {APP_NAME}

          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">

            About

          </h1>

          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">

            A personal project turned learning companion, built to make SQL practice feel less like studying and more like pair programming.

          </p>

        </header>

&nbsp;

        {/* Profile card */}

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

&nbsp;

            <div className="min-w-0">

              <h2 className="text-xl font-semibold text-foreground">{PROFILE.name}</h2>

              <p className="mt-1 text-sm text-muted-foreground">{PROFILE.role}</p>

&nbsp;

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

                <Link

                  to="/contact"

                  className="inline-flex items-center gap-2 font-medium text-foreground transition-colors hover:text-primary"

                >

                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />

                  {PROFILE.email}

                </Link>

              </div>

            </div>

          </div>

        </section>

&nbsp;

        {/* Story / mission */}

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">

          <h2 className="text-lg font-semibold text-foreground">Why {APP_NAME}?</h2>

          <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">

            <p>

              I built {APP_NAME} because the fastest way to learn SQL is to write it — and the

              fastest way to write more is to get instant, helpful feedback. Most SQL tutorials stop

              after the example; this app keeps going with you, generating questions, grading

              answers, and explaining why a query works or fails.

            </p>

            <p>

              The goal is simple: turn SQL from a syntax memorization exercise into a skill you can

              use confidently. Whether you are preparing for interviews, writing reports, or just

              curious about databases, {APP_NAME} is designed to be the mentor you open on the side

              of your screen while you practice.

            </p>

          </div>

        </section>

&nbsp;

        {/* Highlights / values */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          <section className="rounded-2xl border border-border bg-card p-6">

            <Sparkles className="h-5 w-5 text-muted-foreground" />

            <h3 className="mt-3 text-base font-semibold text-foreground">AI-powered practice</h3>

            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">

              Questions and hints are generated dynamically, so every session feels fresh and

              tailored to the topic you choose.

            </p>

          </section>

&nbsp;

          <section className="rounded-2xl border border-border bg-card p-6">

            <Database className="h-5 w-5 text-muted-foreground" />

            <h3 className="mt-3 text-base font-semibold text-foreground">Real SQL patterns</h3>

            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">

              Practice covers SELECT, JOINs, aggregations, subqueries, window functions, and

              real-world scenario questions.

            </p>

          </section>

&nbsp;

          <section className="rounded-2xl border border-border bg-card p-6">

            <Code2 className="h-5 w-5 text-muted-foreground" />

            <h3 className="mt-3 text-base font-semibold text-foreground">Built with modern tools</h3>

            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">

              React, TanStack Start, Tailwind CSS, and AI-assisted grading come together for a fast,

              focused practice experience.

            </p>

          </section>

&nbsp;

          <section className="rounded-2xl border border-border bg-card p-6">

            <GraduationCap className="h-5 w-5 text-muted-foreground" />

            <h3 className="mt-3 text-base font-semibold text-foreground">Always learning</h3>

            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">

              The app is updated regularly with new questions, better explanations, and feedback

              from the people who use it.

            </p>

          </section>

        </div>

&nbsp;

        {/* CTA footer */}

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

    </m

ain>

  );

}

<div className="mt-6 flex flex-wrap justify-center gap-3">

  <Link

    to="/about"

    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"

  >

    About the project

  </Link>

  <Link

    to="/contact"

    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"

  >

    <Mail className="h-4 w-4" />

    Preview the contact page

  <

/Link>

</div>

1. **Contact details** — name, email address to display, and LinkedIn URL. If you'd rather not display a personal email, I'll point Contact at the existing feedback form and your LinkedIn only.

I can start on the shared header/footer and the legal + FAQ pages immediately while you send those two.

## Technical notes

All five routes are plain TanStack Start file routes with no loaders, so they prerender cleanly and need no backend work. No changes to auth, resume storage, the AI gateway, or any practice engine. Styling reuses the existing Sora/Manrope + Cloud White token system in `src/styles.css`.
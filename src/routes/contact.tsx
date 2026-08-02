import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Linkedin, MessageSquare, Bug } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const APP_NAME = "Smart AI Code Playground";
const SITE = "https://smartsqlaimentor.live";
const EMAIL = "pydikalvasrikanth@gmail.com";
const LINKEDIN = "https://www.linkedin.com/in/srikanth-pydikalva/";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact — ${APP_NAME}` },
      {
        name: "description",
        content: `Get in touch with the team behind ${APP_NAME} — report a bug, suggest a question topic, or say hello by email or LinkedIn.`,
      },
      { property: "og:title", content: `Contact — ${APP_NAME}` },
      {
        property: "og:description",
        content: `Report a bug, suggest a topic, or reach out about ${APP_NAME}.`,
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/contact` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/contact` }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="px-4 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Contact</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
            Questions, bug reports, or ideas for new practice topics — all of it is welcome. I read
            everything that comes in.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a
              href={`mailto:${EMAIL}`}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <Mail className="h-5 w-5 text-muted-foreground" />
              <h2 className="mt-3 text-base font-semibold text-foreground">Email</h2>
              <p className="mt-1.5 break-all text-sm text-muted-foreground">{EMAIL}</p>
            </a>

            <a
              href={LINKEDIN}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <Linkedin className="h-5 w-5 text-muted-foreground" />
              <h2 className="mt-3 text-base font-semibold text-foreground">LinkedIn</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Connect with Srikanth Pydikalva
              </p>
            </a>

            <Link
              to="/feedback"
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h2 className="mt-3 text-base font-semibold text-foreground">In-app feedback</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Fastest route — sends straight to my inbox from inside the app.
              </p>
            </Link>

            <div className="rounded-2xl border border-border bg-card p-6">
              <Bug className="h-5 w-5 text-muted-foreground" />
              <h2 className="mt-3 text-base font-semibold text-foreground">Reporting a bug?</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Include the track (SQL, Python, Java, PySpark, C/C++ or GCP), the question you were
                on, and what you expected to happen.
              </p>
            </div>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Curious who builds this?{" "}
            <Link to="/about" className="text-primary hover:underline">
              Read the About page
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
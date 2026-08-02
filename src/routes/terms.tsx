import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const APP_NAME = "Smart AI Code Playground";
const SITE = "https://smartsqlaimentor.live";
const EMAIL = "pydikalvasrikanth@gmail.com";
const UPDATED = "26 July 2026";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `Terms of Use — ${APP_NAME}` },
      {
        name: "description",
        content: `The terms that govern your use of ${APP_NAME}: acceptable use, AI-generated content, accounts, warranties and liability.`,
      },
      { property: "og:title", content: `Terms of Use — ${APP_NAME}` },
      {
        property: "og:description",
        content: `Acceptable use, AI-generated content disclaimers, and liability limits for ${APP_NAME}.`,
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/terms` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/terms` }],
  }),
  component: TermsPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="px-4 py-10 sm:py-16">
        <article className="mx-auto w-full max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Terms of Use
          </h1>
          <p className="mt-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Last updated {UPDATED}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            By creating an account or using {APP_NAME}, you agree to these terms. If you do not
            agree, please do not use the app.
          </p>

          <Section title="What this service is">
            <p>
              {APP_NAME} is an educational practice tool. It generates questions, grades submitted
              code and SQL with AI, explains concepts, and simulates interviews for SQL, Python,
              Java, PySpark, C/C++ and GCP data engineering.
            </p>
            <p>
              It is <strong className="text-foreground">not</strong> a production SQL engine, a
              certified assessment platform, a compiler, or a substitute for professional training
              or legal, financial, or engineering advice. Grades and scores are indicative learning
              signals, not credentials.
            </p>
          </Section>

          <Section title="Accounts">
            <p>
              You are responsible for the accuracy of the details you provide and for activity under
              your account. Do not share your account, and tell us promptly if you suspect
              unauthorised access. One account per person.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>You agree not to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Scrape, bulk-download, resell, or redistribute questions, answers, or explanations.</li>
              <li>
                Use automated scripts to generate load, or otherwise attempt to overwhelm, probe, or
                bypass the app's limits or security.
              </li>
              <li>
                Submit confidential employer code, credentials, personal data of others, or unlawful
                content into the editors, chat, or interview.
              </li>
              <li>
                Use the app to cheat in a live, proctored, or otherwise prohibited assessment.
              </li>
              <li>Reverse engineer, resell, or white-label the service without written permission.</li>
            </ul>
            <p>
              We may suspend or terminate accounts that breach these terms, with or without notice.
            </p>
          </Section>

          <Section title="AI-generated content">
            <p>
              Questions, grading, hints, theory, and interview feedback are produced by large
              language models. AI output can be incomplete, outdated, or simply wrong. Always verify
              anything important against official documentation before relying on it, and never run
              generated code against production systems without review.
            </p>
          </Section>

          <Section title="Your content and ownership">
            <p>
              You keep ownership of the code and text you submit. You grant us a limited licence to
              process it in order to operate the service — including sending it to AI providers for
              grading — and to store it so your progress can be resumed. The app itself, its
              interface, and its curated question banks remain the property of the creator.
            </p>
          </Section>

          <Section title="Availability and changes">
            <p>
              The service is provided on a best-effort basis. Features may change, be added, or be
              removed, and access may be interrupted for maintenance, provider outages, or usage
              limits. Free access is offered at our discretion and may change in future.
            </p>
          </Section>

          <Section title="No warranty">
            <p>
              The service is provided "as is" and "as available", without warranties of any kind,
              express or implied, including fitness for a particular purpose, accuracy of results,
              or uninterrupted availability. We do not warrant that using this app will result in
              passing any interview, exam, or certification.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              To the maximum extent permitted by law, the creator of {APP_NAME} is not liable for
              any indirect, incidental, or consequential loss, including lost opportunities, lost
              data, or damage arising from reliance on AI-generated output. Where liability cannot
              be excluded, it is limited to the amount you paid to use the service (which, for free
              accounts, is zero).
            </p>
          </Section>

          <Section title="Governing terms and contact">
            <p>
              These terms may be updated; continued use after a change means you accept the revised
              version. Questions? Email{" "}
              <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">
                {EMAIL}
              </a>{" "}
              or visit the{" "}
              <Link to="/contact" className="text-primary hover:underline">
                contact page
              </Link>
              . See also the{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </Section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
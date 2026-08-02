import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const APP_NAME = "Smart AI Code Playground";
const SITE = "https://smartsqlaimentor.live";
const EMAIL = "pydikalvasrikanth@gmail.com";
const UPDATED = "26 July 2026";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy — ${APP_NAME}` },
      {
        name: "description",
        content: `How ${APP_NAME} collects, uses, and protects your account details, practice attempts, and the code you submit for AI grading.`,
      },
      { property: "og:title", content: `Privacy Policy — ${APP_NAME}` },
      {
        property: "og:description",
        content: `What data ${APP_NAME} collects, how AI grading processes your submissions, and how to request deletion.`,
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/privacy` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/privacy` }],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="px-4 py-10 sm:py-16">
        <article className="mx-auto w-full max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Last updated {UPDATED}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            This page is maintained by the creator of {APP_NAME} to explain, in plain language, what
            information the app handles and why. It covers the app only — not any third-party site
            you reach from it.
          </p>

          <Section title="What we collect">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Account details.</strong> Your email address,
                and — if you sign in with Google — your name and profile picture as provided by
                Google. We never receive your password.
              </li>
              <li>
                <strong className="text-foreground">Practice activity.</strong> The questions you
                are served, the code and SQL you submit, grading results, hints requested, solved
                items, timers, and session progress used to resume where you left off.
              </li>
              <li>
                <strong className="text-foreground">Feedback you send.</strong> The message text and
                the email address attached to your account, so a reply is possible.
              </li>
              <li>
                <strong className="text-foreground">Basic analytics.</strong> Aggregated page views
                and traffic sources via Google Analytics. This is not used to identify individuals.
              </li>
            </ul>
            <p>
              We do not collect payment details, and we do not ask for identity documents, phone
              numbers, or addresses.
            </p>
          </Section>

          <Section title="AI processing of your submissions">
            <p>
              Grading, hints, theory explanations, and mock-interview responses are produced by
              third-party large language models accessed through an AI gateway. To generate a
              response, the app sends the relevant content — your question, your submitted code or
              SQL, and the surrounding practice context — to that model provider.
            </p>
            <p>
              Do not paste confidential employer code, credentials, API keys, personal data, or any
              material you are not free to share into the editors or chat.
            </p>
            <p>
              Live AI interview sessions use your microphone (and camera, if you enable it) in your
              browser. Speech is converted to text for the interview flow; recordings are not stored
              on our servers.
            </p>
          </Section>

          <Section title="How the data is used">
            <ul className="list-disc space-y-2 pl-5">
              <li>To authenticate you and keep you signed in.</li>
              <li>To generate questions, grade answers, and explain results.</li>
              <li>To save progress so you can resume a session on any device.</li>
              <li>To respond to feedback and fix bugs.</li>
              <li>To understand aggregate usage and improve the app.</li>
            </ul>
            <p>We do not sell your data, and we do not use it for advertising.</p>
          </Section>

          <Section title="Storage, retention and security">
            <p>
              Data is stored in a managed Postgres database with row-level security, so your
              practice records are readable only by your own authenticated account. Some progress is
              also cached in your browser's local storage so sessions survive a refresh — clearing
              site data removes that local copy.
            </p>
            <p>
              Practice history is kept while your account is active so your progress and solved
              library remain useful. Feedback messages are kept until the issue is resolved. No
              system is perfectly secure, so we cannot guarantee absolute protection.
            </p>
          </Section>

          <Section title="Third parties">
            <p>
              The app relies on service providers for hosting and infrastructure, authentication and
              database (including Google Sign-In if you choose it), AI model inference for grading
              and explanations, transactional email for account messages, and Google Analytics for
              aggregate traffic statistics.
            </p>
          </Section>

          <Section title="Your choices and rights">
            <ul className="list-disc space-y-2 pl-5">
              <li>Access or correct your account information from within the app.</li>
              <li>Clear locally stored progress by clearing your browser site data.</li>
              <li>
                Request a copy of your data, or deletion of your account and its practice history,
                by emailing{" "}
                <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">
                  {EMAIL}
                </a>
                . Deletion requests are actioned within 30 days.
              </li>
              <li>Opt out of analytics using your browser's tracking protection or an extension.</li>
            </ul>
          </Section>

          <Section title="Children">
            <p>
              {APP_NAME} is intended for people aged 16 and over. If you believe a child has created
              an account, contact us and we will remove it.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              This policy may be updated as the app evolves. Material changes will be reflected in
              the "last updated" date above.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about privacy? Email{" "}
              <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">
                {EMAIL}
              </a>{" "}
              or use the{" "}
              <Link to="/contact" className="text-primary hover:underline">
                contact page
              </Link>
              . See also our{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Use
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
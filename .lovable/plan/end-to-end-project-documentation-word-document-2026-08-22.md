# End-to-End Project Documentation (Word document)

Produce a single, polished `.docx` handover document covering the whole platform — product overview first, then a deep technical reference. Delivered as a downloadable file; no application code changes.

## Deliverable

`SmartSQL-AI-Mentor-Documentation.docx` in the documents area, US Letter, 1" margins, Arial, styled headings, table of contents, and formatted tables. Every page is rendered to images and visually checked before delivery.

## Document outline

**Part A — Product overview (non-technical)**
1. Executive summary: what the platform is, who it's for, current status (trial, moving to aicodedost.com).
2. Feature tour by section:
   - Home / landing and navigation
   - MySQL / SQL engine: Today, Free Practice, Topic-wise, Data Engineering, Solved library; schema, ERD, seed data, 7-step theory
   - Python, Java, C/C++, PySpark coding engines: question generation, run/evaluate, theory panel, Python→SQL solution
   - GCP Data Engineer question bank with difficulty tiers and covered-topics tracking
   - AI Live Interview: pre-interview setup, JD calibration, animated avatar, voice + barge-in, scorecard report
   - AI Chat with image/file attachments
   - Interactive tutorials (MySQL visual explainer, Python, Java, PySpark, C/C++ 3D lessons)
   - Practice planner, resume-where-you-left-off, product tour, feedback
3. User journeys: sign up → practice → resume → report.
4. Design system: typography (Sora/Manrope), aurora/glass 3D visual language, light default theme, semantic tokens.

**Part B — Technical reference**
5. Stack and architecture: TanStack Start v1, React 19, Vite 7, Tailwind v4, Cloudflare Worker runtime, Lovable Cloud (Supabase) backend.
6. Repository map: `src/routes`, `src/components`, `src/lib`, `src/tutorials`, `src/integrations`.
7. Routing table: every route file → URL → purpose → SEO metadata owner.
8. Server boundary rules: `*.functions.ts` thin wrappers vs `*.server.ts` implementations; why prompts/secrets never reach the client; `requireSupabaseAuth` middleware and `attachSupabaseAuth` in `src/start.ts`.
9. Server function catalogue: sql-engine, python-engine, java-engine, python-sql, plan/java-plan/python-plan, interview, chat, resume, feedback-email — inputs, commands, outputs.
10. AI layer: Lovable AI Gateway, tiered model routing, two-tier cache (`ai_cache`), Postgres rate limiter (`rate_limits` + `consume_rate_limit`), standardized 7-step theory prompt contract.
11. Database reference — table-by-table columns, purpose, RLS/grant posture for: `profiles`, `attempts`, `question_sessions`, `session_state`, `topic_mastery`, `practice_plans`, `plan_days`, `feedback`, `ai_cache`, `rate_limits`, and the email tables (`email_send_log`, `email_send_state`, `email_unsubscribe_tokens`, `suppressed_emails`).
12. Auth: email/password, Google OAuth, reset password, redirect/origin handling via `src/lib/site-url.ts`.
13. Email infrastructure: auth webhook + queue routes under `src/routes/lovable/email/`, HMAC verification, templates, sender domain.
14. Security: CSP and security headers in `src/server.ts`, secrets inventory and where each is read, copy protection, what is never exposed.
15. Performance: code splitting, lazy panels, CSS-over-JS animations, query cache defaults, DB indexes, ~2000-user capacity notes.
16. SEO: per-route `head()` metadata, sitemap, robots, `llms.txt`.
17. Operations: environment variables (`.env.example`), preview vs production URLs, deploy/publish flow, known limitations and roadmap (domain migration to aicodedost.com).
18. Appendices: glossary, file-by-file index of key modules.

## Technical approach

- Read the actual route files, server modules, styles, and schema so the document reflects the real code — no invented behaviour.
- Generate with the `docx` library via a script in `/tmp`, using explicit US Letter page size, `Heading1`/`Heading2`/`Heading3` style overrides, `TableOfContents`, DXA-width tables with matching cell widths, and numbering configs for bullets/numbers.
- Validate the package, convert to PDF → page images, inspect every page for clipping/overflow, fix and re-run until clean.
- Write the final file to the documents area and surface it as a downloadable artifact.

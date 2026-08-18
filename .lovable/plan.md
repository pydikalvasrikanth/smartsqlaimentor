# Continuation prompt for the new Lovable account

You will upload this full codebase to the new account and want the agent there to pick up exactly where this one left off. Paste the prompt below as the **first message** in that project, before asking for any new feature.

## Master onboarding / continuation prompt

```text
CONTEXT: This project is a complete, production app I migrated from another Lovable account. The code is already uploaded — do NOT redesign, rewrite, rename routes, or "modernize" anything. Read the codebase first, confirm what you found, and then continue development from this exact state.

PROJECT: "Smart AI Code Playground" (smartsqlaimentor.live) — an AI-powered interview and coding-practice platform.

STACK (fixed, do not change): TanStack Start v1 + React 19 + Vite 7, Tailwind v4 via src/styles.css, shadcn/ui, Lovable Cloud (Supabase) for auth + database, Lovable AI Gateway for all AI calls. No other router, no other backend, no edge functions — app logic uses createServerFn, external/webhook/cron endpoints use file routes.

FIRST TASKS FOR YOU, IN THIS ORDER:
1. Enable Lovable Cloud, then apply every file in supabase/migrations/ in filename order. This creates: profiles (+handle_new_user trigger), question_sessions, attempts, topic_mastery, practice_plans, plan_days, session_state, feedback, rate_limits (+consume_rate_limit RPC), ai_cache (+ai_cache_get/ai_cache_put RPCs), and the email queue tables email_send_state, email_send_log, suppressed_emails, email_unsubscribe_tokens (+enqueue_email/read_email_batch/delete_email/move_to_dlq). Every table must keep RLS enabled and its explicit GRANTs; rate_limits and ai_cache are service_role-only, reached only through their SECURITY DEFINER RPCs.
2. Regenerate src/integrations/supabase/* for the new project and set VITE_SITE_URL to the new site URL.
3. Add secrets: RESEND_API_KEY (transactional email), and configure Google auth with my own OAuth client id/secret. Email/password + Google sign-in, no anonymous signups, reset-password flow must keep working.
4. Run a typecheck and production build and fix only real breakages caused by the migration.

ARCHITECTURE INVARIANTS YOU MUST PRESERVE:
- All AI prompts, model routing and secrets live in *.server.ts modules. Every *.functions.ts file stays a thin createServerFn wrapper (module scope: imports, types, exported server functions only) — splitting deletes runtime siblings otherwise.
- process.env is read only inside handlers; client code uses VITE_* only.
- Two-tier AI cache: in-isolate LRU (15m) + shared ai_cache table (24h TTL). Keys include command + normalized prompt + model; user-specific commands also include userId. Never cache PII.
- Three-tier model routing (cheap for short/structured, mid for evaluation, strongest for theory and live interviews).
- Persistent rate limiting via consume_rate_limit (20 requests / 60s) on AI chat.
- Auth redirects use the shared origin helper (src/lib/site-url.ts), never raw window.location.origin.

FEATURES THAT MUST KEEP WORKING EXACTLY AS BUILT:
- Subject engines with identical feature parity: SQL (/mysql, /practice), Python (/python), Java (/java), C & C++ (/cpp, /c-cpp-coding-practice), PySpark (/pyspark), GCP Data Engineering (/gcp). Tabs per subject: Today (15 questions, easy-to-hard ramp), Free Practice, Topic-wise, Company/Role-wise where present, Solved library, Tutorial.
- Per-question resizable split layout (draggable from anywhere, independent scrolling per pane): left pane = question card, ERD, schema, seed data, About, AI Theory panel; right pane = Monaco editor with run/submit, animated execution trace, and test results BELOW the editor.
- AI theory always follows the 7-step structure: Core Concept, Syntax, Schema/Join Strategy, Business Formulas, End-to-End Trace, Edge Cases, Algorithm Checklist — with animated flow diagrams.
- AI commands: EXPLAIN_THEORY, REVEAL_SOLUTION, VISUALIZE_QUERY, OPTIMIZE_QUERY, EVALUATE_SUBMISSION, DEBUG_QUERY, TEXT_TO_SQL, PYTHON_THEORY, PYTHON_TO_SQL (SQL solution card shown after the Python solution).
- Solved library: every solved question stored with its answer plus all unique functions/APIs the user has used.
- Cross-device resume: session_state autosaves active question, code buffer and progress per subject (namespaced keys so SQL/Python/Java never collide) with a "Continue where you left off" prompt.
- Live AI Interview (/interview): pre-interview setup form with job-description calibration, animated SVG avatar, voice with VAD + barge-in, phase-aware questioning, live scratchpad, post-interview scorecard with radar chart. Mobile must not skip or repeat questions — asked/answered state is tracked server-side.
- Product tour for new users, fixed header timer under the page heading, floating AI assistant chat readable in both themes, planner + mastery dashboard, feedback widget with transactional email, 3D interactive tutorials per language.
- SEO: unique head() per route, sitemap.xml derived from the canonical site URL, robots.txt, JSON-LD. Public endpoints only under src/routes/api/public/* with signature verification.

DESIGN SYSTEM (keep as-is): light theme by default, glassmorphism with subtle 3D (aurora gradients, perspective grid, orbit rings, wireframe cube), Sora headings + Manrope body, semantic color tokens only — no hardcoded color utilities. CSS animations preferred over JS animation libraries for load speed. Fully responsive, no horizontal overflow on mobile.

RULES: do not change routes or URLs, do not migrate the database to anything else, do not expose secrets client-side, and validate each change with a typecheck + build before reporting done. When I ask for a new feature, follow these same invariants.
```

## Notes

DATABASE (public schema, RLS enabled + explicit GRANTs on every table):
- profiles (auto-created by a handle_new_user trigger on auth.users)
- question_sessions, attempts (indexed on user_id/created_at), topic_mastery
- practice_plans, plan_days
- session_state (cross-device resume; per-subject keys)
- feedback
- rate_limits + consume_rate_limit() RPC (service_role only, 20 requests / 60s)
- ai_cache + ai_cache_get/ai_cache_put RPCs (service_role only, 24h TTL)
- email queue: email_send_state, email_send_log, suppressed_emails, email_unsubscribe_tokens with enqueue_email/read_email_batch/delete_email/move_to_dlq

ARCHITECTURE RULES (edge-runtime safe):
- All AI prompts, model routing and secrets live in *.server.ts modules; *.functions.ts files are thin createServerFn wrappers only (module scope = imports + exported server functions).
- Read process.env only inside handlers. Client code uses VITE_* only.
- Two-tier AI cache: in-isolate LRU (15m) + shared ai_cache table (24h). Cache keys include command + normalized prompt + model; user-specific commands also include userId. Never cache PII.
- Three-tier model routing: cheap model for short/structured tasks, mid for evaluation, strongest for theory and interviews.

SUBJECT ENGINES (identical feature set for SQL, Python, Java, C/C++, PySpark, GCP Data Engineering):
Each subject page has tabs: Today (15 questions, easy-to-hard ramp), Free Practice, Topic-wise, Company/Role-wise where relevant, Solved library, and Tutorial.
Per question use a resizable split layout (draggable from anywhere, independent scrolling in both panes) with:
- Left: question card, ERD diagram, schema, seed data, About, and an AI Theory panel
- Right: Monaco multi-language code editor, run/submit, animated execution trace, test results BELOW the editor
Theory must always follow this 7-step structure: Core Concept, Syntax, Schema/Join Strategy, Business Formulas, End-to-End Trace, Edge Cases, Algorithm Checklist — with animated flow diagrams.
AI commands: EXPLAIN_THEORY, REVEAL_SOLUTION, VISUALIZE_QUERY, OPTIMIZE_QUERY, EVALUATE_SUBMISSION, DEBUG_QUERY, TEXT_TO_SQL, PYTHON_THEORY, PYTHON_TO_SQL (show an SQL solution card after the Python solution).
The Solved tab stores every solved question with its answer and lists all unique functions/APIs the user has used.

RESUME: every subject autosaves the active question, code buffer and progress to session_state; on return show a "Continue where you left off" prompt. Keys are namespaced per subject so SQL/Python/Java never collide.

LIVE AI INTERVIEW (/interview): pre-interview setup form (role, level, job-description paste) that builds a dynamic prompt; animated SVG avatar; voice with VAD + barge-in (AI pauses when the user speaks); phase-aware questioning; live scratchpad; post-interview scorecard report with radar chart. Must work on mobile without skipping or repeating questions — track asked/answered state server-side.

ALSO: onboarding product tour with spotlighted elements, fixed header timer under the page heading, floating AI assistant chat (rate-limited, readable in both themes), planner + mastery dashboard, feedback widget with transactional email, 3D interactive tutorials per language, SEO (unique head() per route, sitemap.xml, robots.txt, JSON-LD), and public API routes only under src/routes/api/public/* with signature verification.

Build incrementally, subject by subject, verifying each before moving on.
```

## Technical notes

- Upload the whole repo including `supabase/migrations/` — recreating RLS policies and grants from a prompt is the most error-prone part of a move.
- After publishing on the new account, move the custom domain `smartsqlaimentor.live` and update the Google OAuth redirect URIs to the new URLs.
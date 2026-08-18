# Migrating this app to another Lovable account

## Fastest, exact-copy route (recommended)

A prompt can never reproduce this app byte-for-byte — it is ~50 routes, ~90 components, 13 database tables and 10 database functions. Do this instead:

1. In this project, connect the code repository (Project settings) and push the code.
2. From the new account, create a project from that repository. Code arrives identical.
3. Enable Cloud on the new project, then run the SQL in `supabase/migrations/` in filename order so tables, RLS, grants and functions match.
4. Re-add secrets on the new account: AI gateway key (automatic), the email sending key, your own Google OAuth client id/secret in Auth settings, and `VITE_SITE_URL` for the new domain.
5. Move the custom domain `smartsqlaimentor.live` after the new project is published.

Use the master prompt below only if you want the new account's AI to rebuild from scratch (results will differ in detail).

## Master rebuild prompt (paste as the first message in the new project)

```text
Build "Smart AI Code Playground" — an AI-powered interview & coding practice platform. Stack: TanStack Start v1 + React 19 + Vite 7 + Tailwind v4 + shadcn/ui, Lovable Cloud for auth/DB, Lovable AI Gateway for all AI. Do not use any other backend or router.

DESIGN: Light theme by default, glassmorphism + subtle 3D (aurora gradient backgrounds, perspective grid, orbit rings, wireframe cube), Sora headings + Manrope body. All colors as semantic tokens in src/styles.css. Prefer CSS animations over JS animation libraries for speed. Fully responsive, no horizontal overflow on mobile.

AUTH: Email/password + Google sign-in. No anonymous signups. Reset-password flow. All auth redirects must use one shared origin helper that works inside preview iframes and on the custom domain — never raw window.location.origin.

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

- The prompt is deliberately capability-level, not file-level; the new account's agent will choose its own file names.
- Carry over `supabase/migrations/` from this project. Recreating RLS policies and grants by prompt is the most error-prone part of a rebuild.
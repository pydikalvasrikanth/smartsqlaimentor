PHASE 1 — SQL ENGINE CLOUDFLARE SERVER-BOUNDARY REFACTOR

I have uploaded the latest project and reviewed the current implementation.

Make ONLY the Phase 1 SQL server-boundary refactor.

DO NOT:

- change UI

- change routes

- change authentication

- change Supabase

- change Lovable AI Gateway

- change Nitro

- change Wrangler

- change dependencies

- change database schema

- change prompts

- change business logic

- change cache behavior

- change Python

- change Java

- change Chat

- change Interview

- change Python-SQL

- change Plan logic

- run repository-wide formatting

- fix unrelated lint errors

IMPORTANT:

The current sql-engine.functions.ts contains BOTH:

1. runSqlEngine — the client-facing server function

2. callEngineCommand — a server-only helper used by runSqlEngine AND plan.functions.ts

The goal is to separate the server-only implementation from the server-function boundary without changing behavior.

CURRENT SERVER-ONLY CONTENT INCLUDES:

- CACHEABLE_COMMANDS

- SYSTEM_PROMPT

- TOOLS_BY_COMMAND

- PayloadSchemas

- InputSchema if it depends on PayloadSchemas

- buildUserPrompt

- callEngineCommand

RECOMMENDED TARGET:

src/lib/

├── sql-engine.functions.ts

└── sql-engine.server.ts

Do NOT create sql-engine.schemas.ts unless there is a demonstrated reason to expose a schema/type across the client/server boundary.

Prefer the smallest safe refactor.

==================================================

SQL-ENGINE.SERVER.TS

==================================================

Move server-only implementation into:

src/lib/sql-engine.server.ts

This may include:

- CACHEABLE_COMMANDS

- SYSTEM_PROMPT

- TOOLS_BY_COMMAND

- PayloadSchemas

- InputSchema

- buildUserPrompt

- callEngineCommand

- server-only validation helpers

Keep:

- LOVABLE_API_KEY access

- AI gateway access

- Supabase/server-only imports

- server-only logic

inside server-only modules.

Do NOT expose server-only schemas or prompts to client-reachable modules unnecessarily.

IMPORTANT:

PLAN_FOCUS and ANALYZE_SESSION are server-only commands and must remain server-only.

Do not add them to a client-facing command schema.

==================================================

SQL-ENGINE.FUNCTIONS.TS

==================================================

Make this file the thin server-function boundary.

Preserve exactly:

- runSqlEngine export name

- POST method

- requireSupabaseAuth middleware

- input validation behavior

- handler behavior

- return shape

- errors

Do not introduce new any casts.

The existing:

data.command as any

should be removed if TypeScript can correctly infer the type after the refactor.

If a type assertion is genuinely necessary, use a safe explicit type rather than any.

==================================================

PLAN.FUNCTIONS.TS

==================================================

The current project imports callEngineCommand from:

./sql-engine.functions

and uses it multiple times.

If callEngineCommand moves to sql-engine.server.ts, update ONLY the import path required to preserve the existing behavior.

Do NOT change Plan logic.

Do NOT change function implementations.

Do NOT change prompts.

Do NOT change authentication.

Verify that plan.functions.ts can safely import the server-only module under the existing TanStack server-function compilation model before making the import change.

==================================================

IMPORTANT SERVER/CLIENT BOUNDARY

==================================================

Do not assume every Zod schema is client-safe.

Keep server-only schemas server-side if they are not required by client code.

Do not expose:

- LOVABLE_API_KEY

- SUPABASE_SERVICE_ROLE_KEY

- server-only prompts

- server-only tool definitions

- privileged server helpers

to the client bundle.

==================================================

DO NOT CHANGE CACHE BEHAVIOR

==================================================

Keep:

- CACHEABLE_COMMANDS

- cacheKey

- getCached

- setCached

behavior exactly as it currently works.

The Cloudflare distributed-cache/rate-limit issue will be handled in a later phase.

==================================================

VALIDATION

==================================================

The package.json does NOT currently have a typecheck script.

Therefore do not run:

bun run typecheck

unless a typecheck script is first discovered.

Use the existing TypeScript-only validation command that successfully passed during the baseline audit and report the exact command used.

Then run:

bun run build

The build must pass.

Confirm the existing Nitro Cloudflare artifacts are still generated.

Inspect the built client/server output.

CLIENT BUNDLE MUST NOT CONTAIN:

- SQL SYSTEM_PROMPT

- SQL tool definitions

- LOVABLE_API_KEY

- SUPABASE_SERVICE_ROLE_KEY

- server-only callEngineCommand implementation

SERVER BUNDLE SHOULD CONTAIN:

- SQL server implementation

- prompts

- tool definitions

- callEngineCommand

==================================================

FUNCTIONAL TESTING

==================================================

After the build passes, test the actual SQL functionality.

At minimum test:

1. Authenticated /mysql page

2. INIT_ENVIRONMENT

3. EVALUATE_SUBMISSION

4. GET_HINT

5. REVEAL_SOLUTION

6. Invalid input

7. Unauthenticated request

Also test the existing Plan functionality that uses callEngineCommand:

8. INIT/NEXT practice flow

9. PLAN_FOCUS

10. ANALYZE_SESSION

11. REVEAL_SOLUTION from Plan flow

12. EVALUATE_SUBMISSION from Plan flow

Do not change functionality to make tests pass.

==================================================

STOP CONDITION

==================================================

STOP after Phase 1.

Do NOT start:

- Python refactor

- Java refactor

- Chat refactor

- Interview refactor

- rate limiter migration

- cache migration

- email security

- SSR bundle optimization

- domain migration

- authentication migration

Those are later phases.

==================================================

FINAL REPORT

==================================================

Report:

1. Exact files changed

2. Exact symbols moved

3. Exact import changes

4. Why each change was required

5. Confirmation that server-only content is no longer client-reachable

6. TypeScript validation command and result

7. Production build result

8. Cloudflare artifact result

9. Client-bundle secret/prompt scan

10. SQL functional test results

11. Plan/callEngineCommand test results

12. Any warnings

13. Any remaining risks

STOP.
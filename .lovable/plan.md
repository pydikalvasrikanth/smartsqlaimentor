# Cloudflare Deployment Audit & Migration Plan

Good news first: this project is **already targeting Cloudflare**. `vite.config.ts` uses the Lovable TanStack config whose Nitro build defaults to the Cloudflare Worker target, and `src/server.ts` is a Worker-style `fetch` entry. So this is not a platform migration — it is a hardening pass on the parts of the code that behave differently on Cloudflare than on a normal Node server.

## What the audit found

No blocking incompatibilities. There are no `child_process`, `sharp`, `puppeteer`, `fs.watch`, `os.cpus`, `__dirname`, or native-addon dependencies anywhere in `src/`, and `vite.config.ts` does not set the forbidden `ssr.external` / `resolve.external`. All secrets are read inside handlers, not at module scope.

Four real risks, in priority order:

### 1. Server-function files are not thin wrappers (highest risk)
Every `src/lib/*.functions.ts` file keeps prompts, tool schemas, Zod payload maps and helper functions at module scope alongside the `createServerFn` declarations — for example `sql-engine.functions.ts` (607 lines), `python-engine.functions.ts` (534), `java-engine.functions.ts` (521), `plan.functions.ts` (578), `interview.functions.ts`, `chat.functions.ts`, `python-sql.functions.ts`, and both `*-plan.functions.ts`.

When the build splits these modules for the Worker, runtime siblings next to a server function can be dropped, producing `ReferenceError` in production even though dev and typecheck pass. This is the single most likely cause of "works in preview, breaks when published".

Fix: move every constant, prompt, tool schema and helper into imported `*.server.ts` modules (or plain shared modules for the Zod schemas the validators need), leaving each `*.functions.ts` with only imports, types, and exported `createServerFn` declarations.

### 2. In-memory state does not survive on Workers
`chat.functions.ts` holds a rate limiter in a module-level `Map`, and `ai-gateway.server.ts` holds a result cache in another. Cloudflare runs many short-lived isolates, so both are per-isolate and effectively random: rate limits are bypassable and the cache mostly misses.

Fix: keep them as a best-effort fast path but make correctness not depend on them — move rate limiting to a database-backed counter (a small table keyed by user + window), and treat the result cache purely as an opportunistic in-isolate cache with a short TTL.

### 3. Email routes are outside the public-API convention
`src/routes/lovable/email/auth/webhook.ts`, `.../queue/process.ts` and `.../auth/preview.ts` read `LOVABLE_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` and are reached by external callers, but they do not sit under `src/routes/api/public/*`. On published sites that prefix is what bypasses site auth; anything else can be blocked or, if reachable, needs its own caller verification.

Fix: confirm each handler verifies its caller (webhook signature for the auth webhook, a shared secret for the queue processor), and restrict or remove the `preview` endpoint in production. Relocating them under `api/public/` is optional and should only happen if the managed email integration allows it — otherwise leave the paths alone and rely on the in-handler checks.

### 4. Worker bundle size and cold start
The Worker SSR bundle pulls in `three`, `@react-three/drei`, `@react-three/fiber`, `mermaid`, `framer-motion`, `recharts`, `monaco` and `prismjs`. Cloudflare has a hard per-Worker size limit and cold start scales with bundle size.

Fix: audit which of those actually reach the SSR graph and gate the heavy visual ones behind `ClientOnly` + dynamic import so they never enter the server bundle, then re-measure.

## Sequencing

1. Thin-wrapper refactor of the nine `*.functions.ts` files, one file per step, verifying the build after each.
2. Replace the in-memory rate limiter with a DB-backed one; downgrade the result cache to best-effort.
3. Verify caller authentication on the three email routes and lock down the preview endpoint.
4. Trim the SSR bundle by moving 3D/diagram libraries out of the server graph.
5. Run a production build and exercise SQL, Python, Java, PySpark, chat and interview flows against it, since dev runs on Node and does not enforce Worker constraints.

## Technical notes

- Keep `src/server.ts` as the Nitro server entry; do not add a `wrangler.toml` or a second entry point.
- Do not introduce `ssr.external` / `resolve.external` — they hard-fail the Worker build.
- Continue reading `process.env.*` inside handlers only; env binds per request on Workers.
- `src/start.ts` must keep `attachSupabaseAuth` in `functionMiddleware`, or every `requireSupabaseAuth` function 401s.
- No package changes are required for this plan.

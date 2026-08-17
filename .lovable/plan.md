# Step 1 — Thin-wrapper refactor: `src/lib/sql-engine.functions.ts`

Scope is exactly one feature file. No UI, routes, Supabase, auth, gateway, Nitro, Wrangler, dependency, or formatting changes. No other engine file is touched, with one unavoidable one-line exception explained below.

## Why this file is unsafe today

`sql-engine.functions.ts` is 607 lines and keeps everything at module scope next to the server function: the cache-command set, the system prompt, the per-command tool schemas, `buildUserPrompt` (a ~160-line prompt builder with all seven theory sections), the Zod payload schemas, and the exported `callEngineCommand` helper. The only actual server function is the last four lines.

When the production Worker bundle splits this module (`?tss-serverfn-split`), sibling runtime declarations next to a `createServerFn` can be dropped, producing `ReferenceError` in production while dev and typecheck stay green. Everything the handler reaches must come in through imports.

## Target file layout

```text
src/lib/
├── sql-engine.functions.ts   # thin wrapper: imports + the one createServerFn
├── sql-engine.schemas.ts     # pure Zod (no secrets, no server imports)
└── sql-engine.server.ts      # prompts, tool schemas, gateway call helper
```

### `sql-engine.schemas.ts` (client-safe, pure Zod)

Moved here: `DIFFICULTY`, `shortStr`, `PayloadSchemas`, `InputSchema`, plus an exported `SqlEngineCommand` type.

Why client-safe: these are validation shapes only — no secrets, no `process.env`, no Supabase, no gateway imports. The functions file needs `InputSchema` for `inputValidator`, and the server module needs `PayloadSchemas` for `callEngineCommand`'s signature, so a shared non-`.server` module is the correct home. Naming it `.server.ts` would make it unimportable from the client-reachable functions file.

### `sql-engine.server.ts` (server-only)

Moved here: `CACHEABLE_COMMANDS`, `SYSTEM_PROMPT`, `TOOLS_BY_COMMAND`, `buildUserPrompt`, and `callEngineCommand`.

Why server-only: `callEngineCommand` reads `process.env.LOVABLE_API_KEY` and calls `callGatewayTool` from `ai-gateway.server`. The prompts and tool schemas are AI model configuration that should never ship to the browser, and today they do because module scope of a `.functions.ts` file is client-reachable. Moving them shrinks the client bundle as a side benefit.

All five items move **verbatim** — same text, same tool JSON, same command names, same cache set, same error strings, same `{ data?, error? }` return shape, same `preCheckSql` / `cacheKey` / `getCached` / `setCached` / `modelForCommand` call order.

### `sql-engine.functions.ts` (after)

```ts
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { InputSchema } from "./sql-engine.schemas";
import { callEngineCommand } from "./sql-engine.server";

export const runSqlEngine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => callEngineCommand(data.command as any, data.payload));
```

`runSqlEngine` keeps its exact name, method, middleware, validator, and handler body. Its four existing importers (`src/routes/topic.$slug.tsx`, `src/routes/engine.tsx`, `src/routes/mysql.tsx`, `src/components/sql/SchemaPanel.tsx`) are unaffected — no changes there.

## The one unavoidable exception

`src/lib/plan.functions.ts` line 10 does `import { callEngineCommand } from "./sql-engine.functions"`. Once `callEngineCommand` lives in `sql-engine.server.ts`, that import must become `from "./sql-engine.server"`.

Re-exporting it from the functions file is not an option: `**/*.server.*` is blocked from client bundles, so a re-export would break the build for every route that imports `runSqlEngine`.

So the change to `plan.functions.ts` is **exactly one import path on one line** — no logic, no signature, no behavior change, nothing else in that file. This is required for the refactor to compile; flagging it explicitly since your instruction was to leave other `*.functions.ts` files alone.

## Validation

1. Typecheck — note: `package.json` has no `typecheck` script (scripts are `dev`, `build`, `build:dev`, `preview`, `lint`, `format`), so `bun run typecheck` will fail as "script not found". I will run the equivalent TypeScript-only check against `tsconfig.json` and report it as the typecheck result.
2. `bun run build` — must exit 0.
3. Confirm Nitro still emits the Cloudflare Worker output: `dist/server/wrangler.json`, `.wrangler/deploy/config.json`, `dist/client/_headers`, `dist/nitro.json`.
4. Confirm `dist/server` still contains the SQL server-fn chunk and that no `sql-engine` prompt text leaks into `dist/client`.
5. No `bun run format`, no unrelated lint fixes. Expect new lint noise only from `prettier/prettier` and `no-explicit-any` on the two new files, matching the existing baseline style — reported, not fixed.
6. Fix only breakage caused by this refactor. Stop after Step 1; do not touch Python, Java, Chat, Interview, Plan logic, or Python-SQL.

## Report I will give you

Files changed, item-by-item mapping of what moved and why, behavior-preservation confirmation, typecheck result, build result, Cloudflare Worker output confirmation, and any warnings.

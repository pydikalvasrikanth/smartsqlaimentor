# Phase 2 — Python Server-Function Hardening

## Audit findings (read-only, no files modified yet)

`src/lib/python-engine.functions.ts` is 535 lines. Only the last 105 lines are the actual server-function boundary; everything above is module-scope server-only code that must not sit in a `*.functions.ts` file.

**Module-scope content that is server-only**
- `systemPromptFor(lang)`, `FORMAT_RULES`, `systemPromptWithFormat(lang)` — prompts (lines 17-42)
- `TOOLS_BY_COMMAND` — 10 tool schemas: INIT_PYTHON_ENVIRONMENT, NEXT_PYTHON_QUESTION, EVALUATE_PYTHON, PYTHON_HINT, REVEAL_PYTHON_SOLUTION, PYTHON_DEBUG, PYTHON_VISUALIZE, PYTHON_OPTIMIZE, PYTHON_THEORY, PYTHON_TO_SQL (lines 44-248)
- `buildUserPrompt(command, payload)` — includes the full 7-section theory prompt (lines 250-334)
- `PayloadSchemas` + `InputSchema` (lines 336-397) — validation only, not needed by any client file
- `callPythonEngine` — reads `process.env.LOVABLE_API_KEY`, calls the AI Gateway (lines 399-421)
- `stripSolution` — answer-key redaction helper (lines 424-428)

**Server-only imports already present in this file**: `supabaseAdmin` from `@/integrations/supabase/client.server`, plus `callGatewayTool`, `cacheKey`, `getCached`, `setCached`, `modelForCommand`, `preCheckSubmission`, `reconcileVerdict` from `ai-gateway.server`.

**External consumers** — verified by search: only `runPythonEngine` is imported anywhere (`src/routes/python.tsx`, `src/routes/cpp.tsx`, `src/routes/pyspark.tsx`, `src/components/python/PythonTheoryPanel.tsx`). No file imports `callPythonEngine`, `PayloadSchemas`, `TOOLS_BY_COMMAND`, or the prompts. `python-plan.functions.ts` and `python-sql.functions.ts` are fully self-contained (own gateway URL, own prompts) and import nothing from the Python engine.

**Risk this fixes**: the Worker's server-function split strips handler bodies from `*.functions.ts` modules but keeps module scope in the client graph — so today the prompts and tool schemas are reachable by the client bundler, and any sibling runtime declaration can be dropped in production, producing `ReferenceError`.

## Plan

Smallest safe architecture — two files, no schemas module (nothing crosses the boundary):

```text
src/lib/python-engine.functions.ts   (thin boundary: runPythonEngine only)
            |
            v
src/lib/python-engine.server.ts      (prompts, tools, schemas, gateway, DB logic)
```

1. **Create `src/lib/python-engine.server.ts`** containing, byte-identical: `systemPromptFor`, `FORMAT_RULES`, `systemPromptWithFormat`, `TOOLS_BY_COMMAND`, `buildUserPrompt`, `PayloadSchemas`, `InputSchema`, `callPythonEngine`, `stripSolution`, plus the current `supabaseAdmin` / `ai-gateway.server` / `languages` / `starter-code` imports. Export `InputSchema` and one new `runPythonEngineImpl({ command, payload, userId })` that holds the exact handler body from lines 433-535, unchanged in logic, ordering, cache keys, error strings, and return shapes.

2. **Reduce `src/lib/python-engine.functions.ts`** to imports + the single `runPythonEngine` declaration: same `method: "POST"`, same `requireSupabaseAuth` middleware, same `InputSchema.parse` validator, handler delegating to `runPythonEngineImpl` with `context.userId`.

3. **Type note**: the existing `data.command as keyof typeof PayloadSchemas` cast moves into the server module where `PayloadSchemas` lives; no new `any` types introduced.

No other file changes — routes, components, prompts, business logic, cache behavior, DB queries, and auth all untouched.

## Validation after the change

- TypeScript: `tsgo -p tsconfig.json` (the command that passed in Phase 1)
- `bun run build`, confirm Nitro Cloudflare artifacts (`dist/server/wrangler.json`, `dist/client/_headers`)
- Client-bundle scan: confirm the Python system prompt, `FORMAT_RULES`, tool names (`init_python_environment`, `python_theory`, ...) and `LOVABLE_API_KEY` appear in `dist/server` and NOT in `dist/client`
- Authenticated browser test on `/python`: init question, hint, theory, evaluate, reveal solution, next question, debug/visualize/optimize, Python-to-SQL card; spot-check `/cpp` and `/pyspark` which share the same server fn
- Boundary test: anonymous `/python` still gated, invalid command rejected

Then STOP and report exact files changed. Phase 3 (Java) only after explicit approval.

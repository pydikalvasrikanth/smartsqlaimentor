# Faster loading + better AI code evaluation

Two separate problems, two separate fixes. Below is what I found in the current app and what I recommend.

## Part 1 — Loading speed

What the code shows today:
- The subject pages are very large single route files (mysql 2399 lines, python 1615, cpp 1579, java 1479, pyspark 1129, interview 1309). Everything in a page ships in one chunk, so first paint waits on code the user has not opened yet.
- Heavy libraries are in the main dependency graph: Monaco editor (loaded from a CDN), `three` + `@react-three/fiber` + `drei` (3D tutorial scenes), `mermaid` (theory diagrams), `prismjs`.
- No route-level data prefetch or query caching strategy on the practice pages; each tab switch re-triggers work.

Planned changes:
1. Split each subject page by tab. Keep the shell (header, tab strip, SEO content) in the route; load Today / Free practice / Topic-wise / Solved / Theory / Tutorial panels with `React.lazy` behind a small skeleton. This is the single biggest win.
2. Lazy-boundary the three heaviest libraries so they are only fetched when actually visible: Monaco (already has a Prism fallback — make Prism the default first paint and upgrade to Monaco in the background), `mermaid` (import inside the diagram component on first render), `three`/fiber scenes (already per-lesson — confirm no static import path pulls them into the subject pages).
3. Preload the hero/LCP asset per route via `head().links` and drop any render-blocking work above the fold.
4. Cache reads with TanStack Query `staleTime` (solved library, plans, topic catalogs) so returning to a tab is instant instead of refetching.
5. Add `content-visibility: auto` to long below-fold sections and make the long question/lesson lists windowed where they exceed ~100 rows.

Expected effect: first meaningful paint on `/python`, `/mysql`, `/java`, `/cpp`, `/pyspark` drops to the shell + skeleton, with panel JS arriving only for the tab in use.

## Part 2 — AI code evaluation quality and speed

What the code shows today: every engine (`sql-engine`, `python-engine`, `java-engine`, `python-sql`, plans, chat, interview) calls the gateway with one buffered `fetch` to `google/gemini-3-flash-preview`, forced into a single tool call. No streaming, no retry, no self-check, no caching, and no execution — grading is "mentally execute the code".

Planned changes:
1. **Two-tier model routing.** Keep Flash for hints, debug, visualize, and question generation (fast, cheap). Route *grading* and *optimize* to a stronger reasoning model so verdicts stop being wrong on edge cases. Cost stays low because grading is the rarer call.
2. **Deterministic pre-check before the model.** Run cheap, exact checks first: compile/parse sanity, signature match, empty-body detection, obvious infinite loops. For Python, run the real code in-browser with Pyodide (already used in the Python tutorial's runner) against the test cases so pass/fail is *measured*, not guessed; the model then only explains the failures. This removes the biggest source of wrong grades.
3. **Structured, verifiable grading contract.** Require per-test `actual_repr` with a short trace justification, then reconcile in code: if the model's `passed` count disagrees with its own per-test rows, trust the rows. Reject and retry once on malformed output instead of surfacing "AI returned malformed JSON".
4. **Streaming for anything long.** Switch grading, theory, reveal, and optimize to streaming so the user sees output in ~1s instead of staring at a spinner, and long generations can't be severed mid-flight by the request timeout.
5. **Cache and dedupe.** Hash (question id + normalized user code) and reuse the previous verdict on an unchanged resubmit. Cache theory per question id. Both are pure wins on cost and latency.
6. **Graceful degradation.** Explicit UI states for rate limit, credits exhausted, and gateway timeout, with the user's code and any local test results preserved.

## Technical notes

- Engine files stay `*.functions.ts` server functions with `requireSupabaseAuth`; the answer key continues to live in `question_sessions` and is never sent to the browser.
- Streaming grading needs the response consumed inside the handler (`streamText` + awaited text) or a streaming server route for token-by-token UI — I will use a streaming server route for the panels that render progressively.
- Pyodide execution is client-side and sandboxed; it applies to Python only. Java, C/C++, PySpark, and SQL keep model-based grading plus the deterministic pre-checks and reconciliation.
- No schema changes required except an optional `evaluations` cache table keyed by user + question + code hash (with GRANTs and RLS scoped to `auth.uid()`).

## Suggested order

1. Route/tab code splitting + lazy Monaco/mermaid (biggest perceived speed win).
2. Grading reconciliation + retry + model routing (biggest correctness win).
3. Pyodide-verified Python grading.
4. Streaming for grading/theory/optimize.
5. Caching layer and error states.

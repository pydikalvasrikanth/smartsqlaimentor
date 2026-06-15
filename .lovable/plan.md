
## Goal

On every SQL practice question (Free Practice, Topic pages, Targeted, Interview, Data Engineering), add a **"Solve in Python"** toggle next to the question. When enabled, the same problem is re-framed as a Python (pandas) task using the same schema + seed data, the user can write Python in an editor and run/reveal, and a side-by-side **MySQL vs Python** comparison explains the equivalent constructs.

## What the user sees

1. **New "Solve in Python" button** on the `QuestionCard` header (next to difficulty pill). Clicking toggles between **SQL mode** (default) and **Python mode** for that exact question.

2. **Python mode panel** replaces the SQL editor area and shows:
   - Restated task in Python terms ("Given dataframes `customers`, `orders`, `order_items` …, return a DataFrame with …").
   - **Python editor** (Monaco, language=python) pre-filled with imports and DataFrame stubs derived from the current schema/seed.
   - Action buttons: **Run**, **Hint**, **Reveal answer (step-by-step)**, **Show MySQL ↔ Python differences**, **Back to SQL**.
   - Feedback panel reused for results / hints / reveal / comparison.

3. **Reveal answer** shows a numbered, step-by-step pandas solution with code blocks and a narration of *why* each step maps to a SQL clause (FROM → DataFrame, WHERE → boolean mask, GROUP BY → `groupby`, JOIN → `merge`, window → `groupby().transform` / `rank`, CTE → intermediate variable, etc.).

4. **MySQL ↔ Python view** shows a two-column table: the canonical MySQL solution on the left, the equivalent pandas code on the right, with row-by-row mapping and notes on differences (NULL vs NaN, three-valued logic, ordering stability, performance, set semantics).

## Implementation

### New files

- `src/lib/python-sql.functions.ts` — `createServerFn` endpoint `runPythonFromSql` that accepts one of these commands:
  - `CONVERT_TO_PYTHON` → `{ schema_sql, seed_data_sql, sql_task, expected_sql }` → returns `{ python_task, starter_code, dataframe_setup, expected_python }`.
  - `EVALUATE_PYTHON` → `{ python_task, dataframe_setup, expected_python, user_python }` → returns `{ is_correct, status_title, feedback_message, user_result_preview, expected_result_preview, mistake_tag }`.
  - `HINT_PYTHON` → `{ python_task, user_python }` → returns `{ hint, suggested_apis }`.
  - `REVEAL_PYTHON` → `{ python_task, expected_python }` → returns `{ steps: [{ title, code, explanation }], full_solution }`.
  - `COMPARE_SQL_PYTHON` → `{ sql_task, expected_sql, expected_python }` → returns `{ mapping: [{ sql_snippet, python_snippet, note }], key_differences: string[] }`.
  All implemented as AI-tool-calls through the existing Lovable AI gateway, mirroring `sql-engine.functions.ts` patterns (same model, same auth middleware).

- `src/components/sql/PythonModePanel.tsx` — UI panel: Monaco python editor + buttons + reuses `FeedbackPanel`. Self-contained so all three routes can drop it in.

- `src/components/sql/SqlPythonComparison.tsx` — renders the side-by-side mapping table and key-differences list.

### Edited files

- `src/components/sql/QuestionCard.tsx` — add an optional `mode: "sql" | "python"` and `onToggleMode` prop; render a "Solve in Python" / "Back to SQL" pill button in the header.

- `src/components/sql/FeedbackPanel.tsx` — extend `FeedbackData` discriminated union with new kinds: `python-eval`, `python-hint`, `python-reveal`, `sql-vs-python`. Render each with the appropriate layout (reusing existing markdown + table styling, no design changes).

- `src/routes/practice.tsx` — add `pythonMode` state and `pythonContext` (cached converted task per question). When toggled, lazy-call `CONVERT_TO_PYTHON` (cached on `sessionQuestionId`), render `<PythonModePanel>` in place of `<SqlEditor>`+SQL toolbar buttons. Works in Free Practice, Targeted, Interview, and Data Engineering tabs since they share this workspace.

- `src/routes/topic.$slug.tsx` — same toggle wiring on the topic page workspace.

- (No DB schema changes; Python attempts are not persisted to mastery — only SQL attempts feed mastery scores, to keep the existing curriculum logic untouched.)

### Server-function details

- Reuse the existing `requireSupabaseAuth` middleware and the gateway helper used in `sql-engine.functions.ts`.
- Use `google/gemini-3-flash-preview` with strict tool-call schemas (no plain text), mirroring the `TOOLS_BY_COMMAND` pattern.
- Cache the conversion client-side per `sessionQuestionId` so toggling SQL ↔ Python is instant after the first conversion.

### Edge cases

- Toggle is disabled until a question is loaded.
- If conversion fails, toast the error and keep SQL mode active.
- The "Run" in Python mode is **semantic evaluation by the AI** (same approach as SQL — no real Python sandbox), to match the existing UX.
- DDL/transaction-style questions (INSERT/UPDATE/DELETE, triggers, indexes, EXPLAIN) get a Python panel that explains "this concept doesn't map directly to pandas" instead of a runnable task, and shows the MySQL-vs-Python comparison only.

## Out of scope

- Real in-browser Python execution (Pyodide) — kept as a future option; current eval is AI-graded like SQL.
- Persisting Python attempts in mastery/progress tables.
- Adding Python mode to non-SQL routes (`/python`, `/gcp`, `/chat` already have their own flows).

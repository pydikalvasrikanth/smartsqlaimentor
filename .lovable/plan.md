## Goal

Turn the existing `/python` section into a **multi-language coding section**. A language dropdown at the top lets the user pick **Python, Java, C, or C++**. Everything downstream — question generation, starter code, editor highlighting, execution/grading, theory, "Show SQL version", solved library, and resume — adapts to the selected language.

The separate `/java` route stays in place for now (no removal in this change) but the new unified flow is the primary path.

## UX

Top of `/python` (all tabs: Today, Free Practice, Topic-wise, Targeted):

```text
Language: [ Python ▾ ]   Topic: [...]   Difficulty: [...]   [Start]
           Python
           Java
           C
           C++
```

- Changing language mid-session prompts: "Switch language? Current code will be saved." → confirm swaps editor + regenerates a fresh question in the new language.
- Editor label, file name (`solution.py` / `Solution.java` / `solution.c` / `solution.cpp`), and syntax highlighting update with the selection.
- Section heading stays "Coding Practice" (rename from "Python Interview Engine") since it's no longer Python-only.

## Technical design

**New shared type** `src/lib/languages.ts`
```ts
export type CodeLang = "python" | "java" | "c" | "cpp";
export const LANG_META: Record<CodeLang, { label; ext; prismLang; starter; fileName }>
```

**Editor** — new `src/components/code/CodeEditor.tsx`
- Single component wrapping `react-simple-code-editor` + Prism.
- Loads the correct Prism grammar based on `lang` prop (`prism-python`, `prism-java`, `prism-c`, `prism-cpp`).
- Reuses the maximize/resize behavior from existing `PythonEditor` / `JavaEditor`.
- Existing `PythonEditor` / `JavaEditor` stay for backward compat, but `/python` route switches to `CodeEditor`.

**Server functions** `src/lib/python-engine.functions.ts`
- Extend `GENERATE_PY_QUESTION`, `GRADE_PY_SOLUTION`, `PYTHON_THEORY`, `PYTHON_TO_SQL` handlers to accept a `lang: CodeLang` input.
- System prompt switches per language:
  - Python → pandas/stdlib (current behavior)
  - Java → Java 17 idiomatic, `Solution` class + `main`
  - C → C11, `stdio.h`, `main`
  - C++ → C++17, STL where helpful
- Grader runs the same rubric but expects code in the chosen language; test cases stay language-agnostic (input/expected output described in prompt) since we already grade via LLM, not real execution.
- "Show SQL version" (`PYTHON_TO_SQL`) works for any source language — prompt is updated to say "convert this <lang> solution to MySQL".

No new tables. No new routes. `/java` route left untouched.

**Route wiring** `src/routes/python.tsx`
- Add `lang` to component state, default `"python"`.
- Persist per tab in the existing resume key (append `:<lang>` so switching languages doesn't clobber the Python buffer).
- Replace `<PythonEditor>` with `<CodeEditor lang={lang} …>`.
- Update file-name badge and "Show SQL version" trigger label to say the current language.
- Update tab heading + `HeaderTimer` label.

**Solved Library**
- `SolvedLibrary` gets a `lang` filter so Python/Java/C/C++ solves live side-by-side; the unique-functions extractor gains simple regexes per language (Python `def`, Java method signatures, C/C++ function definitions).

**Resume**
- Resume key format changes from `python:<tab>` to `code:<tab>:<lang>` so each language keeps its own draft.
- Old `python:*` keys are read once as fallback (backwards compat) then migrated on first save.

## Scope of edits

- New: `src/lib/languages.ts`, `src/components/code/CodeEditor.tsx`.
- Edit: `src/routes/python.tsx`, `src/lib/python-engine.functions.ts`, `src/components/sql/SolvedLibrary.tsx` (add lang filter).
- No DB migration. No changes to `/java`, `/practice`, or other subjects.

## Out of scope

- Real code execution/sandboxing (grading stays LLM-based, same as today).
- Removing the standalone `/java` route.
- Adding more languages (Go, Rust, TS) — easy follow-up once the selector pattern lands.

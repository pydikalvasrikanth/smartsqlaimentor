# Add C & C++ Practice Section

Create a new `/cpp` section that mirrors the Python section feature-for-feature, with a language toggle to switch between **C** and **C++**. Engine already accepts `c` and `cpp` as `lang` values, so no backend schema changes are needed — this is primarily a new route + subject wiring.

## Scope (feature parity with `/python`)

The new section will include the same tabs and functions currently in `/python`:
- Today's Question
- Free Practice
- Topic-wise
- Companies
- Solved library
- Theory panel (below question) with mermaid flow diagrams
- Resizable split between question and editor
- Product tour for new users
- HeaderTimer fixed at top
- Resume / autosave per-subject (separate resume key from python/java)
- Show "Python version" card after solve (reusing the cross-language explainer pattern, adapted: show a Python reference solution after the C/C++ solve)

## Language toggle

At the top of the editor panel, a two-option pill selector: **C | C++**.
- Persists selection per user in localStorage.
- Switching language keeps in-progress code per-language (same buffer strategy already used in `/python`).
- File name shown in editor tab updates (`solution.c` ↔ `solution.cpp`) from `LANG_META`.
- Passed as `lang` to every engine call (`init`, `next`, `evaluate`, `hint`, `reveal`, `debug`, `visualize`, `optimize`, `theory`, `to_sql`).

## Files to add

- `src/routes/cpp.tsx` — new route, cloned from `src/routes/python.tsx` with:
  - `subject = "cpp"` for resume + attempts + solved library
  - Language toggle limited to `["c", "cpp"]`
  - Default language: `cpp`
  - Header renamed to "C / C++ Interview Engine"
- `src/routes/c-cpp-coding-practice.tsx` — SEO landing page mirroring `python-coding-practice.tsx` (H1, FAQ + LearningResource JSON-LD, internal links).

## Files to edit

- `src/routes/index.tsx` — add a practice card linking to `/cpp` in the tracks grid + footer link.
- `src/routes/__root.tsx` — no change (fonts/analytics already global).
- `src/routes/sitemap[.]xml.ts` — add `/cpp` and `/c-cpp-coding-practice`.
- `src/components/sql/SolvedLibrary.tsx` — extend `Subject` union with `"cpp"`; add C/C++ keyword + STL highlighting (reuse Java-style extractor list adapted for C/C++: `printf`, `scanf`, `malloc`, `free`, `std::vector`, `std::map`, `std::sort`, `std::unordered_map`, iterators, etc.). Add a C/C++ highlighter branch (keywords: `int`, `char`, `struct`, `class`, `template`, `const`, `static`, `void`, `return`, `if`, `else`, `for`, `while`, `switch`, `case`, `new`, `delete`, `nullptr`, `auto`, `namespace`, `using`, etc.).
- `src/components/code/CodeEditor.tsx` — confirm `c` and `cpp` Prism grammars load (add to prism-setup if missing).
- `src/lib/prism-setup.ts` — ensure `prismjs/components/prism-c` and `prism-cpp` are dynamically imported.
- `public/robots.txt` — no change (sitemap already referenced).
- `src/lib/resume.ts` — add `"cpp"` to subject key list so the per-subject resume slot exists.

## Backend

Engine already supports `lang: "c" | "cpp"` via `languageSpec()` in `src/lib/languages.ts` and the Zod enum in `python-engine.functions.ts`. No migration needed. Attempts table already has a `subject` text column; we'll store `"cpp"` as the subject regardless of C vs C++ (language is captured separately in the code / prompt), so the Solved tab shows all C & C++ solves together.

## SEO

- New landing route `c-cpp-coding-practice.tsx`: H1 "C & C++ Interview Coding Practice", 500-word intro covering pointers, memory, STL, competitive programming; FAQ JSON-LD; internal links to `/cpp`, `/python`, `/java`.
- Route `head()` for `/cpp` with unique title/description/og.
- Sitemap entries added.

## Out of scope

- No changes to the Python, Java, PySpark, SQL, or GCP sections.
- No new database migrations.
- No AI model/provider changes.

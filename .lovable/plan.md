## What I found

I compared the uploaded `python-playbook-interactive-main.zip` against what's already live at `/python-tutorial` in this project (Smart AI Code Playground):

- Lesson data is already an exact copy — 35 topics, 6 levels (`src/tutorials/python/data/topics.ts`, byte-identical to the zip's `src/data/topics.ts`).
- All 6 components are ported and already slightly hardened versions of the originals: `CodeBlock`, `PyRunner`, `Quiz`, `SearchPalette`, `StepVisualizer`, `TopicSidebar`.
- The home page (`/python-tutorial`) matches the zip's `index.tsx` hero, progress bar, and level grids.
- The dark gold-on-navy theme is ported as a scoped `.tut-python` block in `src/styles.css`.

Three things from the zip are **not** ported yet, and that's most likely what looks "different" to you.

## What to build

1. **Tutorial About page** — port the zip's `about.tsx` to `/python-tutorial/about`: how each lesson works (explanation → animated step-through → live playground → quiz), the "progress is stored only in your browser" note, and the **Reset progress** button (wired to the existing `resetProgress()`). Link it from the tutorial header and the footer.

2. **Light/dark toggle for the tutorial** — the zip ships a `ThemeToggle` and a `.light` palette (cream background, dark gold accent). Add the equivalent light palette under the scoped `.tut-python` styles and a toggle button in the tutorial header, persisted to localStorage. The tutorial stays dark by default, matching the zip.

3. **Parity pass + verification** — walk the reference file-by-file against the port and fix any remaining behaviour drift (quiz scoring at ≥80% marking a topic complete, step-visualizer frame handling, sidebar active state), then run a browser pass on desktop and mobile: load the index, open a topic, run Pyodide, step the visualizer, take a quiz, and confirm progress persists after refresh.

Also adds `/python-tutorial/about` to `src/routes/sitemap[.]xml.ts`.

## Technical notes

- New route file: `src/routes/python-tutorial.about.tsx` with `createFileRoute("/python-tutorial/about")` and its own `head()` metadata.
- Light theme goes in `src/styles.css` as `.tut-python.light` overrides so it can never leak into the main Cloud White app shell.
- No backend, no dependency, and no changes to the main site — everything stays inside `src/routes/python-tutorial.*` and `src/tutorials/python/*`.

## Goal

Bring `/python-tutorial` up to the same behaviour as the uploaded `python-playbook-interactive-main` reference app, and fix the four problem areas you selected.

## What I verified

- Both `/python-tutorial` and `/python-tutorial/variables` return 200 — the pages load, but the port is incomplete.
- `TopicSidebar.tsx` exists in `src/tutorials/python/components/` but is **not imported anywhere** — no topic page has sidebar navigation.
- `SearchPalette` is only on the index page, not on topic pages.
- The tutorial's dark palette is scoped via `.tut-python` in `src/styles.css`, but the wrapper is applied only at the page root, so portalled UI (search dialog, popovers) and some nested elements fall back to the site's light "Cloud White" theme.
- The topic route has no `notFoundComponent`, so an unknown topic id falls through to the generic app error page.

## Changes

**1. Sidebar + shared tutorial layout**
- Convert `src/routes/python-tutorial.tsx` into a layout route that renders the sticky header (logo, search, theme toggle, back-to-playground) plus `TopicSidebar` and an `<Outlet />`.
- Move the current landing content into a new `python-tutorial.index.tsx` leaf.
- Sidebar: grouped by level, per-level progress, completion ticks, active-topic highlight, collapsible on desktop, slide-over drawer on mobile.
- Add `SearchPalette` to the topic pages via the shared header (⌘K / Ctrl+K).

**2. Live Python runner reliability**
- Harden `PyRunner`: load Pyodide from a pinned CDN with a fallback mirror, surface a clear error + retry button on failure, show a load-progress state, and reset `stdout`/`stderr` handlers per run so repeated runs don't duplicate output.
- Run user code in a fresh namespace each execution so leftover variables don't corrupt later runs; support `input()` via a prompt shim.
- Keep it client-only and lazy so SSR is unaffected.

**3. Step visualizer**
- Fix the trace playback: reliable play/pause/step/reset, speed control, current-line highlight synced to the trace index, variable-diff highlighting when a value changes, and stdout accumulation per step.
- Guard against topics whose `trace` is shorter/longer than the code lines.

**4. Theme / styling parity**
- Apply the `.tut-python` scope to the layout wrapper so every child (including the sidebar and mobile drawer) inherits it.
- Add the missing reference tokens and `.mono`, scrollbar, and glow rules under the scope; make search/dialog portals inherit the tutorial palette.
- Verify contrast for body text, code tokens, and muted labels in both site themes.

**5. "Coming soon" for missing topics**
- Add `notFoundComponent` to `python-tutorial.$topicId.tsx`: friendly card saying this topic isn't published yet — "We're working on it, this topic will be added soon" — with links back to the tutorial index and the nearest available topic. Keep `robots: noindex` on that state.
- Same fallback if a topic exists but has no sections/example content yet.

**6. Verification**
- Playwright pass on desktop + mobile viewport: index → topic navigation, sidebar open/close, run a Python snippet and confirm output, step through the visualizer, complete a quiz, and hit an unknown topic id.

## Technical notes

- No data changes: `src/tutorials/python/data/topics.ts` already matches the reference `src/data/topics.ts` (785 vs 786 lines), so content stays as-is.
- Route ids follow the existing dot-file convention: `python-tutorial.tsx` (layout), `python-tutorial.index.tsx`, `python-tutorial.$topicId.tsx`.
- Per-page `head()` metadata stays on the leaf routes; the layout will not add `og:image`.

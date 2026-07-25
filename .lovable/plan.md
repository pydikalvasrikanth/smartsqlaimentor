# Quality + SEO Overhaul — v01 → v02

## 0. Baseline "v01"

Lovable auto-versions every change (full rollback history is already saved), so no DB table is needed. Before I start, I'll ask you to click **Publish** — that snapshots the current live app as your v01 baseline you can roll back to at any time. All work below lands as v02.

## 1. Design system reset (Cloud White + Sora/Manrope)

Rewrite `src/styles.css` tokens and typography:

- **Palette (light default, dark parity):**
  - `--background` `#fafbfc` / dark `#0b1220`
  - `--surface-2` `#f4f6fa` / dark `#111a2e`
  - `--foreground` `#0f172a` / dark `#e8ecf1`
  - `--muted-foreground` `#475569` / dark `#94a3b8`
  - `--border` `#e2e8f0` / dark `#1e293b`
  - `--primary` `#3b82f6`, `--primary-glow` `#60a5fa`, `--primary-foreground` `#ffffff`
  - Success `#16a34a`, warning `#d97706`, destructive `#dc2626`
- **Type scale (standardized):** Sora headings (600/700), Manrope body (400/500/600). H1 40/48, H2 30/36, H3 22/28, body 15/24, small 13/20, code JetBrains Mono 13. Loaded via `<link>` in `__root.tsx`.
- **Spacing / radii:** radius 10px, cards 14px, buttons 8px. Consistent `p-4 md:p-6`, `gap-4 md:gap-6`.
- **Shadows:** subtle elevation only (`0 1px 2px`, `0 8px 24px -12px` for popovers).
- **Focus rings:** 2px `primary`, 2px offset — a11y compliant.
- **Component sweep:** unify Button, Card, Input, Tabs, Badge variants so every route inherits the new tokens automatically. Removes ad‑hoc `bg-[#…]` and stray dark chrome (Monaco stays IDE-dark for readability but with the new accent).

## 2. Landing page rebuild (`src/routes/index.tsx`)

New composition using Cloud White system:

- Top nav (logo, primary links, theme toggle, sign‑in CTA).
- Hero — H1 + subhead + two CTAs + trust strip.
- "Practice tracks" bento (SQL / Python / Java / PySpark / GCP / Interview) — internal deep links.
- How it works (3 steps).
- Feature grid (AI grading, resumable sessions, animated theory, voice interview, adaptive difficulty, solved library).
- FAQ (schema-marked).
- Footer (all routes, contact, socials, legal placeholders).

## 3. Performance pass

- Split route-level bundles that pull heavy libs (`monaco`, `mermaid`, `recharts`) behind `React.lazy` where they aren't already.
- Preload the Sora/Manrope woff2 subsets via `<link rel="preload">`.
- Convert PNG hero-adjacent assets to responsive `<img loading="lazy" decoding="async">`; add width/height to prevent CLS.
- Add `Cache-Control` headers on `/sitemap.xml` (already), extend to `/robots.txt` route.
- Debounce autosave writes (already local; keep server flush at 5s idle).

## 4. SEO — on-page

For each public route (`/`, `/practice`, `/python`, `/java`, `/pyspark`, `/gcp`, `/interview`, `/engine`, `/tutorial`, `/feedback`, `/chat`, `/auth`):

- Unique `<title>` ≤60 chars with target keyword.
- `<meta description>` ≤160 chars, benefit + keyword.
- One `<h1>`, semantic h2/h3 tree.
- `og:title`, `og:description`, `og:url`, `twitter:card=summary_large_image`.
- Canonical → `https://smartsqlaimentor.live/<path>`.
- Route-scoped JSON-LD: WebSite, Organization, LearningResource (per subject), FAQPage (landing), BreadcrumbList (subject pages).

## 5. SEO — technical

- `public/robots.txt` — keep `Allow: /`, add both live domains to `Sitemap:`.
- Migrate `public/sitemap.xml` → server route `src/routes/sitemap[.]xml.ts` that reflects every current public route with weekly changefreq. Delete stale static file.
- `alt` text audit on every `<img>`.
- Add `hreflang` = en, `lang="en"` on `<html>` (already).
- Web‑vitals: preconnect fonts, defer GA (already async), inline critical CSS via Vite plugin default.

## 6. SEO — new landing pages (rank targets)

Add SEO-tuned public routes (no functional change to existing engines):

- `/sql-interview-questions` — curated list linking into `/practice` topics.
- `/pyspark-practice` — hero + benefits → CTA to `/pyspark`.
- `/gcp-data-engineer-interview` — role-focused → CTA to `/gcp`.
- `/python-coding-practice` — → CTA to `/python`.

Each: 800–1200 words, H1/H2/H3 tree, FAQ block, JSON-LD, internal links.

## 7. SEO — backlink-ready guides

- `/guides/sql-window-functions` — cheat-sheet-style, code snippets, diagrams.
- `/guides/pyspark-vs-pandas` — comparison table.
- `/guides/gcp-data-engineer-roadmap` — checklist.

Added to sitemap.

## 8. Functionality guardrail

No changes to: auth, resume/session logic, engine RPCs, editors, interview flow, GCP question bank, email pipeline. Only presentation, metadata, and net-new marketing routes.

## Technical execution order

1. `src/styles.css` token rewrite + font links.
2. Shared UI component variants (`src/components/ui/*`) — light audit only.
3. Landing rebuild.
4. Route metadata sweep (`head()` in each route file).
5. Sitemap server route + robots update.
6. New landing + guide routes (7 files).
7. `route.tree.gen.ts` regenerates automatically.
8. Verify build, spot‑check preview at mobile (420×805) and desktop.

## Deliverables

- v02 published build with new visual system, standardized typography, unified spacing.
- 4 SEO landing pages + 3 long-form guides live in sitemap.
- Full metadata + JSON-LD coverage.
- Lighthouse target: Performance ≥90 mobile, SEO 100, A11y ≥95.

Reply **approve** to proceed, or tell me what to change (e.g. skip guides, keep current landing, different accent blue, etc.).

Change the heading correct and also the main page heading interview intelligence engine to smart AI Code playground 
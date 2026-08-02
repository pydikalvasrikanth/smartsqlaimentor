# Complete subject-page SEO and MySQL URL migration

## Confirmed findings

- The published site already returns `X-Frame-Options: SAMEORIGIN` and a Content Security Policy on the tested HTML routes. Those two warnings are stale crawl results, not current missing-header defects.
- The home page and authenticated workspaces (`/practice`, `/python`, `/java`, `/cpp`, `/pyspark`, `/gcp`, `/engine`, and `/interview`) currently send loading-only or empty server-rendered HTML to signed-out crawlers. This causes the missing H1/H2, low-content, and no-internal-outlink findings even though headings exist later for signed-in users.
- MySQL practice currently uses `/practice`; changing it without a permanent redirect would break existing bookmarks and indexed links.

## Implementation

### 1. Add crawlable SSR content to the home and subject pages

- Keep authentication around editors, generated questions, progress, and other private interactive features.
- Render an indexable public shell before authentication resolves on the home page and every affected subject/workspace page.
- Give each shell one descriptive H1, logical H2 sections, at least 200 words of useful subject-specific copy, and server-rendered internal links.
- Include relevant links to the subject tutorial, interview-preparation landing page, related practice subjects, FAQ, and sign-in page.
- Show a clear sign-in action in place of the protected workspace for signed-out visitors; signed-in users continue to receive the existing tool without losing progress or functionality.
- Use one shared SEO-shell component/data model so every subject follows the same standard while retaining unique copy and metadata.

### 2. Rename MySQL practice from `/practice` to `/mysql`

- Rename the route and change its route declaration, canonical, Open Graph URL, structured-data URL, navigation links, landing-page links, tutorial links, auth-page links, timer route matching, and sitemap entry to `/mysql`.
- Keep a thin `/practice` route that issues a permanent `301` redirect to `/mysql` so existing links and search equity are preserved.
- Exclude the redirecting `/practice` URL from the sitemap.

### 3. Complete route metadata and indexing rules

- Ensure every public content route has unique title, description, `og:title`, `og:description`, `og:type`, `twitter:card`, self-referencing canonical, and `og:url` on `https://smartsqlaimentor.live`.
- Add missing canonical metadata to `/interview` where applicable.
- Keep account-only utility pages such as authentication and password reset out of search with `noindex` rather than padding them with SEO copy.
- Preserve the existing `.live` canonical domain and sitemap domain to avoid splitting indexing signals.

### 4. Keep sitemap and crawler signals consistent

- Update the existing sitemap mechanism in place; do not replace it.
- Include `/mysql` and every public indexable route, omit redirects and `noindex` utility routes, and preserve the current page-specific `lastmod` policy by not inventing build-time dates.
- Keep the single `.live` sitemap directive already present in `robots.txt`.

### 5. Verification

- Check raw server-rendered HTML without JavaScript for each home/subject route: exactly one H1, at least one meaningful H2, useful copy, and crawlable internal `<a href>` links.
- Verify `/practice` returns a permanent redirect to `/mysql`, while `/mysql` returns `200` with a self-referencing canonical.
- Verify live HTML responses still include `X-Frame-Options` and Content Security Policy headers.
- Verify desktop and mobile signed-in flows still open the existing editors and resume the latest saved state.
- Re-run the SEO review after publication; third-party crawlers may retain the previous header/HTML result until they recrawl the deployment.

## Technical approach

- Create a reusable public subject-introduction component rendered during SSR, with route-specific content supplied by each workspace.
- Keep redirects in TanStack route handling and allow the generated route tree to update automatically.
- Do not alter authentication, question generation, saved sessions, grading, or tutorial functionality.
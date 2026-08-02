# SEO crawl findings: which are real

Three of the four are real and worth fixing. One is largely a crawler artifact.

## 1. Missing X-Frame-Options — real (low)
No security headers are set anywhere; the server entry returns responses untouched. Worth adding as hardening; no ranking impact.

## 2. Missing Content-Security-Policy — real (low)
Same cause. The policy must allow Google Analytics, Google Fonts and the backend, so it needs writing carefully rather than copying a strict template.

## 3. Canonicalised pages — real, and the important one
Canonicals are split across two domains:
- `smartsqlaimentor.live` on newer pages (landing pages, tutorials, legal pages)
- `smartsqlaimentor.lovable.app` on core pages (`/`, `/practice`, `/python`, `/java`, `/cpp`, `/pyspark`, `/gcp`, `/engine`, `/auth`, `/chat`, `/tutorial`, `/reset-password`)

`robots.txt` advertises two sitemaps, while `sitemap.xml` uses `.live`. So a crawl of `.live` finds the home page canonical pointing at `.lovable.app` — search engines are told not to index the `.live` version. That is exactly the warning, and it splits ranking signals.

## 4. Pages without internal outlinks — mostly a crawler artifact
The crawl only reached 4 URLs, so JavaScript rendering was off. The one flagged page is almost certainly `/auth`, which genuinely has very few internal links. Real but minor.

## Fix plan

1. Unify canonicals (first)
   - Primary domain: `smartsqlaimentor.live`, already used by the sitemap, tutorials and landing pages.
   - Replace every `https://smartsqlaimentor.lovable.app` canonical / `og:url` / JSON-LD `url` with the primary domain, via one shared `SITE_URL` constant instead of per-route hardcoded strings.
   - Trim `robots.txt` to a single `Sitemap:` line on the primary domain.

2. Security headers
   - Add for HTML responses in `src/server.ts`: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Content-Security-Policy` allowing self, Google Analytics/Tag Manager, Google Fonts, the backend, and the inline styles/scripts the framework needs.

3. Internal links on `/auth`
   - Add the shared site footer (or a compact row: Home, FAQ, About, Privacy, Terms) so the page has server-rendered internal outlinks.

## Technical notes
- Headers go in the existing `fetch` wrapper in `src/server.ts`, applied only when `content-type` is HTML so API and sitemap responses are untouched.
- CSP starts permissive (`'unsafe-inline'` styles, explicit script hosts) because the GA snippet and JSON-LD are inlined in `__root.tsx`; a nonce-based strict policy would require reworking those.
- The canonical change also updates `og:url` in the same routes for consistency.
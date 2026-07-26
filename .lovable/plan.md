## Goal

Three fixes:
1. The draggable floating timer should not appear on About, Contact, FAQ, Privacy, Terms, or the MySQL tutorial pages.
2. The tutorial page should show the fixed timer in its top bar (same one used in SQL practice), not the floating one.
3. Add a back arrow on the content pages so users can return from About/Contact/FAQ/Privacy/Terms.

## Changes

**1. Hide the floating timer (`src/components/FloatingTimer.tsx`)**
- Add `/about`, `/contact`, `/faq`, `/privacy`, `/terms`, `/tutorial` to the existing `HIDE_ON` route list so the draggable widget never mounts there.

**2. Fixed timer on the tutorial (`src/routes/tutorial.tsx`)**
- Both headers in this route (the tutorial list header and the in-viewer header, which already has a back arrow) get `<HeaderTimer storageKey="header_timer:sql" />` placed on the right side of the bar — identical placement and behaviour to SQL practice, so the tutorial timer stays in sync with the SQL session timer.

**3. Back arrow in shared chrome (`src/components/SiteHeader.tsx`)**
- Add a left-side back button (arrow icon, `aria-label="Go back"`) before the logo, visible on every page that uses `SiteHeader` (About, Contact, FAQ, Privacy, Terms).
- Behaviour: navigates back in history when there is history to go back to, otherwise falls back to the home page — so it never dead-ends on a direct/SEO landing.

## Technical notes

- `HeaderTimer` already persists per-key state in localStorage; reusing `header_timer:sql` on the tutorial intentionally shares the SQL study timer rather than starting a second clock.
- No changes to timer logic itself, no backend changes; purely presentation/routing visibility.

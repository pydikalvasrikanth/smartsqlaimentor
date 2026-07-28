## Goal

Modernize `/auth` (the sign in / create account page) and rename the heading from "Sign in to SQL Intelligence Engine" to "Sign in to Smart AI Code Playground".

## Copy changes (src/routes/auth.tsx)

- H1: `Sign in to Smart AI Code Playground`
- Sub-label: replace `adaptive practice` with `SQL · Python · Java · C/C++ · PySpark · GCP`
- Head metadata: title `Sign in — Smart AI Code Playground`, matching description, `og:title`, `og:description` (keeps canonical `/auth`).

## Visual upgrade

Two-panel layout on desktop, single column on mobile:

```text
+---------------------+---------------------+
|  Brand / value      |   Auth card         |
|  panel (lg+ only)   |   - segmented tabs  |
|  - logo + tagline   |   - Google first    |
|  - 3 feature bullets|   - divider "or"    |
|  - subtle gradient  |   - email/password  |
+---------------------+---------------------+
```

- Ambient background using existing semantic tokens (`--primary`, `--primary-glow`, `--surface-2`) — soft radial glow + grid, no hardcoded colors, works in light and dark.
- Auth card: elevated surface, rounded-xl, border, `shadow-elegant`, generous spacing, larger inputs (h-11) with icon prefixes (Mail, Lock) and clear focus rings.
- Sliding segmented control for Sign in / Create account instead of the two flat buttons.
- Google button promoted above the email form with a real Google "G" mark and neutral styling.
- Password field: keep show/hide toggle; in signup mode add a lightweight strength meter (length/number/symbol) rendered from local state only.
- Buttons: keep gradient primary, add loading spinner states already present; consistent `active:scale` micro-interactions.
- Add a theme toggle in the top-right so the page respects light mode.
- Footer line: "Back to home" plus small links to Privacy and Terms.

## Behavior

No auth logic changes — same `signUp`, `signInWithPassword`, `resend`, and `lovable.auth.signInWithOAuth("google")` calls, same redirect handling, same verify-email notice and error toasts.

## Files touched

- `src/routes/auth.tsx` (layout, copy, metadata)
- `src/styles.css` only if a new shared utility/token is needed for the ambient panel

## Accessibility

Single H1, labeled inputs, `aria-label` on icon buttons, visible focus states, mobile layout verified at 420px.

&nbsp;

I will provide the logo please add that logo to my url search 
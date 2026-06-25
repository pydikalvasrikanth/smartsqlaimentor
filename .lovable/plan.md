## Scope

Only the Python page (`src/routes/python.tsx`). No other routes touched.

## 1. Remove the "Free practice" tab on python subject only 

- Delete the tab button (line ~672–674) that renders `Wrench` + "Free practice".
- Remove `"free"` from the `tab` state union and default-case it to `"today"` (line ~335).
- Update the conditional at line ~902 `{!question && (tab === "free" || (tab === "today" && !plan)) && (...)}` to just `{!question && tab === "today" && !plan && (...)}` so the free-practice planner block only shows when there's no plan yet on the Today tab.
- Update the heading at line ~910 to drop the "Free practice session" variant (always show "Build your Python practice plan" since it now only renders when no plan exists).
- Remove the now-unused `Wrench` icon import if nothing else uses it.

## 2. Increase font sizes by one step on all subjects like sql and python and data engineer 

Apply a "+1 Tailwind step" bump to text classes on the Python page only:

- `text-[10px]` → `text-[11px]`
- `text-[11px]` → `text-xs`
- `text-xs` → `text-sm`
- `text-sm` → `text-base`
- `text-base` → `text-lg`
- `text-lg` → `text-xl`
- `text-xl` → `text-2xl`
- `text-2xl` → `text-3xl`

Applied across headings (h1/h2/h3), subheadings, body copy, labels, badges, buttons, and tab labels inside `src/routes/python.tsx`. Monospace status chips in the header stay readable since they also scale up.

## Out of scope

- `src/routes/practice.tsx` (SQL) free-practice tab remains.
- No changes to global theme, other routes, or backend.
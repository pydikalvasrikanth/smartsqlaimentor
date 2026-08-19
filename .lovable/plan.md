# Fix light-mode editor text + uncommented starter instructions

## Problem 1 — starter code words invisible in light mode

The Python / Java / PySpark / C-C++ editors render on a fixed dark
background (`#1e1e1e`) but never set a text colour. Prism only colours
recognised tokens (keywords, strings, numbers); everything else — variable
names, function names, plain identifiers — inherits the page foreground.
In dark mode that inherited colour is near-white, so it reads fine; in light
mode it is near-black on the dark editor background, so those words disappear.
The SQL editor is unaffected because it explicitly sets its own text colour.

Fix: give every code editor an explicit light-on-dark text colour, exactly
like the SQL editor already does, so the editor look is identical in both
themes.

Files:
- `src/components/code/CodeEditor.tsx` (Python/Java/C/C++/PySpark shared editor)
- `src/components/python/PythonEditor.tsx`
- `src/components/java/JavaEditor.tsx`

Change in each: set the editor text colour (`color: "#e8eaf3"`) on the editor
style and a matching class on the wrapper, keeping the existing dark
background and white caret. No theme-dependent colour left to inherit.

## Problem 2 — starter instructions are not commented

Generated starter templates sometimes contain guidance lines ("Write your
solution here", "Return the result as a list", step hints) as bare prose
lines, which is invalid code and shows up as syntax noise in the editor.

Fix in two layers:

1. Prompt layer — in the engine server modules, state explicitly that every
   instruction/guidance line inside starter code MUST be a language-correct
   comment (`#` for Python/PySpark, `//` for Java/C/C++, `--` for SQL) and
   never bare prose.
2. Safety net in `src/lib/starter-code.ts` — after normalising, detect
   remaining prose lines (lines that are not comments, contain no code
   punctuation such as `=`, `(`, `;`, `:` at end, and read as a sentence) and
   prefix them with the correct comment token for the target language. This
   guarantees valid code even when the model ignores the prompt.

Applies to all subjects: SQL, Python, PySpark, Java, C, C++.

## Verification

- Typecheck + production build.
- Open a question in light mode for Python, Java, PySpark and C/C++ and
  confirm all starter-code words are legible.
- Confirm generated starter templates contain no uncommented prose lines.

## Out of scope

No layout, routing, theme-token or AI-model changes.

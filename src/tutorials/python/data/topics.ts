export type QuizQ = {
  q: string;
  options: string[];
  answer: number;
  explain: string;
};

export type TraceFrame = {
  line: number;
  vars: Record<string, string>;
  stack?: string[];
  note?: string;
  heap?: Record<string, string>;
};

export type Section = { heading: string; body: string; code?: string };

export type Topic = {
  id: string;
  title: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  levelName: string;
  emoji: string;
  tagline: string;
  tags: string[];
  sections: Section[];
  example: { code: string; trace?: TraceFrame[] };
  challenge?: { prompt: string; starter: string };
  quiz: QuizQ[];
};

export const LEVELS: { n: 1|2|3|4|5|6; name: string; blurb: string; color: string }[] = [
  { n: 1, name: "Foundations", blurb: "Variables, numbers, strings, booleans, I/O.", color: "teal" },
  { n: 2, name: "Control & Collections", blurb: "if/for/while, lists, tuples, dicts, sets.", color: "blue" },
  { n: 3, name: "Functions & Modules", blurb: "Functions, args, lambdas, scope, packages.", color: "purple" },
  { n: 4, name: "OOP & Errors", blurb: "Classes, inheritance, dunder, exceptions.", color: "pink" },
  { n: 5, name: "Intermediate/Advanced", blurb: "Iterators, generators, decorators, typing.", color: "orange" },
  { n: 6, name: "Expert", blurb: "Async, GIL, metaclasses, memory, performance.", color: "gold" },
];

const t = (o: Topic): Topic => o;

export const TOPICS: Topic[] = [
  // ═════════════════ LEVEL 1: FOUNDATIONS ═════════════════
  t({
    id: "variables",
    title: "Variables & Types",
    level: 1, levelName: "Foundations", emoji: "📦",
    tagline: "Names bound to objects in memory.",
    tags: ["basics", "assignment", "int", "str", "float"],
    sections: [
      { heading: "What is a variable?", body: "A variable is a name that refers to an object stored in memory. Python doesn't have 'boxes' holding values — it has labels pointing to objects." },
      { heading: "Assignment", body: "The = operator binds a name on the left to the object on the right. The same name can be re-bound to any type later.", code: "x = 42\nx = \"hello\"   # perfectly legal — Python is dynamically typed" },
      { heading: "Built-in types", body: "int (whole numbers), float (decimals), str (text), bool (True/False), NoneType (None). Use type(x) to inspect." },
    ],
    example: {
      code: "name = \"Ada\"\nage = 36\nheight = 1.72\nis_engineer = True\nprint(name, age, height, is_engineer)",
      trace: [
        { line: 1, vars: { name: '"Ada"' }, note: "Bind name → string object" },
        { line: 2, vars: { name: '"Ada"', age: "36" }, note: "Bind age → int object" },
        { line: 3, vars: { name: '"Ada"', age: "36", height: "1.72" }, note: "Bind height → float" },
        { line: 4, vars: { name: '"Ada"', age: "36", height: "1.72", is_engineer: "True" }, note: "Bind bool" },
        { line: 5, vars: { name: '"Ada"', age: "36", height: "1.72", is_engineer: "True" }, note: "Print all four" },
      ],
    },
    challenge: { prompt: "Create three variables of different types and print their type().", starter: "# your code here\n" },
    quiz: [
      { q: "What does type(3.14) return?", options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'decimal'>"], answer: 1, explain: "3.14 is a floating-point literal." },
      { q: "After x = 1; x = 'hi', what is type(x)?", options: ["int", "str", "TypeError", "unknown"], answer: 1, explain: "Python re-binds x to the string. Types belong to objects, not names." },
      { q: "Which is NOT a built-in type?", options: ["int", "bool", "char", "None"], answer: 2, explain: "Python has no char — single characters are just 1-length strings." },
    ],
  }),
  t({
    id: "numbers",
    title: "Numbers & Operators",
    level: 1, levelName: "Foundations", emoji: "🔢",
    tagline: "Arithmetic, integer vs float division, modulo.",
    tags: ["math", "int", "float", "//", "%", "**"],
    sections: [
      { heading: "Operators", body: "+ - * / // % ** — plus, minus, times, true divide, floor divide, modulo, power." },
      { heading: "True vs floor division", body: "/ always returns float. // truncates toward negative infinity." },
      { heading: "Precedence", body: "** > unary - > * / // % > + -. Use parentheses when in doubt." },
    ],
    example: {
      code: "print(7 / 2)     # 3.5\nprint(7 // 2)    # 3\nprint(7 % 2)     # 1\nprint(2 ** 10)   # 1024\nprint(-7 // 2)   # -4  (floor!)",
    },
    quiz: [
      { q: "What is 10 // 3?", options: ["3", "3.33", "4", "1"], answer: 0, explain: "Floor division discards the fractional part." },
      { q: "What is 2 ** 3 ** 2?", options: ["64", "512", "12", "18"], answer: 1, explain: "** is right-associative: 2 ** (3 ** 2) = 2 ** 9 = 512." },
      { q: "What is -7 % 3 in Python?", options: ["-1", "2", "1", "-2"], answer: 1, explain: "Python's % returns a result with the sign of the divisor: (-7) - ((-7)//3)*3 = 2." },
    ],
  }),
  t({
    id: "strings",
    title: "Strings & f-strings",
    level: 1, levelName: "Foundations", emoji: "🔤",
    tagline: "Immutable text sequences and rich formatting.",
    tags: ["str", "format", "f-string", "slicing"],
    sections: [
      { heading: "Immutable sequences", body: "Strings are sequences of Unicode code points. You can slice them but not mutate in place." },
      { heading: "f-strings", body: "f\"...\" evaluates expressions inside {}. Supports formatting mini-language: {value:.2f}, {n:>10}, {n:,}." },
      { heading: "Common methods", body: ".upper() .lower() .strip() .split() .replace() .startswith() .endswith() .join()." },
    ],
    example: {
      code: "name = \"ada\"\nage = 36\nprint(f\"{name.title()} is {age} years old\")\nprint(f\"pi ≈ {3.14159:.2f}\")\nprint(\"-\".join([\"a\", \"b\", \"c\"]))",
    },
    quiz: [
      { q: "What is 'python'[1:4]?", options: ["'pyt'", "'yth'", "'ytho'", "'yh'"], answer: 1, explain: "Slice [start:stop] is inclusive of start, exclusive of stop." },
      { q: "f\"{7/2:.1f}\" produces:", options: ["'3.5'", "'3.50'", "'3'", "'7/2'"], answer: 0, explain: ".1f = 1 decimal place." },
      { q: "Are strings mutable?", options: ["Yes", "No", "Only in Python 3", "Only ASCII strings"], answer: 1, explain: "All Python strings are immutable." },
    ],
  }),
  t({
    id: "booleans",
    title: "Booleans & Truthiness",
    level: 1, levelName: "Foundations", emoji: "✅",
    tagline: "True, False, and what counts as 'truthy'.",
    tags: ["bool", "truthy", "and", "or", "not"],
    sections: [
      { heading: "Falsy values", body: "False, None, 0, 0.0, \"\", [], {}, (), set() — everything else is truthy." },
      { heading: "Short-circuit", body: "and returns the first falsy operand (or last). or returns the first truthy operand (or last). Not always a bool!" },
      { heading: "Chained comparisons", body: "a < b < c is (a < b) and (b < c), evaluating b once." },
    ],
    example: {
      code: "print(bool([]))           # False\nprint(bool(\"0\"))          # True (non-empty!)\nprint(0 or \"default\")     # 'default'\nprint(1 < 2 < 3)          # True",
    },
    quiz: [
      { q: "bool('False') is:", options: ["True", "False", "None", "Error"], answer: 0, explain: "Any non-empty string is truthy." },
      { q: "'' or 'x' or 'y' evaluates to:", options: ["''", "'x'", "'y'", "True"], answer: 1, explain: "or returns the first truthy operand." },
      { q: "Which is truthy?", options: ["0", "None", "[]", "'0'"], answer: 3, explain: "Non-empty strings are truthy — even '0'." },
    ],
  }),
  t({
    id: "io",
    title: "print, input & Comments",
    level: 1, levelName: "Foundations", emoji: "💬",
    tagline: "Talking to the user and to yourself.",
    tags: ["print", "input", "comments"],
    sections: [
      { heading: "print", body: "print(*objects, sep=' ', end='\\n'). Change sep or end to customize output." },
      { heading: "input", body: "input(prompt) reads a line as a string. Convert with int()/float() if you need numbers." },
      { heading: "Comments", body: "# for single lines. Triple-quoted strings are usually docstrings, not comments." },
    ],
    example: {
      code: "# Ask the user their name\nname = input(\"Your name: \")\nprint(\"Hello,\", name, end=\"!\\n\")",
    },
    quiz: [
      { q: "input() returns:", options: ["str", "int", "the raw typed characters as bytes", "depends on input"], answer: 0, explain: "Always a string. Convert as needed." },
      { q: "print(1, 2, 3, sep='-') prints:", options: ["'1 2 3'", "'1-2-3'", "'1,2,3'", "'123'"], answer: 1, explain: "sep replaces the default space." },
    ],
  }),
  t({
    id: "conversion",
    title: "Type Conversion",
    level: 1, levelName: "Foundations", emoji: "🔄",
    tagline: "Casting between int, float, str, list, and friends.",
    tags: ["cast", "int", "float", "str"],
    sections: [
      { heading: "Explicit conversion", body: "int(x), float(x), str(x), list(x), tuple(x), set(x), bool(x)." },
      { heading: "Watch out", body: "int('3.14') raises ValueError — you must go through float first: int(float('3.14')) → 3." },
    ],
    example: {
      code: "n = int(\"42\")\np = float(\"3.14\")\nchars = list(\"abc\")\nprint(n, p, chars)",
    },
    quiz: [
      { q: "int('3.7') does what?", options: ["Returns 3", "Returns 4", "Raises ValueError", "Returns 3.7"], answer: 2, explain: "You need float('3.7') first." },
      { q: "list('hi') is:", options: ["['hi']", "['h', 'i']", "'hi'", "Error"], answer: 1, explain: "list() over a string splits into characters." },
    ],
  }),

  // ═════════════════ LEVEL 2: CONTROL & COLLECTIONS ═════════════════
  t({
    id: "if-elif-else",
    title: "if / elif / else",
    level: 2, levelName: "Control & Collections", emoji: "🔀",
    tagline: "Branching on conditions.",
    tags: ["if", "elif", "else", "match"],
    sections: [
      { heading: "Basic branching", body: "Python uses indentation to define blocks — no braces." },
      { heading: "Ternary expression", body: "value_if_true if condition else value_if_false" },
      { heading: "match/case (3.10+)", body: "Pattern matching for structural dispatch. Not a switch — patterns bind names and destructure." },
    ],
    example: {
      code: "score = 87\nif score >= 90:\n    grade = 'A'\nelif score >= 80:\n    grade = 'B'\nelse:\n    grade = 'C'\nprint(grade)",
      trace: [
        { line: 1, vars: { score: "87" } },
        { line: 2, vars: { score: "87" }, note: "87 >= 90? False" },
        { line: 4, vars: { score: "87" }, note: "87 >= 80? True → enter branch" },
        { line: 5, vars: { score: "87", grade: "'B'" } },
        { line: 8, vars: { score: "87", grade: "'B'" }, note: "Print 'B'" },
      ],
    },
    quiz: [
      { q: "How do you write a one-line conditional?", options: ["x = a if cond else b", "x = cond ? a : b", "if cond: x = a else: x = b", "x = cond and a or b"], answer: 0, explain: "Python's ternary reads left-to-right." },
      { q: "elif is short for:", options: ["else if", "end if", "either if", "extra if"], answer: 0, explain: "elif keeps indentation flat." },
    ],
  }),
  t({
    id: "loops",
    title: "for & while Loops",
    level: 2, levelName: "Control & Collections", emoji: "🔁",
    tagline: "Iteration over sequences and conditions.",
    tags: ["for", "while", "break", "continue", "range"],
    sections: [
      { heading: "for loops iterate", body: "for x in iterable: — works on any iterable (list, str, dict, generator, file)." },
      { heading: "range", body: "range(stop), range(start, stop), range(start, stop, step). Lazy — no list created." },
      { heading: "break / continue / else", body: "break exits early. continue skips to next iteration. else on a loop runs if no break fired." },
    ],
    example: {
      code: "total = 0\nfor n in range(1, 6):\n    total += n\nprint(total)  # 15",
      trace: [
        { line: 1, vars: { total: "0" } },
        { line: 2, vars: { total: "0", n: "1" } },
        { line: 3, vars: { total: "1", n: "1" } },
        { line: 2, vars: { total: "1", n: "2" } },
        { line: 3, vars: { total: "3", n: "2" } },
        { line: 2, vars: { total: "3", n: "3" } },
        { line: 3, vars: { total: "6", n: "3" } },
        { line: 2, vars: { total: "6", n: "4" } },
        { line: 3, vars: { total: "10", n: "4" } },
        { line: 2, vars: { total: "10", n: "5" } },
        { line: 3, vars: { total: "15", n: "5" } },
        { line: 4, vars: { total: "15", n: "5" }, note: "Print 15" },
      ],
    },
    quiz: [
      { q: "range(1, 10, 2) yields:", options: ["1,2,...,10", "1,3,5,7,9", "1,3,5,7,9,10", "2,4,6,8"], answer: 1, explain: "Start=1, step=2, stop=10 (exclusive)." },
      { q: "What triggers a loop's else clause?", options: ["Never", "Only on empty iterable", "Loop finished without break", "Any exception"], answer: 2, explain: "else runs when the loop completes normally." },
    ],
  }),
  t({
    id: "lists",
    title: "Lists",
    level: 2, levelName: "Control & Collections", emoji: "📋",
    tagline: "Ordered, mutable sequences.",
    tags: ["list", "append", "slice", "sort"],
    sections: [
      { heading: "Creation & indexing", body: "[1,2,3] literal. Zero-indexed. Negative indices count from the end." },
      { heading: "Mutation", body: ".append(x), .extend(it), .insert(i,x), .pop(i), .remove(x), del lst[i]." },
      { heading: "Slicing", body: "lst[start:stop:step] returns a new list. lst[:] is a shallow copy." },
    ],
    example: {
      code: "nums = [3, 1, 4, 1, 5, 9, 2, 6]\nnums.sort()\nprint(nums[:3])   # [1, 1, 2]\nprint(nums[::-1]) # reversed",
    },
    quiz: [
      { q: "Are lists mutable?", options: ["Yes", "No"], answer: 0, explain: "Lists can be modified in place." },
      { q: "lst[::-1] does what?", options: ["Empty list", "Reversed copy", "In-place reverse", "Error"], answer: 1, explain: "Slice with step -1 → reversed shallow copy." },
      { q: "What does lst.append([1,2]) do to lst=[0]?", options: ["[0,1,2]", "[0,[1,2]]", "Error", "[[0],1,2]"], answer: 1, explain: "append adds one item — the list itself." },
    ],
  }),
  t({
    id: "tuples",
    title: "Tuples",
    level: 2, levelName: "Control & Collections", emoji: "🔗",
    tagline: "Immutable ordered sequences — great as keys.",
    tags: ["tuple", "immutable", "unpacking"],
    sections: [
      { heading: "Immutable = hashable", body: "Tuples of hashables can be dict keys or set members. Lists cannot." },
      { heading: "Unpacking", body: "a, b, c = (1, 2, 3). Star: a, *rest = [1,2,3,4] → rest=[2,3,4]." },
      { heading: "One-element tuple", body: "(1,) not (1) — the trailing comma matters." },
    ],
    example: {
      code: "point = (3, 4)\nx, y = point\nprint(x + y)\n\nfirst, *rest = [1,2,3,4,5]\nprint(first, rest)",
    },
    quiz: [
      { q: "Which is a 1-tuple?", options: ["(1)", "(1,)", "[1]", "{1}"], answer: 1, explain: "The comma makes it a tuple." },
      { q: "Can a tuple be a dict key?", options: ["Always", "If all items are hashable", "Never", "Only with strings"], answer: 1, explain: "A tuple containing a list is not hashable." },
    ],
  }),
  t({
    id: "dicts",
    title: "Dictionaries",
    level: 2, levelName: "Control & Collections", emoji: "🗺️",
    tagline: "Hash-map key→value store. Ordered since 3.7.",
    tags: ["dict", "hash", "get", "items"],
    sections: [
      { heading: "Access & default", body: "d[k] raises KeyError. d.get(k, default) doesn't. d.setdefault(k, v) inserts if missing." },
      { heading: "Iteration", body: "for k in d, for v in d.values(), for k,v in d.items()." },
      { heading: "Comprehensions & merge", body: "{k: v for k,v in pairs}. Python 3.9+: d1 | d2 merges." },
    ],
    example: {
      code: "ages = {\"ada\": 36, \"bob\": 42}\nages[\"cai\"] = 29\nprint(ages.get(\"dee\", -1))\nfor k, v in ages.items():\n    print(k, v)",
    },
    quiz: [
      { q: "d.get('x') when 'x' missing returns:", options: ["KeyError", "None", "0", "''"], answer: 1, explain: "get returns None by default." },
      { q: "Are dicts ordered?", options: ["Never", "Always since Python 3.7", "Only with OrderedDict", "Randomly"], answer: 1, explain: "Insertion order is guaranteed since 3.7." },
    ],
  }),
  t({
    id: "sets",
    title: "Sets",
    level: 2, levelName: "Control & Collections", emoji: "🎯",
    tagline: "Unordered collections of unique hashables.",
    tags: ["set", "union", "intersection"],
    sections: [
      { heading: "Creation", body: "{1,2,3} or set([1,2,3]). Empty set is set(), because {} is a dict." },
      { heading: "Set algebra", body: "a | b union, a & b intersection, a - b difference, a ^ b symmetric difference." },
      { heading: "O(1) membership", body: "x in s is average O(1) for sets and dicts, O(n) for lists." },
    ],
    example: {
      code: "a = {1,2,3,4}\nb = {3,4,5,6}\nprint(a | b)  # {1,2,3,4,5,6}\nprint(a & b)  # {3,4}\nprint(a ^ b)  # {1,2,5,6}",
    },
    quiz: [
      { q: "What does {} create?", options: ["Empty set", "Empty dict", "Empty tuple", "SyntaxError"], answer: 1, explain: "Use set() for an empty set." },
      { q: "a & b returns:", options: ["Union", "Intersection", "Difference", "Symmetric difference"], answer: 1, explain: "& is intersection." },
    ],
  }),

  // ═════════════════ LEVEL 3: FUNCTIONS ═════════════════
  t({
    id: "functions",
    title: "Defining Functions",
    level: 3, levelName: "Functions & Modules", emoji: "🧩",
    tagline: "def, return, default arguments, docstrings.",
    tags: ["def", "return", "docstring"],
    sections: [
      { heading: "def", body: "def name(params): body. Return with return; without it, returns None." },
      { heading: "Default arguments", body: "Evaluated once at definition. Never use mutable defaults like [] or {} — use None + assign inside." },
      { heading: "Docstrings", body: "First string in the body becomes .__doc__. Show up in help()." },
    ],
    example: {
      code: "def greet(name, greeting=\"Hello\"):\n    \"\"\"Return a friendly greeting.\"\"\"\n    return f\"{greeting}, {name}!\"\n\nprint(greet(\"Ada\"))\nprint(greet(\"Bob\", greeting=\"Hi\"))",
      trace: [
        { line: 5, vars: {}, stack: ["<module>"], note: "Call greet('Ada')" },
        { line: 3, vars: { name: "'Ada'", greeting: "'Hello'" }, stack: ["<module>", "greet"], note: "Enter function" },
        { line: 5, vars: {}, stack: ["<module>"], note: "Returns → prints 'Hello, Ada!'" },
        { line: 6, vars: {}, stack: ["<module>"], note: "Call greet('Bob', greeting='Hi')" },
        { line: 3, vars: { name: "'Bob'", greeting: "'Hi'" }, stack: ["<module>", "greet"] },
        { line: 6, vars: {}, stack: ["<module>"], note: "Prints 'Hi, Bob!'" },
      ],
    },
    quiz: [
      { q: "What does 'return' with no value give?", options: ["0", "None", "''", "Error"], answer: 1, explain: "All functions return None if nothing is returned." },
      { q: "def f(x, ls=[]): ls.append(x); return ls. Calling f(1) then f(2) yields:", options: ["[1] and [2]", "[1] and [1,2]", "[] and [2]", "Error"], answer: 1, explain: "Mutable defaults persist across calls." },
    ],
  }),
  t({
    id: "args-kwargs",
    title: "*args & **kwargs",
    level: 3, levelName: "Functions & Modules", emoji: "✨",
    tagline: "Variable-length positional and keyword arguments.",
    tags: ["*args", "**kwargs", "unpacking"],
    sections: [
      { heading: "Star params", body: "*args collects extra positional args into a tuple. **kwargs collects extra keyword args into a dict." },
      { heading: "Unpacking at call site", body: "f(*iter, **mapping) spreads them into arguments." },
      { heading: "Keyword-only", body: "def f(a, *, b): b must be passed by keyword." },
    ],
    example: {
      code: "def show(*args, **kwargs):\n    print(\"pos:\", args)\n    print(\"kw:\", kwargs)\n\nshow(1, 2, 3, name=\"Ada\", age=36)\n\nnums = [1, 2, 3]\nshow(*nums, mode=\"debug\")",
    },
    quiz: [
      { q: "*args is a:", options: ["list", "tuple", "dict", "generator"], answer: 1, explain: "Always a tuple." },
      { q: "**kwargs is a:", options: ["list", "tuple", "dict", "set"], answer: 2, explain: "Always a dict of str keys." },
    ],
  }),
  t({
    id: "lambda",
    title: "Lambdas & Higher-Order Functions",
    level: 3, levelName: "Functions & Modules", emoji: "λ",
    tagline: "Anonymous functions and map/filter/sorted.",
    tags: ["lambda", "map", "filter", "sorted", "key"],
    sections: [
      { heading: "lambda", body: "lambda params: expression — one expression only. Not for statements." },
      { heading: "map / filter", body: "Lazy iterators. Often clearer as comprehensions." },
      { heading: "sorted(key=...)", body: "key is a function called once per item — the classic lambda use case." },
    ],
    example: {
      code: "people = [(\"Ada\", 36), (\"Bob\", 42), (\"Cai\", 29)]\nby_age = sorted(people, key=lambda p: p[1])\nprint(by_age)",
    },
    quiz: [
      { q: "How many statements can a lambda body contain?", options: ["Unlimited", "One expression", "Up to 3", "One statement"], answer: 1, explain: "Lambdas take a single expression." },
      { q: "sorted(xs, key=lambda x: -x) sorts:", options: ["Ascending", "Descending", "Randomly", "By absolute value"], answer: 1, explain: "Sorting by negation reverses order." },
    ],
  }),
  t({
    id: "scope",
    title: "Scope & Closures",
    level: 3, levelName: "Functions & Modules", emoji: "🔒",
    tagline: "LEGB rule and functions that capture state.",
    tags: ["scope", "closure", "nonlocal", "global"],
    sections: [
      { heading: "LEGB", body: "Name lookup order: Local → Enclosing → Global → Built-in." },
      { heading: "global vs nonlocal", body: "global rebinds a module-level name. nonlocal rebinds the nearest enclosing function's name." },
      { heading: "Closures", body: "A nested function that remembers variables from its enclosing scope, even after that scope returns." },
    ],
    example: {
      code: "def make_counter():\n    count = 0\n    def inc():\n        nonlocal count\n        count += 1\n        return count\n    return inc\n\nc = make_counter()\nprint(c(), c(), c())  # 1 2 3",
    },
    quiz: [
      { q: "Without 'nonlocal', assigning to 'count' inside inc would:", options: ["Modify outer", "Create a new local", "Raise SyntaxError", "Modify global"], answer: 1, explain: "Assignment creates a local by default." },
      { q: "What does LEGB stand for?", options: ["Local, Enclosing, Global, Built-in", "Local, Extern, Global, Base", "List, Enum, Global, Boolean", "Lambda, Extend, Get, Bind"], answer: 0, explain: "Standard Python name resolution order." },
    ],
  }),
  t({
    id: "modules",
    title: "Modules & Imports",
    level: 3, levelName: "Functions & Modules", emoji: "📦",
    tagline: "Organizing code across files.",
    tags: ["import", "from", "package", "__init__"],
    sections: [
      { heading: "Import forms", body: "import math, from math import sqrt, from math import sqrt as s, import math as m." },
      { heading: "Packages", body: "A directory with __init__.py (optional in 3.3+) is a package. Sub-modules via dotted paths." },
      { heading: "__name__ == '__main__'", body: "Idiomatic guard: code inside runs only when the module is executed directly, not on import." },
    ],
    example: {
      code: "import math\nfrom math import pi, sqrt\n\nprint(math.tau)\nprint(sqrt(pi))\n\nif __name__ == '__main__':\n    print('run directly')",
    },
    quiz: [
      { q: "Which imports sqrt directly?", options: ["import math.sqrt", "from math import sqrt", "import sqrt from math", "using math.sqrt"], answer: 1, explain: "from … import brings the name into the current namespace." },
      { q: "When is __name__ == '__main__'?", options: ["When file is imported", "When file is run directly", "Always", "Inside a package"], answer: 1, explain: "Only when the file is the entry point." },
    ],
  }),
  t({
    id: "venv",
    title: "Virtual Environments & pip",
    level: 3, levelName: "Functions & Modules", emoji: "🧪",
    tagline: "Isolated dependency worlds per project.",
    tags: ["venv", "pip", "requirements"],
    sections: [
      { heading: "Why venv?", body: "Each project gets its own site-packages so versions never collide with the system Python." },
      { heading: "Create & activate", body: "python -m venv .venv, then source .venv/bin/activate (or .venv\\Scripts\\activate on Windows)." },
      { heading: "pip", body: "pip install X, pip freeze > requirements.txt, pip install -r requirements.txt." },
    ],
    example: {
      code: "# Shell — not Python:\n#   python -m venv .venv\n#   source .venv/bin/activate\n#   pip install requests\n#   pip freeze > requirements.txt\nimport sys\nprint(sys.prefix)  # points at .venv when activated",
    },
    quiz: [
      { q: "What does pip freeze do?", options: ["Locks Python version", "Prints installed packages with versions", "Deletes cache", "Freezes the interpreter"], answer: 1, explain: "Handy for generating requirements.txt." },
      { q: "Why use venv?", options: ["Faster Python", "Per-project isolated packages", "Better syntax", "Required by pip"], answer: 1, explain: "Prevents dependency conflicts across projects." },
    ],
  }),

  // ═════════════════ LEVEL 4: OOP & ERRORS ═════════════════
  t({
    id: "classes",
    title: "Classes & Instances",
    level: 4, levelName: "OOP & Errors", emoji: "🏛️",
    tagline: "Blueprints for objects with state and behavior.",
    tags: ["class", "self", "__init__", "instance"],
    sections: [
      { heading: "Anatomy", body: "class Name: body. __init__ initializes each new instance. self is the instance passed automatically." },
      { heading: "Attributes", body: "Instance attributes live on self. Class attributes are shared across instances." },
      { heading: "Methods", body: "Regular methods take self. @classmethod takes cls. @staticmethod takes neither." },
    ],
    example: {
      code: "class Dog:\n    species = \"Canis familiaris\"  # class attr\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n    def bark(self):\n        return f\"{self.name} says woof\"\n\nfido = Dog(\"Fido\", 3)\nprint(fido.bark())\nprint(fido.species)",
      trace: [
        { line: 9, vars: {}, stack: ["<module>"], note: "Dog('Fido', 3) — allocate + call __init__" },
        { line: 3, vars: { self: "<Dog>", name: "'Fido'", age: "3" }, stack: ["<module>", "__init__"] },
        { line: 4, vars: { self: "<Dog name='Fido'>", name: "'Fido'", age: "3" }, stack: ["<module>", "__init__"] },
        { line: 5, vars: { self: "<Dog name='Fido' age=3>", name: "'Fido'", age: "3" }, stack: ["<module>", "__init__"] },
        { line: 9, vars: { fido: "<Dog name='Fido' age=3>" }, stack: ["<module>"] },
        { line: 10, vars: { fido: "<Dog name='Fido' age=3>" }, stack: ["<module>"], note: "fido.bark() → 'Fido says woof'" },
      ],
    },
    quiz: [
      { q: "What does __init__ do?", options: ["Allocates memory", "Runs once per class", "Initializes a new instance", "Deletes the instance"], answer: 2, explain: "Called after __new__ allocates the object." },
      { q: "Is 'self' a keyword?", options: ["Yes", "No, just a convention"], answer: 1, explain: "You could name it 'this' — but don't." },
    ],
  }),
  t({
    id: "inheritance",
    title: "Inheritance & MRO",
    level: 4, levelName: "OOP & Errors", emoji: "🧬",
    tagline: "Class hierarchies and method resolution order.",
    tags: ["inheritance", "super", "MRO"],
    sections: [
      { heading: "Subclass", body: "class Child(Parent): overrides methods and adds new ones. super() calls the parent's version." },
      { heading: "Multiple inheritance", body: "class C(A, B): — Python uses C3 linearization to compute MRO. Inspect via C.__mro__." },
      { heading: "isinstance / issubclass", body: "Runtime checks against a class or tuple of classes." },
    ],
    example: {
      code: "class Animal:\n    def speak(self): return \"?\"\n\nclass Dog(Animal):\n    def speak(self): return \"woof\"\n\nclass Puppy(Dog):\n    def speak(self): return super().speak() + \"!\"\n\nprint(Puppy().speak())  # woof!\nprint([c.__name__ for c in Puppy.__mro__])",
    },
    quiz: [
      { q: "What does super() do?", options: ["Calls parent method", "Creates parent instance", "Skips MRO", "Same as self"], answer: 0, explain: "Delegates to the next class in the MRO." },
      { q: "MRO stands for:", options: ["Multiple Return Objects", "Method Resolution Order", "Module Runtime Order", "Meta Route Object"], answer: 1, explain: "Determines which method wins in inheritance." },
    ],
  }),
  t({
    id: "dunder",
    title: "Dunder Methods",
    level: 4, levelName: "OOP & Errors", emoji: "✨",
    tagline: "__methods__ that hook into Python's syntax.",
    tags: ["dunder", "__str__", "__eq__", "__len__"],
    sections: [
      { heading: "The Big Ones", body: "__init__, __repr__, __str__, __eq__, __hash__, __len__, __getitem__, __iter__, __call__, __enter__/__exit__." },
      { heading: "Operator overloading", body: "__add__, __mul__, __lt__ etc. — a + b calls a.__add__(b) or b.__radd__(a)." },
    ],
    example: {
      code: "class Vector:\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n    def __add__(self, other):\n        return Vector(self.x+other.x, self.y+other.y)\n    def __repr__(self):\n        return f\"Vector({self.x}, {self.y})\"\n\nprint(Vector(1,2) + Vector(3,4))",
    },
    quiz: [
      { q: "Which dunder makes len(obj) work?", options: ["__size__", "__len__", "__length__", "__count__"], answer: 1, explain: "Any class defining __len__ supports len()." },
      { q: "What does print(x) call when __str__ is missing?", options: ["__repr__", "id()", "type()", "Error"], answer: 0, explain: "print falls back to __repr__." },
    ],
  }),
  t({
    id: "properties",
    title: "Properties & Descriptors",
    level: 4, levelName: "OOP & Errors", emoji: "🎛️",
    tagline: "Computed attributes and the descriptor protocol.",
    tags: ["property", "descriptor", "getter", "setter"],
    sections: [
      { heading: "@property", body: "Turn a method into a read-only attribute. Add @x.setter for writes and @x.deleter for delete." },
      { heading: "Descriptors", body: "A class implementing __get__/__set__/__delete__ is a descriptor. property is built on this." },
    ],
    example: {
      code: "class Circle:\n    def __init__(self, r): self.r = r\n    @property\n    def area(self):\n        return 3.14159 * self.r ** 2\n\nc = Circle(5)\nprint(c.area)  # attribute access, but computed",
    },
    quiz: [
      { q: "Accessing c.area calls:", options: ["Nothing — it's a field", "The getter method", "__init__ again", "type()"], answer: 1, explain: "@property makes it look like an attribute." },
      { q: "Which method makes a class a descriptor?", options: ["__descr__", "__get__", "__prop__", "__attr__"], answer: 1, explain: "Plus optional __set__/__delete__." },
    ],
  }),
  t({
    id: "exceptions",
    title: "Exceptions",
    level: 4, levelName: "OOP & Errors", emoji: "🚨",
    tagline: "try/except/else/finally and custom errors.",
    tags: ["try", "except", "raise", "custom"],
    sections: [
      { heading: "try / except", body: "Catch specific exception types. Bare except: catches everything (avoid)." },
      { heading: "else / finally", body: "else runs if no exception. finally always runs — great for cleanup." },
      { heading: "Raising", body: "raise ValueError('bad input'). Custom exceptions inherit from Exception." },
    ],
    example: {
      code: "def parse_int(s):\n    try:\n        return int(s)\n    except ValueError as e:\n        print(f\"can't parse {s!r}: {e}\")\n        return None\n    finally:\n        print(\"done\")\n\nprint(parse_int(\"42\"))\nprint(parse_int(\"oops\"))",
    },
    quiz: [
      { q: "When does finally run?", options: ["On exception", "On success", "Always", "Never"], answer: 2, explain: "Even if you return early or re-raise." },
      { q: "Custom exceptions should inherit from:", options: ["object", "BaseException", "Exception", "Error"], answer: 2, explain: "BaseException is too low-level; use Exception." },
    ],
  }),
  t({
    id: "context-managers",
    title: "Context Managers (with)",
    level: 4, levelName: "OOP & Errors", emoji: "🚪",
    tagline: "Guaranteed setup and teardown.",
    tags: ["with", "context", "__enter__", "__exit__"],
    sections: [
      { heading: "The protocol", body: "__enter__(self) runs at the start of with. __exit__(self, exc_type, exc, tb) runs at the end, even on exception." },
      { heading: "contextlib.contextmanager", body: "Turn a generator with a single yield into a context manager." },
    ],
    example: {
      code: "from contextlib import contextmanager\n\n@contextmanager\ndef tag(name):\n    print(f\"<{name}>\")\n    yield\n    print(f\"</{name}>\")\n\nwith tag(\"h1\"):\n    print(\"Hello\")",
    },
    quiz: [
      { q: "What guarantees a file is closed?", options: ["Garbage collector", "with open(...) as f:", "del f", "close() at end"], answer: 1, explain: "with calls __exit__ even on exceptions." },
      { q: "@contextmanager decorates a generator with:", options: ["Two yields", "No yield", "Exactly one yield", "A return"], answer: 2, explain: "Code before yield is __enter__; code after is __exit__." },
    ],
  }),

  // ═════════════════ LEVEL 5: INTERMEDIATE/ADVANCED ═════════════════
  t({
    id: "generators",
    title: "Iterators & Generators",
    level: 5, levelName: "Intermediate/Advanced", emoji: "🌀",
    tagline: "Lazy sequences you can walk once.",
    tags: ["iter", "next", "yield", "generator"],
    sections: [
      { heading: "Iterator protocol", body: "An iterator has __iter__ returning self and __next__ raising StopIteration when done." },
      { heading: "Generators", body: "def with yield produces a generator function — each yield suspends state until next() resumes." },
      { heading: "yield from", body: "Delegates iteration to a sub-iterable — flattens nested generators." },
    ],
    example: {
      code: "def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b\n\nprint(list(fib(10)))",
      trace: [
        { line: 7, vars: {}, note: "fib(10) creates a generator (no code runs yet)" },
        { line: 2, vars: { n: "10", a: "0", b: "1" }, note: "First next() → enters function" },
        { line: 4, vars: { n: "10", a: "0", b: "1", "_": "0" }, note: "yield 0 → suspended" },
        { line: 5, vars: { n: "10", a: "0", b: "1", "_": "0" }, note: "Next iteration begins" },
        { line: 5, vars: { n: "10", a: "1", b: "1", "_": "0" }, note: "Swap a, b" },
        { line: 4, vars: { n: "10", a: "1", b: "1", "_": "1" }, note: "yield 1" },
      ],
    },
    quiz: [
      { q: "What does calling a generator function do?", options: ["Runs immediately", "Returns a generator object", "Raises StopIteration", "Returns None"], answer: 1, explain: "Execution starts on the first next()." },
      { q: "When does a generator end?", options: ["return value", "yield None", "Function returns (raises StopIteration)", "break inside"], answer: 2, explain: "Returning stops the generator." },
    ],
  }),
  t({
    id: "decorators",
    title: "Decorators",
    level: 5, levelName: "Intermediate/Advanced", emoji: "🎀",
    tagline: "Functions that wrap functions.",
    tags: ["decorator", "@", "wraps"],
    sections: [
      { heading: "Just syntax sugar", body: "@dec above def f is f = dec(f). Decorators are functions taking a callable and returning a callable." },
      { heading: "functools.wraps", body: "Preserves __name__ and __doc__ on the wrapper — always use it." },
      { heading: "Parameterized", body: "A 'decorator factory' returns the actual decorator: @retry(3) → retry(3)(f)." },
    ],
    example: {
      code: "from functools import wraps\nimport time\n\ndef timed(fn):\n    @wraps(fn)\n    def wrapper(*a, **k):\n        t = time.perf_counter()\n        r = fn(*a, **k)\n        print(f\"{fn.__name__}: {time.perf_counter()-t:.4f}s\")\n        return r\n    return wrapper\n\n@timed\ndef work():\n    return sum(range(100_000))\n\nwork()",
    },
    quiz: [
      { q: "@decorator above def f is equivalent to:", options: ["f = decorator", "f = decorator(f)", "f = decorator()", "decorator(f)"], answer: 1, explain: "It re-binds f to the decorator's return value." },
      { q: "Why use @wraps?", options: ["Speed", "Preserves function metadata", "Required by Python", "Handles arguments"], answer: 1, explain: "So help() and __name__ still work correctly." },
    ],
  }),
  t({
    id: "comprehensions",
    title: "Comprehensions",
    level: 5, levelName: "Intermediate/Advanced", emoji: "📐",
    tagline: "List/dict/set/gen expressions — Pythonic transforms.",
    tags: ["comprehension", "list", "dict", "generator"],
    sections: [
      { heading: "Forms", body: "[x for x in it if cond] — list. {x for ...} — set. {k:v for ...} — dict. (x for ...) — generator." },
      { heading: "Nested", body: "[y for row in matrix for y in row] flattens. Read left→right like nested for loops." },
      { heading: "When not to", body: "If it doesn't fit on one line clearly, use a real loop." },
    ],
    example: {
      code: "squares = [n*n for n in range(10)]\nevens_sq = [n*n for n in range(10) if n % 2 == 0]\nby_len = {w: len(w) for w in [\"hi\", \"hello\"]}\nprint(squares, evens_sq, by_len)",
    },
    quiz: [
      { q: "What does (x*x for x in range(3)) create?", options: ["tuple (0,1,4)", "list [0,1,4]", "generator", "set {0,1,4}"], answer: 2, explain: "Parens around a comprehension = generator." },
      { q: "{x for x in [1,1,2]} is:", options: ["{1,1,2}", "{1,2}", "[1,2]", "dict"], answer: 1, explain: "Sets deduplicate." },
    ],
  }),
  t({
    id: "typing",
    title: "Typing & Dataclasses",
    level: 5, levelName: "Intermediate/Advanced", emoji: "🏷️",
    tagline: "Static type hints and boilerplate-free classes.",
    tags: ["typing", "dataclass", "hints"],
    sections: [
      { heading: "Hints", body: "def f(x: int) -> str: — not enforced at runtime. Tools like mypy/pyright check them." },
      { heading: "Modern generics (3.9+)", body: "list[int], dict[str, int]. Union: X | Y. Optional: X | None." },
      { heading: "@dataclass", body: "Auto-generates __init__, __repr__, __eq__ from field annotations." },
    ],
    example: {
      code: "from dataclasses import dataclass\n\n@dataclass\nclass Point:\n    x: float\n    y: float\n    def dist(self) -> float:\n        return (self.x**2 + self.y**2) ** 0.5\n\nprint(Point(3, 4))\nprint(Point(3, 4).dist())",
    },
    quiz: [
      { q: "Are Python type hints enforced at runtime?", options: ["Yes", "No — checked by tools", "Only for classes", "Only in stub files"], answer: 1, explain: "The interpreter mostly ignores them." },
      { q: "@dataclass generates all except:", options: ["__init__", "__repr__", "__eq__", "__hash__ by default"], answer: 3, explain: "__hash__ is set to None unless frozen=True." },
    ],
  }),
  t({
    id: "pathlib",
    title: "Pathlib & File I/O",
    level: 5, levelName: "Intermediate/Advanced", emoji: "🗂️",
    tagline: "Modern paths and safe file handling.",
    tags: ["pathlib", "open", "with"],
    sections: [
      { heading: "Path objects", body: "from pathlib import Path. p / 'sub' / 'file.txt' composes paths. .exists(), .is_file(), .read_text(), .write_text()." },
      { heading: "open()", body: "open(path, mode) with mode 'r', 'w', 'a', 'rb', 'wb'. Always use inside with." },
    ],
    example: {
      code: "from pathlib import Path\np = Path(\"greeting.txt\")\np.write_text(\"Hello!\\n\")\nprint(p.read_text())",
    },
    quiz: [
      { q: "Path('a') / 'b' returns:", options: ["'a/b' (str)", "Path('a/b')", "TypeError", "['a','b']"], answer: 1, explain: "/ on Path composes paths portably." },
      { q: "Best way to read a text file:", options: ["open(p).read()", "with open(p) as f: f.read()", "read(p)", "file(p)"], answer: 1, explain: "with ensures the file is always closed." },
    ],
  }),
  t({
    id: "json",
    title: "JSON & Serialization",
    level: 5, levelName: "Intermediate/Advanced", emoji: "📤",
    tagline: "Turning objects into text and back.",
    tags: ["json", "pickle", "serialization"],
    sections: [
      { heading: "json module", body: "json.dumps(obj) → str, json.loads(s) → obj. json.dump/load for file objects." },
      { heading: "Custom types", body: "Default only supports dict, list, str, int, float, bool, None. Use default= or a custom Encoder for the rest." },
    ],
    example: {
      code: "import json\ndata = {\"name\": \"Ada\", \"skills\": [\"math\", \"code\"], \"active\": True}\ns = json.dumps(data, indent=2)\nprint(s)\nprint(json.loads(s))",
    },
    quiz: [
      { q: "json.dumps returns:", options: ["dict", "bytes", "str", "File"], answer: 2, explain: "Use dump() to write to a file object." },
      { q: "Can json handle datetime by default?", options: ["Yes", "No"], answer: 1, explain: "You need a custom encoder or convert to a string first." },
    ],
  }),

  // ═════════════════ LEVEL 6: EXPERT ═════════════════
  t({
    id: "async",
    title: "async / await & Event Loop",
    level: 6, levelName: "Expert", emoji: "⚡",
    tagline: "Cooperative concurrency for I/O-bound work.",
    tags: ["async", "await", "asyncio", "coroutine"],
    sections: [
      { heading: "Coroutines", body: "async def creates a coroutine function. Calling it returns a coroutine object — nothing runs until you await or schedule it." },
      { heading: "Event loop", body: "asyncio.run(main()) starts a loop. Await points let other tasks progress while you wait on I/O." },
      { heading: "Gather", body: "asyncio.gather(*coros) runs them concurrently and returns results in order." },
    ],
    example: {
      code: "import asyncio\n\nasync def fetch(name, delay):\n    await asyncio.sleep(delay)\n    return f\"{name} done\"\n\nasync def main():\n    results = await asyncio.gather(\n        fetch(\"A\", 0.3),\n        fetch(\"B\", 0.1),\n        fetch(\"C\", 0.2),\n    )\n    print(results)\n\nasyncio.run(main())",
    },
    quiz: [
      { q: "Is async/await good for CPU-bound work?", options: ["Yes", "No — use multiprocessing"], answer: 1, explain: "It gives no parallel CPU because of the GIL. It shines for I/O." },
      { q: "What does calling async def foo() do (without await)?", options: ["Runs foo", "Returns a coroutine", "Runs in a thread", "Blocks"], answer: 1, explain: "Coroutines need a loop or await to execute." },
    ],
  }),
  t({
    id: "concurrency",
    title: "Threads, Processes & the GIL",
    level: 6, levelName: "Expert", emoji: "🧵",
    tagline: "Concurrency vs parallelism in CPython.",
    tags: ["threading", "multiprocessing", "GIL"],
    sections: [
      { heading: "The GIL", body: "CPython's Global Interpreter Lock allows only one thread to execute Python bytecode at a time. Threads are still great for I/O." },
      { heading: "Threads", body: "threading.Thread(target=fn).start() — cheap, share memory, fine for I/O-bound." },
      { heading: "Processes", body: "multiprocessing bypasses the GIL by spawning separate interpreters. Best for CPU-bound." },
    ],
    example: {
      code: "from concurrent.futures import ThreadPoolExecutor\nimport time\n\ndef slow(i):\n    time.sleep(0.2)\n    return i * i\n\nt = time.perf_counter()\nwith ThreadPoolExecutor(max_workers=5) as pool:\n    print(list(pool.map(slow, range(5))))\nprint(f\"{time.perf_counter()-t:.2f}s\")  # ~0.2s not 1.0s",
    },
    quiz: [
      { q: "For CPU-bound Python work, prefer:", options: ["threading", "multiprocessing", "asyncio", "None"], answer: 1, explain: "Separate processes each have their own GIL." },
      { q: "The GIL exists in:", options: ["Every Python", "CPython only", "Jython", "PyPy JIT"], answer: 1, explain: "Reference implementation only." },
    ],
  }),
  t({
    id: "metaclasses",
    title: "Metaclasses",
    level: 6, levelName: "Expert", emoji: "🪞",
    tagline: "Classes that create classes.",
    tags: ["metaclass", "type"],
    sections: [
      { heading: "type is the default metaclass", body: "type(name, bases, dict) creates a class at runtime. class C: is sugar for that call." },
      { heading: "class C(metaclass=Meta):", body: "Meta.__init__ or Meta.__new__ can register, validate, or transform the class as it's built." },
      { heading: "Usually you don't need them", body: "Prefer decorators or __init_subclass__ for most use cases." },
    ],
    example: {
      code: "class UpperMeta(type):\n    def __new__(mcs, name, bases, ns):\n        ns = {k.upper() if not k.startswith('__') else k: v for k, v in ns.items()}\n        return super().__new__(mcs, name, bases, ns)\n\nclass Config(metaclass=UpperMeta):\n    host = \"localhost\"\n    port = 8080\n\nprint(Config.HOST, Config.PORT)",
    },
    quiz: [
      { q: "The default metaclass is:", options: ["object", "type", "class", "meta"], answer: 1, explain: "Every class is an instance of type." },
      { q: "Simpler alternative to a metaclass:", options: ["__init_subclass__ or a decorator", "eval()", "exec()", "globals()"], answer: 0, explain: "Handles most 'register subclass' patterns." },
    ],
  }),
  t({
    id: "memory",
    title: "Memory, References & gc",
    level: 6, levelName: "Expert", emoji: "🧠",
    tagline: "id, is vs ==, refcounting, and the cycle collector.",
    tags: ["gc", "id", "is", "refcount"],
    sections: [
      { heading: "is vs ==", body: "== compares values. is compares identity (same object in memory). id(x) returns the identity." },
      { heading: "Refcounting", body: "CPython deallocates when the refcount hits zero. sys.getrefcount(x) inspects it." },
      { heading: "Cycles", body: "Reference cycles (a→b→a) can't be freed by refcounting alone. The gc module collects them." },
    ],
    example: {
      code: "import sys, gc\na = [1, 2]\nb = a\nprint(a is b, a == b)     # True True\nc = [1, 2]\nprint(a is c, a == c)     # False True\nprint(sys.getrefcount(a)) # includes the temp arg\ngc.collect()",
    },
    quiz: [
      { q: "a == b tests:", options: ["Identity", "Value equality", "Memory location", "Type"], answer: 1, explain: "== calls __eq__." },
      { q: "Why does CPython need gc?", options: ["Faster free", "To collect reference cycles", "For threads", "Not needed"], answer: 1, explain: "Refcounting alone leaks cycles." },
    ],
  }),
  t({
    id: "performance",
    title: "Performance & __slots__",
    level: 6, levelName: "Expert", emoji: "🚀",
    tagline: "Profiling, __slots__, and when to reach for C.",
    tags: ["performance", "profile", "__slots__", "cython"],
    sections: [
      { heading: "Measure first", body: "cProfile, timeit, and py-spy. Don't optimize before you profile." },
      { heading: "__slots__", body: "Declaring __slots__ on a class skips __dict__ per instance — significant memory savings when you have millions of instances." },
      { heading: "Reach for C", body: "NumPy for numeric arrays. Cython, mypyc, or Rust extensions (via PyO3) when pure-Python is a bottleneck." },
    ],
    example: {
      code: "class Point:\n    __slots__ = (\"x\", \"y\")\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n\np = Point(3, 4)\nprint(p.x, p.y)\ntry:\n    p.z = 5  # AttributeError — no __dict__\nexcept AttributeError as e:\n    print(\"blocked:\", e)",
    },
    quiz: [
      { q: "__slots__ mainly saves:", options: ["CPU", "Memory per instance", "Import time", "Nothing"], answer: 1, explain: "Also slightly speeds attribute access." },
      { q: "First step to speed up code:", options: ["Rewrite in C", "Profile", "Add threads", "Use asyncio"], answer: 1, explain: "Measure before optimizing." },
    ],
  }),
];

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

export function topicIndex(id: string): number {
  return TOPICS.findIndex((t) => t.id === id);
}

export function neighborTopics(id: string) {
  const i = topicIndex(id);
  return {
    prev: i > 0 ? TOPICS[i - 1] : null,
    next: i >= 0 && i < TOPICS.length - 1 ? TOPICS[i + 1] : null,
  };
}
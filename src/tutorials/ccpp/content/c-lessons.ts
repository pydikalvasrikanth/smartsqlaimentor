import type { Curriculum, ConceptCard } from "./types";
import { withExtraLessons, mergeExtras } from "./lesson-kit";
import { cExtraCore } from "./c-extra-core";
import { cExtraAdvanced } from "./c-extra-advanced";

const A = "var(--java-orange)";
const B = "var(--java-blue)";
const T = "var(--teal)";
const P = "var(--purple)";
const K = "var(--pink)";
const G = "oklch(0.72 0.16 145)";
const R = "var(--destructive)";

// small helper
const c = (
  n: number,
  title: string,
  color: string,
  description: string,
  rest: Partial<ConceptCard> = {},
): ConceptCard => ({
  kind: "concept",
  number: n,
  title,
  color,
  description,
  ...rest,
});

const cBase: Curriculum = {
  track: "c",
  name: "C",
  accent: "var(--java-blue)",
  tagline:
    "A hands-on C course with infographic-style lessons — from Hello World through pointers, memory, systems programming, threads, sockets and secure C.",
  modules: [
    {
      id: "foundations",
      title: "1 · Foundations",
      color: G,
      description: "Compilation pipeline, types, control flow — the vocabulary of C.",
      lessons: [
        {
          id: "hello-world",
          title: "Hello, World & the Compilation Pipeline",
          tagline: "How your .c file becomes an executable — the four steps every C program takes.",
          examples: "gcc, clang, .i / .s / .o files",
          cards: [
            c(
              1,
              "Hello, World",
              G,
              "Every C program starts at main() and returns an int status code.",
              {
                example: {
                  code: `#include <stdio.h>\n\nint main(void) {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
                  caption: "hello.c",
                },
                output: "Hello, World!",
              },
            ),
            c(
              2,
              "The 4-Step Pipeline",
              B,
              "Compilation is not one step. Each phase produces a real file you can inspect.",
              {
                extras: [
                  {
                    kind: "diagram",
                    diagram: "compilation-pipeline",
                    caption: ".c → .i → .s → .o → executable",
                  },
                ],
                syntax: {
                  code: `gcc -E hello.c -o hello.i   // preprocess\ngcc -S hello.i -o hello.s   // compile to asm\ngcc -c hello.s -o hello.o   // assemble\ngcc hello.o   -o hello      // link`,
                  caption: "one command per stage",
                },
              },
            ),
            c(
              3,
              "#include & the Preprocessor",
              P,
              "The preprocessor is a text substitution engine. It runs BEFORE the compiler sees your code.",
              {
                example: {
                  code: `#define PI 3.14159\n#define SQUARE(x) ((x) * (x))\n\n#include <stdio.h>  // pastes the whole header here\n\nint main(void) {\n    printf("%f\\n", SQUARE(PI));\n    return 0;\n}`,
                },
                extras: [
                  {
                    kind: "callout",
                    tone: "warn",
                    text: "Always wrap macro arguments in parentheses — SQUARE(a+1) without them becomes a+1*a+1.",
                  },
                ],
              },
            ),
            c(
              4,
              "Compile & Run",
              K,
              "The compiler + linker turn your code into a binary the OS can execute.",
              {
                syntax: {
                  code: `gcc -Wall -Wextra -O2 hello.c -o hello\n./hello`,
                  caption: "shell",
                },
                note: "Always compile with -Wall -Wextra. They catch real bugs.",
              },
            ),
          ],
        },
        {
          id: "types",
          title: "Types, Sizes & Operators",
          tagline: "Primitive types are fixed-width — know exactly how many bytes each one holds.",
          examples: "int, char, sizeof, casting",
          cards: [
            c(
              1,
              "Primitive Types",
              G,
              "C guarantees minimum sizes; use <stdint.h> for exact widths.",
              {
                example: {
                  code: `#include <stdio.h>\n#include <stdint.h>\n\nint main(void) {\n    char     a = 'A';        // >= 1 byte\n    int      b = 42;         // >= 2 bytes (usually 4)\n    long     c = 1000000L;   // >= 4 bytes\n    double   d = 3.14;       // 8 bytes\n    uint32_t e = 0xDEADBEEF; // exactly 4 bytes\n    printf("int=%zu bytes\\n", sizeof(int));\n    return 0;\n}`,
                },
              },
            ),
            c(
              2,
              "sizeof — Always Ask",
              B,
              "Never assume type sizes. sizeof is a compile-time operator.",
              {
                example: {
                  code: `printf("%zu %zu %zu %zu\\n",\n  sizeof(char), sizeof(int), sizeof(long), sizeof(void*));`,
                },
                output: "1 4 8 8   ← on a typical 64-bit Linux",
                extras: [
                  {
                    kind: "callout",
                    tone: "tip",
                    text: "%zu is the correct format specifier for size_t.",
                  },
                ],
              },
            ),
            c(
              3,
              "Operators",
              P,
              "Arithmetic, comparison, bitwise, logical — plus C's compound assignment shortcuts.",
              {
                example: {
                  code: `int  x = 10 + 3 * 4;   // 22, * before +\nint  y = x % 5;        // remainder = 2\nint  m = (x > 20);     // 1 (true)\nint  b = x & 0xF;      // bitwise AND\nx += 5;                // x = x + 5\nx <<= 1;               // x = x * 2`,
                },
              },
            ),
            c(
              4,
              "Casting",
              K,
              "Explicit type conversion. Implicit conversions are a bug factory.",
              {
                example: {
                  code: `int    a = 7, b = 2;\nfloat  wrong = a / b;        // 3.0f  ← integer division!\nfloat  right = (float)a / b; // 3.5f\nsize_t n = 100;\nint    i = (int)n;           // narrow with intent`,
                },
                extras: [
                  {
                    kind: "callout",
                    tone: "warn",
                    text: "Integer / integer is integer. Cast one operand first.",
                  },
                ],
              },
            ),
          ],
        },
        {
          id: "control-flow",
          title: "Control Flow & Functions",
          tagline: "if / for / while / switch and the function contract that binds them.",
          examples: "if, for, while, switch, return",
          cards: [
            c(
              1,
              "if / else",
              G,
              "The staple branching form. Each branch is a statement or a { } block.",
              {
                example: {
                  code: `int score = 82;\nif (score >= 90)      puts("A");\nelse if (score >= 80) puts("B");\nelse                  puts("C or lower");`,
                },
              },
            ),
            c(2, "for & while Loops", B, "Two shapes for the same idea: init → test → step.", {
              example: {
                code: `for (int i = 0; i < 5; i++) printf("%d ", i);\n\nint j = 0;\nwhile (j < 5) { printf("%d ", j); j++; }\n\ndo { j--; } while (j > 0);`,
              },
              output: "0 1 2 3 4 0 1 2 3 4",
            }),
            c(3, "switch", P, "Fast dispatch on integer/char/enum values. Don't forget break!", {
              example: {
                code: `switch (op) {\n    case '+': r = a + b; break;\n    case '-': r = a - b; break;\n    default:  puts("unknown"); break;\n}`,
              },
              extras: [
                {
                  kind: "callout",
                  tone: "warn",
                  text: "Missing break falls through to the next case — sometimes intended, usually a bug.",
                },
              ],
            }),
            c(4, "Functions", K, "Named, typed, reusable units. Prototype in .h, body in .c.", {
              example: {
                code: `// area.h\nint area(int w, int h);\n\n// area.c\nint area(int w, int h) {\n    return w * h;\n}\n\n// main.c\n#include "area.h"\nint main(void) { return area(3, 4); }`,
              },
            }),
          ],
        },
      ],
    },

    {
      id: "pointers",
      title: "2 · Memory & Pointers",
      color: A,
      description: "Addresses, indirection, arrays, strings — the heart of C.",
      lessons: [
        {
          id: "pointers",
          title: "Pointers 101",
          tagline: "A pointer is just a variable that stores an address.",
          examples: "&, *, NULL, int *p",
          cards: [
            c(
              1,
              "Declare & Dereference",
              A,
              "&x gives an address. *p reads the value at an address.",
              {
                example: {
                  code: `int x = 42;\nint *p = &x;      // p holds x's address\nprintf("%d\\n", *p); // 42  (deref)\n*p = 99;           // writes through p\nprintf("%d\\n", x);  // 99`,
                },
                extras: [{ kind: "diagram", diagram: "pointer-arrow", caption: "p → x" }],
              },
            ),
            c(
              2,
              "NULL & Safety",
              R,
              'NULL means "no address". Always check before dereferencing.',
              {
                example: {
                  code: `int *p = NULL;\nif (p != NULL) {\n    *p = 10;   // safe\n}\n// *p without the check = crash (segfault)`,
                },
                extras: [
                  {
                    kind: "callout",
                    tone: "warn",
                    text: "Dereferencing NULL is undefined behavior. Initialize pointers to NULL.",
                  },
                ],
              },
            ),
            c(3, "Pointer Arithmetic", B, "p + 1 advances by sizeof(*p) bytes — not one byte.", {
              example: {
                code: `int a[3] = {10, 20, 30};\nint *p   = a;\nprintf("%d\\n", *(p + 2));  // 30\np++;                       // now points to a[1]\nprintf("%d\\n", *p);        // 20`,
              },
            }),
            c(
              4,
              "Pass-by-Pointer",
              P,
              "C is pass-by-value. To let a function modify a caller variable, pass its address.",
              {
                example: {
                  code: `void inc(int *n) { (*n)++; }\n\nint main(void) {\n    int x = 5;\n    inc(&x);       // pass address\n    printf("%d\\n", x); // 6\n}`,
                },
              },
            ),
            c(
              5,
              "Pitfalls & Interview",
              R,
              "The classic pointer mistakes and one question you WILL be asked.",
              {
                extras: [
                  {
                    kind: "pitfall",
                    items: [
                      "Dereferencing an uninitialised pointer (wild pointer).",
                      "Returning the address of a local variable — that stack frame is gone on return.",
                      "Freeing a pointer twice, or freeing memory you didn't malloc.",
                      "Mixing const-ness: passing const char* where char* is expected.",
                    ],
                  },
                  {
                    kind: "interview",
                    q: "What's the difference between `int *p` and `int const *p` and `int * const p`?",
                    a: "`int *p` — mutable pointer to mutable int. `int const *p` (a.k.a `const int *p`) — pointer can move, but the int it points to is read-only through p. `int * const p` — pointer is fixed to one address, but the int is writeable. Read the declaration right-to-left.",
                  },
                  {
                    kind: "quiz",
                    question: "int a = 5; int *p = &a; *p = 10; a is now?",
                    options: ["5", "10", "undefined", "address of a"],
                    correct: 1,
                    explain:
                      "*p = 10 writes through the pointer to the memory of a, so a becomes 10.",
                  },
                ],
              },
            ),
          ],
        },
        {
          id: "arrays-strings",
          title: "Arrays & Strings",
          tagline: "Arrays decay to pointers. Strings are just char arrays ending in '\\0'.",
          examples: "char[], strlen, strcpy",
          cards: [
            c(
              1,
              "Arrays Decay",
              A,
              "In most expressions an array name becomes a pointer to its first element.",
              {
                example: {
                  code: `int a[5] = {1, 2, 3, 4, 5};\nint *p   = a;         // decay\nprintf("%d\\n", a[2]); // 3\nprintf("%d\\n", p[2]); // 3, identical`,
                },
                note: "sizeof(a) inside main = 20 bytes. Inside a function, sizeof(a) = 8 (just the pointer).",
              },
            ),
            c(
              2,
              "C Strings",
              B,
              "A string is char[] terminated with '\\0'. All string.h functions rely on that.",
              {
                example: {
                  code: `char s[] = "Hi";  // {'H','i','\\0'}\nprintf("%zu\\n", strlen(s)); // 2\nprintf("%zu\\n", sizeof(s)); // 3 (includes '\\0')`,
                },
                extras: [
                  {
                    kind: "callout",
                    tone: "warn",
                    text: "Forget the '\\0' and strlen walks off the end of the buffer — undefined behavior.",
                  },
                ],
              },
            ),
            c(3, "Copy Safely", P, "strcpy has no length check. Prefer strncpy / snprintf.", {
              example: {
                code: `char dst[8];\nsnprintf(dst, sizeof(dst), "%s", "Hello, world!");\nprintf("%s\\n", dst); // "Hello, "  (truncated, still '\\0')`,
              },
              extras: [
                {
                  kind: "callout",
                  tone: "tip",
                  text: "snprintf is the safest string builder in standard C.",
                },
              ],
            }),
          ],
        },
        {
          id: "function-pointers",
          title: "Function Pointers",
          tagline: "Functions have addresses too — pass them around like data.",
          cards: [
            c(1, "Declare", A, "int (*fp)(int, int) — parentheses around *fp are required.", {
              example: {
                code: `int add(int a, int b) { return a + b; }\n\nint (*fp)(int, int) = add;\nprintf("%d\\n", fp(2, 3));  // 5`,
              },
            }),
            c(2, "Callbacks", B, "Function pointers make qsort, atexit, event loops possible.", {
              example: {
                code: `int cmp(const void *a, const void *b) {\n    return *(int*)a - *(int*)b;\n}\n\nint v[] = {3, 1, 4, 1, 5};\nqsort(v, 5, sizeof(int), cmp);`,
              },
            }),
            c(3, "typedef for Sanity", P, "The syntax is ugly. typedef makes it usable.", {
              example: {
                code: `typedef int (*BinaryOp)(int, int);\n\nBinaryOp op = add;\nprintf("%d\\n", op(4, 5));`,
              },
            }),
          ],
        },
      ],
    },

    {
      id: "composite",
      title: "3 · Structs, Unions & I/O",
      color: T,
      description: "Group values together and talk to the outside world.",
      lessons: [
        {
          id: "structs",
          title: "Structs, Unions & Enums",
          tagline: "Compose primitive types into meaningful records.",
          cards: [
            c(
              1,
              "struct",
              T,
              "A record with named fields. Access with . (value) or -> (pointer).",
              {
                example: {
                  code: `struct Point { int x, y; };\n\nstruct Point p = {3, 4};\nprintf("%d %d\\n", p.x, p.y);\n\nstruct Point *pp = &p;\nprintf("%d\\n", pp->y);  // arrow`,
                },
              },
            ),
            c(2, "typedef struct", B, "Skip the struct keyword everywhere by naming the type.", {
              example: { code: `typedef struct {\n    int x, y;\n} Point;\n\nPoint p = {1, 2};` },
            }),
            c(
              3,
              "union",
              P,
              "All fields share the same memory. sizeof(union) = sizeof(biggest field).",
              {
                example: {
                  code: `union Value {\n    int    i;\n    float  f;\n    char   bytes[4];\n};\n\nunion Value v;\nv.i = 0x40490fdb;\nprintf("%f\\n", v.f); // ~pi (type-punning)`,
                },
              },
            ),
            c(4, "enum", K, "Named integer constants. Great with switch.", {
              example: {
                code: `typedef enum { RED, GREEN, BLUE } Color;\nColor c = GREEN;   // == 1`,
              },
            }),
          ],
        },
        {
          id: "file-io",
          title: "File I/O",
          tagline: "fopen / fread / fwrite / fclose — the stdio buffered stream API.",
          cards: [
            c(1, "Text Files", T, "Open in text mode, read/write line by line.", {
              example: {
                code: `FILE *f = fopen("log.txt", "w");\nif (!f) { perror("open"); return 1; }\nfprintf(f, "hello %d\\n", 42);\nfclose(f);`,
              },
            }),
            c(
              2,
              "Read a File",
              B,
              "fgets reads one line, up to size-1 chars, keeping the newline.",
              {
                example: {
                  code: `char buf[256];\nFILE *f = fopen("log.txt", "r");\nwhile (fgets(buf, sizeof buf, f)) {\n    fputs(buf, stdout);\n}\nfclose(f);`,
                },
              },
            ),
            c(3, "Binary I/O", P, "Read raw structs in one shot with fread/fwrite.", {
              example: {
                code: `Point p = {3, 4};\nFILE *f = fopen("p.bin", "wb");\nfwrite(&p, sizeof p, 1, f);\nfclose(f);`,
              },
              extras: [
                {
                  kind: "callout",
                  tone: "warn",
                  text: "Binary format is not portable across CPUs (endianness, padding).",
                },
              ],
            }),
            c(
              4,
              "errno & perror",
              R,
              "Every stdio call sets errno on failure. perror prints a human message.",
              {
                example: {
                  code: `#include <errno.h>\n\nFILE *f = fopen("/no/such/file", "r");\nif (!f) {\n    perror("fopen");     // e.g. "fopen: No such file or directory"\n    printf("errno=%d\\n", errno);\n}`,
                },
              },
            ),
          ],
        },
      ],
    },

    {
      id: "dynamic",
      title: "4 · Dynamic Memory & Data Structures",
      color: P,
      description:
        "malloc / free, and building linked lists, dynamic arrays, hash tables from scratch.",
      lessons: [
        {
          id: "malloc-free",
          title: "malloc & free",
          tagline: "Ask the heap for memory. You own it until you free it.",
          examples: "malloc, calloc, realloc, free",
          cards: [
            c(
              1,
              "Allocate",
              P,
              "malloc(n) returns a void* to n bytes of uninitialised memory, or NULL.",
              {
                example: {
                  code: `int *arr = malloc(100 * sizeof *arr);\nif (!arr) { perror("malloc"); return 1; }\nfor (int i = 0; i < 100; i++) arr[i] = i;\n// ... use arr ...\nfree(arr);   // must free exactly once`,
                },
                extras: [{ kind: "diagram", diagram: "heap-vs-stack", caption: "stack vs heap" }],
              },
            ),
            c(
              2,
              "calloc & realloc",
              B,
              "calloc zero-initialises. realloc resizes (and may move) an existing block.",
              {
                example: {
                  code: `int *a = calloc(10, sizeof *a);   // zeroed\na = realloc(a, 20 * sizeof *a);    // grow to 20\nif (!a) { /* OOM: original block leaked if you overwrote */ }`,
                },
                extras: [
                  {
                    kind: "callout",
                    tone: "warn",
                    text: "Never do  a = realloc(a, ...);  without a temporary — you leak on failure.",
                  },
                ],
              },
            ),
            c(
              3,
              "The 3 Deadly Sins",
              R,
              "Memory leaks, use-after-free, double-free — all Undefined Behavior.",
              {
                example: {
                  code: `int *p = malloc(4);\nfree(p);\n*p = 1;      // use-after-free\nfree(p);     // double-free\n// leak: forgot to call free at all`,
                },
                extras: [
                  {
                    kind: "callout",
                    tone: "tip",
                    text: "Run under valgrind or AddressSanitizer (-fsanitize=address) to catch all three.",
                  },
                ],
              },
            ),
            c(
              4,
              "Complexity & Try It",
              T,
              "malloc is fast on average, but not free — and fragmentation grows with churn.",
              {
                extras: [
                  {
                    kind: "complexity",
                    rows: [
                      { op: "malloc(n)", big_o: "O(1) avg", note: "may occasionally sbrk / mmap" },
                      {
                        op: "free(p)",
                        big_o: "O(1) avg",
                        note: "may coalesce adjacent free blocks",
                      },
                      { op: "realloc grow", big_o: "O(n)", note: "copies if it must relocate" },
                    ],
                  },
                  {
                    kind: "tryIt",
                    lang: "c",
                    caption: "run it",
                    code: `#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    int *v = malloc(5 * sizeof *v);\n    for (int i = 0; i < 5; i++) v[i] = i * i;\n    for (int i = 0; i < 5; i++) printf("%d ", v[i]);\n    free(v);\n    return 0;\n}`,
                  },
                ],
              },
            ),
          ],
        },
        {
          id: "linked-list",
          title: "Linked Lists from Scratch",
          tagline: "A pointer-chain of dynamically allocated nodes.",
          cards: [
            c(1, "Node & Head", P, "Each node stores a value and a pointer to the next node.", {
              example: {
                code: `typedef struct Node {\n    int          value;\n    struct Node *next;\n} Node;\n\nNode *head = NULL;`,
              },
              extras: [
                {
                  kind: "diagram",
                  diagram: "linked-list",
                  caption: "head → 10 → 20 → 30 → 40 → NULL",
                },
              ],
            }),
            c(2, "push_front", B, "Allocate, link to old head, update head.", {
              example: {
                code: `void push(Node **head, int v) {\n    Node *n = malloc(sizeof *n);\n    n->value = v;\n    n->next  = *head;\n    *head    = n;\n}`,
              },
            }),
            c(3, "free_all", R, "Walk the chain, free each node — miss one and you leak.", {
              example: {
                code: `void free_all(Node *head) {\n    while (head) {\n        Node *next = head->next;\n        free(head);\n        head = next;\n    }\n}`,
              },
            }),
          ],
        },
      ],
    },

    {
      id: "systems",
      title: "5 · Systems C",
      color: K,
      description: "Memory model, alignment, UB, signals — how C interacts with the machine.",
      lessons: [
        {
          id: "layout",
          title: "Memory Layout of a Process",
          tagline: "Text, data, BSS, heap, stack — where every variable lives.",
          cards: [
            c(1, "The 5 Segments", K, "The OS loader carves your process into distinct regions.", {
              extras: [
                { kind: "diagram", diagram: "memory-layout", caption: "process address space" },
              ],
            }),
            c(
              2,
              "Where does X live?",
              B,
              "Storage class and declaration site decide the segment.",
              {
                example: {
                  code: `int    g;              // BSS  (zero-initialised)\nint    g2 = 5;         // DATA (initialised)\nstatic int s;          // BSS  (file scope only)\nconst char *msg = "hi";// pointer in DATA, "hi" in read-only TEXT\n\nint main(void) {\n    int   local;        // STACK\n    int  *heap = malloc(4);  // *heap is on HEAP\n}`,
                },
              },
            ),
            c(3, "Stack Frames", A, "Each function call pushes a frame; return pops it.", {
              extras: [
                {
                  kind: "diagram",
                  diagram: "stack-frame",
                  caption: "call stack grows toward lower addresses",
                },
              ],
            }),
          ],
        },
        {
          id: "alignment-ub",
          title: "Alignment, Padding & Undefined Behavior",
          tagline:
            "Structs are padded so each field lives on its natural boundary. Break the rules and the compiler is allowed to do anything.",
          cards: [
            c(
              1,
              "Struct Padding",
              B,
              "The compiler adds hidden bytes so int lands on a 4-byte boundary.",
              {
                example: {
                  code: `struct Bad  { char c; int i; char c2; };    // 12 bytes\nstruct Good { int  i; char c; char c2; };   // 8 bytes\n\nprintf("%zu %zu\\n", sizeof(struct Bad), sizeof(struct Good));`,
                },
                extras: [
                  {
                    kind: "callout",
                    tone: "tip",
                    text: "Order fields largest-to-smallest to shrink structs.",
                  },
                ],
              },
            ),
            c(
              2,
              "Undefined Behavior",
              R,
              "The compiler assumes UB never happens — and optimises accordingly.",
              {
                example: {
                  code: `int x = INT_MAX;\nx + 1;             // signed overflow = UB\n\nint a[3];\na[3] = 0;          // out-of-bounds = UB\n\nint *p; *p = 1;    // uninitialised pointer = UB`,
                },
                extras: [
                  {
                    kind: "callout",
                    tone: "warn",
                    text: "Enable -fsanitize=undefined during development to catch these at runtime.",
                  },
                ],
              },
            ),
            c(3, "volatile & restrict", P, "Two little qualifiers that change codegen.", {
              example: {
                code: `volatile int *reg = (int*)0x40000000; // hardware register — do not cache\n*reg = 1;\n\nvoid copy(int * restrict dst, int * restrict src, int n) {\n    // compiler assumes dst and src don't overlap → can vectorise\n    for (int i = 0; i < n; i++) dst[i] = src[i];\n}`,
              },
            }),
          ],
        },
      ],
    },

    {
      id: "advanced",
      title: "6 · Advanced / Job-Ready",
      color: R,
      description: "Threads, atomics, sockets, mmap, sanitizers, secure C — production skills.",
      lessons: [
        {
          id: "threads",
          title: "POSIX Threads",
          tagline: "pthread_create, mutexes, condition variables — real concurrency in C.",
          examples: "pthread_create, pthread_mutex_t",
          cards: [
            c(1, "Create & Join", A, "One process, many threads sharing the address space.", {
              example: {
                code: `#include <pthread.h>\n\nvoid *worker(void *arg) {\n    int id = *(int*)arg;\n    printf("hi from %d\\n", id);\n    return NULL;\n}\n\nint main(void) {\n    pthread_t t[3];\n    int ids[3] = {1, 2, 3};\n    for (int i = 0; i < 3; i++)\n        pthread_create(&t[i], NULL, worker, &ids[i]);\n    for (int i = 0; i < 3; i++)\n        pthread_join(t[i], NULL);\n}`,
              },
              extras: [{ kind: "diagram", diagram: "threads", caption: "main forks 3 workers" }],
            }),
            c(2, "Mutex", B, "Serialise access to shared data or you get a data race (UB).", {
              example: {
                code: `pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;\nint counter = 0;\n\nvoid *inc(void *_) {\n    for (int i = 0; i < 100000; i++) {\n        pthread_mutex_lock(&m);\n        counter++;\n        pthread_mutex_unlock(&m);\n    }\n    return NULL;\n}`,
              },
            }),
            c(3, "Condition Variables", T, "Wait for a condition without busy-looping.", {
              example: {
                code: `pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;\npthread_cond_t  c = PTHREAD_COND_INITIALIZER;\nint ready = 0;\n\n// consumer\npthread_mutex_lock(&m);\nwhile (!ready) pthread_cond_wait(&c, &m);\npthread_mutex_unlock(&m);\n\n// producer\npthread_mutex_lock(&m);\nready = 1;\npthread_cond_signal(&c);\npthread_mutex_unlock(&m);`,
              },
              extras: [
                {
                  kind: "callout",
                  tone: "warn",
                  text: "Always use while(!cond), not if — spurious wakeups exist.",
                },
              ],
            }),
            c(4, "C11 Atomics", P, "Lock-free counters and flags for hot paths.", {
              example: {
                code: `#include <stdatomic.h>\n\natomic_int hits = 0;\natomic_fetch_add(&hits, 1);\nint v = atomic_load_explicit(&hits, memory_order_acquire);`,
              },
            }),
          ],
        },
        {
          id: "sockets",
          title: "TCP Sockets",
          tagline: "Berkeley sockets — the API every network daemon on Earth is built on.",
          cards: [
            c(1, "Server: bind → listen → accept", A, "Four syscalls give you a TCP server.", {
              example: {
                code: `int s = socket(AF_INET, SOCK_STREAM, 0);\nstruct sockaddr_in a = {\n    .sin_family = AF_INET,\n    .sin_port   = htons(8080),\n    .sin_addr   = { INADDR_ANY },\n};\nbind(s, (struct sockaddr*)&a, sizeof a);\nlisten(s, 16);\n\nfor (;;) {\n    int c = accept(s, NULL, NULL);\n    write(c, "hello\\n", 6);\n    close(c);\n}`,
              },
            }),
            c(2, "Client: socket → connect", B, "Same socket API, one connect call.", {
              example: {
                code: `int s = socket(AF_INET, SOCK_STREAM, 0);\nstruct sockaddr_in a = {\n    .sin_family = AF_INET,\n    .sin_port   = htons(8080),\n};\ninet_pton(AF_INET, "127.0.0.1", &a.sin_addr);\nconnect(s, (struct sockaddr*)&a, sizeof a);\n\nchar buf[64];\nssize_t n = read(s, buf, sizeof buf);\nwrite(1, buf, n);`,
              },
            }),
            c(
              3,
              "Handle Many Clients",
              P,
              "For scale: fork per client, threads, or an event loop with epoll/kqueue.",
              {
                extras: [
                  {
                    kind: "callout",
                    tone: "tip",
                    text: "Modern high-perf servers use epoll (Linux) / kqueue (BSD) / IOCP (Windows).",
                  },
                ],
              },
            ),
          ],
        },
        {
          id: "sanitizers",
          title: "Sanitizers, Valgrind & Secure C",
          tagline:
            "The tools that turn silent UB into loud crashes — plus the classic security bugs.",
          cards: [
            c(
              1,
              "AddressSanitizer",
              R,
              "Catches heap-buffer-overflow, use-after-free, double-free.",
              {
                syntax: { code: `gcc -fsanitize=address -g app.c -o app\n./app`, caption: "asan" },
                output: `==12345==ERROR: AddressSanitizer:\n   heap-buffer-overflow on address 0x... at pc 0x...\n   WRITE of size 4 at 0x... thread T0`,
              },
            ),
            c(2, "UBSan", A, "Catches signed overflow, misaligned loads, shift-out-of-range.", {
              syntax: { code: `gcc -fsanitize=undefined -g app.c -o app`, caption: "ubsan" },
            }),
            c(3, "Buffer Overflow", R, "The bug behind Morris, Heartbleed and thousands more.", {
              example: {
                code: `char name[16];\ngets(name);           // NEVER — deprecated, no bounds check\nstrcpy(name, argv[1]); // also unsafe if argv[1] is long\n\n// SAFE:\nfgets(name, sizeof name, stdin);\nsnprintf(name, sizeof name, "%s", argv[1]);`,
              },
            }),
            c(
              4,
              "Format-String Bug",
              R,
              "%n and friends let an attacker read/write arbitrary memory.",
              {
                example: {
                  code: `printf(user_input);        // ATTACKER controls format string!\nprintf("%s", user_input);  // safe`,
                },
              },
            ),
          ],
        },
      ],
    },
  ],
};

export const cCurriculum: Curriculum = withExtraLessons(
  cBase,
  mergeExtras(cExtraCore, cExtraAdvanced),
);

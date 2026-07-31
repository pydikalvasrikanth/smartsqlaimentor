import type { Lesson } from "./types";
import { c, A, B, T, P, K, G, R } from "./lesson-kit";

/** Extra C lessons for modules 1–3. */
export const cExtraCore: Record<string, Lesson[]> = {
  foundations: [
    {
      id: "storage-classes",
      title: "Storage Classes & Scope",
      tagline: "auto, static, extern, register — who owns a variable, and for how long.",
      examples: "static, extern, const, scope rules",
      cards: [
        c(1, "Automatic Storage", G, "Locals live on the stack and die when the block exits.", {
          example: {
            code: `void f(void) {
    int x = 1;      // automatic: created on entry
    {
        int y = 2;  // inner block scope
    }               // y destroyed here
}                   // x destroyed here`,
          },
          extras: [{ kind: "diagram", diagram: "stack-frame", caption: "one frame per call" }],
        }),
        c(
          2,
          "static — Lifetime vs Visibility",
          B,
          "static means two different things depending on where you write it.",
          {
            example: {
              code: `static int counter = 0;   // file scope: private to this .c file

void tick(void) {
    static int calls = 0; // block scope: persists across calls
    calls++;
}`,
            },
            note: "At file scope static = internal linkage. Inside a function static = permanent lifetime.",
          },
        ),
        c(
          3,
          "extern & Headers",
          P,
          "extern declares a symbol defined in another translation unit.",
          {
            example: {
              code: `// config.h
extern int g_verbose;   // declaration only

// config.c
int g_verbose = 0;      // the single definition`,
            },
            extras: [
              {
                kind: "callout",
                tone: "warn",
                text: "Defining a global in a header (without extern) causes duplicate-symbol link errors.",
              },
            ],
          },
        ),
        c(4, "const & Shadowing Pitfalls", R, "Constants and the scoping traps that hide bugs.", {
          example: {
            code: `const double PI = 3.14159;   // read-only object
int x = 1;
void f(void) {
    int x = 2;   // shadows the global — the global is unreachable here
}`,
          },
          extras: [
            {
              kind: "pitfall",
              items: [
                "Shadowing a global with a local of the same name — compile with -Wshadow.",
                "Assuming a static local resets between calls. It does not.",
                "Using const on a pointer without deciding which side it protects.",
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "preprocessor",
      title: "The Preprocessor in Depth",
      tagline: "Macros, include guards and conditional compilation — the code before the code.",
      examples: "#define, #ifdef, #pragma once",
      cards: [
        c(
          1,
          "Object & Function Macros",
          G,
          "Pure text substitution — no types, no scope, no safety net.",
          {
            syntax: {
              code: `#define MAX_USERS 100
#define MIN(a, b) ((a) < (b) ? (a) : (b))`,
            },
            extras: [
              {
                kind: "callout",
                tone: "warn",
                text: "MIN(i++, j) evaluates i++ twice. Prefer static inline functions when you can.",
              },
            ],
          },
        ),
        c(2, "Include Guards", B, "Stop a header being pasted twice into one translation unit.", {
          example: {
            code: `#ifndef VEC_H
#define VEC_H

typedef struct { float x, y; } Vec;

#endif /* VEC_H */`,
            caption: "vec.h",
          },
          note: "#pragma once is shorter and supported everywhere in practice, but not standard C.",
        }),
        c(3, "Conditional Compilation", P, "Compile different code per platform, per build type.", {
          example: {
            code: `#ifdef DEBUG
  #define LOG(msg) fprintf(stderr, "[dbg] %s\\n", msg)
#else
  #define LOG(msg) ((void)0)
#endif

#if defined(__linux__)
  #include <unistd.h>
#endif`,
          },
        }),
        c(
          4,
          "Stringify & Token Paste",
          K,
          "# turns an argument into a string, ## glues tokens together.",
          {
            example: {
              code: `#define STR(x)      #x
#define CONCAT(a,b) a##b

STR(hello)        // becomes "hello"
int CONCAT(my,Var) = 5;   // int myVar = 5;`,
            },
            extras: [
              {
                kind: "interview",
                q: "Why wrap a multi-statement macro in do { ... } while (0)?",
                a: "So the macro behaves like a single statement. Without it, `if (x) MACRO(); else ...` breaks because the braces end the if-statement early. do/while(0) gives you one statement that still requires the trailing semicolon.",
              },
            ],
          },
        ),
      ],
    },
    {
      id: "io-formatting",
      title: "Formatted I/O Done Right",
      tagline: 'printf/scanf format specifiers, and why scanf("%s") is a security hole.',
      examples: "printf, snprintf, fgets, %d %s %zu",
      cards: [
        c(
          1,
          "printf Specifiers",
          G,
          "Match the specifier to the type exactly — mismatches are undefined behavior.",
          {
            example: {
              code: `printf("%d\\n",   42);        // int
printf("%u\\n",   42u);       // unsigned
printf("%ld\\n",  42L);       // long
printf("%zu\\n",  sizeof(int)); // size_t
printf("%.3f\\n", 3.14159);   // 3.142
printf("%p\\n",   (void*)&x); // pointer
printf("%-10s|\\n", "left");  // width + left align`,
            },
            output: "42\n42\n42\n4\n3.142\n0x7ffd…\nleft      |",
          },
        ),
        c(2, "Reading Input Safely", R, "Never use gets(). Prefer fgets + explicit parsing.", {
          example: {
            code: `char line[128];
if (fgets(line, sizeof line, stdin)) {
    line[strcspn(line, "\\n")] = '\\0';  // trim newline
    int n = atoi(line);
}`,
          },
          extras: [
            {
              kind: "callout",
              tone: "warn",
              text: 'scanf("%s", buf) has no length limit — it will overflow buf. Use "%127s" or fgets.',
            },
          ],
        }),
        c(
          3,
          "snprintf for Building Strings",
          B,
          "Always bounded, always NUL-terminated, returns the length it wanted.",
          {
            example: {
              code: `char buf[32];
int need = snprintf(buf, sizeof buf, "user-%d", id);
if (need >= (int)sizeof buf) {
    // output was truncated
}`,
            },
          },
        ),
        c(4, "Quick Check", P, "Test yourself on specifier mismatches.", {
          extras: [
            {
              kind: "quiz",
              question: "What is the correct specifier for a size_t value?",
              options: ["%d", "%lu", "%zu", "%s"],
              correct: 2,
              explain:
                "%zu is the portable specifier for size_t. %lu happens to work on many 64-bit platforms but is wrong on others.",
            },
          ],
        }),
      ],
    },
  ],

  pointers: [
    {
      id: "pointer-arithmetic",
      title: "Pointer Arithmetic & Arrays vs Pointers",
      tagline: "Why a[i] is literally *(a + i), and where arrays stop behaving like pointers.",
      examples: "a[i], p + n, decay, sizeof",
      cards: [
        c(
          1,
          "Indexing Is Arithmetic",
          G,
          "The compiler rewrites a[i] as *(a + i). Both forms are identical.",
          {
            example: {
              code: `int a[4] = {10, 20, 30, 40};
printf("%d %d\\n", a[2], *(a + 2));  // 30 30
printf("%d\\n", 2[a]);               // 30 — legal, and awful`,
            },
          },
        ),
        c(2, "Scaling by Element Size", B, "p + 1 moves sizeof(*p) bytes, not one byte.", {
          example: {
            code: `int    *pi = a;      // +1 moves 4 bytes
char   *pc = (char*)a; // +1 moves 1 byte
double *pd;            // +1 moves 8 bytes

ptrdiff_t gap = &a[3] - &a[0];  // 3, not 12`,
          },
          extras: [
            { kind: "diagram", diagram: "pointer-arrow", caption: "stride = sizeof(element)" },
          ],
        }),
        c(
          3,
          "Array Decay",
          P,
          "Passed to a function, an array becomes a bare pointer — the length is lost.",
          {
            example: {
              code: `void f(int arr[]) {
    printf("%zu\\n", sizeof arr);  // 8 — the pointer size!
}

int main(void) {
    int a[10];
    printf("%zu\\n", sizeof a);    // 40 — the real array
    f(a);
}`,
            },
            extras: [
              {
                kind: "callout",
                tone: "tip",
                text: "Always pass the length alongside the pointer: f(int *arr, size_t n).",
              },
            ],
          },
        ),
        c(
          4,
          "Multi-Dimensional Arrays",
          K,
          "int m[3][4] is contiguous — 12 ints in a row, not an array of pointers.",
          {
            example: {
              code: `int m[3][4];
m[1][2] = 7;                 // == *(*(m + 1) + 2)
int *flat = &m[0][0];
flat[1 * 4 + 2] = 7;         // same cell

void g(int rows, int cols, int m[rows][cols]); // C99 VLA parameter`,
            },
            extras: [
              {
                kind: "interview",
                q: "Difference between int **pp and int m[3][4]?",
                a: "int m[3][4] is one contiguous block of 12 ints; the compiler knows the row stride. int **pp is a pointer to an array of pointers — two dereferences, non-contiguous rows, and it cannot be initialized from m.",
              },
            ],
          },
        ),
      ],
    },
    {
      id: "const-correctness",
      title: "const Correctness & void*",
      tagline: "Read declarations right-to-left, and use void* for generic code.",
      examples: "const char *, char * const, qsort",
      cards: [
        c(
          1,
          "Read It Right-to-Left",
          G,
          "The position of const relative to * decides what is frozen.",
          {
            example: {
              code: `const int *p;        // pointer to const int   (can't write *p)
int const *p2;       // identical to the above
int * const p3 = &x; // const pointer to int   (can't move p3)
const int * const p4 = &x; // both frozen`,
            },
          },
        ),
        c(
          2,
          "const in APIs",
          B,
          "A const parameter is a promise to the caller that you won't modify the data.",
          {
            example: {
              code: `size_t my_strlen(const char *s) {
    size_t n = 0;
    while (s[n]) n++;
    return n;   // s is never written through
}`,
            },
            note: "const on input pointers also enables better optimization and self-documents intent.",
          },
        ),
        c(
          3,
          "void* — Generic Pointers",
          P,
          "void* holds any object address, but you cannot dereference it directly.",
          {
            example: {
              code: `void *mem = malloc(n * sizeof(int));
int  *ints = mem;               // implicit conversion is fine in C
// *mem;                        // error: incomplete type

int cmp(const void *a, const void *b) {
    return (*(const int*)a) - (*(const int*)b);
}
qsort(ints, n, sizeof(int), cmp);`,
            },
          },
        ),
        c(
          4,
          "Casting Away const",
          R,
          "Legal syntax, undefined behavior if the object was really const.",
          {
            example: {
              code: `const int k = 5;
int *bad = (int*)&k;
*bad = 9;   // UNDEFINED BEHAVIOR — k may live in read-only memory`,
            },
            extras: [
              {
                kind: "callout",
                tone: "warn",
                text: "If you need to cast away const, the API is usually wrong. Fix the signature instead.",
              },
            ],
          },
        ),
      ],
    },
  ],

  composite: [
    {
      id: "bitfields",
      title: "Bitfields & Bit Manipulation",
      tagline: "Pack flags into single bits — and know what the standard does not guarantee.",
      examples: "unsigned x : 3, &, |, ^, <<",
      cards: [
        c(1, "Bitwise Toolkit", G, "Set, clear, toggle and test individual bits.", {
          example: {
            code: `#define BIT(n)  (1u << (n))

flags |=  BIT(3);          // set bit 3
flags &= ~BIT(3);          // clear bit 3
flags ^=  BIT(3);          // toggle bit 3
if (flags & BIT(3)) { }    // test bit 3`,
          },
        }),
        c(2, "Bitfield Structs", B, "Declare exact bit widths inside a struct.", {
          example: {
            code: `struct Packet {
    unsigned version : 4;
    unsigned type    : 4;
    unsigned flags   : 8;
    unsigned length  : 16;
};   // often 4 bytes total`,
          },
          extras: [
            {
              kind: "callout",
              tone: "warn",
              text: "Bit order and padding of bitfields are implementation-defined. Never use them for on-the-wire formats — shift and mask manually instead.",
            },
          ],
        }),
        c(3, "Masks & Extraction", P, "Pull a field out of a packed word with shift + mask.", {
          example: {
            code: `uint32_t word = 0xDEADBEEF;
uint8_t  hi   = (word >> 24) & 0xFF;   // 0xDE
uint16_t low  =  word        & 0xFFFF; // 0xBEEF`,
          },
          output: "hi = 0xDE, low = 0xBEEF",
        }),
        c(4, "Common Traps", R, "Shifting is easier to get wrong than it looks.", {
          extras: [
            {
              kind: "pitfall",
              items: [
                "Shifting by >= the width of the type is undefined (1 << 32 on a 32-bit int).",
                "Shifting a signed negative value left is undefined.",
                "1 << 31 overflows int — write 1u << 31.",
                "Right-shifting a signed negative value is implementation-defined.",
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "typedef-enums",
      title: "typedef, Enums & Opaque Types",
      tagline: "Name your types well, and hide implementation behind an opaque handle.",
      examples: "typedef struct, enum, forward declaration",
      cards: [
        c(1, "typedef", G, "Give a type a short, meaningful name.", {
          example: {
            code: `typedef struct Node Node;        // forward typedef
typedef unsigned long long u64;
typedef int (*Compare)(const void*, const void*);  // function pointer type`,
          },
        }),
        c(2, "Enums", B, "Named integer constants with automatic numbering.", {
          example: {
            code: `typedef enum {
    STATE_IDLE = 0,
    STATE_RUN,        // 1
    STATE_DONE,       // 2
    STATE_COUNT       // 3 — handy array size
} State;

const char *names[STATE_COUNT] = {"idle", "run", "done"};`,
          },
          extras: [
            {
              kind: "callout",
              tone: "tip",
              text: "A trailing COUNT member keeps lookup tables in sync automatically.",
            },
          ],
        }),
        c(
          3,
          "Opaque Handles",
          P,
          "Expose a pointer type in the header, keep the struct body in the .c file.",
          {
            example: {
              code: `// stack.h
typedef struct Stack Stack;
Stack *stack_new(void);
void   stack_push(Stack *s, int v);
void   stack_free(Stack *s);

// stack.c
struct Stack { int *data; size_t len, cap; };`,
            },
            note: "Callers can't touch the fields, so you can change the layout without breaking them.",
          },
        ),
        c(4, "Union Tricks", K, "A union stores one member at a time in the same bytes.", {
          example: {
            code: `typedef struct {
    enum { T_INT, T_FLT, T_STR } tag;
    union { int i; float f; char *s; } as;
} Value;   // tagged union — always check tag before reading`,
          },
        }),
      ],
    },
    {
      id: "buffering-errno",
      title: "stdio Buffering & errno",
      tagline: "Why your printf didn't appear, and how to report real error causes.",
      examples: "setvbuf, fflush, errno, perror",
      cards: [
        c(
          1,
          "Three Buffer Modes",
          G,
          "stdout is line-buffered on a terminal, fully buffered into a pipe.",
          {
            syntax: {
              code: `setvbuf(stdout, NULL, _IONBF, 0);   // unbuffered
setvbuf(stdout, NULL, _IOLBF, 0);   // line buffered
setvbuf(stdout, NULL, _IOFBF, 4096);// fully buffered`,
            },
            extras: [
              {
                kind: "callout",
                tone: "warn",
                text: 'If a program crashes before flushing, buffered output is lost — which is why prints "disappear" before a segfault. stderr is unbuffered on purpose.',
              },
            ],
          },
        ),
        c(2, "fflush", B, "Force the buffer out now.", {
          example: {
            code: `printf("working...");
fflush(stdout);       // appears immediately
long_running_task();`,
          },
          note: "fflush(stdin) is undefined behavior — do not use it to clear input.",
        }),
        c(
          3,
          "errno & perror",
          P,
          "Library calls set errno on failure. Check the return value first, then read errno.",
          {
            example: {
              code: `#include <errno.h>
#include <string.h>

FILE *f = fopen("missing.txt", "r");
if (!f) {
    perror("fopen");                       // fopen: No such file or directory
    fprintf(stderr, "%s\\n", strerror(errno));
    return 1;
}`,
            },
          },
        ),
        c(4, "errno Rules", R, "errno is only meaningful right after a failure.", {
          extras: [
            {
              kind: "pitfall",
              items: [
                "Reading errno when the call succeeded — its value is stale garbage.",
                "Calling another library function before reading errno (it may overwrite it).",
                "Assuming errno is a plain global; it is thread-local in modern C.",
              ],
            },
          ],
        }),
      ],
    },
  ],
};

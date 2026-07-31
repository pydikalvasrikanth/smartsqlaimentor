import type { Lesson } from "./types";
import { c, A, B, P, K, G, R } from "./lesson-kit";

/** Extra C lessons for modules 4–6. */
export const cExtraAdvanced: Record<string, Lesson[]> = {
  dynamic: [
    {
      id: "memory-leaks",
      title: "Leaks, Double Frees & Dangling Pointers",
      tagline: "Every malloc needs exactly one free — on every path, including error paths.",
      examples: "valgrind, free(NULL), p = NULL",
      cards: [
        c(
          1,
          "The Leak",
          R,
          "Lose the last pointer to a block and the memory is unreachable forever.",
          {
            example: {
              code: `char *buf = malloc(1024);
buf = malloc(2048);   // LEAK: the first block is now unreachable
free(buf);            // frees only the second`,
            },
            extras: [{ kind: "diagram", diagram: "heap-vs-stack", caption: "orphaned heap block" }],
          },
        ),
        c(
          2,
          "Dangling Pointers",
          A,
          "Using memory after free is undefined and often exploitable.",
          {
            example: {
              code: `free(p);
// p still holds the old address — a dangling pointer
p = NULL;    // make the mistake crash loudly instead of silently
free(p);     // free(NULL) is guaranteed safe`,
            },
            extras: [
              {
                kind: "callout",
                tone: "tip",
                text: "Set pointers to NULL immediately after freeing. free(NULL) is a documented no-op.",
              },
            ],
          },
        ),
        c(3, "Single-Exit Cleanup", B, "The goto-cleanup pattern keeps error paths leak-free.", {
          example: {
            code: `int run(void) {
    int rc = -1;
    char *a = malloc(64); if (!a) goto out;
    char *b = malloc(64); if (!b) goto out_a;

    rc = 0;
    free(b);
out_a:
    free(a);
out:
    return rc;
}`,
          },
          note: "This is the one place idiomatic C really does use goto.",
        }),
        c(4, "Finding Leaks", P, "Tools, not eyeballs.", {
          syntax: {
            code: `valgrind --leak-check=full --show-leak-kinds=all ./app
gcc -fsanitize=address,undefined -g app.c -o app && ./app`,
          },
          extras: [
            {
              kind: "interview",
              q: "Does a leaked allocation matter if the program exits immediately?",
              a: "For a short-lived CLI the OS reclaims everything at exit, so it is harmless in practice. It matters enormously in long-running servers, libraries and embedded code — and leaks hide real ownership bugs, so tools still flag them.",
            },
          ],
        }),
      ],
    },
    {
      id: "dynamic-arrays",
      title: "Dynamic Arrays (Growable Vectors)",
      tagline: "realloc with geometric growth gives amortized O(1) append.",
      examples: "realloc, capacity, amortized O(1)",
      cards: [
        c(1, "The Struct", G, "Track data, length and capacity separately.", {
          example: {
            code: `typedef struct {
    int   *data;
    size_t len;
    size_t cap;
} Vec;`,
          },
        }),
        c(
          2,
          "Doubling Growth",
          B,
          "Grow by a factor, never by one — that keeps append amortized O(1).",
          {
            example: {
              code: `int vec_push(Vec *v, int value) {
    if (v->len == v->cap) {
        size_t cap = v->cap ? v->cap * 2 : 4;
        int *tmp = realloc(v->data, cap * sizeof *tmp);
        if (!tmp) return -1;        // old block still valid
        v->data = tmp;
        v->cap  = cap;
    }
    v->data[v->len++] = value;
    return 0;
}`,
            },
            extras: [
              {
                kind: "beforeAfter",
                before: {
                  title: "cap = 4, len = 4",
                  headers: ["slot", "value"],
                  rows: [
                    ["0", "10"],
                    ["1", "20"],
                    ["2", "30"],
                    ["3", "40"],
                  ],
                },
                after: {
                  title: "cap = 8, len = 5",
                  headers: ["slot", "value"],
                  rows: [
                    ["0-3", "copied"],
                    ["4", "50"],
                    ["5-7", "free"],
                  ],
                },
                note: "realloc may move the block — every old pointer into it is invalidated.",
              },
            ],
          },
        ),
        c(
          3,
          "The realloc Trap",
          R,
          "Never assign realloc's result straight back to the original pointer.",
          {
            example: {
              code: `v->data = realloc(v->data, n);  // BUG: on failure the old block leaks

int *tmp = realloc(v->data, n);   // correct
if (!tmp) return -1;
v->data = tmp;`,
            },
          },
        ),
        c(4, "Cost", P, "Where the time goes.", {
          extras: [
            {
              kind: "complexity",
              rows: [
                { op: "push (no grow)", big_o: "O(1)" },
                { op: "push (amortized)", big_o: "O(1)", note: "doubling" },
                { op: "push (worst case)", big_o: "O(n)", note: "copy on realloc" },
                { op: "index", big_o: "O(1)" },
                { op: "insert / remove middle", big_o: "O(n)" },
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "hash-tables",
      title: "Hash Tables from Scratch",
      tagline: "Buckets, a hash function, and a collision strategy.",
      examples: "FNV-1a, chaining, load factor",
      cards: [
        c(1, "A Good Hash", G, "FNV-1a is short, fast and good enough for in-process tables.", {
          example: {
            code: `uint64_t fnv1a(const char *s) {
    uint64_t h = 1469598103934665603ULL;
    while (*s) {
        h ^= (unsigned char)*s++;
        h *= 1099511628211ULL;
    }
    return h;
}`,
          },
        }),
        c(2, "Separate Chaining", B, "Each bucket holds a linked list of entries.", {
          example: {
            code: `typedef struct Entry {
    char *key; int value;
    struct Entry *next;
} Entry;

typedef struct { Entry **buckets; size_t nbuckets, count; } Map;

size_t idx = fnv1a(key) % map->nbuckets;`,
          },
          extras: [{ kind: "diagram", diagram: "linked-list", caption: "bucket → entry → entry" }],
        }),
        c(
          3,
          "Load Factor & Rehash",
          P,
          "Grow when count / buckets exceeds ~0.75, or lookups degrade.",
          {
            example: {
              code: `if ((double)map->count / map->nbuckets > 0.75)
    map_rehash(map, map->nbuckets * 2);   // reinsert every entry`,
            },
            extras: [
              {
                kind: "callout",
                tone: "warn",
                text: "Use a power-of-two bucket count with a masked index, or a prime with modulo — mixing the two badly clusters keys.",
              },
            ],
          },
        ),
        c(4, "Cost", K, "Average vs worst case.", {
          extras: [
            {
              kind: "complexity",
              rows: [
                { op: "insert", big_o: "O(1) avg", note: "O(n) if all keys collide" },
                { op: "lookup", big_o: "O(1) avg" },
                { op: "delete", big_o: "O(1) avg" },
                { op: "rehash", big_o: "O(n)", note: "amortized away" },
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "trees",
      title: "Binary Search Trees",
      tagline: "Ordered data with O(log n) search — when the tree stays balanced.",
      examples: "insert, search, recursion, free",
      cards: [
        c(1, "The Node", G, "Two children, one value.", {
          example: {
            code: `typedef struct Node {
    int value;
    struct Node *left, *right;
} Node;`,
          },
        }),
        c(2, "Insert", B, "Recurse left for smaller, right for larger.", {
          example: {
            code: `Node *insert(Node *root, int v) {
    if (!root) {
        Node *n = malloc(sizeof *n);
        n->value = v; n->left = n->right = NULL;
        return n;
    }
    if (v < root->value) root->left  = insert(root->left,  v);
    else if (v > root->value) root->right = insert(root->right, v);
    return root;
}`,
          },
        }),
        c(
          3,
          "Traversal & Cleanup",
          P,
          "In-order visits values in sorted order; post-order is how you free.",
          {
            example: {
              code: `void inorder(const Node *n) {
    if (!n) return;
    inorder(n->left);
    printf("%d ", n->value);
    inorder(n->right);
}

void destroy(Node *n) {
    if (!n) return;
    destroy(n->left); destroy(n->right);
    free(n);            // children first, then self
}`,
            },
          },
        ),
        c(
          4,
          "Balance Matters",
          R,
          "Insert sorted data into a plain BST and it degenerates into a linked list.",
          {
            extras: [
              {
                kind: "complexity",
                rows: [
                  { op: "search (balanced)", big_o: "O(log n)" },
                  { op: "search (degenerate)", big_o: "O(n)", note: "sorted inserts" },
                  { op: "insert", big_o: "O(h)", note: "h = height" },
                  { op: "in-order traversal", big_o: "O(n)" },
                ],
              },
              {
                kind: "callout",
                tone: "tip",
                text: "Production code uses a self-balancing tree (AVL or red-black) — that's what std::map is.",
              },
            ],
          },
        ),
      ],
    },
  ],

  systems: [
    {
      id: "endianness",
      title: "Endianness & Byte Order",
      tagline: "The same 4 bytes mean different numbers on different machines.",
      examples: "htonl, ntohs, uint8_t*",
      cards: [
        c(
          1,
          "Little vs Big",
          G,
          "x86 and ARM are little-endian; network byte order is big-endian.",
          {
            extras: [
              {
                kind: "beforeAfter",
                before: {
                  title: "0x12345678 little-endian",
                  headers: ["addr", "byte"],
                  rows: [
                    ["+0", "78"],
                    ["+1", "56"],
                    ["+2", "34"],
                    ["+3", "12"],
                  ],
                },
                after: {
                  title: "0x12345678 big-endian",
                  headers: ["addr", "byte"],
                  rows: [
                    ["+0", "12"],
                    ["+1", "34"],
                    ["+2", "56"],
                    ["+3", "78"],
                  ],
                },
                note: "Same value in a register, opposite layout in memory.",
              },
            ],
          },
        ),
        c(2, "Detecting It", B, "Inspect the first byte of a known value.", {
          example: {
            code: `uint32_t v = 1;
if (*(uint8_t*)&v == 1) puts("little-endian");
else                    puts("big-endian");`,
          },
        }),
        c(3, "Network Byte Order", P, "Convert before you send, convert after you receive.", {
          example: {
            code: `#include <arpa/inet.h>
uint32_t on_wire = htonl(value);   // host  -> network
uint32_t local   = ntohl(on_wire); // network -> host
uint16_t port    = htons(8080);`,
          },
        }),
        c(4, "Serialization Rule", R, "Never memcpy a struct onto the wire or into a file.", {
          extras: [
            {
              kind: "pitfall",
              items: [
                "Struct padding differs between compilers and architectures.",
                "Endianness differs between sender and receiver.",
                "Type sizes (long) differ between 32- and 64-bit builds.",
                "Serialize field by field with explicit widths and byte order instead.",
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "volatile-restrict",
      title: "volatile, restrict & inline",
      tagline: "Three keywords that tell the optimizer what it may and may not assume.",
      examples: "volatile, restrict, static inline",
      cards: [
        c(1, "volatile", A, '"This memory can change behind your back — reload it every time."', {
          example: {
            code: `volatile uint32_t *reg = (uint32_t*)0x40021000;  // hardware register
while (*reg & BUSY_BIT) { }   // without volatile this may loop forever

volatile sig_atomic_t stop = 0;   // written by a signal handler`,
          },
          extras: [
            {
              kind: "callout",
              tone: "warn",
              text: "volatile is NOT a threading primitive. It gives no atomicity and no memory ordering — use _Atomic or a mutex.",
            },
          ],
        }),
        c(
          2,
          "restrict",
          B,
          "A promise that two pointers never alias, which unlocks big optimizations.",
          {
            example: {
              code: `void add(size_t n, float * restrict out,
         const float * restrict a, const float * restrict b) {
    for (size_t i = 0; i < n; i++) out[i] = a[i] + b[i];
}   // compiler may now vectorize freely`,
            },
            note: "Break the promise (overlapping buffers) and the behavior is undefined — memmove exists for that reason.",
          },
        ),
        c(3, "inline", P, "A hint to inline the body; in C it also changes linkage rules.", {
          example: {
            code: `static inline int clampi(int v, int lo, int hi) {
    return v < lo ? lo : (v > hi ? hi : v);
}   // put it in the header — static inline is the safe idiom`,
          },
        }),
        c(4, "Quick Check", K, "Do you reach for volatile or an atomic?", {
          extras: [
            {
              kind: "quiz",
              question: "Two threads increment a shared counter. What do you use?",
              options: ["volatile int", "_Atomic int or a mutex", "register int", "static int"],
              correct: 1,
              explain:
                "volatile only prevents caching in a register; the read-modify-write is still non-atomic. _Atomic (C11) or a mutex gives real atomicity and ordering.",
            },
          ],
        }),
      ],
    },
    {
      id: "signals",
      title: "Signals & setjmp",
      tagline: "Asynchronous interrupts, and the very short list of things a handler may do.",
      examples: "SIGINT, sigaction, setjmp/longjmp",
      cards: [
        c(
          1,
          "Installing a Handler",
          G,
          "Prefer sigaction over signal — its semantics are portable.",
          {
            example: {
              code: `#include <signal.h>
static volatile sig_atomic_t g_stop = 0;

static void on_sigint(int sig) { (void)sig; g_stop = 1; }

struct sigaction sa = {0};
sa.sa_handler = on_sigint;
sigaction(SIGINT, &sa, NULL);

while (!g_stop) { do_work(); }   // graceful shutdown`,
            },
          },
        ),
        c(2, "Async-Signal-Safe Only", R, "Inside a handler you may call almost nothing.", {
          extras: [
            {
              kind: "pitfall",
              items: [
                "printf, malloc and free are NOT async-signal-safe — calling them can deadlock.",
                "Only write(), _exit(), and the documented safe list are allowed.",
                "Set a volatile sig_atomic_t flag and do the real work in the main loop.",
              ],
            },
          ],
        }),
        c(3, "Common Signals", B, "Know what each one means.", {
          extras: [
            {
              kind: "complexity",
              rows: [
                { op: "SIGINT", big_o: "Ctrl+C", note: "catchable" },
                { op: "SIGTERM", big_o: "polite kill", note: "catchable" },
                { op: "SIGKILL", big_o: "hard kill", note: "cannot be caught" },
                { op: "SIGSEGV", big_o: "bad memory access" },
                {
                  op: "SIGPIPE",
                  big_o: "write to closed socket",
                  note: "often ignored in servers",
                },
              ],
            },
          ],
        }),
        c(4, "setjmp / longjmp", P, "A non-local goto — C's closest thing to an exception.", {
          example: {
            code: `#include <setjmp.h>
static jmp_buf env;

if (setjmp(env) == 0) {
    risky();          // may longjmp back here
} else {
    puts("recovered");
}

void risky(void) { longjmp(env, 1); }`,
          },
          extras: [
            {
              kind: "callout",
              tone: "warn",
              text: "longjmp skips all cleanup — anything malloc'd between setjmp and longjmp leaks. Use sparingly.",
            },
          ],
        }),
      ],
    },
  ],

  advanced: [
    {
      id: "atomics",
      title: "C11 Atomics & Memory Ordering",
      tagline: "Lock-free counters and the ordering guarantees that make them correct.",
      examples: "_Atomic, atomic_fetch_add, memory_order",
      cards: [
        c(1, "Atomic Types", G, "Read-modify-write in one indivisible step.", {
          example: {
            code: `#include <stdatomic.h>

_Atomic int counter = 0;
atomic_fetch_add(&counter, 1);        // seq_cst by default
int now = atomic_load(&counter);
atomic_store(&counter, 0);`,
          },
        }),
        c(2, "Why ++ Is Not Atomic", R, "One line of C is three machine steps.", {
          extras: [
            {
              kind: "beforeAfter",
              before: {
                title: "counter++ (plain int)",
                headers: ["step", "op"],
                rows: [
                  ["1", "load"],
                  ["2", "add 1"],
                  ["3", "store"],
                ],
              },
              after: {
                title: "atomic_fetch_add",
                headers: ["step", "op"],
                rows: [
                  ["1", "lock xadd"],
                  ["", "indivisible"],
                  ["", "no lost update"],
                ],
              },
              note: "Two threads interleaving the load/add/store lose increments.",
            },
          ],
        }),
        c(3, "Memory Orders", P, "Weaker orders are faster but harder to reason about.", {
          example: {
            code: `atomic_fetch_add(&hits, 1, memory_order_relaxed);   // counter only
atomic_store(&ready, 1, memory_order_release);     // publish
if (atomic_load(&ready, memory_order_acquire)) { } // consume`,
          },
          extras: [
            {
              kind: "callout",
              tone: "tip",
              text: "Default to seq_cst. Only weaken to acquire/release after you have measured a real bottleneck.",
            },
          ],
        }),
        c(4, "Compare-and-Swap", K, "The building block of every lock-free algorithm.", {
          example: {
            code: `int expected = old;
while (!atomic_compare_exchange_weak(&value, &expected, expected + 1)) {
    // expected was reloaded with the current value — retry
}`,
          },
          extras: [
            {
              kind: "interview",
              q: "When is a lock-free structure worse than a mutex?",
              a: "Under high contention CAS loops burn CPU retrying, and lock-free code is far harder to write correctly (ABA problem, memory reclamation). A well-implemented mutex parks the thread and is often faster overall. Reach for lock-free only for hot, simple operations like counters.",
            },
          ],
        }),
      ],
    },
    {
      id: "mmap",
      title: "mmap & Shared Memory",
      tagline: "Map a file or anonymous pages straight into your address space.",
      examples: "mmap, munmap, MAP_SHARED, shm_open",
      cards: [
        c(1, "Mapping a File", G, "Read the file as if it were an array — no read() loop.", {
          example: {
            code: `int fd = open("data.bin", O_RDONLY);
struct stat st; fstat(fd, &st);
char *p = mmap(NULL, st.st_size, PROT_READ, MAP_PRIVATE, fd, 0);
if (p == MAP_FAILED) { perror("mmap"); return 1; }

// p[0] .. p[st.st_size - 1] are the file bytes
munmap(p, st.st_size);
close(fd);`,
          },
        }),
        c(2, "Anonymous Memory", B, "malloc uses this under the hood for large allocations.", {
          example: {
            code: `void *big = mmap(NULL, 64u << 20,
                 PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);`,
          },
          extras: [
            {
              kind: "diagram",
              diagram: "memory-layout",
              caption: "mapped region between heap and stack",
            },
          ],
        }),
        c(
          3,
          "Shared Between Processes",
          P,
          "MAP_SHARED makes writes visible to every process mapping the same object.",
          {
            example: {
              code: `int fd = shm_open("/myshm", O_CREAT | O_RDWR, 0600);
ftruncate(fd, size);
void *p = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
// synchronize with a process-shared mutex or atomics`,
            },
          },
        ),
        c(4, "Trade-offs", R, "mmap is not always faster.", {
          extras: [
            {
              kind: "pitfall",
              items: [
                "Page faults on first touch — random access to a cold mapping can be slower than a sequential read().",
                "Accessing past the file end raises SIGBUS, not EOF.",
                "Mappings survive fork() with MAP_SHARED and are copied with MAP_PRIVATE.",
                "Always munmap; mappings are not freed by free().",
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "build-systems",
      title: "make, CMake & Multi-File Projects",
      tagline: "Split code into translation units and rebuild only what changed.",
      examples: "Makefile, CMakeLists.txt, -I -L -l",
      cards: [
        c(
          1,
          "Compile vs Link",
          G,
          "Each .c becomes a .o; the linker resolves symbols between them.",
          {
            syntax: {
              code: `gcc -c main.c -o main.o
gcc -c util.c -o util.o
gcc main.o util.o -o app -lm`,
            },
            extras: [
              {
                kind: "diagram",
                diagram: "compilation-pipeline",
                caption: "many .c → many .o → one binary",
              },
            ],
          },
        ),
        c(2, "A Real Makefile", B, "Pattern rules plus dependency generation.", {
          example: {
            code: `CC      := gcc
CFLAGS  := -Wall -Wextra -O2 -MMD -MP
OBJS    := main.o util.o

app: $(OBJS)
	$(CC) $(OBJS) -o $@ -lm

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

-include $(OBJS:.o=.d)

clean:
	rm -f app $(OBJS) $(OBJS:.o=.d)`,
            caption: "Makefile — recipe lines must start with a TAB",
          },
        }),
        c(3, "CMake", P, "Generates the build files, handles dependencies and platforms for you.", {
          example: {
            code: `cmake_minimum_required(VERSION 3.16)
project(app C)
set(CMAKE_C_STANDARD 11)

add_executable(app main.c util.c)
target_compile_options(app PRIVATE -Wall -Wextra)
target_link_libraries(app PRIVATE m)`,
            caption: "CMakeLists.txt",
          },
          syntax: {
            code: `cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build -j`,
          },
        }),
        c(4, "Linker Errors Decoded", R, "The two messages every C developer meets.", {
          extras: [
            {
              kind: "pitfall",
              items: [
                '"undefined reference to X" — you declared X but never linked the object/library defining it.',
                '"multiple definition of X" — a variable or function body was defined in a header included twice.',
                "Library order matters with static libs: put -lfoo AFTER the objects that use it.",
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "profiling",
      title: "Profiling & Performance",
      tagline: "Measure first. The bottleneck is almost never where you guessed.",
      examples: "perf, gprof, cache misses, -O2",
      cards: [
        c(1, "Tools", G, "Sampling profilers show where the time actually goes.", {
          syntax: {
            code: `perf stat ./app                 # cycles, IPC, cache misses
perf record -g ./app && perf report
gcc -pg app.c -o app && ./app && gprof ./app`,
          },
        }),
        c(
          2,
          "Cache Locality Wins",
          B,
          "Row-major traversal is often several times faster than column-major.",
          {
            example: {
              code: `// fast: sequential memory
for (int i = 0; i < N; i++)
    for (int j = 0; j < N; j++) sum += m[i][j];

// slow: strides the cache on every step
for (int j = 0; j < N; j++)
    for (int i = 0; i < N; i++) sum += m[i][j];`,
            },
            extras: [
              {
                kind: "callout",
                tone: "tip",
                text: "Same complexity, same instruction count — the only difference is cache behaviour.",
              },
            ],
          },
        ),
        c(3, "Compiler Flags", P, "The optimizer is your cheapest speedup.", {
          extras: [
            {
              kind: "complexity",
              rows: [
                { op: "-O0", big_o: "no opt", note: "debug builds only" },
                { op: "-O2", big_o: "default release" },
                { op: "-O3", big_o: "more inlining/vectorizing", note: "measure, can be slower" },
                { op: "-march=native", big_o: "uses this CPU's ISA", note: "not portable" },
                { op: "-flto", big_o: "cross-file inlining" },
              ],
            },
          ],
        }),
        c(4, "Method", K, "A repeatable loop beats intuition.", {
          extras: [
            {
              kind: "interview",
              q: "How do you approach optimizing a slow C program?",
              a: "Reproduce with a benchmark, profile to find the hot path, check whether the algorithm is wrong (complexity beats micro-optimization), then look at memory access patterns and allocation churn, and only then micro-optimize. Re-measure after every change and keep the benchmark in CI.",
            },
          ],
        }),
      ],
    },
    {
      id: "allocator",
      title: "Writing a Small Allocator",
      tagline: "Bump and pool allocators — a classic systems interview exercise.",
      examples: "arena, alignment, free list",
      cards: [
        c(
          1,
          "Bump / Arena Allocator",
          G,
          "Allocation is a pointer increment; you free everything at once.",
          {
            example: {
              code: `typedef struct { char *base, *cur, *end; } Arena;

void *arena_alloc(Arena *a, size_t n, size_t align) {
    uintptr_t p = (uintptr_t)a->cur;
    p = (p + align - 1) & ~(uintptr_t)(align - 1);   // round up
    if ((char*)p + n > a->end) return NULL;
    a->cur = (char*)p + n;
    return (void*)p;
}

void arena_reset(Arena *a) { a->cur = a->base; }`,
            },
          },
        ),
        c(2, "Pool Allocator", B, "Fixed-size blocks and a free list — O(1) alloc and free.", {
          example: {
            code: `typedef struct Block { struct Block *next; } Block;

void *pool_alloc(Block **free_list) {
    Block *b = *free_list;
    if (b) *free_list = b->next;
    return b;
}

void pool_free(Block **free_list, void *p) {
    Block *b = p; b->next = *free_list; *free_list = b;
}`,
          },
          extras: [
            {
              kind: "diagram",
              diagram: "linked-list",
              caption: "free list threaded through unused blocks",
            },
          ],
        }),
        c(
          3,
          "Alignment Rules",
          P,
          "Every returned pointer must be suitably aligned for any type.",
          {
            example: {
              code: `#include <stdalign.h>
size_t align = alignof(max_align_t);   // usually 16 on x86-64`,
            },
            extras: [
              {
                kind: "callout",
                tone: "warn",
                text: "Misaligned access is undefined behavior in C and a hard fault on some architectures.",
              },
            ],
          },
        ),
        c(4, "Why Bother", K, "Custom allocators trade generality for speed.", {
          extras: [
            {
              kind: "complexity",
              rows: [
                {
                  op: "malloc/free",
                  big_o: "general",
                  note: "thread-safe, fragmentation handling",
                },
                { op: "arena alloc", big_o: "O(1)", note: "no per-object free" },
                { op: "arena reset", big_o: "O(1)", note: "frees everything" },
                { op: "pool alloc/free", big_o: "O(1)", note: "fixed size only" },
              ],
            },
          ],
        }),
      ],
    },
  ],
};

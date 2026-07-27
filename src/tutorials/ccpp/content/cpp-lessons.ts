import type { Curriculum, ConceptCard } from "./types";

const A = "var(--java-orange)";
const B = "var(--java-blue)";
const T = "var(--teal)";
const P = "var(--purple)";
const K = "var(--pink)";
const G = "oklch(0.72 0.16 145)";
const R = "var(--destructive)";
const c = (n: number, title: string, color: string, description: string, rest: Partial<ConceptCard> = {}): ConceptCard => ({
  kind: "concept", number: n, title, color, description, ...rest,
});

export const cppCurriculum: Curriculum = {
  track: "cpp",
  name: "C++",
  accent: "var(--purple)",
  tagline: "Modern C++ from Hello World through RAII, templates, STL, move semantics, concurrency and C++20 concepts.",
  modules: [
    {
      id: "foundations",
      title: "1 · Foundations",
      color: G,
      description: "Modern C++ syntax, references, auto, and RAII.",
      lessons: [
        {
          id: "hello-world",
          title: "Hello, Modern C++",
          tagline: "iostream, namespaces, auto — the modern C++ starter kit.",
          cards: [
            c(1, "Hello, World", G, "std::cout streams text; endl flushes.", {
              example: { code: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!\\n";\n    return 0;\n}`, caption: "hello.cpp" },
              output: "Hello, World!",
            }),
            c(2, "namespaces", B, "std:: prefixes standard library. Prefer explicit std:: over using namespace std;.", {
              example: { code: `#include <string>\n#include <iostream>\n\nint main() {\n    std::string name = "Ada";\n    std::cout << "Hi, " << name << '\\n';\n}` },
            }),
            c(3, "auto & Range for", P, "Let the compiler infer the type — cleaner and safer than repeating it.", {
              example: { code: `#include <vector>\n#include <iostream>\n\nint main() {\n    std::vector<int> v{1, 2, 3, 4};\n    for (auto x : v) std::cout << x << ' ';\n}` },
              output: "1 2 3 4",
            }),
            c(4, "Build", K, "Compile with a modern standard flag.", {
              syntax: { code: `g++ -std=c++20 -Wall -Wextra -O2 hello.cpp -o hello\n./hello`, caption: "shell" },
            }),
          ],
        },
        {
          id: "refs-const",
          title: "References & const-correctness",
          tagline: "Prefer references over pointers when the value must not be null.",
          cards: [
            c(1, "T&", G, "An alias for another object. Cannot be rebound, cannot be null.", {
              example: { code: `int x = 5;\nint& r = x;   // alias\nr = 10;       // x is now 10` },
            }),
            c(2, "const T&", B, "Pass big objects to functions without copying.", {
              example: { code: `void print(const std::string& s) {\n    std::cout << s << '\\n';\n}` },
              extras: [{ kind: "callout", tone: "tip", text: "Rule of thumb: pass by const& for anything larger than a machine word." }],
            }),
            c(3, "const methods", P, "A const method promises not to mutate the object.", {
              example: { code: `struct Point {\n    int x, y;\n    int sum() const { return x + y; }\n};` },
            }),
          ],
        },
      ],
    },
    {
      id: "classes",
      title: "2 · Classes & RAII",
      color: A,
      description: "Constructors, destructors, and the C++ resource-management idiom.",
      lessons: [
        {
          id: "classes",
          title: "Classes, Constructors, Destructors",
          tagline: "A class ties data and behaviour together; the destructor runs at scope exit.",
          cards: [
            c(1, "Class Basics", A, "public / private, member init lists, constructors.", {
              example: { code: `class Counter {\npublic:\n    Counter(int start = 0) : n_(start) {}\n    void inc() { ++n_; }\n    int  value() const { return n_; }\nprivate:\n    int n_;\n};` },
            }),
            c(2, "Destructor", B, "Runs automatically when the object goes out of scope.", {
              example: { code: `class File {\npublic:\n    File(const char* p) { f_ = std::fopen(p, "r"); }\n    ~File() { if (f_) std::fclose(f_); }\nprivate:\n    std::FILE* f_ = nullptr;\n};` },
            }),
            c(3, "RAII", T, "Resource Acquisition Is Initialisation — every resource has an owner object.", {
              example: { code: `void read() {\n    File f("data.txt");   // opens\n    // ... use f ...\n}                          // f goes out of scope → destructor closes it` },
              extras: [{ kind: "callout", tone: "tip", text: "RAII is why C++ doesn't need try/finally." }],
            }),
            c(4, "Rule of Zero/Five", P, "If you write a destructor, you probably need to write (or delete) copy & move too.", {
              extras: [{ kind: "callout", tone: "note", text: "Prefer members that already manage themselves (std::vector, std::unique_ptr) — then you need nothing (Rule of Zero)." }],
            }),
          ],
        },
        {
          id: "inheritance",
          title: "Inheritance & Polymorphism",
          tagline: "virtual functions enable runtime dispatch through a vtable.",
          cards: [
            c(1, "virtual", A, "Override in derived classes and call through a base pointer/reference.", {
              example: { code: `struct Shape {\n    virtual double area() const = 0;   // pure virtual\n    virtual ~Shape() = default;\n};\nstruct Circle : Shape {\n    double r;\n    Circle(double r) : r(r) {}\n    double area() const override { return 3.14159 * r * r; }\n};` },
              extras: [{ kind: "diagram", diagram: "vtable", caption: "vtable dispatch" }],
            }),
            c(2, "override & final", B, "Ask the compiler to check you actually override.", {
              example: { code: `struct D : Shape {\n    double area() const override { return 0; }\n    // typo like: double are() const override;  → compiler error\n};` },
            }),
            c(3, "Virtual Destructor", R, "Base with virtual functions must have virtual dtor, or deletion is UB.", {
              example: { code: `Shape* s = new Circle(2);\ndelete s;   // needs Shape::~Shape() virtual` },
            }),
          ],
        },
      ],
    },
    {
      id: "memory",
      title: "3 · Memory & Smart Pointers",
      color: T,
      description: "new/delete, unique_ptr, shared_ptr, move semantics.",
      lessons: [
        {
          id: "smart-ptrs",
          title: "unique_ptr & shared_ptr",
          tagline: "Prefer smart pointers over raw new/delete. Ownership becomes visible.",
          cards: [
            c(1, "unique_ptr", T, "Sole owner. Non-copyable, movable. Zero overhead.", {
              example: { code: `#include <memory>\nauto p = std::make_unique<int>(42);\nstd::cout << *p;\n// no delete — destructor runs when p goes out of scope` },
              extras: [{ kind: "diagram", diagram: "smart-pointer", caption: "unique ownership" }],
            }),
            c(2, "shared_ptr", B, "Reference-counted shared ownership. Slightly more expensive.", {
              example: { code: `auto a = std::make_shared<int>(7);\nauto b = a;         // ref count = 2\n// both go out of scope → delete` },
              extras: [{ kind: "callout", tone: "warn", text: "Two shared_ptrs pointing at each other = leak. Break cycles with weak_ptr." }],
            }),
            c(3, "Move Semantics", P, "std::move casts to rvalue so the resource is stolen, not copied.", {
              example: { code: `std::vector<int> a(1000000, 1);\nstd::vector<int> b = std::move(a); // O(1) steal, not O(n) copy\n// a is now valid-but-unspecified (empty in practice)` },
              extras: [{ kind: "diagram", diagram: "move-vs-copy", caption: "copy vs move" }],
            }),
          ],
        },
      ],
    },
    {
      id: "templates",
      title: "4 · Templates & Generic Programming",
      color: P,
      description: "Function & class templates, concepts, variadics.",
      lessons: [
        {
          id: "templates",
          title: "Templates",
          tagline: "Write once, instantiate for any type at compile time.",
          cards: [
            c(1, "Function Template", P, "The compiler generates a version per used type.", {
              example: { code: `template<typename T>\nT max_of(T a, T b) { return a > b ? a : b; }\n\nmax_of(3, 4);       // T = int\nmax_of(2.5, 1.1);   // T = double` },
            }),
            c(2, "Class Template", B, "Same idea for classes — std::vector<T> works this way.", {
              example: { code: `template<typename T>\nstruct Box {\n    T value;\n    T& get() { return value; }\n};\n\nBox<int> a{42};\nBox<std::string> b{"hi"};` },
            }),
            c(3, "C++20 Concepts", G, "Constrain templates so errors are readable and intent is explicit.", {
              example: { code: `#include <concepts>\n\ntemplate<std::integral T>\nT twice(T x) { return x + x; }\n\ntwice(5);      // ok\ntwice(1.5);    // compile error: not integral` },
            }),
            c(4, "Variadic Templates", K, "Take any number of arguments of any types.", {
              example: { code: `template<typename... Ts>\nvoid print_all(Ts... xs) {\n    ((std::cout << xs << ' '), ...);   // C++17 fold\n}\nprint_all(1, "two", 3.0);` },
            }),
          ],
        },
      ],
    },
    {
      id: "stl",
      title: "5 · STL",
      color: K,
      description: "Containers, iterators, algorithms, ranges.",
      lessons: [
        {
          id: "containers",
          title: "Containers & Iterators",
          tagline: "vector, map, unordered_map — pick the right container for the access pattern.",
          cards: [
            c(1, "vector", K, "Dynamic array. O(1) push_back amortised, O(1) random access.", {
              example: { code: `#include <vector>\nstd::vector<int> v{1, 2, 3};\nv.push_back(4);\nfor (int x : v) std::cout << x << ' ';` },
              extras: [{ kind: "diagram", diagram: "vector-grow", caption: "doubling capacity" }],
            }),
            c(2, "map vs unordered_map", B, "map = ordered tree (O(log n)); unordered_map = hash table (O(1) avg).", {
              example: { code: `#include <unordered_map>\nstd::unordered_map<std::string, int> ages;\nages["Ada"] = 36;\nages["Ken"] = 70;\nfor (auto& [name, age] : ages)\n    std::cout << name << '=' << age << '\\n';` },
            }),
            c(3, "Algorithms", P, "The <algorithm> header operates on iterator ranges.", {
              example: { code: `#include <algorithm>\nstd::vector<int> v{4, 1, 3, 2};\nstd::sort(v.begin(), v.end());\nauto it = std::find(v.begin(), v.end(), 3);` },
            }),
            c(4, "C++20 Ranges", G, "Composable, lazy, no iterator boilerplate.", {
              example: { code: `#include <ranges>\n#include <vector>\n\nstd::vector v{1, 2, 3, 4, 5};\nauto evens_sq = v\n    | std::views::filter([](int x){ return x % 2 == 0; })\n    | std::views::transform([](int x){ return x * x; });\nfor (int x : evens_sq) std::cout << x << ' ';  // 4 16` },
            }),
          ],
        },
      ],
    },
    {
      id: "concurrency",
      title: "6 · Concurrency",
      color: B,
      description: "std::thread, mutex, atomic, async.",
      lessons: [
        {
          id: "threads",
          title: "std::thread & std::mutex",
          tagline: "Portable concurrency in the standard library.",
          cards: [
            c(1, "std::thread", B, "Create a thread with a callable and its arguments.", {
              example: { code: `#include <thread>\n\nvoid worker(int id) { std::cout << "hi " << id << '\\n'; }\n\nint main() {\n    std::thread t1(worker, 1);\n    std::thread t2(worker, 2);\n    t1.join();\n    t2.join();\n}` },
              extras: [{ kind: "diagram", diagram: "threads", caption: "two workers" }],
            }),
            c(2, "std::mutex + lock_guard", A, "RAII lock — releases even on exception.", {
              example: { code: `std::mutex m;\nint counter = 0;\n\nvoid inc() {\n    for (int i = 0; i < 100000; ++i) {\n        std::lock_guard<std::mutex> lk(m);\n        ++counter;\n    }\n}` },
            }),
            c(3, "std::atomic", T, "Lock-free counters / flags for hot paths.", {
              example: { code: `#include <atomic>\nstd::atomic<int> hits{0};\nhits.fetch_add(1, std::memory_order_relaxed);` },
            }),
            c(4, "async & future", P, "Fire-and-collect concurrent tasks.", {
              example: { code: `#include <future>\nauto f = std::async(std::launch::async, [] { return 42; });\nint v = f.get();   // waits and retrieves` },
            }),
          ],
        },
      ],
    },
    {
      id: "advanced",
      title: "7 · Advanced / Job-Ready",
      color: R,
      description: "Exceptions, lambdas, constexpr, modules — production idioms.",
      lessons: [
        {
          id: "modern",
          title: "Lambdas, constexpr & Exceptions",
          tagline: "The idioms that show up in every real-world modern C++ codebase.",
          cards: [
            c(1, "Lambdas", R, "Anonymous functions with a capture list.", {
              example: { code: `int threshold = 10;\nauto over = [threshold](int x) { return x > threshold; };\n\nstd::vector<int> v{1, 20, 3, 40};\nauto n = std::count_if(v.begin(), v.end(), over);  // 2` },
            }),
            c(2, "constexpr", G, "Compute at compile time — zero runtime cost.", {
              example: { code: `constexpr int factorial(int n) {\n    return n <= 1 ? 1 : n * factorial(n - 1);\n}\nstatic_assert(factorial(5) == 120);` },
            }),
            c(3, "Exceptions", A, "Throw / try / catch — pair with RAII for safe cleanup.", {
              example: { code: `void load(const std::string& path) {\n    std::ifstream f(path);\n    if (!f) throw std::runtime_error("cannot open " + path);\n    // ...\n}\n\ntry { load("data.txt"); }\ncatch (const std::exception& e) {\n    std::cerr << "err: " << e.what() << '\\n';\n}` },
            }),
            c(4, "C++20 Modules", P, "The modern replacement for #include — faster builds, real encapsulation.", {
              example: { code: `// math.ixx\nexport module math;\nexport int add(int a, int b) { return a + b; }\n\n// main.cpp\nimport math;\nint main() { return add(2, 3); }` },
              extras: [{ kind: "callout", tone: "note", text: "Modules avoid re-parsing headers per translation unit. Big compile-time wins." }],
            }),
          ],
        },
      ],
    },
  ],
};
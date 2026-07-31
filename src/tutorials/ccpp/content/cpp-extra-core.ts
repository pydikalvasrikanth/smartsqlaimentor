import type { Lesson } from "./types";
import { c, A, B, P, K, G, R } from "./lesson-kit";

/** Extra C++ lessons for modules 1–4. */
export const cppExtraCore: Record<string, Lesson[]> = {
  foundations: [
    {
      id: "namespaces",
      title: "Namespaces & Organisation",
      tagline: "Avoid name collisions without prefixing every symbol.",
      examples: "namespace, ::, using, anonymous namespace",
      cards: [
        c(1, "Declaring a Namespace", G, "Group related names under a scope.", {
          example: {
            code: `namespace app::net {
    class Socket { /* ... */ };
    void connect(Socket&);
}

app::net::Socket s;
namespace net = app::net;   // alias
net::connect(s);`,
          },
        }),
        c(
          2,
          "using — Carefully",
          R,
          "using namespace std; in a header poisons every file that includes it.",
          {
            example: {
              code: `using std::string;      // fine: one specific name
using namespace std;    // avoid in headers, tolerable in a .cpp

// std::count vs a local count() becomes ambiguous`,
            },
            extras: [
              {
                kind: "callout",
                tone: "warn",
                text: "Never put `using namespace` at file scope in a header.",
              },
            ],
          },
        ),
        c(3, "Anonymous Namespace", B, "The C++ replacement for file-scope static.", {
          example: {
            code: `namespace {
    int helper_counter = 0;      // internal linkage
    void helper() { /* ... */ }
}`,
          },
        }),
        c(
          4,
          "ADL",
          P,
          "Argument-dependent lookup finds functions in the namespace of the argument type.",
          {
            example: {
              code: `namespace geo { struct Point{int x,y;}; void print(const Point&); }

geo::Point p;
print(p);   // found via ADL — no geo:: needed`,
            },
          },
        ),
      ],
    },
    {
      id: "auto-ranges",
      title: "auto, Range-for & nullptr",
      tagline: "Modern syntax that removes noise without hiding intent.",
      examples: "auto, for (x : v), nullptr, structured bindings",
      cards: [
        c(1, "auto", G, "The compiler deduces the type — the type is still static and fixed.", {
          example: {
            code: `auto  i = 42;                     // int
auto  d = 3.14;                   // double
auto& r = vec[0];                 // reference, no copy
const auto& cr = big_object;      // read-only, no copy
auto  it = m.find(key);           // spares you std::map<K,V>::iterator`,
          },
          extras: [
            {
              kind: "callout",
              tone: "warn",
              text: "Plain `auto x = expr;` always copies and drops references and const. Write auto& or const auto& when you mean a reference.",
            },
          ],
        }),
        c(2, "Range-based for", B, "Iterate a container without an index or an iterator.", {
          example: {
            code: `std::vector<std::string> names{"ada", "linus"};

for (const auto& n : names) std::cout << n << '\\n';  // read
for (auto& n : names) n += "!";                       // modify`,
          },
        }),
        c(3, "nullptr", P, "A real null-pointer type — NULL and 0 are integers in disguise.", {
          example: {
            code: `void f(int);
void f(char*);

f(NULL);     // ambiguous / calls f(int) — surprise
f(nullptr);  // unambiguously calls f(char*)`,
          },
        }),
        c(
          4,
          "Structured Bindings (C++17)",
          K,
          "Destructure pairs, tuples and structs in one line.",
          {
            example: {
              code: `std::map<std::string,int> ages{{"ada",36}};

for (const auto& [name, age] : ages)
    std::cout << name << " is " << age << '\\n';

auto [ok, value] = try_parse(text);`,
            },
          },
        ),
      ],
    },
    {
      id: "overloading-defaults",
      title: "Overloading, Default Args & Lambdas",
      tagline: "One name, several signatures — plus inline callable objects.",
      examples: "overload, default args, [](){}",
      cards: [
        c(
          1,
          "Function Overloading",
          G,
          "Same name, different parameter lists. The return type alone is not enough.",
          {
            example: {
              code: `int  area(int side)          { return side * side; }
int  area(int w, int h)      { return w * h; }
double area(double r)        { return 3.14159 * r * r; }

area(3);       // int version
area(2.0);     // double version`,
            },
          },
        ),
        c(
          2,
          "Default Arguments",
          B,
          "Declared once, in the header — not repeated in the definition.",
          {
            example: {
              code: `// log.hpp
void log(const std::string& msg, int level = 1);

// log.cpp
void log(const std::string& msg, int level) { /* no default here */ }`,
            },
            extras: [
              {
                kind: "callout",
                tone: "warn",
                text: "Default arguments plus overloads easily become ambiguous. Prefer one or the other.",
              },
            ],
          },
        ),
        c(
          3,
          "Lambdas",
          P,
          "An anonymous function object, optionally capturing surrounding state.",
          {
            example: {
              code: `int factor = 3;
auto scale = [factor](int x) { return x * factor; };   // capture by value
auto bump  = [&factor]()     { factor++; };            // capture by reference

std::sort(v.begin(), v.end(),
          [](const auto& a, const auto& b) { return a.score > b.score; });`,
            },
          },
        ),
        c(4, "Capture Pitfalls", R, "A dangling capture outlives the thing it captured.", {
          extras: [
            {
              kind: "pitfall",
              items: [
                "[&] capturing a local, then storing the lambda past the scope — dangling reference.",
                "Capturing `this` in a lambda stored on a member that outlives the object.",
                "[=] silently copies large objects; be explicit about what you capture.",
              ],
            },
          ],
        }),
      ],
    },
  ],

  classes: [
    {
      id: "raii",
      title: "RAII — Resource Acquisition Is Initialization",
      tagline: "The single most important idiom in C++: lifetime owns the resource.",
      examples: "destructor, scope guard, lock_guard",
      cards: [
        c(
          1,
          "The Idea",
          G,
          "Acquire in the constructor, release in the destructor. The compiler runs cleanup for you.",
          {
            example: {
              code: `class File {
    std::FILE* f_;
public:
    explicit File(const char* path) : f_(std::fopen(path, "r")) {
        if (!f_) throw std::runtime_error("open failed");
    }
    ~File() { if (f_) std::fclose(f_); }
    File(const File&) = delete;             // non-copyable
    File& operator=(const File&) = delete;
};`,
            },
          },
        ),
        c(
          2,
          "Exception Safety for Free",
          B,
          "Stack unwinding runs every destructor on the way out.",
          {
            extras: [
              {
                kind: "beforeAfter",
                before: {
                  title: "Manual cleanup",
                  headers: ["step", "risk"],
                  rows: [
                    ["fopen", "—"],
                    ["throw", "fclose skipped"],
                    ["fclose", "never runs"],
                  ],
                },
                after: {
                  title: "RAII",
                  headers: ["step", "risk"],
                  rows: [
                    ["File f{...}", "—"],
                    ["throw", "unwinding"],
                    ["~File()", "always runs"],
                  ],
                },
                note: "No goto cleanup, no forgotten branch.",
              },
            ],
          },
        ),
        c(3, "Standard RAII Types", P, "The library already wraps most resources.", {
          example: {
            code: `std::lock_guard<std::mutex> lk(m);        // unlocks on scope exit
std::unique_ptr<Widget> w = std::make_unique<Widget>();
std::fstream file{"data.txt"};            // closes itself
std::vector<int> v(1000);                 // frees itself`,
          },
        }),
        c(4, "Destructor Rules", R, "One rule you must never break.", {
          extras: [
            {
              kind: "callout",
              tone: "warn",
              text: "Never let an exception escape a destructor — during unwinding that calls std::terminate. Catch and log inside.",
            },
            {
              kind: "interview",
              q: "Why does a base class with virtual functions need a virtual destructor?",
              a: "Deleting a derived object through a Base* with a non-virtual destructor is undefined behavior — only ~Base() runs, so derived members leak. Give any polymorphic base a public virtual destructor (or a protected non-virtual one if deletion through the base is disallowed).",
            },
          ],
        }),
      ],
    },
    {
      id: "access-static",
      title: "Access Control, static & friend",
      tagline: "Encapsulation knobs: who can touch what, and what belongs to the class itself.",
      examples: "public/private/protected, static members, friend",
      cards: [
        c(1, "Access Specifiers", G, "struct defaults to public, class defaults to private.", {
          example: {
            code: `class Account {
public:
    void deposit(double x);      // interface
protected:
    void audit();                // derived classes only
private:
    double balance_ = 0;         // nobody outside
};`,
          },
        }),
        c(2, "static Members", B, "One shared instance for the whole class, not per object.", {
          example: {
            code: `class Counter {
    static inline int live_ = 0;      // C++17: define inline in the header
public:
    Counter()  { ++live_; }
    ~Counter() { --live_; }
    static int live() { return live_; }   // no this pointer
};`,
          },
        }),
        c(3, "friend", P, "Grants one specific function or class access to privates.", {
          example: {
            code: `class Vec2 {
    float x_, y_;
    friend std::ostream& operator<<(std::ostream&, const Vec2&);
};

std::ostream& operator<<(std::ostream& os, const Vec2& v) {
    return os << '(' << v.x_ << ", " << v.y_ << ')';
}`,
          },
          extras: [
            {
              kind: "callout",
              tone: "tip",
              text: "friend is not a hole in encapsulation when used for operators that are logically part of the class.",
            },
          ],
        }),
        c(
          4,
          "explicit & Member Init",
          K,
          "Stop accidental implicit conversions; initialise in the member list.",
          {
            example: {
              code: `class Buffer {
    std::size_t size_;
    std::vector<char> data_;
public:
    explicit Buffer(std::size_t n) : size_(n), data_(n) {}
    // without explicit: Buffer b = 42; would compile
};`,
            },
            note: "Members initialise in declaration order, not the order you write in the init list.",
          },
        ),
      ],
    },
    {
      id: "operator-overloading",
      title: "Operator Overloading",
      tagline: "Give your types natural syntax — without surprising the reader.",
      examples: "operator+, operator==, operator<<",
      cards: [
        c(
          1,
          "Arithmetic Operators",
          G,
          "Implement += as a member, then + as a non-member built on it.",
          {
            example: {
              code: `struct Vec2 {
    float x{}, y{};
    Vec2& operator+=(const Vec2& r) { x += r.x; y += r.y; return *this; }
};

inline Vec2 operator+(Vec2 l, const Vec2& r) { l += r; return l; }`,
            },
          },
        ),
        c(2, "Comparison (C++20)", B, "One spaceship operator generates all six comparisons.", {
          example: {
            code: `struct Version {
    int major, minor, patch;
    auto operator<=>(const Version&) const = default;
    bool operator==(const Version&) const = default;
};

Version{1,2,0} < Version{1,10,0};   // true`,
          },
        }),
        c(
          3,
          "Stream Insertion",
          P,
          "Must be a non-member, because the left operand is the stream.",
          {
            example: {
              code: `std::ostream& operator<<(std::ostream& os, const Vec2& v) {
    return os << '(' << v.x << ", " << v.y << ')';
}

std::cout << Vec2{1,2} << '\\n';   // (1, 2)`,
            },
          },
        ),
        c(4, "Rules of Taste", R, "Overloading is easy to abuse.", {
          extras: [
            {
              kind: "pitfall",
              items: [
                "Only overload when the meaning is obvious (+ on a vector, not on a Logger).",
                "Keep operator semantics conventional: + must not modify its operands.",
                "operator[] should return a reference so callers can assign through it.",
                "Overload == and != consistently, or use = default with <=>.",
              ],
            },
          ],
        }),
      ],
    },
  ],

  memory: [
    {
      id: "new-delete",
      title: "new, delete & Why You Should Avoid Them",
      tagline: "The raw layer under smart pointers — know it, then stop writing it.",
      examples: "new, delete[], leaks, make_unique",
      cards: [
        c(1, "Raw Allocation", A, "new calls the constructor; delete calls the destructor.", {
          example: {
            code: `Widget* w = new Widget(42);
delete w;

int* arr = new int[100];
delete[] arr;          // [] form is mandatory for arrays`,
          },
          extras: [
            {
              kind: "diagram",
              diagram: "heap-vs-stack",
              caption: "objects on the heap outlive their scope",
            },
          ],
        }),
        c(2, "malloc vs new", B, "They are not interchangeable.", {
          extras: [
            {
              kind: "beforeAfter",
              before: {
                title: "malloc / free",
                headers: ["aspect", "behaviour"],
                rows: [
                  ["ctor/dtor", "not called"],
                  ["return", "void*"],
                  ["failure", "returns NULL"],
                  ["size", "you compute it"],
                ],
              },
              after: {
                title: "new / delete",
                headers: ["aspect", "behaviour"],
                rows: [
                  ["ctor/dtor", "called"],
                  ["return", "typed pointer"],
                  ["failure", "throws bad_alloc"],
                  ["size", "deduced"],
                ],
              },
              note: "Never free() something from new, or delete something from malloc().",
            },
          ],
        }),
        c(3, "The Leak Paths", R, "Any early return or throw between new and delete leaks.", {
          example: {
            code: `void bad() {
    Widget* w = new Widget;
    if (!validate()) return;   // LEAK
    risky();                   // throws -> LEAK
    delete w;
}

void good() {
    auto w = std::make_unique<Widget>();  // always freed
}`,
          },
        }),
        c(4, "Modern Guidance", G, "Almost no application code should contain new or delete.", {
          extras: [
            {
              kind: "callout",
              tone: "tip",
              text: "Prefer a value member, then std::vector/std::string, then make_unique, then make_shared. Raw new belongs inside library internals only.",
            },
          ],
        }),
      ],
    },
    {
      id: "move-semantics",
      title: "Move Semantics: lvalues, rvalues & std::move",
      tagline: "Transfer ownership instead of copying buffers.",
      examples: "T&&, std::move, move ctor",
      cards: [
        c(
          1,
          "lvalue vs rvalue",
          G,
          "An lvalue has a name and an address; an rvalue is a temporary.",
          {
            example: {
              code: `std::string s = "hi";   // s is an lvalue
get_name();             // the returned temporary is an rvalue

void f(const std::string&);  // binds to both
void f(std::string&&);       // binds to rvalues only — can steal`,
            },
          },
        ),
        c(2, "Move Constructor", B, "Steal the pointer, leave the source valid but empty.", {
          example: {
            code: `class Buffer {
    char*  data_ = nullptr;
    size_t size_ = 0;
public:
    Buffer(Buffer&& o) noexcept
        : data_(o.data_), size_(o.size_) {
        o.data_ = nullptr;   // source must stay destructible
        o.size_ = 0;
    }
};`,
          },
          extras: [
            {
              kind: "beforeAfter",
              before: {
                title: "Copy",
                headers: ["step", "cost"],
                rows: [
                  ["allocate", "O(n)"],
                  ["memcpy", "O(n)"],
                  ["both own data", "2 buffers"],
                ],
              },
              after: {
                title: "Move",
                headers: ["step", "cost"],
                rows: [
                  ["steal pointer", "O(1)"],
                  ["null the source", "O(1)"],
                  ["one owner", "1 buffer"],
                ],
              },
            },
            { kind: "diagram", diagram: "move-vs-copy", caption: "ownership transfer" },
          ],
        }),
        c(
          3,
          "std::move Is a Cast",
          P,
          'It moves nothing — it just says "you may steal from this".',
          {
            example: {
              code: `std::string a = "hello";
std::string b = std::move(a);   // b steals a's buffer
// a is valid but unspecified — assign to it before reading`,
            },
            extras: [
              {
                kind: "callout",
                tone: "warn",
                text: "Never std::move a value you still need, and never move a const object — it silently copies.",
              },
            ],
          },
        ),
        c(
          4,
          "noexcept Matters",
          K,
          "std::vector only moves your type on reallocation if the move ctor is noexcept.",
          {
            extras: [
              {
                kind: "interview",
                q: "Why must a move constructor be noexcept?",
                a: "vector's strong exception guarantee requires it to fall back to copying if moving could throw. Marking the move constructor noexcept lets vector move elements during reallocation, which is the difference between O(1) and O(n) per element.",
              },
            ],
          },
        ),
      ],
    },
    {
      id: "rule-of-five",
      title: "Rule of 0 / 3 / 5",
      tagline: "Which special member functions you must write — usually none.",
      examples: "copy ctor, assignment, destructor, =default, =delete",
      cards: [
        c(1, "Rule of Zero", G, "If your members manage themselves, write none of the five.", {
          example: {
            code: `class Config {
    std::string name_;
    std::vector<int> values_;
    // no destructor, no copy, no move — all correct by default
};`,
          },
        }),
        c(2, "The Five", B, "If you write one, you almost certainly need all five.", {
          example: {
            code: `class Buffer {
public:
    ~Buffer();                              // 1 destructor
    Buffer(const Buffer&);                  // 2 copy ctor
    Buffer& operator=(const Buffer&);       // 3 copy assign
    Buffer(Buffer&&) noexcept;              // 4 move ctor
    Buffer& operator=(Buffer&&) noexcept;   // 5 move assign
};`,
          },
        }),
        c(
          3,
          "=default and =delete",
          P,
          "State your intent explicitly instead of relying on implicit rules.",
          {
            example: {
              code: `class Handle {
public:
    Handle(const Handle&)            = delete;   // non-copyable
    Handle& operator=(const Handle&) = delete;
    Handle(Handle&&) noexcept        = default;  // but movable
    Handle& operator=(Handle&&) noexcept = default;
};`,
            },
            extras: [
              {
                kind: "callout",
                tone: "warn",
                text: "Declaring a destructor suppresses the implicit move operations — your class silently falls back to copying.",
              },
            ],
          },
        ),
        c(
          4,
          "Copy-and-Swap",
          K,
          "One idiom that gives self-assignment safety and strong exception safety.",
          {
            example: {
              code: `Buffer& Buffer::operator=(Buffer other) noexcept {  // by value
    swap(*this, other);
    return *this;
}   // 'other' destructor releases the old resource`,
            },
          },
        ),
      ],
    },
    {
      id: "perfect-forwarding",
      title: "Perfect Forwarding & Universal References",
      tagline: "Pass arguments through a wrapper without losing their value category.",
      examples: "T&&, std::forward, variadic factory",
      cards: [
        c(
          1,
          "Universal Reference",
          G,
          "In a deduced template context, T&& binds to both lvalues and rvalues.",
          {
            example: {
              code: `template <typename T>
void wrapper(T&& arg);   // universal reference

void f(Widget&& arg);    // plain rvalue reference — NOT universal`,
            },
          },
        ),
        c(2, "std::forward", B, "Restores the original value category when passing along.", {
          example: {
            code: `template <typename T>
void wrapper(T&& arg) {
    target(std::forward<T>(arg));   // lvalue stays lvalue, rvalue stays rvalue
}`,
          },
          extras: [
            {
              kind: "callout",
              tone: "warn",
              text: "Inside the function, arg itself is an lvalue (it has a name). Without forward, you always copy.",
            },
          ],
        }),
        c(3, "Variadic Factory", P, "This is exactly how make_unique is written.", {
          example: {
            code: `template <typename T, typename... Args>
std::unique_ptr<T> my_make_unique(Args&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}`,
          },
        }),
        c(
          4,
          "emplace vs push",
          K,
          "emplace_back forwards constructor arguments and builds in place.",
          {
            example: {
              code: `std::vector<std::string> v;
v.push_back(std::string(10, 'x'));  // build temporary, then move
v.emplace_back(10, 'x');            // constructed directly in the vector`,
            },
          },
        ),
      ],
    },
  ],

  templates: [
    {
      id: "specialization",
      title: "Class Templates & Specialization",
      tagline: "Generic by default, hand-tuned for the types that need it.",
      examples: "template<class T> class, full & partial specialization",
      cards: [
        c(1, "Class Template", G, "One definition, any element type.", {
          example: {
            code: `template <typename T>
class Stack {
    std::vector<T> data_;
public:
    void push(const T& v) { data_.push_back(v); }
    T    pop() { T v = data_.back(); data_.pop_back(); return v; }
    bool empty() const { return data_.empty(); }
};

Stack<int> si; Stack<std::string> ss;`,
          },
        }),
        c(2, "Full Specialization", B, "Replace the whole implementation for one exact type.", {
          example: {
            code: `template <typename T> struct Serializer {
    static std::string to_text(const T& v) { return std::to_string(v); }
};

template <> struct Serializer<bool> {
    static std::string to_text(bool v) { return v ? "true" : "false"; }
};`,
          },
        }),
        c(3, "Partial Specialization", P, "Match a family of types, e.g. any pointer.", {
          example: {
            code: `template <typename T> struct Traits            { static constexpr bool is_ptr = false; };
template <typename T> struct Traits<T*>        { static constexpr bool is_ptr = true;  };
template <typename K, typename V> struct Traits<std::pair<K,V>> { /* ... */ };`,
          },
          extras: [
            {
              kind: "callout",
              tone: "tip",
              text: "Function templates cannot be partially specialized — overload them instead.",
            },
          ],
        }),
        c(
          4,
          "Where Templates Live",
          R,
          "Templates are instantiated at use, so definitions belong in headers.",
          {
            extras: [
              {
                kind: "pitfall",
                items: [
                  'Defining a template in a .cpp gives "undefined reference" at link time.',
                  "Heavy template use bloats compile times and binary size.",
                  "Template error messages are long — read the FIRST error, not the last.",
                ],
              },
            ],
          },
        ),
      ],
    },
    {
      id: "variadic",
      title: "Variadic Templates & Fold Expressions",
      tagline: "Type-safe varargs — any number of arguments, any types.",
      examples: "typename... Args, sizeof...(), fold",
      cards: [
        c(1, "Parameter Packs", G, "Args... is a list of types; args... is a list of values.", {
          example: {
            code: `template <typename... Args>
void log(Args&&... args) {
    std::cout << "arity=" << sizeof...(Args) << '\\n';
}`,
          },
        }),
        c(2, "Fold Expressions (C++17)", B, "Expand a pack over an operator in one expression.", {
          example: {
            code: `template <typename... Args>
auto sum(Args... args) { return (args + ... + 0); }

template <typename... Args>
void print(Args&&... args) { ((std::cout << args << ' '), ...); }

print("x", 1, 2.5);   // x 1 2.5`,
          },
        }),
        c(
          3,
          "Recursive Expansion",
          P,
          "Pre-C++17 style, still useful when each element needs different handling.",
          {
            example: {
              code: `void print() { std::cout << '\\n'; }

template <typename T, typename... Rest>
void print(const T& first, const Rest&... rest) {
    std::cout << first << ' ';
    print(rest...);          // peel one argument per call
}`,
            },
          },
        ),
        c(4, "Where You Meet Them", K, "The standard library is built on packs.", {
          extras: [
            {
              kind: "complexity",
              rows: [
                { op: "std::make_unique<T>(args...)", big_o: "forwarding pack" },
                { op: "emplace_back(args...)", big_o: "in-place construction" },
                { op: "std::tuple<Ts...>", big_o: "heterogeneous storage" },
                { op: "std::format(fmt, args...)", big_o: "type-safe printf" },
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "concepts",
      title: "Concepts (C++20)",
      tagline:
        "Constrain templates so errors point at the call site, not 400 lines into the library.",
      examples: "concept, requires, std::integral",
      cards: [
        c(1, "Using a Concept", G, "Say what the type must support.", {
          example: {
            code: `#include <concepts>

template <std::integral T>
T gcd(T a, T b) { while (b) { T t = b; b = a % b; a = t; } return a; }

gcd(12, 18);    // ok
// gcd(1.5, 2.0);  // error: does not satisfy std::integral`,
          },
        }),
        c(2, "Defining One", B, "A concept is a compile-time predicate on types.", {
          example: {
            code: `template <typename T>
concept Drawable = requires(const T& t, Canvas& c) {
    { t.draw(c) } -> std::same_as<void>;
    { t.bounds() } -> std::convertible_to<Rect>;
};

template <Drawable T> void render(const T& shape);`,
          },
        }),
        c(3, "requires Clauses", P, "Combine constraints with && and ||.", {
          example: {
            code: `template <typename T>
    requires std::copyable<T> && (sizeof(T) <= 64)
void store(T value);

void f(const auto& x) requires Drawable<decltype(x)>;`,
          },
        }),
        c(4, "Before & After", K, "The real benefit is the error message.", {
          extras: [
            {
              kind: "beforeAfter",
              before: {
                title: "Unconstrained template",
                headers: ["symptom", "detail"],
                rows: [
                  ["error site", "deep inside library"],
                  ["length", "hundreds of lines"],
                  ["cause", "hidden"],
                ],
              },
              after: {
                title: "Concept-constrained",
                headers: ["symptom", "detail"],
                rows: [
                  ["error site", "the call"],
                  ["length", "a few lines"],
                  ["cause", "named constraint"],
                ],
              },
            },
          ],
        }),
      ],
    },
    {
      id: "crtp-sfinae",
      title: "CRTP, SFINAE & if constexpr",
      tagline: "Static polymorphism and compile-time branching.",
      examples: "CRTP, enable_if, if constexpr",
      cards: [
        c(
          1,
          "CRTP",
          G,
          "A base class templated on its own derived class — polymorphism with no vtable.",
          {
            example: {
              code: `template <typename Derived>
struct Shape {
    double area() const {
        return static_cast<const Derived*>(this)->area_impl();
    }
};

struct Circle : Shape<Circle> {
    double r;
    double area_impl() const { return 3.14159 * r * r; }
};`,
            },
            extras: [
              {
                kind: "callout",
                tone: "tip",
                text: "No virtual call overhead, fully inlinable — but the type must be known at compile time.",
              },
            ],
          },
        ),
        c(
          2,
          "SFINAE",
          B,
          '"Substitution Failure Is Not An Error" — the old way to constrain overloads.',
          {
            example: {
              code: `template <typename T,
          typename = std::enable_if_t<std::is_integral_v<T>>>
void f(T v);   // only participates for integral T`,
            },
            note: "In C++20, replace this entirely with a concept.",
          },
        ),
        c(3, "if constexpr (C++17)", P, "Discard the untaken branch at compile time.", {
          example: {
            code: `template <typename T>
std::string describe(const T& v) {
    if constexpr (std::is_integral_v<T>)      return "integer";
    else if constexpr (std::is_floating_point_v<T>) return "float";
    else                                      return "other";
}`,
          },
          extras: [
            {
              kind: "callout",
              tone: "tip",
              text: "The discarded branch is not compiled, so it may contain code that would be invalid for that T.",
            },
          ],
        }),
        c(4, "Choosing", R, "Modern preference order.", {
          extras: [
            {
              kind: "interview",
              q: "CRTP or virtual functions?",
              a: "Virtual gives runtime dispatch and heterogeneous containers, at the cost of an indirect call and no inlining. CRTP resolves everything at compile time — faster and inlinable — but each derived type is a distinct base type, so you cannot store them in one container without type erasure.",
            },
          ],
        }),
      ],
    },
  ],
};

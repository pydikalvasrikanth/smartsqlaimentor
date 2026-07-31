import type { Lesson } from "./types";
import { c, A, B, P, K, G, R } from "./lesson-kit";

/** Extra C++ lessons for modules 5–7. */
export const cppExtraAdvanced: Record<string, Lesson[]> = {
  stl: [
    {
      id: "algorithms",
      title: "Algorithms & Iterators",
      tagline: "Stop writing raw loops — the library already has the loop, tested and optimized.",
      examples: "sort, find_if, accumulate, transform",
      cards: [
        c(1, "The Core Set", G, "Most loops you write are one of these.", {
          example: {
            code: `#include <algorithm>
#include <numeric>

std::sort(v.begin(), v.end());
auto it  = std::find_if(v.begin(), v.end(), [](int x){ return x > 10; });
int  sum = std::accumulate(v.begin(), v.end(), 0);
std::transform(v.begin(), v.end(), out.begin(), [](int x){ return x * 2; });
bool any = std::any_of(v.begin(), v.end(), is_valid);`,
          },
        }),
        c(
          2,
          "The Erase-Remove Idiom",
          B,
          "remove only shuffles elements; erase actually shrinks the container.",
          {
            example: {
              code: `// pre-C++20
v.erase(std::remove(v.begin(), v.end(), 42), v.end());

// C++20
std::erase(v, 42);
std::erase_if(v, [](int x){ return x % 2 == 0; });`,
            },
            extras: [
              {
                kind: "beforeAfter",
                before: {
                  title: "after std::remove",
                  headers: ["idx", "value"],
                  rows: [
                    ["0-2", "kept"],
                    ["3-4", "garbage"],
                    ["size", "unchanged"],
                  ],
                },
                after: {
                  title: "after erase",
                  headers: ["idx", "value"],
                  rows: [
                    ["0-2", "kept"],
                    ["—", "removed"],
                    ["size", "shrunk"],
                  ],
                },
              },
            ],
          },
        ),
        c(3, "Iterator Categories", P, "What an algorithm can demand of your container.", {
          extras: [
            {
              kind: "complexity",
              rows: [
                { op: "input / output", big_o: "single pass", note: "streams" },
                { op: "forward", big_o: "multi-pass", note: "forward_list" },
                { op: "bidirectional", big_o: "++ and --", note: "list, map" },
                { op: "random access", big_o: "it + n in O(1)", note: "vector, deque, array" },
              ],
            },
            {
              kind: "callout",
              tone: "tip",
              text: "std::sort needs random access — that's why you call list::sort() for a std::list.",
            },
          ],
        }),
        c(4, "Invalidation", R, "Mutating a container while iterating is the classic crash.", {
          extras: [
            {
              kind: "pitfall",
              items: [
                "vector: any push_back may reallocate and invalidate every iterator, pointer and reference.",
                "vector erase invalidates everything from the erase point onward.",
                "map/set: erase invalidates only the erased iterator; use it = m.erase(it).",
                "Never keep an iterator across a resize.",
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "associative",
      title: "map, unordered_map & set",
      tagline: "Ordered tree vs hash table — pick by access pattern, not by habit.",
      examples: "std::map, unordered_map, set, find",
      cards: [
        c(1, "Ordered vs Hashed", G, "map is a red-black tree; unordered_map is a hash table.", {
          example: {
            code: `std::map<std::string, int>           ordered;   // sorted by key
std::unordered_map<std::string, int> hashed;    // no order

ordered["ada"] = 36;
if (auto it = hashed.find("ada"); it != hashed.end())
    std::cout << it->second;`,
          },
          extras: [
            { kind: "diagram", diagram: "class-tree", caption: "balanced tree vs bucket array" },
          ],
        }),
        c(2, "Cost", B, "The numbers that drive the choice.", {
          extras: [
            {
              kind: "complexity",
              rows: [
                {
                  op: "map insert / find / erase",
                  big_o: "O(log n)",
                  note: "sorted iteration free",
                },
                { op: "unordered_map insert / find", big_o: "O(1) avg", note: "O(n) worst" },
                { op: "map iteration", big_o: "O(n) sorted" },
                { op: "unordered_map iteration", big_o: "O(n) arbitrary order" },
              ],
            },
          ],
        }),
        c(3, "operator[] Inserts", R, "Reading a missing key with [] silently creates it.", {
          example: {
            code: `std::map<std::string,int> m;
if (m["missing"] == 0) { }   // just inserted "missing" -> 0 !
int v = m.at("missing");     // throws std::out_of_range instead
auto it = m.find("missing"); // no insertion, no throw`,
          },
          extras: [
            {
              kind: "callout",
              tone: "warn",
              text: "operator[] also requires the value type to be default-constructible, and it is non-const.",
            },
          ],
        }),
        c(4, "Modern Insertion", P, "C++17 gives you clearer, cheaper insertion APIs.", {
          example: {
            code: `auto [it, inserted] = m.try_emplace("ada", 36);   // no overwrite
m.insert_or_assign("ada", 37);                    // overwrite
m.emplace("linus", 54);

std::set<int> s{3,1,2};    // sorted unique: 1 2 3`,
          },
        }),
      ],
    },
    {
      id: "ranges",
      title: "Ranges & Views (C++20)",
      tagline: "Composable, lazy pipelines that replace nested loops.",
      examples: "views::filter, transform, take, ranges::sort",
      cards: [
        c(1, "No More begin/end", G, "Range algorithms take the container directly.", {
          example: {
            code: `#include <ranges>
#include <algorithm>

std::ranges::sort(v);
auto it = std::ranges::find(v, 42);
bool ok = std::ranges::all_of(v, is_valid);`,
          },
        }),
        c(2, "Views Pipe Together", B, "Views are lazy — nothing runs until you iterate.", {
          example: {
            code: `namespace rv = std::views;

auto result = v
    | rv::filter([](int x){ return x % 2 == 0; })
    | rv::transform([](int x){ return x * x; })
    | rv::take(5);

for (int x : result) std::cout << x << ' ';`,
          },
          extras: [
            {
              kind: "callout",
              tone: "tip",
              text: "No intermediate vectors are allocated — each element flows through the whole pipeline once.",
            },
          ],
        }),
        c(3, "Handy Views", P, "The ones you will reach for daily.", {
          extras: [
            {
              kind: "complexity",
              rows: [
                { op: "views::filter", big_o: "keep matching" },
                { op: "views::transform", big_o: "map each element" },
                { op: "views::take / drop", big_o: "slice" },
                { op: "views::reverse", big_o: "iterate backwards" },
                { op: "views::iota(0, n)", big_o: "lazy number range" },
                { op: "views::split / join", big_o: "tokenize" },
              ],
            },
          ],
        }),
        c(4, "Dangling Views", R, "A view does not own its data.", {
          example: {
            code: `auto bad() {
    std::vector<int> v{1,2,3};
    return v | std::views::filter(odd);   // DANGLING: v dies here
}

auto ok = std::ranges::to<std::vector>(   // C++23: materialize
    v | std::views::filter(odd));`,
          },
        }),
      ],
    },
  ],

  concurrency: [
    {
      id: "condition-variable",
      title: "condition_variable & Producer/Consumer",
      tagline: "Wait for a condition without burning CPU on a spin loop.",
      examples: "unique_lock, wait, notify_one",
      cards: [
        c(
          1,
          "Wait With a Predicate",
          G,
          "Always pass the predicate overload — it handles spurious wakeups for you.",
          {
            example: {
              code: `std::mutex m;
std::condition_variable cv;
std::queue<Job> q;

// consumer
std::unique_lock lk(m);
cv.wait(lk, [&]{ return !q.empty() || done; });
Job j = std::move(q.front()); q.pop();`,
            },
            extras: [
              {
                kind: "callout",
                tone: "warn",
                text: "cv.wait(lk) without a predicate can wake up spuriously and proceed with no data. Never use the bare form.",
              },
            ],
          },
        ),
        c(2, "Notify", B, "Modify the shared state under the lock, then notify.", {
          example: {
            code: `{
    std::lock_guard lk(m);
    q.push(std::move(job));
}
cv.notify_one();      // notify_all() to wake every waiter`,
          },
        }),
        c(3, "A Thread-Safe Queue", P, "The canonical interview implementation.", {
          example: {
            code: `template <typename T>
class Queue {
    std::mutex m_; std::condition_variable cv_;
    std::queue<T> q_; bool closed_ = false;
public:
    void push(T v) {
        { std::lock_guard lk(m_); q_.push(std::move(v)); }
        cv_.notify_one();
    }
    bool pop(T& out) {
        std::unique_lock lk(m_);
        cv_.wait(lk, [&]{ return !q_.empty() || closed_; });
        if (q_.empty()) return false;
        out = std::move(q_.front()); q_.pop();
        return true;
    }
    void close() {
        { std::lock_guard lk(m_); closed_ = true; }
        cv_.notify_all();
    }
};`,
          },
        }),
        c(4, "Deadlock Rules", R, "Two locks, two orders, one hang.", {
          extras: [
            {
              kind: "pitfall",
              items: [
                "Always acquire multiple mutexes in the same global order, or use std::scoped_lock(a, b).",
                "Never call user code or a callback while holding a lock.",
                "Never notify while holding the lock for long — unlock first where you can.",
                "A lost wakeup happens if you notify before the waiter registers; the predicate form prevents it.",
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "async-future",
      title: "std::async, future & promise",
      tagline: "Get a value back from another thread, exceptions included.",
      examples: "async, future::get, promise, packaged_task",
      cards: [
        c(1, "std::async", G, "Launch work and receive a future for the result.", {
          example: {
            code: `#include <future>

auto fut = std::async(std::launch::async, [] {
    return heavy_computation();
});

do_other_work();
int result = fut.get();   // blocks until ready`,
          },
          extras: [
            {
              kind: "callout",
              tone: "warn",
              text: "Without std::launch::async the implementation may defer the task and run it lazily on get().",
            },
          ],
        }),
        c(2, "Exceptions Travel", B, "A throw inside the task is rethrown by get().", {
          example: {
            code: `auto f = std::async(std::launch::async, []{ throw std::runtime_error("boom"); });
try { f.get(); }
catch (const std::exception& e) { std::cerr << e.what(); }`,
          },
        }),
        c(3, "promise / future", P, "Manual handoff when the value is produced somewhere else.", {
          example: {
            code: `std::promise<int> p;
std::future<int> f = p.get_future();

std::thread t([&p]{ p.set_value(42); });
std::cout << f.get();   // 42
t.join();`,
          },
        }),
        c(
          4,
          "The async Destructor Trap",
          R,
          "The future returned by async blocks in its destructor.",
          {
            example: {
              code: `{
    std::async(std::launch::async, slow_task);  // temporary future
}   // blocks HERE until slow_task finishes — looks synchronous`,
            },
            note: "Store the future in a named variable if you want real concurrency.",
          },
        ),
      ],
    },
    {
      id: "atomics-memory-order",
      title: "std::atomic & Memory Order",
      tagline: "Data races are undefined behavior; atomics are how you avoid them without a mutex.",
      examples: "atomic<int>, fetch_add, compare_exchange",
      cards: [
        c(1, "Atomic Counters", G, "The right tool for a shared counter.", {
          example: {
            code: `std::atomic<int> hits{0};
hits.fetch_add(1, std::memory_order_relaxed);
int now = hits.load();

std::atomic<bool> ready{false};
ready.store(true, std::memory_order_release);`,
          },
          extras: [
            {
              kind: "diagram",
              diagram: "threads",
              caption: "concurrent increments, one consistent total",
            },
          ],
        }),
        c(
          2,
          "Acquire / Release",
          B,
          "Release publishes everything written before it; acquire sees it.",
          {
            example: {
              code: `// producer
data = compute();
flag.store(true, std::memory_order_release);

// consumer
while (!flag.load(std::memory_order_acquire)) { }
use(data);   // guaranteed to see the producer's write`,
            },
          },
        ),
        c(3, "CAS Loops", P, "compare_exchange is how you build lock-free updates.", {
          example: {
            code: `std::atomic<int> best{0};
int cur = best.load();
while (candidate > cur &&
       !best.compare_exchange_weak(cur, candidate)) {
    // cur was refreshed with the current value; loop and retry
}`,
          },
        }),
        c(4, "Guidance", R, "Lock-free is not automatically faster.", {
          extras: [
            {
              kind: "interview",
              q: "Is std::atomic<T> always lock-free?",
              a: "No. Only types the hardware can update atomically (typically up to a pointer or 16 bytes) are lock-free; larger types fall back to an internal mutex. Check with is_lock_free() or is_always_lock_free.",
            },
            {
              kind: "callout",
              tone: "tip",
              text: "Default to seq_cst ordering. Weaken only with a benchmark proving it matters.",
            },
          ],
        }),
      ],
    },
    {
      id: "jthread-coroutines",
      title: "jthread, stop_token & Coroutines",
      tagline: 'C++20\'s answer to "I forgot to join" and to callback-heavy async code.',
      examples: "jthread, stop_token, co_await, co_yield",
      cards: [
        c(
          1,
          "std::jthread",
          G,
          "Joins automatically in its destructor and supports cooperative cancellation.",
          {
            example: {
              code: `std::jthread worker([](std::stop_token st) {
    while (!st.stop_requested()) {
        do_chunk();
    }
});
// worker.request_stop() then join() happen automatically at scope exit`,
            },
            extras: [
              {
                kind: "beforeAfter",
                before: {
                  title: "std::thread",
                  headers: ["case", "result"],
                  rows: [
                    ["forgot join()", "std::terminate"],
                    ["exception thrown", "terminate"],
                    ["cancellation", "roll your own"],
                  ],
                },
                after: {
                  title: "std::jthread",
                  headers: ["case", "result"],
                  rows: [
                    ["scope exit", "auto join"],
                    ["exception", "auto join"],
                    ["cancellation", "stop_token"],
                  ],
                },
              },
            ],
          },
        ),
        c(
          2,
          "Cooperative Cancellation",
          B,
          "There is no safe way to kill a thread — you ask it to stop.",
          {
            example: {
              code: `void worker(std::stop_token st) {
    std::stop_callback cb(st, []{ std::puts("stopping"); });
    while (!st.stop_requested()) { step(); }
}`,
            },
          },
        ),
        c(
          3,
          "Coroutines",
          P,
          "A function that can suspend and resume — the compiler rewrites it into a state machine.",
          {
            example: {
              code: `Generator<int> fibonacci() {
    int a = 0, b = 1;
    while (true) {
        co_yield a;             // suspend, hand a value out
        auto next = a + b; a = b; b = next;
    }
}

Task<Response> fetch(Url u) {
    auto conn = co_await connect(u);   // suspend without blocking a thread
    co_return co_await conn.read();
}`,
            },
            extras: [
              {
                kind: "callout",
                tone: "warn",
                text: "C++20 ships the language machinery but almost no library types — you write or import Task/Generator (C++23 adds std::generator).",
              },
            ],
          },
        ),
        c(4, "When to Use What", K, "Match the tool to the workload.", {
          extras: [
            {
              kind: "complexity",
              rows: [
                { op: "jthread", big_o: "CPU-bound parallelism" },
                { op: "async/future", big_o: "one-off background result" },
                { op: "thread pool", big_o: "many short tasks" },
                {
                  op: "coroutines",
                  big_o: "I/O-bound concurrency",
                  note: "thousands of in-flight ops",
                },
              ],
            },
          ],
        }),
      ],
    },
  ],

  advanced: [
    {
      id: "exception-safety",
      title: "Exception Safety Guarantees",
      tagline: "Four levels of promise your function can make when something throws.",
      examples: "basic, strong, nothrow, noexcept",
      cards: [
        c(1, "The Four Levels", G, "State which one every public function provides.", {
          extras: [
            {
              kind: "complexity",
              rows: [
                { op: "No guarantee", big_o: "avoid", note: "may corrupt or leak" },
                { op: "Basic", big_o: "valid state", note: "invariants hold, values unspecified" },
                { op: "Strong", big_o: "commit or rollback", note: "as if never called" },
                { op: "Nothrow", big_o: "noexcept", note: "never throws" },
              ],
            },
          ],
        }),
        c(
          2,
          "Achieving Strong Safety",
          B,
          "Do all the throwing work first, then commit with non-throwing operations.",
          {
            example: {
              code: `void Container::add(const Item& item) {
    auto copy = data_;        // may throw — nothing committed yet
    copy.push_back(item);     // may throw — still nothing committed
    data_.swap(copy);         // noexcept: the commit point
}`,
            },
          },
        ),
        c(3, "noexcept", P, "A promise, enforced by std::terminate if you break it.", {
          example: {
            code: `void cleanup() noexcept;                     // must not throw
Buffer(Buffer&&) noexcept;                   // enables vector move
static_assert(std::is_nothrow_move_constructible_v<Buffer>);`,
          },
        }),
        c(4, "Rules That Prevent Disaster", R, "Two hard rules and one habit.", {
          extras: [
            {
              kind: "pitfall",
              items: [
                "Never let an exception escape a destructor — during unwinding it calls std::terminate.",
                "Catch by const reference (catch (const std::exception& e)), never by value.",
                "Use RAII everywhere so unwinding cleans up automatically.",
                "Don't use exceptions for ordinary control flow — return std::optional or std::expected.",
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "pimpl",
      title: "PIMPL & Compile-Time Firewalls",
      tagline: "Hide the implementation, cut rebuild times, keep the ABI stable.",
      examples: "unique_ptr<Impl>, forward declaration",
      cards: [
        c(1, "The Header", G, "Only a forward declaration and an owning pointer are visible.", {
          example: {
            code: `// widget.hpp
class Widget {
public:
    Widget();
    ~Widget();                       // must be declared here
    Widget(Widget&&) noexcept;
    Widget& operator=(Widget&&) noexcept;
    void draw();
private:
    struct Impl;
    std::unique_ptr<Impl> p_;
};`,
          },
        }),
        c(2, "The Source", B, "The real members live in the .cpp, invisible to every caller.", {
          example: {
            code: `// widget.cpp
struct Widget::Impl {
    std::vector<Shape> shapes;
    Renderer           renderer;
};

Widget::Widget() : p_(std::make_unique<Impl>()) {}
Widget::~Widget() = default;         // Impl is complete HERE
void Widget::draw() { p_->renderer.draw(p_->shapes); }`,
          },
          extras: [
            {
              kind: "callout",
              tone: "warn",
              text: "Declare the destructor in the header and define it (= default) in the .cpp. Otherwise unique_ptr tries to delete an incomplete type.",
            },
          ],
        }),
        c(3, "What You Gain", P, "Change internals without recompiling the world.", {
          extras: [
            {
              kind: "beforeAfter",
              before: {
                title: "Plain class",
                headers: ["change", "effect"],
                rows: [
                  ["add a member", "every includer rebuilds"],
                  ["header", "pulls heavy deps"],
                  ["ABI", "breaks"],
                ],
              },
              after: {
                title: "PIMPL",
                headers: ["change", "effect"],
                rows: [
                  ["add a member", "one .cpp rebuilds"],
                  ["header", "forward decls only"],
                  ["ABI", "stable"],
                ],
              },
            },
          ],
        }),
        c(4, "The Cost", R, "Not free — measure before applying it everywhere.", {
          note: "One heap allocation per object and an extra indirection on every member access. Use it for library boundaries and heavy headers, not for small value types.",
        }),
      ],
    },
    {
      id: "type-erasure",
      title: "Type Erasure: function, any, variant",
      tagline: "Store different types behind one interface — with or without inheritance.",
      examples: "std::function, std::any, std::variant, optional",
      cards: [
        c(1, "std::function", G, "Any callable with a matching signature.", {
          example: {
            code: `std::function<int(int,int)> op;
op = [](int a, int b){ return a + b; };
op = std::plus<int>{};
op = &add_function;
int r = op(2, 3);`,
          },
          extras: [
            {
              kind: "callout",
              tone: "tip",
              text: "std::function may heap-allocate and always costs an indirect call. In a hot path take a template parameter or std::function_ref instead.",
            },
          ],
        }),
        c(2, "std::variant", B, "A type-safe union — exactly one of a fixed list of types.", {
          example: {
            code: `std::variant<int, std::string, double> v = 42;
v = "hello";

std::visit([](const auto& x){ std::cout << x; }, v);

if (auto* s = std::get_if<std::string>(&v)) { /* ... */ }`,
          },
        }),
        c(
          3,
          "optional & expected",
          P,
          'Model "maybe a value" and "value or error" without exceptions.',
          {
            example: {
              code: `std::optional<User> find_user(int id);

if (auto u = find_user(7)) std::cout << u->name;

// C++23
std::expected<Config, ParseError> parse(std::string_view text);`,
            },
          },
        ),
        c(4, "std::any", K, "Holds literally anything; you must know the type to get it back.", {
          example: {
            code: `std::any a = 42;
a = std::string("hi");
try { auto s = std::any_cast<std::string>(a); }
catch (const std::bad_any_cast&) { }`,
          },
          extras: [
            {
              kind: "interview",
              q: "variant or inheritance?",
              a: "variant is a closed set known at compile time — no heap allocation, exhaustive visiting, value semantics. Inheritance is an open set extensible by other code, at the cost of heap allocation and virtual dispatch. Prefer variant when the list of alternatives is fixed.",
            },
          ],
        }),
      ],
    },
    {
      id: "metaprogramming",
      title: "type_traits, tuple & constexpr",
      tagline: "Computation and introspection that finishes before the program starts.",
      examples: "is_same_v, tuple, constexpr, consteval",
      cards: [
        c(1, "type_traits", G, "Ask questions about types at compile time.", {
          example: {
            code: `#include <type_traits>

static_assert(std::is_integral_v<int>);
static_assert(!std::is_copy_constructible_v<std::unique_ptr<int>>);

using Bare = std::remove_cvref_t<const std::string&>;   // std::string`,
          },
        }),
        c(2, "std::tuple", B, "Heterogeneous fixed-size storage with compile-time indexing.", {
          example: {
            code: `std::tuple<int, std::string, double> row{1, "ada", 3.5};

auto& name = std::get<1>(row);
auto [id, n, score] = row;               // structured bindings

std::apply([](auto&&... xs){ (std::cout << ... << xs); }, row);`,
          },
        }),
        c(3, "constexpr & consteval", P, "Run real code at compile time.", {
          example: {
            code: `constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
static_assert(factorial(5) == 120);      // computed by the compiler

consteval int must_be_compile_time(int n) { return n * 2; }
constinit int global = factorial(4);     // guaranteed static init`,
          },
          extras: [
            {
              kind: "callout",
              tone: "tip",
              text: "constexpr functions can also run at runtime; consteval functions cannot.",
            },
          ],
        }),
        c(4, "Compile-Time Cost", R, "Metaprogramming is not free.", {
          extras: [
            {
              kind: "pitfall",
              items: [
                "Deep template recursion explodes compile time and memory.",
                "Prefer if constexpr and concepts over enable_if chains — far cheaper to compile and read.",
                "Every distinct instantiation adds code to the binary.",
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "modules-tooling",
      title: "Modules, ABI & Build Tooling",
      tagline: "C++20 modules replace headers — and the rest of a professional build.",
      examples: "export module, CMake, sanitizers, clang-tidy",
      cards: [
        c(1, "A Module", G, "Compiled once, imported instantly — no textual inclusion.", {
          example: {
            code: `// math.ixx
export module math;

export int add(int a, int b) { return a + b; }
int helper() { return 0; }        // not exported

// main.cpp
import math;
int main() { return add(2, 3); }`,
          },
        }),
        c(2, "Why Modules Win", B, "Headers are re-parsed in every translation unit.", {
          extras: [
            {
              kind: "beforeAfter",
              before: {
                title: "Headers",
                headers: ["property", "behaviour"],
                rows: [
                  ["parsing", "once per TU"],
                  ["macros", "leak in and out"],
                  ["order", "include order matters"],
                  ["guards", "manual"],
                ],
              },
              after: {
                title: "Modules",
                headers: ["property", "behaviour"],
                rows: [
                  ["parsing", "once, total"],
                  ["macros", "isolated"],
                  ["order", "irrelevant"],
                  ["guards", "unnecessary"],
                ],
              },
            },
          ],
        }),
        c(3, "CMake for C++20", P, "A modern, warnings-clean, sanitized build.", {
          example: {
            code: `cmake_minimum_required(VERSION 3.28)
project(app CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(app main.cpp)
target_compile_options(app PRIVATE -Wall -Wextra -Wpedantic)

# debug builds with sanitizers
target_compile_options(app PRIVATE
    $<$<CONFIG:Debug>:-fsanitize=address,undefined -g>)
target_link_options(app PRIVATE
    $<$<CONFIG:Debug>:-fsanitize=address,undefined>)`,
            caption: "CMakeLists.txt",
          },
        }),
        c(4, "Toolchain Checklist", K, "What a production C++ repo runs in CI.", {
          extras: [
            {
              kind: "complexity",
              rows: [
                { op: "ASan / UBSan", big_o: "memory + UB bugs", note: "debug + CI" },
                { op: "TSan", big_o: "data races" },
                { op: "clang-tidy", big_o: "static analysis" },
                { op: "clang-format", big_o: "consistent style" },
                { op: "Catch2 / GoogleTest", big_o: "unit tests" },
                { op: "vcpkg / Conan", big_o: "dependency management" },
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "design-problems",
      title: "Interview Design Problems",
      tagline: "Three implementations that come up again and again.",
      examples: "LRU cache, mini shared_ptr, thread pool",
      cards: [
        c(
          1,
          "LRU Cache — O(1)",
          G,
          "Hash map of keys to list iterators, plus a list ordered by recency.",
          {
            example: {
              code: `class LRUCache {
    using Pair = std::pair<int,int>;
    std::list<Pair> items_;                                  // front = newest
    std::unordered_map<int, std::list<Pair>::iterator> map_;
    std::size_t cap_;
public:
    explicit LRUCache(std::size_t cap) : cap_(cap) {}

    std::optional<int> get(int key) {
        auto it = map_.find(key);
        if (it == map_.end()) return std::nullopt;
        items_.splice(items_.begin(), items_, it->second);   // O(1) move to front
        return it->second->second;
    }

    void put(int key, int value) {
        if (auto it = map_.find(key); it != map_.end()) {
            it->second->second = value;
            items_.splice(items_.begin(), items_, it->second);
            return;
        }
        if (map_.size() == cap_) {
            map_.erase(items_.back().first);
            items_.pop_back();
        }
        items_.emplace_front(key, value);
        map_[key] = items_.begin();
    }
};`,
            },
            extras: [
              {
                kind: "complexity",
                rows: [
                  { op: "get", big_o: "O(1)" },
                  { op: "put", big_o: "O(1)" },
                  { op: "evict", big_o: "O(1)", note: "list back" },
                  { op: "space", big_o: "O(capacity)" },
                ],
              },
            ],
          },
        ),
        c(2, "A Mini shared_ptr", B, "Reference counting, atomically.", {
          example: {
            code: `template <typename T>
class SharedPtr {
    T* ptr_ = nullptr;
    std::atomic<int>* count_ = nullptr;
public:
    explicit SharedPtr(T* p) : ptr_(p), count_(new std::atomic<int>(1)) {}

    SharedPtr(const SharedPtr& o) : ptr_(o.ptr_), count_(o.count_) {
        if (count_) count_->fetch_add(1, std::memory_order_relaxed);
    }

    ~SharedPtr() {
        if (count_ && count_->fetch_sub(1, std::memory_order_acq_rel) == 1) {
            delete ptr_;
            delete count_;
        }
    }
    T& operator*()  const { return *ptr_; }
    T* operator->() const { return ptr_; }
};`,
          },
          extras: [
            { kind: "diagram", diagram: "smart-pointer", caption: "two owners, one control block" },
            {
              kind: "callout",
              tone: "warn",
              text: "The control block must be atomic; the pointee is NOT thread-safe. And this toy version still needs assignment operators and weak-ref support.",
            },
          ],
        }),
        c(3, "A Thread Pool", P, "N workers pulling from one synchronized queue.", {
          example: {
            code: `class ThreadPool {
    std::vector<std::jthread> workers_;
    std::queue<std::function<void()>> tasks_;
    std::mutex m_; std::condition_variable cv_; bool stop_ = false;
public:
    explicit ThreadPool(unsigned n = std::thread::hardware_concurrency()) {
        for (unsigned i = 0; i < n; ++i)
            workers_.emplace_back([this]{
                for (;;) {
                    std::function<void()> job;
                    {
                        std::unique_lock lk(m_);
                        cv_.wait(lk, [this]{ return stop_ || !tasks_.empty(); });
                        if (stop_ && tasks_.empty()) return;
                        job = std::move(tasks_.front()); tasks_.pop();
                    }
                    job();
                }
            });
    }
    void submit(std::function<void()> job) {
        { std::lock_guard lk(m_); tasks_.push(std::move(job)); }
        cv_.notify_one();
    }
    ~ThreadPool() {
        { std::lock_guard lk(m_); stop_ = true; }
        cv_.notify_all();          // jthread members join automatically
    }
};`,
          },
        }),
        c(4, "How to Answer", K, "Interviewers grade the reasoning, not just the code.", {
          extras: [
            {
              kind: "interview",
              q: "What do interviewers look for in these problems?",
              a: "State the complexity target first, pick data structures that meet it, and say why. Then handle ownership (who frees what), thread safety (which invariants a lock protects), and edge cases (capacity 0, self-assignment, empty queue, shutdown). Mentioning RAII, noexcept moves and the rule of five signals real C++ experience.",
            },
            {
              kind: "quiz",
              question: "Why does the LRU cache use std::list rather than std::vector?",
              options: [
                "Lists use less memory",
                "splice moves a node in O(1) and never invalidates iterators",
                "Vectors cannot store pairs",
                "Lists are cache-friendly",
              ],
              correct: 1,
              explain:
                "The map stores iterators into the list. list::splice reorders in O(1) and keeps every iterator valid; a vector would invalidate them on every move and cost O(n) per reorder.",
            },
          ],
        }),
      ],
    },
  ],
};

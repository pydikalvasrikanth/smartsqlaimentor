export type SceneKey =
  | "jvm"
  | "stackHeap"
  | "inheritance"
  | "arrays"
  | "hashmap"
  | "gc"
  | "threads"
  | "virtualThreads"
  | "streams";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "code"; code: string; caption?: string }
  | { kind: "list"; items: string[] }
  | { kind: "callout"; tone: "tip" | "warn" | "note"; text: string };

export type Lesson = {
  id: string;
  title: string;
  tagline: string;
  blocks: Block[];
  scene?: SceneKey;
  takeaways: string[];
};

export type Module = {
  id: string;
  title: string;
  color: string;
  lessons: Lesson[];
};

const L = (l: Lesson): Lesson => l;

export const modules: Module[] = [
  {
    id: "foundations",
    title: "1 · Foundations",
    color: "var(--java-orange)",
    lessons: [
      L({
        id: "what-is-java",
        title: "What is Java & the JVM?",
        tagline: "Write once, run anywhere — how bytecode and the JVM make it possible.",
        scene: "jvm",
        blocks: [
          { kind: "p", text: "Java is a statically typed, object-oriented language that compiles to platform-neutral bytecode. The Java Virtual Machine (JVM) loads that bytecode and executes it on any operating system." },
          { kind: "p", text: "The lifecycle: your .java source is compiled by javac into a .class file of bytecode. The JVM's class loader pulls those classes into memory, the bytecode verifier checks them, and the execution engine (interpreter + JIT compiler) runs them — turning hot code paths into optimized native machine code at runtime." },
          { kind: "code", caption: "The pipeline in one line", code: "Hello.java  →  javac  →  Hello.class  →  JVM  →  native CPU" },
          { kind: "callout", tone: "tip", text: "Rotate the 3D JVM below to see the ClassLoader, Runtime Data Areas and Execution Engine as separate stages that data flows through." },
        ],
        takeaways: [
          "Java source compiles to bytecode, not to a specific CPU.",
          "The JVM is the portable runtime; different JVMs exist for different OSes.",
          "The JIT compiler turns hot methods into fast native code while the program runs.",
        ],
      }),
      L({
        id: "hello-world",
        title: "Hello, World",
        tagline: "Your first program — and every piece of the required ceremony explained.",
        blocks: [
          { kind: "p", text: "Every Java program starts inside a class, and execution begins at a method named main with a very specific signature." },
          { kind: "code", code: `public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}` },
          { kind: "list", items: [
            "public — visible to the JVM launcher outside this class.",
            "class Hello — the container; filename must be Hello.java.",
            "static — no instance is needed to call main.",
            "void — main returns nothing.",
            "String[] args — command-line arguments.",
          ] },
          { kind: "callout", tone: "note", text: "System.out is a PrintStream; println writes a line to standard output." },
        ],
        takeaways: [
          "Filename must match the public class name.",
          "main has a fixed signature: public static void main(String[]).",
          "Statements end with a semicolon; blocks use braces.",
        ],
      }),
      L({
        id: "variables",
        title: "Variables & Primitive Types",
        tagline: "Eight primitive types, one reference world, and why the difference matters.",
        scene: "stackHeap",
        blocks: [
          { kind: "p", text: "Java has 8 primitive types stored directly on the call stack, and reference types whose values live on the heap while a reference to them sits on the stack." },
          { kind: "code", code: `int      age    = 27;          // 32-bit integer
long     views  = 9_000_000L;  // 64-bit integer
double   pi     = 3.14159;     // 64-bit float
float    ratio  = 0.5f;        // 32-bit float
boolean  ready  = true;
char     grade  = 'A';
byte     flag   = 0x1F;
short    port   = 8080;

String   name   = "Ada";       // reference type` },
          { kind: "callout", tone: "tip", text: "The 3D visualization shows stack frames on the left with primitives inline, and objects on the heap with arrows from stack references." },
        ],
        takeaways: [
          "8 primitives: byte, short, int, long, float, double, boolean, char.",
          "Primitives store the value; references store an address to a heap object.",
          "Use _ as a digit separator for readable large numbers.",
        ],
      }),
      L({
        id: "operators",
        title: "Operators & Expressions",
        tagline: "Arithmetic, comparison, logical and bitwise — and Java's promotion rules.",
        blocks: [
          { kind: "code", code: `int  sum   = 5 + 3;      // 8
int  div   = 7 / 2;      // 3  (integer division!)
double d   = 7 / 2.0;    // 3.5
int  mod   = 10 % 3;     // 1
boolean eq = (a == b);   // reference equality for objects
boolean ok = ready && !done;
int mask   = flags & 0xFF;   // bitwise AND` },
          { kind: "callout", tone: "warn", text: "== on Strings compares references, not content. Use .equals() to compare values." },
        ],
        takeaways: [
          "Integer / integer = integer. Promote one side to get a double.",
          "&& and || short-circuit; & and | do not (and also work bitwise).",
          "For objects, == checks identity, .equals() checks value.",
        ],
      }),
      L({
        id: "strings",
        title: "Strings",
        tagline: "Immutable text, the String pool, and how to concatenate efficiently.",
        blocks: [
          { kind: "p", text: "String objects are immutable — every 'modification' creates a new object. Literals live in the String pool so identical literals share memory." },
          { kind: "code", code: `String a = "Java";
String b = a + " 21";               // new object "Java 21"
String c = String.format("Hi %s!", a);

// Efficient repeated concatenation:
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 100; i++) sb.append(i);
String result = sb.toString();

// Text blocks (Java 15+):
String json = """
    { "name": "Ada" }
    """;` },
        ],
        takeaways: [
          "Strings are immutable — reuse literals from the pool for equality.",
          "Use StringBuilder inside loops instead of += concatenation.",
          "Text blocks (\"\"\") preserve multi-line formatting.",
        ],
      }),
      L({
        id: "io",
        title: "Reading Input",
        tagline: "Scanner for the console, and a peek at System.in.",
        blocks: [
          { kind: "code", code: `import java.util.Scanner;

public class Ask {
    public static void main(String[] args) {
        try (Scanner in = new Scanner(System.in)) {
            System.out.print("Your name: ");
            String name = in.nextLine();
            System.out.println("Hello, " + name);
        }
    }
}` },
          { kind: "callout", tone: "tip", text: "try-with-resources auto-closes the Scanner even if an exception is thrown." },
        ],
        takeaways: [
          "Scanner wraps System.in for line/token/number reads.",
          "Close I/O resources — try-with-resources handles it for you.",
        ],
      }),
    ],
  },
  {
    id: "control",
    title: "2 · Control Flow & Methods",
    color: "var(--teal)",
    lessons: [
      L({
        id: "if-else",
        title: "if / else",
        tagline: "Branching with boolean expressions.",
        blocks: [
          { kind: "code", code: `if (score >= 90)      grade = 'A';
else if (score >= 80) grade = 'B';
else if (score >= 70) grade = 'C';
else                  grade = 'F';

String label = (age >= 18) ? "adult" : "minor";  // ternary` },
        ],
        takeaways: ["Conditions must be boolean.", "The ternary ?: is a compact if/else expression."],
      }),
      L({
        id: "switch",
        title: "switch & Pattern Switch",
        tagline: "Classic switch statements and modern arrow-style expressions.",
        blocks: [
          { kind: "code", code: `// Modern switch expression (Java 14+)
String day = switch (n) {
    case 1, 7 -> "weekend";
    case 2, 3, 4, 5, 6 -> "weekday";
    default -> "unknown";
};

// Pattern switch (Java 21+)
String describe = switch (obj) {
    case Integer i when i > 0 -> "positive int " + i;
    case String  s            -> "string of length " + s.length();
    case null                 -> "nothing";
    default                   -> "something else";
};` },
        ],
        takeaways: [
          "Arrow switch expressions return values and have no fall-through.",
          "Pattern switch dispatches on the runtime type and can bind variables.",
        ],
      }),
      L({
        id: "loops",
        title: "Loops",
        tagline: "for, while, do-while, and the for-each loop.",
        blocks: [
          { kind: "code", code: `for (int i = 0; i < 10; i++) { ... }

while (queue.hasNext()) { ... }

do { retry(); } while (!ok);

for (String name : names) {          // for-each
    System.out.println(name);
}` },
          { kind: "callout", tone: "note", text: "Use break to exit a loop early; continue skips to the next iteration." },
        ],
        takeaways: ["for-each is the cleanest iteration over any Iterable.", "Prefer streams over manual loops for data transformations."],
      }),
      L({
        id: "methods",
        title: "Methods",
        tagline: "Parameters, return types, and overloading.",
        blocks: [
          { kind: "code", code: `public static int max(int a, int b) {
    return a > b ? a : b;
}

// Overloading — same name, different parameters
public static double max(double a, double b) { ... }

// Varargs
public static int sum(int... nums) {
    int total = 0;
    for (int n : nums) total += n;
    return total;
}` },
        ],
        takeaways: ["Overloading picks the best-matching signature at compile time.", "Varargs (int... nums) is really an array under the hood."],
      }),
      L({
        id: "recursion",
        title: "Recursion",
        tagline: "A method that calls itself — and the stack frames it creates.",
        scene: "stackHeap",
        blocks: [
          { kind: "code", code: `static long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}` },
          { kind: "callout", tone: "warn", text: "Each call pushes a new frame on the stack — too much recursion throws StackOverflowError." },
        ],
        takeaways: ["Every recursive call needs a base case.", "Watch the stack grow in the 3D visualization for factorial(5)."],
      }),
    ],
  },
  {
    id: "oop",
    title: "3 · Object-Oriented Core",
    color: "var(--java-blue)",
    lessons: [
      L({
        id: "classes",
        title: "Classes & Objects",
        tagline: "State + behavior packaged together.",
        scene: "stackHeap",
        blocks: [
          { kind: "code", code: `public class Point {
    double x, y;                    // fields (state)

    double distance(Point other) {  // method (behavior)
        double dx = x - other.x, dy = y - other.y;
        return Math.sqrt(dx*dx + dy*dy);
    }
}

Point p = new Point();  // 'new' allocates on the heap
p.x = 3; p.y = 4;` },
        ],
        takeaways: ["A class is a blueprint; an object is one instance in memory.", "'new' allocates a heap object and returns a reference."],
      }),
      L({
        id: "constructors",
        title: "Constructors",
        tagline: "How new objects are initialized.",
        blocks: [
          { kind: "code", code: `public class Point {
    final double x, y;

    public Point(double x, double y) {  // constructor
        this.x = x;
        this.y = y;
    }

    public Point() { this(0, 0); }      // chained constructor
}` },
        ],
        takeaways: ["Constructors have no return type and share the class name.", "this(...) chains to another constructor in the same class."],
      }),
      L({
        id: "this-static",
        title: "this, static & final",
        tagline: "Instance vs class members, and immutability.",
        blocks: [
          { kind: "code", code: `public class Counter {
    private static int total = 0;   // shared across all instances
    private final int id;           // set once per instance
    private int hits;

    public Counter() {
        this.id = ++total;
    }
    public static int totalCreated() { return total; }
}` },
          { kind: "list", items: [
            "static members belong to the class, not any instance.",
            "final variables can be assigned only once.",
            "this refers to the current instance.",
          ] },
        ],
        takeaways: ["static = one copy per class.", "final = write-once."],
      }),
      L({
        id: "inheritance",
        title: "Inheritance",
        tagline: "Extending a class to reuse and specialize.",
        scene: "inheritance",
        blocks: [
          { kind: "code", code: `class Animal {
    String name;
    void speak() { System.out.println("..."); }
}

class Dog extends Animal {
    @Override
    void speak() { System.out.println(name + ": woof"); }
}

Animal a = new Dog();   // upcast
a.speak();              // dynamic dispatch → "woof"` },
          { kind: "callout", tone: "tip", text: "Click a node in the 3D class tree to highlight inherited members." },
        ],
        takeaways: [
          "extends creates an 'is-a' relationship.",
          "@Override lets the compiler check you're really overriding.",
          "Method calls dispatch on the runtime type.",
        ],
      }),
      L({
        id: "polymorphism",
        title: "Polymorphism",
        tagline: "One interface, many runtime behaviors.",
        blocks: [
          { kind: "code", code: `Animal[] zoo = { new Dog(), new Cat(), new Cow() };
for (Animal a : zoo) a.speak();   // each speaks its own way` },
        ],
        takeaways: ["Program to the parent type; the JVM picks the right override.", "Enables 'open for extension, closed for modification' code."],
      }),
      L({
        id: "abstract",
        title: "Abstract Classes",
        tagline: "Partial blueprints that can't be instantiated.",
        blocks: [
          { kind: "code", code: `abstract class Shape {
    abstract double area();          // subclass must implement
    void describe() {
        System.out.println("area = " + area());
    }
}

class Circle extends Shape {
    double r;
    Circle(double r) { this.r = r; }
    double area() { return Math.PI * r * r; }
}` },
        ],
        takeaways: ["Use abstract when subclasses share code AND state.", "You cannot new an abstract class directly."],
      }),
      L({
        id: "interfaces",
        title: "Interfaces, Default & Sealed",
        tagline: "Contracts with optional bodies, and restricted hierarchies.",
        blocks: [
          { kind: "code", code: `interface Drawable {
    void draw();
    default void redraw() {   // Java 8+ default method
        clear(); draw();
    }
    private void clear() { /* ... */ }
}

// Sealed (Java 17+) — only listed types may implement.
sealed interface Shape permits Circle, Square {}
final class Circle implements Shape {}
final class Square implements Shape {}` },
        ],
        takeaways: [
          "Interfaces are pure contracts; a class can implement many.",
          "default methods add behavior without breaking implementers.",
          "sealed types make pattern matching exhaustive.",
        ],
      }),
    ],
  },
  {
    id: "data",
    title: "4 · Data & Collections",
    color: "var(--purple)",
    lessons: [
      L({
        id: "arrays",
        title: "Arrays",
        tagline: "Fixed-size, contiguous, index-from-zero.",
        scene: "arrays",
        blocks: [
          { kind: "code", code: `int[] nums = new int[5];      // {0,0,0,0,0}
int[] primes = {2, 3, 5, 7, 11};
System.out.println(primes[2]);   // 5
System.out.println(primes.length);

int[][] grid = new int[3][3];    // multidimensional` },
          { kind: "callout", tone: "warn", text: "Out-of-range access throws ArrayIndexOutOfBoundsException." },
        ],
        takeaways: ["Length is fixed at creation.", "Multidim arrays are arrays of arrays."],
      }),
      L({
        id: "arraylist",
        title: "ArrayList & LinkedList",
        tagline: "The two workhorse Lists — and when to use each.",
        blocks: [
          { kind: "code", code: `import java.util.*;

List<String> names = new ArrayList<>();
names.add("Ada");
names.add("Grace");
names.remove(0);

List<Integer> queue = new LinkedList<>();
queue.add(1); queue.add(2);` },
          { kind: "list", items: [
            "ArrayList: fast random access, slow inserts in the middle.",
            "LinkedList: fast head/tail inserts, slow random access.",
          ] },
        ],
        takeaways: ["Prefer ArrayList by default.", "Use List<T> as the declared type; swap implementations freely."],
      }),
      L({
        id: "hashmap",
        title: "HashMap & HashSet",
        tagline: "Key → value in O(1) average — using hashCode() and equals().",
        scene: "hashmap",
        blocks: [
          { kind: "code", code: `Map<String, Integer> ages = new HashMap<>();
ages.put("Ada", 36);
ages.put("Grace", 85);
int a = ages.getOrDefault("Ada", 0);

for (var entry : ages.entrySet()) {
    System.out.println(entry.getKey() + " → " + entry.getValue());
}

Set<String> unique = new HashSet<>(List.of("a","b","a"));  // {a,b}` },
          { kind: "callout", tone: "tip", text: "The 3D scene shows buckets: keys hash to a bucket index; collisions form a chain." },
        ],
        takeaways: [
          "Custom keys must implement equals() AND hashCode() consistently.",
          "HashMap is unordered; use LinkedHashMap for insertion order.",
        ],
      }),
      L({
        id: "generics",
        title: "Generics",
        tagline: "Type parameters for reusable, type-safe containers.",
        blocks: [
          { kind: "code", code: `class Box<T> {
    private T value;
    public void set(T v) { value = v; }
    public T get() { return value; }
}

Box<Integer> b = new Box<>();
b.set(42);

// Bounded type parameter
static <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) > 0 ? a : b;
}

List<? extends Number> readOnly;   // upper-bounded wildcard` },
        ],
        takeaways: [
          "Generics are erased at runtime — type checks happen at compile time.",
          "Use bounds (T extends X) to constrain what T can be.",
        ],
      }),
      L({
        id: "iterators",
        title: "Iterators & Iterable",
        tagline: "The contract behind for-each.",
        blocks: [
          { kind: "code", code: `Iterator<String> it = names.iterator();
while (it.hasNext()) {
    String n = it.next();
    if (n.isEmpty()) it.remove();  // safe removal
}` },
        ],
        takeaways: ["for-each unrolls to iterator().hasNext()/next().", "Modifying a collection during for-each throws ConcurrentModificationException."],
      }),
      L({
        id: "comparable",
        title: "Comparable & Comparator",
        tagline: "Natural order vs on-the-fly order.",
        blocks: [
          { kind: "code", code: `class User implements Comparable<User> {
    String name; int age;
    public int compareTo(User o) { return this.age - o.age; }
}

users.sort(Comparator.comparing((User u) -> u.name)
                     .thenComparingInt(u -> u.age).reversed());` },
        ],
        takeaways: ["Comparable defines the class's default order.", "Comparator lets you sort by any strategy at the call site."],
      }),
    ],
  },
  {
    id: "intermediate",
    title: "5 · Intermediate",
    color: "var(--pink)",
    lessons: [
      L({
        id: "exceptions",
        title: "Exceptions & try-with-resources",
        tagline: "Handling failure without cluttering happy paths.",
        blocks: [
          { kind: "code", code: `try (var reader = Files.newBufferedReader(path)) {
    return reader.readLine();
} catch (NoSuchFileException e) {
    return "";
} catch (IOException e) {
    throw new RuntimeException("read failed", e);
}

// Custom exception
class NotFoundException extends RuntimeException {
    public NotFoundException(String msg) { super(msg); }
}` },
          { kind: "list", items: [
            "Checked exceptions (extends Exception) must be caught or declared.",
            "Unchecked (extends RuntimeException) don't require a throws clause.",
            "try-with-resources closes AutoCloseable resources in reverse order.",
          ] },
        ],
        takeaways: ["Catch narrow types first, wide types last.", "Always close I/O — let the compiler do it via try-with-resources."],
      }),
      L({
        id: "enums",
        title: "Enums",
        tagline: "A fixed, type-safe set of named constants — that can also have behavior.",
        blocks: [
          { kind: "code", code: `enum Direction {
    NORTH( 0, -1), EAST(1, 0), SOUTH(0, 1), WEST(-1, 0);

    final int dx, dy;
    Direction(int dx, int dy) { this.dx = dx; this.dy = dy; }

    Direction opposite() {
        return values()[(ordinal() + 2) % 4];
    }
}` },
        ],
        takeaways: ["Enums can carry fields and methods.", "Prefer enums over public static final int for named sets."],
      }),
      L({
        id: "records",
        title: "Records",
        tagline: "Immutable data carriers with equals/hashCode/toString for free (Java 14+).",
        blocks: [
          { kind: "code", code: `record Point(double x, double y) {
    // compact constructor — validation
    public Point {
        if (Double.isNaN(x) || Double.isNaN(y))
            throw new IllegalArgumentException();
    }
    double distance(Point o) {
        return Math.hypot(x - o.x, y - o.y);
    }
}` },
        ],
        takeaways: ["Records are implicitly final and immutable.", "Fields become accessor methods: p.x() not p.x."],
      }),
      L({
        id: "lambdas",
        title: "Lambdas & Functional Interfaces",
        tagline: "Passing behavior as data.",
        blocks: [
          { kind: "code", code: `Runnable r = () -> System.out.println("hi");
Function<String,Integer> len = s -> s.length();
BiFunction<Integer,Integer,Integer> add = (a, b) -> a + b;
Predicate<String> nonEmpty = s -> !s.isEmpty();

// Method reference
list.forEach(System.out::println);` },
        ],
        takeaways: [
          "A lambda targets a functional interface — one abstract method.",
          "Method references (Class::method) are compact lambda substitutes.",
        ],
      }),
      L({
        id: "streams",
        title: "Streams API",
        tagline: "Declarative pipelines over collections.",
        scene: "streams",
        blocks: [
          { kind: "code", code: `import java.util.stream.*;

int sum = List.of(1,2,3,4,5,6).stream()
    .filter(n -> n % 2 == 0)     // 2, 4, 6
    .mapToInt(Integer::intValue)
    .sum();                       // 12

Map<Boolean,List<Integer>> parts = IntStream.rangeClosed(1, 10)
    .boxed()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0));` },
          { kind: "callout", tone: "note", text: "Streams are lazy — nothing happens until a terminal operation (sum, collect, forEach)." },
        ],
        takeaways: [
          "Stages: source → intermediate ops → terminal op.",
          "Streams are single-use; create a new one each time.",
        ],
      }),
      L({
        id: "optional",
        title: "Optional",
        tagline: "A container that may or may not hold a value — a nicer alternative to null.",
        blocks: [
          { kind: "code", code: `Optional<User> found = repo.findById(42);
String name = found.map(u -> u.name).orElse("unknown");

found.ifPresent(u -> System.out.println(u.email));

// Chain
int emailLen = repo.findById(42)
    .map(u -> u.email)
    .map(String::length)
    .orElse(0);` },
          { kind: "callout", tone: "warn", text: "Don't use Optional for fields or parameters — reserve it for return types." },
        ],
        takeaways: ["Signals absence in the type system.", "Use map/flatMap/orElse — avoid isPresent()+get()."],
      }),
      L({
        id: "io-nio",
        title: "File I/O (NIO.2)",
        tagline: "Modern paths, files and streams.",
        blocks: [
          { kind: "code", code: `import java.nio.file.*;
import java.nio.charset.StandardCharsets;

Path p = Path.of("notes.txt");
Files.writeString(p, "hello", StandardCharsets.UTF_8);
String text = Files.readString(p);
List<String> lines = Files.readAllLines(p);

try (var stream = Files.lines(p)) {
    stream.filter(l -> !l.isBlank()).forEach(System.out::println);
}` },
        ],
        takeaways: ["Prefer java.nio.file over the old java.io.File API.", "Files.lines() returns a lazy stream — close it."],
      }),
      L({
        id: "modules",
        title: "Packages & Modules",
        tagline: "Namespaces for classes, and stronger boundaries between JAR-sized units.",
        blocks: [
          { kind: "code", code: `// File: com/acme/util/Math.java
package com.acme.util;

public class Math { ... }

// module-info.java (Java 9+)
module com.acme.util {
    exports com.acme.util;
    requires java.base;
}` },
        ],
        takeaways: [
          "Packages group related classes and are the unit of visibility.",
          "Modules add explicit exports/requires — stronger encapsulation than JARs.",
        ],
      }),
    ],
  },
  {
    id: "advanced",
    title: "6 · Advanced",
    color: "var(--java-orange)",
    lessons: [
      L({
        id: "threads",
        title: "Threads & Runnable",
        tagline: "Multiple flows of execution inside one JVM.",
        scene: "threads",
        blocks: [
          { kind: "code", code: `Thread t = new Thread(() -> {
    for (int i = 0; i < 5; i++)
        System.out.println("tick " + i);
});
t.start();       // runs concurrently
t.join();        // wait for it` },
          { kind: "callout", tone: "tip", text: "The 3D scene shows two threads racing on a shared counter — watch it lose updates without synchronization." },
        ],
        takeaways: ["start() spawns; run() would be sequential.", "Multiple threads share heap objects — that's where the trouble starts."],
      }),
      L({
        id: "synchronized",
        title: "synchronized & Locks",
        tagline: "Coordinating access so shared state stays consistent.",
        scene: "threads",
        blocks: [
          { kind: "code", code: `class Counter {
    private int n;
    public synchronized void inc() { n++; }
    public synchronized int get() { return n; }
}

// Explicit lock
ReentrantLock lock = new ReentrantLock();
lock.lock();
try { /* critical section */ } finally { lock.unlock(); }` },
        ],
        takeaways: [
          "synchronized guarantees mutual exclusion and visibility.",
          "Prefer AtomicInteger / ConcurrentHashMap for simple cases.",
        ],
      }),
      L({
        id: "executors",
        title: "ExecutorService",
        tagline: "Thread pools — the right way to run many tasks.",
        blocks: [
          { kind: "code", code: `ExecutorService pool = Executors.newFixedThreadPool(4);

Future<Integer> f = pool.submit(() -> heavyWork());
Integer result = f.get();     // blocks until done

pool.shutdown();` },
        ],
        takeaways: [
          "Don't hand-roll threads — submit tasks to a pool.",
          "Always shutdown() the executor.",
        ],
      }),
      L({
        id: "completable-future",
        title: "CompletableFuture",
        tagline: "Composable async pipelines.",
        blocks: [
          { kind: "code", code: `CompletableFuture<String> page = CompletableFuture
    .supplyAsync(() -> fetch(url))
    .thenApply(String::trim)
    .thenCombine(
        CompletableFuture.supplyAsync(() -> fetch(url2)),
        (a, b) -> a + b)
    .exceptionally(err -> "fallback");

String result = page.join();` },
        ],
        takeaways: [
          "thenApply/thenCombine chain non-blocking steps.",
          "exceptionally / handle recover from failures.",
        ],
      }),
      L({
        id: "virtual-threads",
        title: "Virtual Threads (Project Loom)",
        tagline: "Millions of cheap threads scheduled on a few carriers (Java 21+).",
        scene: "virtualThreads",
        blocks: [
          { kind: "code", code: `try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 1_000_000; i++) {
        exec.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));
            return null;
        });
    }
}` },
          { kind: "callout", tone: "note", text: "Virtual threads are managed by the JVM, not the OS. Blocking is nearly free." },
        ],
        takeaways: [
          "Write blocking code; the JVM parks/unparks the virtual thread.",
          "Great fit for I/O-heavy servers.",
        ],
      }),
      L({
        id: "jvm-memory",
        title: "JVM Memory Model",
        tagline: "Heap, stack, metaspace and how they interact.",
        scene: "stackHeap",
        blocks: [
          { kind: "list", items: [
            "Stack — one per thread; primitives and references live here.",
            "Heap — shared across threads; all objects live here.",
            "Metaspace — class metadata, bytecode, method info.",
            "PC register + native method stack — bookkeeping per thread.",
          ] },
          { kind: "callout", tone: "tip", text: "The 3D scene highlights the boundary: primitives are on the stack, objects float in the heap." },
        ],
        takeaways: [
          "Each thread gets its own stack.",
          "Only the heap is garbage-collected.",
        ],
      }),
      L({
        id: "gc",
        title: "Garbage Collection",
        tagline: "How unreachable objects are reclaimed.",
        scene: "gc",
        blocks: [
          { kind: "p", text: "Modern collectors (G1, ZGC, Shenandoah) divide the heap into generations. Most objects die young, so a fast 'minor GC' sweeps the young generation. Long-lived objects are promoted to the old generation, which is collected less often but more thoroughly." },
          { kind: "code", code: `# Common tuning flags
-Xms512m -Xmx4g           # initial / max heap
-XX:+UseG1GC              # pick collector
-XX:+PrintGCDetails       # log GC` },
        ],
        takeaways: [
          "You don't free memory — you make objects unreachable.",
          "Young/old generations exploit the 'weak generational hypothesis'.",
        ],
      }),
      L({
        id: "reflection",
        title: "Reflection & Annotations",
        tagline: "Inspecting and manipulating classes at runtime.",
        blocks: [
          { kind: "code", code: `Class<?> c = Class.forName("com.acme.User");
for (var m : c.getDeclaredMethods()) {
    System.out.println(m.getName());
}

// Custom annotation
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Benchmark { }

// Frameworks like Spring/JPA use reflection to wire your code.` },
        ],
        takeaways: [
          "Reflection powers frameworks — use it sparingly in app code.",
          "Annotations attach metadata for compile-time or runtime tools.",
        ],
      }),
      L({
        id: "spring",
        title: "A Peek at Spring Boot",
        tagline: "The most popular Java framework, in one file.",
        blocks: [
          { kind: "code", code: `@SpringBootApplication
public class App {
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}

@RestController
class HelloController {
    @GetMapping("/hello")
    String hello(@RequestParam String name) {
        return "Hello, " + name;
    }
}` },
          { kind: "p", text: "Run it and http://localhost:8080/hello?name=Ada answers 'Hello, Ada'. Spring uses annotations + reflection to wire the controller, start an embedded Tomcat, and serve HTTP." },
        ],
        takeaways: [
          "Convention over configuration — sensible defaults everywhere.",
          "Annotation-driven: @Service, @Repository, @Autowired, @Transactional.",
        ],
      }),
    ],
  },
];

export function findLesson(moduleId: string, lessonId: string) {
  const mod = modules.find((m) => m.id === moduleId);
  const lesson = mod?.lessons.find((l) => l.id === lessonId);
  return mod && lesson ? { module: mod, lesson } : null;
}

export function flatLessons() {
  return modules.flatMap((m) => m.lessons.map((l) => ({ module: m, lesson: l })));
}

export function neighbours(moduleId: string, lessonId: string) {
  const flat = flatLessons();
  const i = flat.findIndex((x) => x.module.id === moduleId && x.lesson.id === lessonId);
  return {
    prev: i > 0 ? flat[i - 1] : null,
    next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : null,
    index: i,
    total: flat.length,
  };
}
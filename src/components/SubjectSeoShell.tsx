import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

type SubjectLink =
  | "/"
  | "/auth"
  | "/faq"
  | "/mysql"
  | "/python"
  | "/java"
  | "/cpp"
  | "/pyspark"
  | "/gcp"
  | "/tutorial"
  | "/python-tutorial"
  | "/java-tutorial"
  | "/cpp-tutorial"
  | "/pyspark-tutorial"
  | "/sql-interview-questions"
  | "/python-coding-practice"
  | "/c-cpp-coding-practice"
  | "/pyspark-practice"
  | "/gcp-data-engineer-interview";

export interface SubjectSeoShellProps {
  eyebrow: string;
  title: string;
  summary: string;
  overview: string[];
  topics: string[];
  workflow: string[];
  links: Array<{ to: SubjectLink; label: string; description: string }>;
}

const sharedWorkflow = [
  "Choose a difficulty, topic, or targeted plan. The engine creates an interview-style prompt with the context and constraints needed to reason about a correct solution.",
  "Write and run your answer in the browser. Ask for a focused hint or theory explanation when you need help without immediately revealing the final answer.",
  "Review semantic feedback, complexity notes, examples, and the reference approach. Automatic checkpoints preserve the latest question and code for your next visit.",
];

export const SUBJECT_SEO_CONTENT: Record<string, SubjectSeoShellProps> = {
  home: {
    eyebrow: "AI-graded interview preparation",
    title: "Smart AI Code Playground",
    summary: "Prepare for technical interviews with adaptive practice in MySQL, Python, Java, C/C++, PySpark, and GCP data engineering. Each subject combines a focused workspace, clear theory, progressive questions, and feedback designed to improve how you explain and implement a solution.",
    overview: [
      "The playground is designed for learners, working engineers, and interview candidates who want more than a static question list. Practice sessions progress from fundamentals to advanced scenarios, while topic-wise and targeted modes let you concentrate on a specific gap before an interview.",
      "Your work is checkpointed by subject, so switching from SQL to Python or another track does not overwrite earlier progress. Return to the latest saved question, code, and session state after a refresh or on another visit.",
    ],
    topics: ["MySQL schemas, joins, windows, CTEs, and optimization", "Python algorithms, data structures, OOP, and practical coding", "Modern Java collections, streams, concurrency, and backend scenarios", "C and C++ pointers, memory, STL, templates, and DSA", "PySpark DataFrames, Spark SQL, tuning, and streaming", "BigQuery, data modeling, warehousing, ETL/ELT, and Power BI"],
    workflow: sharedWorkflow,
    links: [
      { to: "/mysql", label: "MySQL practice", description: "Solve realistic SQL problems with schemas, seed data, and AI feedback." },
      { to: "/python", label: "Python practice", description: "Work through progressive coding interview questions in four languages." },
      { to: "/gcp", label: "GCP data engineering", description: "Prepare for BigQuery, modeling, pipelines, and warehouse interviews." },
    ],
  },
  mysql: {
    eyebrow: "MySQL interview practice",
    title: "MySQL Practice with an AI Mentor",
    summary: "Build interview-ready SQL skills with realistic business questions, generated schemas, seed data, ERD context, and semantic feedback. The workspace supports daily practice, free practice, topic-wise drills, targeted plans, and data-engineering scenarios from beginner through advanced level.",
    overview: ["Each question includes enough database context to reason about relationships, grain, filters, and expected output before writing a query. The evaluator considers result semantics and query design rather than relying only on a string match, so equivalent solutions can still receive useful feedback.", "Theory explanations connect the active question to reusable SQL ideas with examples and visual flows. Hints, debugging help, optimization review, and a solved-question library make the workspace useful for learning as well as timed interview preparation."],
    topics: ["SELECT, filtering, grouping, and aggregate functions", "INNER, LEFT, self, anti, and multi-table joins", "Window functions, ranking, frames, and running totals", "CTEs, subqueries, recursive SQL, and set operations", "Indexes, EXPLAIN plans, query tuning, and data quality", "Data modeling, warehousing, ETL/ELT, and interview scenarios"],
    workflow: sharedWorkflow,
    links: [
      { to: "/tutorial", label: "MySQL visual tutorial", description: "Learn core and advanced SQL concepts with animated explanations." },
      { to: "/sql-interview-questions", label: "SQL interview guide", description: "Review the question types and reasoning expected in interviews." },
      { to: "/gcp", label: "Data engineering bank", description: "Apply SQL alongside modeling, warehousing, BigQuery, and pipelines." },
    ],
  },
  python: {
    eyebrow: "Coding interview practice",
    title: "Python Coding Interview Practice",
    summary: "Practice Python interview problems with an AI mentor that evaluates correctness, edge cases, complexity, and code quality. The unified editor also lets you select Java, C, or C++ when you want to solve the same style of problem in another language.",
    overview: ["Sessions cover the patterns interviewers expect candidates to recognize, from arrays and hash maps to trees, graphs, dynamic programming, object-oriented design, and concurrency. Topic-wise and company-targeted modes help you build a plan around your current level.", "After a submission, inspect test feedback, a reference solution, theory, examples, and an optional SQL version when a data problem has a natural relational solution. Per-language buffers and automatic checkpoints keep unfinished code available when you switch languages or return later."],
    topics: ["Lists, strings, dictionaries, sets, and comprehensions", "Two pointers, sliding windows, hashing, and binary search", "Stacks, queues, linked lists, trees, heaps, and graphs", "Recursion, backtracking, dynamic programming, and greedy reasoning", "OOP, generators, decorators, asyncio, and practical design", "Complexity analysis, hidden tests, debugging, and optimization"],
    workflow: sharedWorkflow,
    links: [
      { to: "/python-tutorial", label: "Python visual tutorial", description: "Study Python fundamentals and advanced topics step by step." },
      { to: "/python-coding-practice", label: "Python interview overview", description: "See the skills, modes, and progression covered by the engine." },
      { to: "/cpp", label: "C/C++ practice", description: "Strengthen lower-level memory, pointers, STL, and systems concepts." },
    ],
  },
  java: {
    eyebrow: "Modern Java interview practice",
    title: "Java Coding Interview Practice",
    summary: "Prepare for Java coding and backend interviews with progressive questions, AI feedback, theory, examples, and resumable code. The track covers Java fundamentals, collections, algorithms, modern language features, concurrency, and common server-side scenarios.",
    overview: ["Questions develop both problem-solving fluency and the ability to explain Java-specific trade-offs. Practice choosing the right collection, handling nullability and exceptions, using streams appropriately, and analyzing time and space complexity.", "Advanced sessions extend into records, pattern matching, virtual threads, concurrent collections, Spring Boot, JPA, and compact system-design exercises. Feedback highlights correctness, edge cases, readability, and opportunities to write more idiomatic Java."],
    topics: ["Core syntax, arrays, strings, control flow, and methods", "Collections, generics, lambdas, streams, and collectors", "Stacks, queues, trees, graphs, heaps, and dynamic programming", "Exceptions, Optional, records, sealed types, and pattern matching", "Threads, CompletableFuture, virtual threads, and concurrency", "Spring Boot, persistence, backend design, and complexity analysis"],
    workflow: sharedWorkflow,
    links: [
      { to: "/java-tutorial", label: "Java visual tutorial", description: "Explore the JVM, memory, collections, streams, and concurrency." },
      { to: "/python", label: "Multi-language editor", description: "Compare interview solutions across Python, Java, C, and C++." },
      { to: "/faq", label: "Practice FAQ", description: "Learn how grading, saved progress, and practice modes work." },
    ],
  },
  cpp: {
    eyebrow: "C and C++ interview practice",
    title: "C and C++ Coding Interview Practice",
    summary: "Switch between C and C++ while practicing interview questions on pointers, memory, data structures, algorithms, object-oriented programming, STL, and systems concepts. Each generated starter template is normalized for the selected language and ready to complete.",
    overview: ["The C path emphasizes arrays, character buffers, structs, pointer arithmetic, dynamic allocation, function pointers, and careful resource management. The C++ path adds classes, RAII, smart pointers, templates, move semantics, containers, algorithms, and modern language practices.", "Progressive sessions combine implementation with explanation. AI feedback checks the selected language, code structure, likely edge cases, complexity, and memory behavior, while theory panels provide examples that connect the current problem to reusable interview patterns."],
    topics: ["C syntax, arrays, strings, structs, and file I/O", "Pointers, allocation, ownership, leaks, and memory safety", "C++ classes, constructors, destructors, inheritance, and polymorphism", "STL containers, iterators, algorithms, templates, and lambdas", "Linked structures, trees, graphs, dynamic programming, and bit operations", "RAII, smart pointers, move semantics, concurrency, and performance"],
    workflow: sharedWorkflow,
    links: [
      { to: "/cpp-tutorial", label: "C/C++ visual tutorial", description: "Follow separate C and C++ learning tracks from fundamentals onward." },
      { to: "/c-cpp-coding-practice", label: "C/C++ interview overview", description: "Review the practice modes and technical areas covered." },
      { to: "/python", label: "Multi-language coding", description: "Practice comparable questions using Python, Java, C, or C++." },
    ],
  },
  pyspark: {
    eyebrow: "Data engineering coding practice",
    title: "PySpark Interview Practice",
    summary: "Prepare for PySpark and Apache Spark interviews with hands-on DataFrame questions, Spark SQL exercises, performance scenarios, and AI-reviewed solutions. The dedicated editor uses PySpark only, keeping every prompt and starter template aligned to data-engineering work.",
    overview: ["Begin with SparkSession, DataFrame creation, expressions, filtering, null handling, grouping, and joins. Intermediate and advanced sessions move into windows, complex types, execution plans, partitioning, caching, broadcast strategies, UDF trade-offs, structured streaming, and Delta Lake.", "Each question is paired with theory and examples so you can explain not just what code works, but why it scales. Review feedback on transformations, actions, shuffles, serialization, skew, partition sizing, and the practical decisions interviewers expect from a data engineer."],
    topics: ["DataFrame creation, selection, filtering, expressions, and nulls", "Aggregations, joins, windows, arrays, maps, and structs", "Spark SQL, temporary views, schemas, and data formats", "Partitions, shuffles, caching, broadcast joins, and skew", "Execution plans, UDF alternatives, testing, and optimization", "Structured Streaming, checkpoints, watermarks, and Delta Lake"],
    workflow: sharedWorkflow,
    links: [
      { to: "/pyspark-tutorial", label: "PySpark visual tutorial", description: "Learn Spark concepts through structured lessons and visual scenes." },
      { to: "/pyspark-practice", label: "PySpark interview overview", description: "Review the engine's topics and progressive practice approach." },
      { to: "/gcp", label: "GCP data engineering", description: "Connect Spark preparation with warehouses, pipelines, and cloud design." },
    ],
  },
  gcp: {
    eyebrow: "Cloud data engineering interviews",
    title: "GCP Data Engineer Interview Preparation",
    summary: "Prepare from beginner to professional level with curated questions and answers covering BigQuery, SQL and data modeling, data warehousing, ETL/ELT development, Dataflow, Pub/Sub, Composer, IAM, cost optimization, and Power BI integration.",
    overview: ["The bank is organized by level and topic so you can build fundamentals first, then progress to architecture, reliability, performance, governance, and scenario-based design. Answers include interviewer rationale, follow-up questions, important functions, and practical trade-offs.", "Mark a question as covered when you finish it; completed questions move out of the active rotation and remain available in a separate covered section. Saved filters, difficulty, question position, and progress let you resume the same preparation session later."],
    topics: ["BigQuery architecture, SQL, partitioning, clustering, and cost control", "Dimensional modeling, warehouse design, facts, dimensions, and SCDs", "Batch and streaming ETL/ELT with Dataflow and Apache Beam", "Pub/Sub, Composer, Airflow, orchestration, and observability", "IAM, security, governance, reliability, and production operations", "Power BI connectivity, semantic models, refresh, and performance"],
    workflow: sharedWorkflow,
    links: [
      { to: "/gcp-data-engineer-interview", label: "GCP interview overview", description: "Review the full skill map and question-bank structure." },
      { to: "/mysql", label: "MySQL practice", description: "Strengthen the SQL and modeling skills used in data interviews." },
      { to: "/pyspark", label: "PySpark practice", description: "Build hands-on distributed processing and optimization skills." },
    ],
  },
  engine: {
    eyebrow: "Interactive MySQL lab",
    title: "MySQL Intelligence Engine",
    summary: "Explore a realistic relational dataset with an AI SQL compiler, data-quality checks, query-plan reasoning, and advanced MySQL labs. This workspace complements interview practice by showing how SQL decisions affect correctness, maintainability, and performance in a data-engineering environment.",
    overview: ["The data preview introduces customers, orders, order items, and quality signals so every query has a clear business grain. Use the schema and ERD to reason about keys and relationships before moving into text-to-SQL prompts or advanced exercises.", "The lab covers execution plans, indexing, window functions, CTEs, data validation, and warehouse-oriented thinking. Signed-in learners can save the active tab and prompt, while the related resources below provide structured theory and interview drills."],
    topics: ["Relational schemas, keys, grain, and ERD reasoning", "Text-to-SQL prompts and explainable query generation", "EXPLAIN plans, indexes, filters, joins, and performance", "Data-quality rules, nulls, duplicates, and validation", "Window functions, CTEs, subqueries, and advanced labs", "BigQuery comparisons and data-engineering trade-offs"],
    workflow: sharedWorkflow,
    links: [
      { to: "/mysql", label: "MySQL practice", description: "Solve progressive interview questions with AI grading." },
      { to: "/tutorial", label: "MySQL visual tutorial", description: "Review SQL concepts with animated explanations." },
      { to: "/gcp", label: "GCP data engineering", description: "Extend SQL skills into warehouses and pipelines." },
    ],
  },
  tutorial: {
    eyebrow: "Interactive MySQL lessons",
    title: "MySQL Visual Tutorial",
    summary: "Learn MySQL from foundations to advanced interview topics through structured visual explanations. The tutorial covers database definition and manipulation, joins, grouping, transactions, functions, CTEs, window functions, indexing, and query behavior with clear examples.",
    overview: ["Part one concentrates on the query engine: how rows are matched, filtered, grouped, ranked, and combined. Animated examples make it easier to follow intermediate result sets and understand why a query produces its final output.", "Part two builds the surrounding database knowledge needed for real projects and interviews, including data types, constraints, DDL, DML, permissions, transactions, isolation levels, upserts, and common functions. Continue into the practice engine to apply each concept to generated schemas."],
    topics: ["SELECT, WHERE, GROUP BY, HAVING, and aggregate functions", "INNER, LEFT, RIGHT, self, and multi-table joins", "Window functions, CTEs, indexes, and subqueries", "DDL, DML, DCL, TCL, constraints, and data types", "Transactions, savepoints, isolation levels, and upserts", "Functions, permissions, query behavior, and visual quizzes"],
    workflow: sharedWorkflow,
    links: [
      { to: "/mysql", label: "MySQL practice", description: "Apply tutorial concepts to generated interview questions." },
      { to: "/sql-interview-questions", label: "SQL interview questions", description: "Understand the skills and reasoning assessed by interviewers." },
      { to: "/gcp", label: "Data engineering interviews", description: "Connect SQL theory with warehousing and ETL/ELT design." },
    ],
  },
};

export function SubjectSeoShell({
  eyebrow,
  title,
  summary,
  overview,
  topics,
  workflow,
  links,
}: SubjectSeoShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <section className="max-w-3xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">{eyebrow}</p>
          <h1 className="text-3xl font-bold text-foreground sm:text-5xl">{title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{summary}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Sign in to start <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
            >
              Explore all subjects
            </Link>
          </div>
        </section>

        <section className="mt-14 border-t border-border pt-10 cv-auto">
          <h2 className="text-2xl font-semibold text-foreground">What you will practice</h2>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
            {overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {topics.map((topic) => (
              <li key={topic} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {topic}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 border-t border-border pt-10 cv-auto">
          <h2 className="text-2xl font-semibold text-foreground">How a practice session works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {workflow.map((step, index) => (
              <li key={step} className="border-l-2 border-primary pl-4">
                <p className="font-mono text-xs text-primary">Step {index + 1}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 border-t border-border pt-10 cv-auto">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Continue learning</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="border-b border-border py-4 text-left hover:border-primary"
              >
                <h3 className="font-semibold text-foreground">{link.label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{link.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
// Topic-wise SQL curriculum, organized by the five SQL sub-languages:
// DDL, DML, DCL, TCL and DQL. Each topic drives the AI question generator
// (topic_prompt + target_concept) and is asked up to 25 times before the
// session auto-advances to the next topic.

export type SqlCategory = "DDL" | "DML" | "DCL" | "TCL" | "DQL";
export type SqlDifficulty = "beginner" | "intermediate" | "advanced";

export interface SqlTopic {
  slug: string;
  name: string;
  category: SqlCategory;
  concept: string;
  difficulty: SqlDifficulty;
  /** Domain + instruction that biases the generated schema and question. */
  prompt: string;
}

export const CATEGORY_INFO: Record<SqlCategory, { label: string; blurb: string; emoji: string }> = {
  DDL: { label: "DDL — Data Definition", blurb: "CREATE, ALTER, DROP, TRUNCATE, constraints & indexes.", emoji: "🏗️" },
  DML: { label: "DML — Data Manipulation", blurb: "INSERT, UPDATE, DELETE, upserts & bulk changes.", emoji: "✏️" },
  DCL: { label: "DCL — Data Control", blurb: "GRANT, REVOKE, privileges & roles.", emoji: "🔐" },
  TCL: { label: "TCL — Transaction Control", blurb: "COMMIT, ROLLBACK, SAVEPOINT & isolation.", emoji: "🔄" },
  DQL: { label: "DQL — Data Query", blurb: "SELECT, joins, aggregates, windows & subqueries.", emoji: "🔎" },
};

export const CATEGORY_ORDER: SqlCategory[] = ["DDL", "DML", "DCL", "TCL", "DQL"];

function ddl(slug: string, name: string, concept: string, difficulty: SqlDifficulty, ask: string): SqlTopic {
  return {
    slug,
    name,
    category: "DDL",
    concept,
    difficulty,
    prompt: `Topic: Data Definition Language (DDL). Use a realistic business domain. The student's task MUST require writing a DDL statement — ${ask}. Provide the existing schema as context. The expected answer should be valid MySQL 8 DDL.`,
  };
}
function dml(slug: string, name: string, concept: string, difficulty: SqlDifficulty, ask: string): SqlTopic {
  return {
    slug,
    name,
    category: "DML",
    concept,
    difficulty,
    prompt: `Topic: Data Manipulation Language (DML). Use a realistic business domain with seeded tables. The student's task MUST require writing a DML statement — ${ask}. The expected answer should be valid MySQL 8 DML (INSERT/UPDATE/DELETE).`,
  };
}
function dcl(slug: string, name: string, concept: string, difficulty: SqlDifficulty, ask: string): SqlTopic {
  return {
    slug,
    name,
    category: "DCL",
    concept,
    difficulty,
    prompt: `Topic: Data Control Language (DCL). Use a realistic multi-user database scenario. The student's task MUST require writing a DCL statement — ${ask}. The expected answer should be valid MySQL 8 GRANT/REVOKE syntax.`,
  };
}
function tcl(slug: string, name: string, concept: string, difficulty: SqlDifficulty, ask: string): SqlTopic {
  return {
    slug,
    name,
    category: "TCL",
    concept,
    difficulty,
    prompt: `Topic: Transaction Control Language (TCL). Use a realistic transactional scenario (banking, inventory, orders). The student's task MUST require transaction control — ${ask}. The expected answer should be valid MySQL 8 transaction control SQL.`,
  };
}
function dql(slug: string, name: string, concept: string, difficulty: SqlDifficulty, ask: string): SqlTopic {
  return {
    slug,
    name,
    category: "DQL",
    concept,
    difficulty,
    prompt: `Topic: Data Query Language (DQL). Use a realistic business domain with seeded tables. The student's task MUST require writing a SELECT query — ${ask}. The expected answer should be valid MySQL 8 SELECT SQL.`,
  };
}

// Ordered from basics to advanced, category by category.
export const SQL_TOPICS: SqlTopic[] = [
  // ---- DDL ----
  ddl("ddl-create-table", "CREATE TABLE", "create-table", "beginner", "create a new table with appropriate column types"),
  ddl("ddl-constraints", "Constraints (PK / FK / UNIQUE / CHECK)", "table-constraints", "beginner", "define primary keys, foreign keys, unique or check constraints"),
  ddl("ddl-data-types", "Data Types & DEFAULT", "data-types", "beginner", "choose correct data types and default values for columns"),
  ddl("ddl-alter-table", "ALTER TABLE", "alter-table", "intermediate", "add, modify or drop a column / constraint on an existing table"),
  ddl("ddl-indexes", "Indexes (CREATE / DROP INDEX)", "indexes-ddl", "intermediate", "create or drop an index to optimize access"),
  ddl("ddl-views", "Views (CREATE VIEW)", "views-ddl", "intermediate", "create or replace a view"),
  ddl("ddl-drop-truncate", "DROP & TRUNCATE", "drop-truncate", "beginner", "drop or truncate a table correctly"),
  ddl("ddl-auto-increment", "AUTO_INCREMENT & Generated Columns", "generated-columns", "advanced", "use AUTO_INCREMENT or a generated/computed column"),

  // ---- DML ----
  dml("dml-insert", "INSERT", "insert-basic", "beginner", "insert one or more rows into a table"),
  dml("dml-insert-select", "INSERT ... SELECT", "insert-select", "intermediate", "insert rows derived from a SELECT query"),
  dml("dml-update", "UPDATE", "update-basic", "beginner", "update rows that match a condition"),
  dml("dml-update-join", "UPDATE with JOIN", "update-join", "advanced", "update rows using values from a joined table"),
  dml("dml-delete", "DELETE", "delete-basic", "beginner", "delete rows that match a condition"),
  dml("dml-upsert", "Upsert (ON DUPLICATE KEY)", "upsert", "intermediate", "perform an upsert with INSERT ... ON DUPLICATE KEY UPDATE"),
  dml("dml-replace", "REPLACE & Bulk DML", "bulk-dml", "intermediate", "perform a bulk insert or REPLACE operation"),

  // ---- DCL ----
  dcl("dcl-grant", "GRANT privileges", "grant", "beginner", "grant specific privileges to a user on a table or database"),
  dcl("dcl-revoke", "REVOKE privileges", "revoke", "beginner", "revoke privileges previously granted to a user"),
  dcl("dcl-roles", "Roles & Privilege Sets", "roles", "intermediate", "create a role, grant privileges to it and assign it to a user"),
  dcl("dcl-column-grants", "Column & View level grants", "column-grants", "advanced", "grant column-level or view-level access to limit exposure"),

  // ---- TCL ----
  tcl("tcl-commit-rollback", "COMMIT & ROLLBACK", "commit-rollback", "beginner", "wrap statements in a transaction and commit or roll back"),
  tcl("tcl-savepoint", "SAVEPOINT", "savepoint", "intermediate", "use SAVEPOINT and roll back to it partially"),
  tcl("tcl-isolation", "Isolation Levels", "isolation-levels", "advanced", "set an appropriate transaction isolation level and explain why"),
  tcl("tcl-atomic-transfer", "Atomic multi-step transaction", "atomic-transaction", "intermediate", "perform a multi-statement money/stock transfer atomically"),

  // ---- DQL ----
  dql("dql-select-where", "SELECT & WHERE", "select-where", "beginner", "filter, order and limit rows"),
  dql("dql-aggregates", "Aggregates & GROUP BY", "aggregates", "beginner", "aggregate with GROUP BY and HAVING"),
  dql("dql-joins", "JOINs", "joins", "intermediate", "combine rows across tables with the right join type"),
  dql("dql-subqueries", "Subqueries & EXISTS", "subqueries", "intermediate", "use a scalar, correlated or EXISTS subquery"),
  dql("dql-ctes", "CTEs (WITH)", "ctes", "intermediate", "use a common table expression for readability"),
  dql("dql-window", "Window Functions", "window-functions", "advanced", "use OVER / PARTITION BY ranking or running totals"),
  dql("dql-pivot", "Conditional Aggregation / Pivot", "pivot", "advanced", "pivot rows into columns with conditional aggregation"),
];

export const SQL_TOPIC_BY_SLUG: Record<string, SqlTopic> = Object.fromEntries(
  SQL_TOPICS.map((t) => [t.slug, t]),
);

/** Questions asked per topic before auto-advancing to the next one. */
export const QUESTIONS_PER_TOPIC = 25;

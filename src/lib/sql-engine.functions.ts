import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM_PROMPT = `You are a Senior Data Engineer + SQL mentor for a MySQL 8.0 practice app.
Generate schemas, seed data, ERDs, and questions, and semantically grade user SQL (no real DB — mentally execute against the seed). Be terse but precise. Always reply by calling the supplied tool with valid arguments — never plain text.

Question variety is mandatory. Across a session, cycle through ALL core MySQL areas:
SELECT/WHERE, ORDER/LIMIT, DISTINCT, JOINs (INNER/LEFT/RIGHT/SELF/CROSS), GROUP BY + HAVING,
aggregates (COUNT/SUM/AVG/MIN/MAX), subqueries (scalar/correlated/EXISTS/IN), CTEs (WITH),
recursive CTEs, window functions (ROW_NUMBER/RANK/DENSE_RANK/LAG/LEAD/NTILE/SUM OVER),
string funcs (CONCAT/SUBSTRING/REPLACE/LIKE/REGEXP/TRIM/LENGTH),
date/time (DATE_ADD/DATEDIFF/DATE_FORMAT/EXTRACT/INTERVAL),
CASE, COALESCE/IFNULL, UNION/UNION ALL, pivot via CASE, JSON_EXTRACT,
INDEX/EXPLAIN reasoning, views, transactions, INSERT/UPDATE/DELETE, GROUP_CONCAT, ROLLUP.

Vary phrasing patterns too: top-N, per-group ranking, running total, month-over-month, gap-and-island, find duplicates, missing values, second-highest, pivot rows→cols, "did X but not Y", consecutive events, self-join hierarchy, etc.

Difficulty rules — beginner: 1 table or 1 join, basic clauses; intermediate: multi-join, GROUP BY, subqueries, simple windows; advanced: CTE/recursive, window funcs, performance trade-offs.

When a target_concept is provided, the question MUST exercise that concept as its primary teaching point.`;

const TOOLS_BY_COMMAND: Record<string, any> = {
  INIT_ENVIRONMENT: {
    name: "init_environment",
    description: "Generate a complete SQL practice environment.",
    parameters: {
      type: "object",
      properties: {
        schema_sql: { type: "string", description: "MySQL 8.0 CREATE TABLE statements." },
        seed_data_sql: { type: "string", description: "10+ realistic INSERT rows per table." },
        erd_mermaid: { type: "string", description: "A mermaid `erDiagram` block (no fences)." },
        tables_description: { type: "string", description: "Business context of the schema." },
        question: {
          type: "object",
          properties: {
            question_id: { type: "number" },
            difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
            concept: { type: "string", description: "Primary SQL concept exercised, e.g. 'window-functions', 'recursive-cte', 'date-functions'." },
            business_context: { type: "string" },
            task: { type: "string" },
            expected_sql: { type: "string" },
          },
          required: ["question_id", "difficulty", "concept", "business_context", "task", "expected_sql"],
        },
      },
      required: ["schema_sql", "seed_data_sql", "erd_mermaid", "tables_description", "question"],
    },
  },
  EVALUATE_SUBMISSION: {
    name: "evaluate_submission",
    description: "Evaluate a user's SQL submission semantically.",
    parameters: {
      type: "object",
      properties: {
        is_correct: { type: "boolean" },
        is_syntax_error: { type: "boolean", description: "True if the user's SQL has a syntax error." },
        status_title: { type: "string", description: "Short result category, e.g. 'Correct', 'Wrong rows', 'Syntax error'." },
        feedback_message: { type: "string", description: "Mentor-style guidance." },
        performance_note: { type: "string", description: "Critique of query efficiency." },
        best_practice_tip: { type: "string", description: "Senior engineer advice." },
        mistake_tag: {
          type: "string",
          description: "Short kebab-case tag of the PRIMARY mistake when wrong, e.g. 'missing-join-condition', 'null-handling', 'wrong-aggregate', 'missing-group-by', 'wrong-window-frame', 'cartesian-product'. Empty string when correct.",
        },
        user_result_preview: {
          type: "string",
          description: "Markdown table (max ~10 rows) showing the result the user's SQL would actually return when mentally executed against the seed data. If syntax error, put 'Could not run: <reason>'.",
        },
        expected_result_preview: {
          type: "string",
          description: "Markdown table (max ~10 rows) showing the result the EXPECTED SQL returns against the seed data.",
        },
      },
      required: ["is_correct", "is_syntax_error", "status_title", "feedback_message", "performance_note", "best_practice_tip", "mistake_tag", "user_result_preview", "expected_result_preview"],
    },
  },
  DEBUG_QUERY: {
    name: "debug_query",
    description: "Explain a SQL syntax/runtime error educationally.",
    parameters: {
      type: "object",
      properties: {
        error_analysis: { type: "string" },
        educational_fix: { type: "string", description: "Explain the rule broken WITHOUT giving the full code." },
      },
      required: ["error_analysis", "educational_fix"],
    },
  },
  GET_HINT: {
    name: "get_hint",
    description: "Conceptual nudge without revealing the solution.",
    parameters: {
      type: "object",
      properties: { hint_text: { type: "string" } },
      required: ["hint_text"],
    },
  },
  REVEAL_SOLUTION: {
    name: "reveal_solution",
    description: "Reveal full solution with step-by-step explanation.",
    parameters: {
      type: "object",
      properties: {
        correct_sql: { type: "string" },
        explanation_steps: { type: "array", items: { type: "string" } },
      },
      required: ["correct_sql", "explanation_steps"],
    },
  },
  TEXT_TO_SQL: {
    name: "text_to_sql",
    description: "Translate NL question to MySQL plus EXPLAIN, BigQuery equivalent, and 3VL warning.",
    parameters: {
      type: "object",
      properties: {
        mysql_sql: { type: "string" },
        explain_plan: { type: "string", description: "Simulated EXPLAIN with index usage commentary." },
        bigquery_sql: { type: "string", description: "BigQuery Standard SQL equivalent." },
        three_valued_logic_warning: { type: "string", description: "Empty string if no 3VL trap." },
        notes: { type: "string" },
      },
      required: ["mysql_sql", "explain_plan", "bigquery_sql", "three_valued_logic_warning", "notes"],
    },
  },
  NEXT_QUESTION: {
    name: "next_question",
    description: "Generate the next adaptive question for the existing schema.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "object",
          properties: {
            question_id: { type: "number" },
            difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
            concept: { type: "string", description: "Primary SQL concept exercised." },
            business_context: { type: "string" },
            task: { type: "string" },
            expected_sql: { type: "string" },
          },
          required: ["question_id", "difficulty", "concept", "business_context", "task", "expected_sql"],
        },
      },
      required: ["question"],
    },
  },
  OPTIMIZE_QUERY: {
    name: "optimize_query",
    description: "Analyse user's SQL and return an optimized version with reasoning.",
    parameters: {
      type: "object",
      properties: {
        optimized_sql: { type: "string", description: "Best-practice optimized MySQL 8.0 rewrite of the user's query." },
        improvements: {
          type: "array",
          items: { type: "string" },
          description: "Specific optimizations applied (index use, join order, sargable predicates, subquery → join, etc.).",
        },
        estimated_gain: { type: "string", description: "Plain-English perf estimate, e.g. '~10x on 1M rows via index seek'." },
        explain_diff: { type: "string", description: "Short EXPLAIN-plan style before/after comparison." },
      },
      required: ["optimized_sql", "improvements", "estimated_gain", "explain_diff"],
    },
  },
  VISUALIZE_QUERY: {
    name: "visualize_query",
    description: "Break a SQL query into ordered execution stages for an animated pipeline visualization (Log2Base2 style).",
    parameters: {
      type: "object",
      properties: {
        logical_order: {
          type: "array",
          description: "Ordered SQL execution stages (FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT). Only include stages present.",
          items: {
            type: "object",
            properties: {
              step: { type: "number" },
              clause: { type: "string", description: "FROM, JOIN, WHERE, GROUP BY, HAVING, SELECT, WINDOW, ORDER BY, LIMIT" },
              operation: { type: "string", description: "Short technical label, e.g. 'Index seek on orders.customer_id'." },
              explanation: { type: "string", description: "Plain-English description of what this stage does (1-2 sentences, mentor tone)." },
              narration: { type: "string", description: "One-line present-tense narration ('We grab all rows from orders…')." },
              rows_in: { type: "string", description: "Approx rows entering." },
              rows_out: { type: "string", description: "Approx rows leaving." },
              columns: {
                type: "array",
                items: { type: "string" },
                description: "Column names visible AFTER this stage (use real column names from schema).",
              },
              sample_rows: {
                type: "array",
                description: "3-5 representative output rows AFTER this stage. Each row = array of cell strings in same order as columns.",
                items: { type: "array", items: { type: "string" } },
              },
              highlight: {
                type: "string",
                description: "Short callout of what changed vs previous stage: 'filtered out 4 rows', 'joined 2 tables', 'grouped into 3 buckets'.",
              },
            },
            required: ["step", "clause", "operation", "explanation", "narration", "rows_in", "rows_out", "columns", "sample_rows", "highlight"],
          },
        },
        mermaid_flow: {
          type: "string",
          description: "A mermaid `flowchart TD` block (no fences) — each node is a stage with clause + rows.",
        },
        summary: { type: "string", description: "1-2 sentence plain-English summary." },
      },
      required: ["logical_order", "mermaid_flow", "summary"],
    },
  },
  PLAN_FOCUS: {
    name: "plan_focus",
    description: "Interpret a student's free-text learning goal and build a focused MySQL practice plan covering it end-to-end.",
    parameters: {
      type: "object",
      properties: {
        focus_title: { type: "string", description: "Short label of what we will drill, e.g. 'MySQL Basics' or 'JOIN Mastery'." },
        difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"], description: "Infer from the goal: 'basics'→beginner, 'professional'/'master'/'advanced'→advanced, else intermediate." },
        concepts: {
          type: "array",
          items: { type: "string" },
          description: "ORDERED list (5-15) of kebab-case MySQL concepts that FULLY cover the goal from foundational to advanced.",
        },
        domain_prompt: { type: "string", description: "One paragraph that biases schema + question generation toward this focus area (used as the practice topic)." },
        intro: { type: "string", description: "One friendly sentence telling the student what this session will cover." },
      },
      required: ["focus_title", "difficulty", "concepts", "domain_prompt", "intro"],
    },
  },
  ANALYZE_SESSION: {
    name: "analyze_session",
    description: "Analyse a student's focused practice session and report strengths, weaknesses and a readiness verdict.",
    parameters: {
      type: "object",
      properties: {
        overall_summary: { type: "string", description: "2-3 sentence plain-English summary of how the session went." },
        accuracy_note: { type: "string", description: "Short note on overall accuracy." },
        strengths: {
          type: "array",
          items: {
            type: "object",
            properties: {
              concept: { type: "string" },
              note: { type: "string", description: "Why this is a strength." },
            },
            required: ["concept", "note"],
          },
        },
        weaknesses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              concept: { type: "string" },
              note: { type: "string", description: "What went wrong (reference mistake tags)." },
              fix: { type: "string", description: "Concrete mentor advice to improve." },
            },
            required: ["concept", "note", "fix"],
          },
        },
        recommendation: { type: "string", description: "What to practice next." },
        verdict: { type: "string", description: "Clear readiness verdict, e.g. 'Solid on basics — ready to move on' or 'Keep practicing ALTER TABLE'." },
      },
      required: ["overall_summary", "accuracy_note", "strengths", "weaknesses", "recommendation", "verdict"],
    },
  },
  EXPLAIN_THEORY: {
    name: "explain_theory",
    description: "Produce an in-depth SQL theory explanation tailored to a specific practice question.",
    parameters: {
      type: "object",
      properties: {
        theory_markdown: {
          type: "string",
          description: "Markdown theory guide with sections for concept overview, syntax, mapping to this task, step-by-step approach, pitfalls, and related concepts. Never include the final answer SQL.",
        },
      },
      required: ["theory_markdown"],
    },
  },
};


function buildUserPrompt(command: string, payload: any): string {
  switch (command) {
    case "INIT_ENVIRONMENT":
      return `Topic: ${payload.topic}
Difficulty: ${payload.difficulty}
Target concept for first question: ${payload.target_concept || "auto-pick a fundamental for this difficulty"}

Build a SQL practice environment:
- 2-4 related tables, realistic columns, FKs.
- 8-12 seed rows per table covering edge cases (NULLs, duplicates, dates spanning months).
- erd_mermaid: MUST start with the literal line "erDiagram" (no code fences, no backticks, no "graph"). Use the form: TABLE_A ||--o{ TABLE_B : "label". Each table block uses UPPERCASE name and lines like "    int id PK".
- First question matches difficulty AND exercises the target concept. Set question.concept to a short kebab-case tag.`;
    case "TEXT_TO_SQL":
      return `Schema:
${payload.schema_sql}

User question (natural language): ${payload.nl_question}

Translate to optimized MySQL 8.0. Also produce: a simulated EXPLAIN plan (mention which indexes are used or missing), a Google BigQuery Standard SQL equivalent, and if the SQL contains "NOT IN" with a subquery/list that could yield NULL, set three_valued_logic_warning to a clear explanation of the 3VL trap (otherwise empty string).`;
    case "EVALUATE_SUBMISSION":
      return `Schema:
${payload.schema_sql}

Seed data (sample):
${payload.seed_data_sql}

Task: ${payload.task}
Expected SQL: ${payload.expected_sql}
User SQL: ${payload.user_sql}

Mentally execute both against the seed data. Compare result sets (rows, columns, ordering when required). If user SQL has a syntax/parsing error, set is_syntax_error=true and is_correct=false. Even when correct, critique performance vs the expected approach.

ALWAYS fill user_result_preview and expected_result_preview as GitHub-flavored markdown tables of the result rows (cap each at 10 rows; include header row). If the user's SQL has a syntax/runtime error, set user_result_preview to "Could not run: <one-line reason>" instead of a table.`;
    case "DEBUG_QUERY":
      return `Schema:
${payload.schema_sql}

User SQL:
${payload.user_sql}

${payload.db_execution_error ? `Reported error: ${payload.db_execution_error}` : "Identify the syntax error yourself."}

Pinpoint the exact keyword/character causing the issue and explain the rule. Do NOT write the corrected query.`;
    case "GET_HINT":
      return `Task: ${payload.task}
User attempt:
${payload.user_attempt_sql || "(empty)"}

Give one conceptual nudge (which clause/function/concept to think about). Do not reveal the solution.`;
    case "REVEAL_SOLUTION":
      return `Expected SQL:
${payload.expected_sql}

Return it as correct_sql and 3-6 numbered explanation_steps that walk through the logic.`;
    case "NEXT_QUESTION":
      return `Schema context:
${payload.schema_context}

Previously asked question IDs (do NOT repeat): ${JSON.stringify(payload.previous_question_ids || [])}
Concepts already covered (PICK A DIFFERENT ONE): ${JSON.stringify(payload.covered_concepts || [])}
Weak concepts (REINFORCE — naturally weave one of these in if it overlaps the target): ${JSON.stringify(payload.weak_concepts || [])}
Target difficulty: ${payload.target_difficulty}
Target concept for THIS question: ${payload.target_concept || "auto-pick an uncovered concept"}

Produce a new MySQL 8.0 question on the same schema. question_id > max previous id.
INFINITE DIVERSITY MANDATE: never reuse phrasing or sentence structure from previous questions; rotate the scenario domain (sales, logistics, IoT, finance, healthcare, gaming…) and the analytical pattern (top-N, ranking, running total, gap-and-island, duplicates, missing values, pivot, etc.). Set question.concept to a short kebab-case tag.`;
    case "OPTIMIZE_QUERY":
      return `Schema:
${payload.schema_sql}

User SQL:
${payload.user_sql}

${payload.task ? `Task being solved: ${payload.task}` : ""}

Rewrite the user's query as a Senior DBA would. Apply: sargable predicates, correct join order, index-friendly filters, replace correlated subqueries with joins/CTEs/window functions where it helps, remove SELECT *, push aggregates, eliminate redundant DISTINCT/ORDER BY, use EXISTS over IN with NULLs. Keep semantics identical. Return optimized_sql plus a concrete improvements list, estimated perf gain, and a short before/after EXPLAIN sketch.`;
    case "VISUALIZE_QUERY":
      return `Schema:
${payload.schema_sql}

User SQL:
${payload.user_sql}

Decompose into the LOGICAL execution order (FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT/WINDOW → ORDER BY → LIMIT). For EACH stage present:
- operation: concrete technical label
- explanation: mentor-style 1-2 sentences
- narration: one present-tense line, very short, like a teacher saying it out loud
- rows_in / rows_out: realistic approximate counts
- columns: actual column names visible AFTER this stage
- sample_rows: 3-5 representative rows AFTER this stage (cells as strings, in column order). Invent plausible values consistent with the schema. Show how the dataset literally transforms (e.g. WHERE drops rows, GROUP BY collapses into buckets, SELECT projects fewer columns, ORDER BY reorders).
- highlight: short callout of what changed visually from the previous stage

Then emit a mermaid \`flowchart TD\` (NO code fences) — node label: "STEP. CLAUSE\\nrows: in→out", connect with --> arrows, <=12 nodes.
Also write a 1-2 sentence summary.`;
    case "PLAN_FOCUS":
      return `Student's free-text learning goal: "${payload.goal}"

Interpret this goal and produce a focused MySQL practice plan:
- focus_title: short label of what we'll drill.
- difficulty: infer from the goal ("basics"/"fundamentals" → beginner; "professional"/"master"/"advanced"/"expert" → advanced; otherwise intermediate).
- concepts: an ORDERED list (5-15) of specific kebab-case MySQL concepts that FULLY cover this goal from foundational to advanced. If the goal is about "basics", cover ALL fundamentals (create-table, data-types, insert-basic, select-where, order-limit, distinct, basic-aggregates, group-by, having, inner-join, left-join, update-basic, delete-basic, alter-table, etc.). If it's about joins, cover every join type and pattern (inner-join, left-join, right-join, self-join, cross-join, multi-join, anti-join, non-equi-join). Always tailor to the goal.
- domain_prompt: one paragraph instruction that biases schema + question generation toward this focus area.
- intro: one friendly sentence telling the student what this session will cover.`;
    case "ANALYZE_SESSION":
      return `The student just finished a focused MySQL practice session.
Session goal: "${payload.goal}"

Per-concept stats (tries / correct / accuracy / mistake tags):
${JSON.stringify(payload.stats)}

Raw attempts (concept, correct, mistake tag, in order):
${JSON.stringify(payload.attempts)}

Analyze their performance. Identify which concepts they are strong at and which they struggle with (use the mistake tags and accuracy). Give concrete, mentor-style advice for each weak area, then a clear verdict on whether they've mastered the goal or should keep practicing.`;
    case "EXPLAIN_THEORY":
      return `Practice question task: ${payload.task}
Primary concept: ${payload.concept || "auto — infer the dominant SQL concept from the task"}
Difficulty: ${payload.difficulty || "n/a"}
Schema (may be empty):
${payload.schema_sql || "(no schema provided)"}

Write an IN-DEPTH SQL theory guide in Markdown that is directly relevant to the question above. Structure:

### 1. Concept overview
What the concept is, why it exists, and when a data engineer reaches for it.

### 2. MySQL syntax
The canonical MySQL 8 syntax with a small illustrative snippet inside a \`\`\`sql fenced block.

### 3. How this question uses it
Relate the concept to the ACTUAL tables/columns in the schema and the specific task. Explain what part of the problem forces this concept.

### 4. Step-by-step approach
Numbered mental model for solving THIS question. Describe the pipeline (which clause runs, what set it produces) WITHOUT writing the final answer SQL.

### 5. Common pitfalls
Bullet list of the traps students hit on this pattern (NULLs, duplicates, join direction, group scope, window frame, etc.).

### 6. Related concepts
2–4 adjacent concepts worth knowing next.

Rules:
- Keep it dense but readable. Short paragraphs, bullets, small \`sql\` snippets.
- Never reveal the full solution SQL. Illustrative snippets should show the technique on a DIFFERENT toy example, not the exact answer.`;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

const DIFFICULTY = z.enum(["beginner", "intermediate", "advanced"]);
const shortStr = (n: number) => z.string().max(n);

const PayloadSchemas = {
  INIT_ENVIRONMENT: z.object({
    topic: shortStr(2_000),
    difficulty: DIFFICULTY,
    target_concept: shortStr(100).optional(),
  }),
  EVALUATE_SUBMISSION: z.object({
    schema_sql: shortStr(50_000),
    seed_data_sql: shortStr(100_000),
    task: shortStr(2_000),
    expected_sql: shortStr(10_000),
    user_sql: shortStr(10_000),
  }),
  DEBUG_QUERY: z.object({
    schema_sql: shortStr(50_000),
    user_sql: shortStr(10_000),
    db_execution_error: shortStr(5_000).optional(),
  }),
  GET_HINT: z.object({
    task: shortStr(2_000),
    user_attempt_sql: shortStr(10_000).optional(),
  }),
  REVEAL_SOLUTION: z.object({
    expected_sql: shortStr(10_000),
  }),
  NEXT_QUESTION: z.object({
    schema_context: shortStr(60_000),
    previous_question_ids: z.array(z.number()).max(500).optional(),
    covered_concepts: z.array(shortStr(100)).max(200).optional(),
    weak_concepts: z.array(shortStr(120)).max(20).optional(),
    target_difficulty: DIFFICULTY,
    target_concept: shortStr(100).optional(),
  }),
  TEXT_TO_SQL: z.object({
    schema_sql: shortStr(50_000),
    nl_question: shortStr(2_000),
  }),
  OPTIMIZE_QUERY: z.object({
    schema_sql: shortStr(50_000),
    user_sql: shortStr(10_000),
    task: shortStr(2_000).optional(),
  }),
  VISUALIZE_QUERY: z.object({
    schema_sql: shortStr(50_000),
    user_sql: shortStr(10_000),
  }),
  // Server-only commands (driven by planFocus / analyzeFocus, never called directly from the client).
  PLAN_FOCUS: z.object({
    goal: shortStr(2_000),
  }),
  ANALYZE_SESSION: z.object({
    goal: shortStr(2_000),
    stats: z.any(),
    attempts: z.any(),
  }),
  EXPLAIN_THEORY: z.object({
    task: shortStr(2_000),
    concept: shortStr(200).optional(),
    difficulty: shortStr(50).optional(),
    schema_sql: shortStr(50_000).optional(),
  }),
} as const;

const InputSchema = z
  .object({
    command: z.enum([
      "INIT_ENVIRONMENT",
      "EVALUATE_SUBMISSION",
      "DEBUG_QUERY",
      "GET_HINT",
      "REVEAL_SOLUTION",
      "NEXT_QUESTION",
      "TEXT_TO_SQL",
      "OPTIMIZE_QUERY",
      "VISUALIZE_QUERY",
      "EXPLAIN_THEORY",
    ]),
    payload: z.unknown(),
  })
  .transform((v, ctx) => {
    const schema = PayloadSchemas[v.command];
    const parsed = schema.safeParse(v.payload);
    if (!parsed.success) {
      parsed.error.issues.forEach((i) =>
        ctx.addIssue({ ...i, path: ["payload", ...i.path] })
      );
      return z.NEVER;
    }
    return { command: v.command, payload: parsed.data };
  });

// Server-only helper used by both runSqlEngine and trusted server functions
// (e.g. logAttempt) to call the AI gateway directly. NEVER call from client.
export async function callEngineCommand(
  command: keyof typeof PayloadSchemas,
  payload: any,
): Promise<{ data?: any; error?: string }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { error: "LOVABLE_API_KEY is not configured." };

  const tool = TOOLS_BY_COMMAND[command];
  const userPrompt = buildUserPrompt(command, payload);

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    tools: [{ type: "function", function: tool }],
    tool_choice: { type: "function", function: { name: tool.name } },
  };

  let resp: Response;
  try {
    resp = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("AI gateway fetch failed", e);
    return { error: "Could not reach the AI gateway. Please try again." };
  }

  if (resp.status === 429) return { error: "Rate limit reached. Please wait a moment and try again." };
  if (resp.status === 402) return { error: "AI credits exhausted. Add credits in Workspace → Usage." };
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error("AI gateway error", resp.status, text);
    return { error: `AI gateway error (${resp.status}).` };
  }

  const json: any = await resp.json();
  const argsStr = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!argsStr) {
    console.error("No tool call in response", JSON.stringify(json).slice(0, 800));
    return { error: "AI did not return structured output. Try again." };
  }
  try {
    return { data: JSON.parse(argsStr) };
  } catch {
    console.error("Failed to parse tool args", argsStr.slice(0, 500));
    return { error: "AI returned malformed JSON. Try again." };
  }
}

export const runSqlEngine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => callEngineCommand(data.command as any, data.payload));

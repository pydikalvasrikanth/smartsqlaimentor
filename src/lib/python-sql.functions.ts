import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM_PROMPT = `You are a Senior Data Engineer who teaches BOTH MySQL and Python (pandas).
You help students solve the SAME analytical problem in Python after they've seen the SQL version.

Conventions for all Python answers:
- Use pandas (import pandas as pd, import numpy as np). Assume each table from the schema is already
  loaded as a DataFrame whose variable name is the lowercase table name (e.g. customers, orders, order_items).
- Show clean, idiomatic pandas. Prefer .merge, .groupby, .assign, .query, .sort_values, .rank, .transform,
  .cumsum, .shift, .drop_duplicates, .pivot_table, np.where, etc. Mention NaN vs SQL NULL when relevant.
- Always reply by calling the supplied tool — never plain text.`;

const TOOLS: Record<string, any> = {
  CONVERT_TO_PYTHON: {
    name: "convert_to_python",
    description: "Convert a MySQL practice task into the equivalent pandas/Python task with starter code.",
    parameters: {
      type: "object",
      properties: {
        python_task: { type: "string", description: "The SAME problem reframed in pandas terms. Mention the DataFrame variable names and the expected output shape." },
        dataframe_setup: { type: "string", description: "Python code block that builds the DataFrames from the seed data (df = pd.DataFrame({...})) so the user can mentally run it. Include all tables." },
        starter_code: { type: "string", description: "Python starter the user should edit. Includes imports, the dataframe_setup, and a TODO with the result variable named `result`." },
        expected_python: { type: "string", description: "Reference pandas solution producing the correct `result` DataFrame/Series. Keep it idiomatic." },
        is_runnable: { type: "boolean", description: "False when the SQL task is DDL/DML/INDEX/EXPLAIN/transaction/trigger and doesn't translate to a runnable pandas query." },
        not_runnable_reason: { type: "string", description: "If is_runnable=false, one sentence explaining what the SQL does and why pandas doesn't model it the same way. Empty otherwise." },
      },
      required: ["python_task", "dataframe_setup", "starter_code", "expected_python", "is_runnable", "not_runnable_reason"],
    },
  },
  EVALUATE_PYTHON: {
    name: "evaluate_python",
    description: "Semantically evaluate a user's pandas solution against the expected solution.",
    parameters: {
      type: "object",
      properties: {
        is_correct: { type: "boolean" },
        is_syntax_error: { type: "boolean" },
        status_title: { type: "string" },
        feedback_message: { type: "string", description: "Mentor-style guidance referencing pandas APIs." },
        mistake_tag: { type: "string", description: "Short kebab-case tag of the primary mistake when wrong. Empty when correct." },
        user_result_preview: { type: "string", description: "Markdown table of the result the user's code would produce (max 10 rows). 'Could not run: <reason>' on syntax error." },
        expected_result_preview: { type: "string", description: "Markdown table of the expected result (max 10 rows)." },
        best_practice_tip: { type: "string", description: "One pandas best-practice nudge." },
      },
      required: ["is_correct", "is_syntax_error", "status_title", "feedback_message", "mistake_tag", "user_result_preview", "expected_result_preview", "best_practice_tip"],
    },
  },
  HINT_PYTHON: {
    name: "hint_python",
    description: "Conceptual nudge for the pandas problem.",
    parameters: {
      type: "object",
      properties: {
        hint_text: { type: "string", description: "Single nudge, no full solution." },
        suggested_apis: { type: "array", items: { type: "string" }, description: "2-4 pandas APIs to look up (e.g. ['groupby', 'transform', 'rank'])." },
      },
      required: ["hint_text", "suggested_apis"],
    },
  },
  REVEAL_PYTHON: {
    name: "reveal_python",
    description: "Reveal the pandas solution with a numbered step-by-step explanation that maps to the SQL clauses.",
    parameters: {
      type: "object",
      properties: {
        full_solution: { type: "string", description: "Complete pandas code block producing `result`." },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Short label, e.g. 'Filter completed orders (WHERE)'." },
              code: { type: "string", description: "The pandas code for THIS step (1-3 lines)." },
              explanation: { type: "string", description: "Plain-English why, and the SQL clause it maps to." },
            },
            required: ["title", "code", "explanation"],
          },
        },
      },
      required: ["full_solution", "steps"],
    },
  },
  COMPARE_SQL_PYTHON: {
    name: "compare_sql_python",
    description: "Produce a side-by-side mapping between the canonical MySQL solution and the pandas solution.",
    parameters: {
      type: "object",
      properties: {
        mapping: {
          type: "array",
          items: {
            type: "object",
            properties: {
              sql_snippet: { type: "string" },
              python_snippet: { type: "string" },
              note: { type: "string", description: "Short explanation of what this row does and any difference (NULL vs NaN, ordering, types, performance)." },
            },
            required: ["sql_snippet", "python_snippet", "note"],
          },
        },
        key_differences: {
          type: "array",
          items: { type: "string" },
          description: "3-6 conceptual differences between MySQL and pandas for this problem (NULL/NaN, set vs row semantics, ordering, performance, type coercion, etc.).",
        },
        when_to_use_which: { type: "string", description: "One-paragraph guidance on when SQL beats pandas and vice-versa for this kind of task." },
      },
      required: ["mapping", "key_differences", "when_to_use_which"],
    },
  },
};

function buildPrompt(command: string, payload: any): string {
  switch (command) {
    case "CONVERT_TO_PYTHON":
      return `Schema (MySQL):
${payload.schema_sql}

Seed data:
${payload.seed_data_sql}

SQL task: ${payload.sql_task}
Canonical SQL solution:
${payload.expected_sql}

Re-frame this exact problem as a pandas exercise. Assume each table is already a DataFrame named after the lowercase table. Build a dataframe_setup block from the seed data, a starter_code block (imports + setup + TODO line "result = ..."), and the reference pandas solution. If the SQL is DDL/DML/INDEX/EXPLAIN/transaction/trigger and has no clean pandas equivalent, set is_runnable=false and explain in not_runnable_reason.`;
    case "EVALUATE_PYTHON":
      return `Python task: ${payload.python_task}

Dataframe setup:
${payload.dataframe_setup}

Expected solution:
${payload.expected_python}

User submission:
${payload.user_python}

Mentally execute both against the dataframe_setup. Compare result rows, columns, ordering when required. If the user's code has a syntax/runtime issue, set is_syntax_error=true, is_correct=false, and put 'Could not run: <reason>' in user_result_preview. Always fill expected_result_preview as a markdown table (cap 10 rows).`;
    case "HINT_PYTHON":
      return `Python task: ${payload.python_task}
User attempt:
${payload.user_python || "(empty)"}

Give one conceptual nudge plus 2-4 pandas APIs to read about. Do not write the solution.`;
    case "REVEAL_PYTHON":
      return `Python task: ${payload.python_task}
Reference solution:
${payload.expected_python}

Walk through it as 3-7 ordered steps. For each step, give a short title that names the SQL clause it mirrors (e.g. 'Join (SQL JOIN → pd.merge)'), the small code snippet, and a plain-English explanation. Then emit the full_solution as the complete code block.`;
    case "COMPARE_SQL_PYTHON":
      return `SQL task: ${payload.sql_task}
Canonical SQL:
${payload.expected_sql}

Equivalent pandas:
${payload.expected_python}

Build a row-by-row mapping table comparing each SQL clause to its pandas equivalent. Then list 3-6 key conceptual differences (NULL vs NaN, set vs sequential semantics, ordering stability, performance, type handling), and a short paragraph on when to prefer SQL vs pandas for this kind of problem.`;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

const shortStr = (n: number) => z.string().max(n);

const PayloadSchemas = {
  CONVERT_TO_PYTHON: z.object({
    schema_sql: shortStr(50_000),
    seed_data_sql: shortStr(100_000),
    sql_task: shortStr(4_000),
    expected_sql: shortStr(10_000).optional().default(""),
  }),
  EVALUATE_PYTHON: z.object({
    python_task: shortStr(4_000),
    dataframe_setup: shortStr(50_000),
    expected_python: shortStr(20_000),
    user_python: shortStr(20_000),
  }),
  HINT_PYTHON: z.object({
    python_task: shortStr(4_000),
    user_python: shortStr(20_000).optional().default(""),
  }),
  REVEAL_PYTHON: z.object({
    python_task: shortStr(4_000),
    expected_python: shortStr(20_000),
  }),
  COMPARE_SQL_PYTHON: z.object({
    sql_task: shortStr(4_000),
    expected_sql: shortStr(10_000),
    expected_python: shortStr(20_000),
  }),
} as const;

const InputSchema = z
  .object({
    command: z.enum([
      "CONVERT_TO_PYTHON",
      "EVALUATE_PYTHON",
      "HINT_PYTHON",
      "REVEAL_PYTHON",
      "COMPARE_SQL_PYTHON",
    ]),
    payload: z.unknown(),
  })
  .transform((v, ctx) => {
    const schema = PayloadSchemas[v.command];
    const parsed = schema.safeParse(v.payload);
    if (!parsed.success) {
      parsed.error.issues.forEach((i) => ctx.addIssue({ ...i, path: ["payload", ...i.path] }));
      return z.NEVER;
    }
    return { command: v.command, payload: parsed.data };
  });

async function callPythonCommand(command: keyof typeof PayloadSchemas, payload: any) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { error: "LOVABLE_API_KEY is not configured." };

  const tool = TOOLS[command];
  const userPrompt = buildPrompt(command, payload);
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
    console.error("AI gateway fetch failed (python)", e);
    return { error: "Could not reach the AI gateway. Please try again." };
  }

  if (resp.status === 429) return { error: "Rate limit reached. Please wait a moment and try again." };
  if (resp.status === 402) return { error: "AI credits exhausted. Add credits in Workspace → Usage." };
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error("AI gateway error (python)", resp.status, text);
    return { error: `AI gateway error (${resp.status}).` };
  }

  const json: any = await resp.json();
  const argsStr = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!argsStr) return { error: "AI did not return structured output. Try again." };
  try {
    return { data: JSON.parse(argsStr) };
  } catch {
    return { error: "AI returned malformed JSON. Try again." };
  }
}

export const runPythonFromSql = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => callPythonCommand(data.command as any, data.payload));
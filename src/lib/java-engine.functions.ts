import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM_PROMPT = `You are a Senior Java Engineer + interview mentor.
You generate realistic Java coding interview questions (FAANG/MNC style) and grade user solutions semantically by mentally executing the code against the test cases (no real sandbox). Be terse, precise, and always reply by calling the supplied tool with valid arguments.

Cover the full Java landscape across a session: data structures (list, dict, set, tuple, deque, heap), strings, recursion, two-pointers, sliding window, hashing, sorting, binary search, stacks/queues, trees, graphs, DP, greedy, bit manipulation, OOP/dataclasses, decorators, generators/iterators, comprehensions, itertools/collections, file I/O, regex, exception handling, type hints, pandas basics, numpy basics, async/await.

Difficulty rules — beginner: single concept, ~5-10 lines; intermediate: multi-concept, 10-25 lines, edge cases; advanced: optimized algo, 20+ lines, time/space analysis required.

When target_concept is provided, the question MUST exercise that concept as its primary teaching point.`;

const TOOLS_BY_COMMAND: Record<string, any> = {
  INIT_JAVA_ENVIRONMENT: {
    name: "init_java_environment",
    description: "Generate a complete Java practice question with starter code and tests.",
    parameters: {
      type: "object",
      properties: {
        topic_description: { type: "string", description: "Brief context for the question theme." },
        question: {
          type: "object",
          properties: {
            question_id: { type: "number" },
            difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
            concept: { type: "string" },
            business_context: { type: "string" },
            task: { type: "string", description: "Clear problem statement with input/output spec." },
            function_signature: { type: "string", description: "e.g. def two_sum(nums: list[int], target: int) -> list[int]:" },
            starter_code: { type: "string", description: "Function skeleton with pass." },
            test_cases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  input_repr: { type: "string", description: "Java literal repr of the call args." },
                  expected_repr: { type: "string", description: "Java literal repr of expected output." },
                  explanation: { type: "string" },
                },
                required: ["input_repr", "expected_repr"],
              },
            },
            expected_solution: { type: "string", description: "Reference Java solution." },
            time_complexity: { type: "string" },
            space_complexity: { type: "string" },
          },
          required: ["question_id", "difficulty", "task", "function_signature", "starter_code", "test_cases", "expected_solution"],
        },
      },
      required: ["question"],
    },
  },
  NEXT_JAVA_QUESTION: {
    name: "next_java_question",
    description: "Generate the next Java question, avoiding repeats.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "object",
          properties: {
            question_id: { type: "number" },
            difficulty: { type: "string" },
            concept: { type: "string" },
            business_context: { type: "string" },
            task: { type: "string" },
            function_signature: { type: "string" },
            starter_code: { type: "string" },
            test_cases: { type: "array", items: { type: "object" } },
            expected_solution: { type: "string" },
            time_complexity: { type: "string" },
            space_complexity: { type: "string" },
          },
          required: ["question_id", "difficulty", "task", "function_signature", "starter_code", "test_cases", "expected_solution"],
        },
      },
      required: ["question"],
    },
  },
  EVALUATE_JAVA: {
    name: "evaluate_java",
    description: "Mentally run user code against test cases and grade.",
    parameters: {
      type: "object",
      properties: {
        is_correct: { type: "boolean" },
        passed: { type: "number" },
        total: { type: "number" },
        per_test: {
          type: "array",
          items: {
            type: "object",
            properties: {
              input_repr: { type: "string" },
              expected_repr: { type: "string" },
              actual_repr: { type: "string" },
              passed: { type: "boolean" },
              note: { type: "string" },
            },
          },
        },
        mistake_tag: { type: "string", description: "short slug: off-by-one, wrong-edge, complexity, etc." },
        explanation: { type: "string" },
        improvements: { type: "array", items: { type: "string" } },
      },
      required: ["is_correct", "passed", "total", "explanation"],
    },
  },
  JAVA_HINT: {
    name: "java_hint",
    description: "Give a single Socratic hint without revealing the solution.",
    parameters: {
      type: "object",
      properties: {
        hint: { type: "string" },
        leading_question: { type: "string" },
      },
      required: ["hint"],
    },
  },
  REVEAL_JAVA_SOLUTION: {
    name: "reveal_java_solution",
    description: "Reveal solution with line-by-line walkthrough.",
    parameters: {
      type: "object",
      properties: {
        solution: { type: "string" },
        walkthrough: { type: "string" },
        time_complexity: { type: "string" },
        space_complexity: { type: "string" },
      },
      required: ["solution", "walkthrough"],
    },
  },
  JAVA_DEBUG: {
    name: "java_debug",
    description: "Identify the bug in user code and educate without giving full solution.",
    parameters: {
      type: "object",
      properties: {
        error_analysis: { type: "string", description: "What's wrong, in plain English." },
        suspected_line: { type: "string" },
        educational_fix: { type: "string", description: "Concept they need to apply." },
      },
      required: ["error_analysis", "educational_fix"],
    },
  },
  JAVA_VISUALIZE: {
    name: "java_visualize",
    description: "Trace execution step by step for a sample input.",
    parameters: {
      type: "object",
      properties: {
        sample_input: { type: "string" },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              line: { type: "string", description: "Code line being executed." },
              action: { type: "string", description: "What happens conceptually." },
              state: { type: "string", description: "Key variable values after this step." },
            },
            required: ["line", "action", "state"],
          },
        },
        final_output: { type: "string" },
        summary: { type: "string" },
      },
      required: ["steps", "summary"],
    },
  },
  JAVA_OPTIMIZE: {
    name: "java_optimize",
    description: "Senior-engineer review: cleaner / faster idiomatic rewrite.",
    parameters: {
      type: "object",
      properties: {
        optimized_code: { type: "string" },
        improvements: { type: "array", items: { type: "string" } },
        time_complexity_before: { type: "string" },
        time_complexity_after: { type: "string" },
        idiomatic_notes: { type: "string" },
      },
      required: ["optimized_code", "improvements"],
    },
  },
  JAVA_THEORY: {
    name: "java_theory",
    description: "Produce an in-depth Java theory guide tailored to a specific practice question.",
    parameters: {
      type: "object",
      properties: {
        theory_markdown: {
          type: "string",
          description: "Markdown theory guide with concept overview, syntax, mapping to the task, mental model, animated mermaid flow, worked mini-example, pitfalls and related concepts. Never reveal the final solution code.",
        },
      },
      required: ["theory_markdown"],
    },
  },
  JAVA_TO_SQL: {
    name: "java_to_sql",
    description: "Reframe the same problem as SQL and provide a MySQL 8 solution.",
    parameters: {
      type: "object",
      properties: {
        schema_ddl: { type: "string", description: "CREATE TABLE(s) needed to model the same problem in SQL." },
        sample_seed: { type: "string", description: "A few INSERT statements matching the Java test cases so the SQL is directly verifiable." },
        sql_solution: { type: "string", description: "MySQL 8 query (or short script) that solves the same task the Java function solves." },
        walkthrough: { type: "string", description: "Line-by-line explanation of the SQL solution and the mapping from Java logic to SQL semantics." },
        java_vs_sql: { type: "string", description: "Short comparison — when each approach is more idiomatic." },
      },
      required: ["schema_ddl", "sql_solution", "walkthrough"],
    },
  },
};

function buildUserPrompt(command: string, payload: any): string {
  switch (command) {
    case "INIT_JAVA_ENVIRONMENT":
      return `Generate a Java interview question.\nDifficulty: ${payload.difficulty}\nTarget concept: ${payload.target_concept}\nContext theme: ${payload.topic || "general"}${payload.company ? `\nCompany style: write a question in the style commonly asked at ${payload.company} (FAANG/MNC interview rounds). Use a realistic ${payload.company}-flavoured business_context.` : ""}`;
    case "NEXT_JAVA_QUESTION":
      return `Generate the next Java question.\nDifficulty: ${payload.target_difficulty}\nTarget concept: ${payload.target_concept}\nAlready covered concepts (avoid same teaching point): ${(payload.covered_concepts || []).join(", ")}\nAlready asked IDs: ${(payload.previous_question_ids || []).join(", ")}${payload.company ? `\nCompany style: ${payload.company}-style interview question.` : ""}`;
    case "EVALUATE_JAVA":
      return `Question task:\n${payload.task}\n\nReference solution:\n${payload.expected_solution}\n\nTest cases:\n${JSON.stringify(payload.test_cases)}\n\nUser code:\n${payload.user_code}\n\nMentally execute the user's code against each test case. Compare actual vs expected. Grade fairly.`;
    case "JAVA_HINT":
      return `Task:\n${payload.task}\n\nUser current code:\n${payload.user_code}\n\nGive ONE Socratic hint.`;
    case "REVEAL_JAVA_SOLUTION":
      return `Task:\n${payload.task}\n\nReference solution:\n${payload.expected_solution}\n\nProvide the solution with a clear line-by-line walkthrough.`;
    case "JAVA_DEBUG":
      return `Task:\n${payload.task}\n\nUser code:\n${payload.user_code}\n\nIdentify the bug. Do NOT give the full solution — just explain what's wrong and the concept to apply.`;
    case "JAVA_VISUALIZE":
      return `Task:\n${payload.task}\n\nCode to trace:\n${payload.user_code}\n\nMentally execute the code on a representative sample input. Return concise step-by-step trace (max 12 steps) showing line, action, and the state of key variables.`;
    case "JAVA_OPTIMIZE":
      return `Task:\n${payload.task}\n\nUser code:\n${payload.user_code}\n\nReference:\n${payload.expected_solution}\n\nAct as a senior Java engineer reviewing this code. Provide a cleaner / more idiomatic / faster version with improvements list and complexity comparison.`;
    case "JAVA_THEORY":
      return `Practice question task: ${payload.task}
Primary concept: ${payload.concept || "auto — infer the dominant Java concept from the task"}
Difficulty: ${payload.difficulty || "n/a"}

Write an IN-DEPTH Java theory guide in Markdown that is directly relevant to the question above. Structure:

### 1. Concept overview
What the concept is, why Java offers it, and when engineers reach for it.

### 2. Java syntax
Canonical Java 3 syntax with a small illustrative snippet inside a \`\`\`java fenced block.

### 3. How this question uses it
Relate the concept to the SPECIFIC task above. Explain which part of the problem forces this pattern.

### 4. Step-by-step approach
Numbered mental model for solving THIS question — describe the algorithm as prose/pseudocode WITHOUT writing the final answer.

### 5. Visual flow (animated)
Emit ONE mermaid \`flowchart LR\` block (fenced with triple backticks and the language \`mermaid\`) showing how data moves through the algorithm for THIS task. 5–8 nodes max. Each node label is short: "STEP\\nwhat it does". Example shape (do NOT copy verbatim):
\`\`\`mermaid
flowchart LR
  A[Input] --> B[Init state\\ndict / pointers]
  B --> C[Iterate\\nprocess element]
  C --> D[Update\\nstate]
  D --> E[Return result]
\`\`\`
The renderer animates arrows so the flow becomes intuitive.

### 6. Worked mini-example
Use a TINY toy input (3–6 items — invented, NOT the exact test cases) to demonstrate the concept end-to-end. Show as GitHub-flavored markdown tables or short trace:
1. **Input** — small.
2. **After the key step** — intermediate state (e.g. hashmap contents, window bounds, stack).
3. **Final output**.
Add 1–2 sentences of narration between the steps. Must be a DIFFERENT toy scenario, never the exact answer.

### 7. Common pitfalls
Bullet list of traps students hit on this pattern (off-by-one, mutable default args, shallow copy, integer overflow-ish, recursion depth, etc.).

### 8. Related concepts
2–4 adjacent Java concepts worth knowing next.

Rules:
- Keep it dense but readable. Short paragraphs, bullets, small \`java\` snippets.
- Section 5 MUST contain exactly one \`\`\`mermaid flowchart LR block.
- Never reveal the full solution code.`;
    case "JAVA_TO_SQL":
      return `The user just finished a Java problem. Reframe the SAME problem as a SQL problem and provide a MySQL 8 solution.

Java task:
${payload.task}

Java function signature: ${payload.function_signature || "(n/a)"}

Test cases (Java literals):
${JSON.stringify(payload.test_cases || [])}

Reference Java solution (for context only — do not restate it):
${payload.expected_solution || "(n/a)"}

Deliver:
1. **schema_ddl** — minimal CREATE TABLE statements that model the inputs of this problem as one or more relational tables (pick sensible column names + types).
2. **sample_seed** — INSERT statements that mirror the Java test-case inputs so the SQL is directly verifiable.
3. **sql_solution** — a clean MySQL 8 query (window functions / CTEs allowed) that produces the same answer the Java function returns. If the Java function returns a scalar, return one row / one column. If it returns a list, return one row per element with a stable ORDER BY.
4. **walkthrough** — plain-English, line-by-line explanation of the SQL and how each Java step maps to a SQL clause.
5. **java_vs_sql** — 2–3 sentences on when each approach is more idiomatic for this shape of problem.

Rules: MySQL 8 dialect only. Use CTEs (\`WITH\`) when it improves clarity. Never use vendor-specific extensions from other engines.`;
    default:
      return JSON.stringify(payload);
  }
}

const PayloadSchemas = {
  INIT_JAVA_ENVIRONMENT: z.object({
    difficulty: z.string().max(50),
    target_concept: z.string().max(200),
    topic: z.string().max(500).optional(),
    company: z.string().max(100).optional(),
  }),
  NEXT_JAVA_QUESTION: z.object({
    target_difficulty: z.string().max(50),
    target_concept: z.string().max(200),
    covered_concepts: z.array(z.string().max(100)).max(200).optional(),
    previous_question_ids: z.array(z.number()).max(500).optional(),
    company: z.string().max(100).optional(),
  }),
  EVALUATE_JAVA: z.object({
    session_question_id: z.string().uuid(),
    user_code: z.string().max(10_000),
  }),
  JAVA_HINT: z.object({
    task: z.string().max(10_000),
    user_code: z.string().max(10_000),
  }),
  REVEAL_JAVA_SOLUTION: z.object({
    session_question_id: z.string().uuid(),
  }),
  JAVA_DEBUG: z.object({
    task: z.string().max(10_000),
    user_code: z.string().max(10_000),
  }),
  JAVA_VISUALIZE: z.object({
    task: z.string().max(10_000),
    user_code: z.string().max(10_000),
  }),
  JAVA_OPTIMIZE: z.object({
    session_question_id: z.string().uuid(),
    user_code: z.string().max(10_000),
  }),
  JAVA_THEORY: z.object({
    session_question_id: z.string().uuid(),
  }),
  JAVA_TO_SQL: z.object({
    session_question_id: z.string().uuid(),
  }),
} as const;

const InputSchema = z
  .object({ command: z.string(), payload: z.any() })
  .superRefine((v, ctx) => {
    const schema = (PayloadSchemas as any)[v.command];
    if (!schema) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown command: ${v.command}` });
    }
  })
  .transform((v) => {
    const schema = (PayloadSchemas as any)[v.command];
    return { command: v.command, payload: schema.parse(v.payload) };
  });

async function callJavaEngine(
  command: keyof typeof PayloadSchemas,
  payload: any,
): Promise<{ data?: any; error?: string }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { error: "LOVABLE_API_KEY is not configured." };

  const tool = TOOLS_BY_COMMAND[command];
  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(command, payload) },
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
  if (resp.status === 429) return { error: "Rate limit reached. Please wait and try again." };
  if (resp.status === 402) return { error: "AI credits exhausted. Add credits in Workspace → Usage." };
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    console.error("AI gateway error", resp.status, t);
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

// Remove the reference solution before anything is returned to the browser.
function stripSolution(question: any) {
  if (!question) return question;
  const { expected_solution, ...rest } = question;
  return rest;
}

export const runJavaEngine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const command = data.command as keyof typeof PayloadSchemas;
    const payload: any = data.payload;

    // Question generation: persist the answer key server-side and return only
    // a session id + a sanitized question (no expected_solution) to the client.
    if (command === "INIT_JAVA_ENVIRONMENT" || command === "NEXT_JAVA_QUESTION") {
      const res = await callJavaEngine(command, payload);
      if (res.error || !res.data) return res;
      const q = res.data.question;
      if (!q || typeof q.task !== "string" || !q.task.trim()) {
        return { error: "AI returned an incomplete question. Try again." };
      }
      const difficulty =
        q.difficulty ?? payload.difficulty ?? payload.target_difficulty ?? "beginner";
      const { data: row, error } = await supabaseAdmin
        .from("question_sessions")
        .insert({
          user_id: userId,
          subject: "java",
          topic_slug: String(q.concept || "java").slice(0, 100),
          concept: q.concept ?? null,
          difficulty,
          task: q.task,
          question_id_external: q.question_id ?? null,
          payload: {
            expected_solution: q.expected_solution ?? "",
            test_cases: q.test_cases ?? [],
            function_signature: q.function_signature ?? "",
          },
        })
        .select("id")
        .single();
      if (error) return { error: error.message };
      return {
        data: { ...res.data, session_question_id: row.id, question: stripSolution(q) },
      };
    }

    // Grading / reveal / optimize: never trust a client-supplied answer key.
    // The answer key lives in question_sessions, a server-only table that the
    // browser cannot read. We fetch it with the service-role client, scoped to
    // the signed-in user's id so one user can never load another user's row.
    if (
      command === "EVALUATE_JAVA" ||
      command === "REVEAL_JAVA_SOLUTION" ||
      command === "JAVA_OPTIMIZE" ||
      command === "JAVA_THEORY" ||
      command === "JAVA_TO_SQL"
    ) {
      const { data: row, error } = await supabaseAdmin
        .from("question_sessions")
        .select("task, payload, concept, difficulty")
        .eq("id", payload.session_question_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (error || !row) return { error: "Question session not found." };
      const stored = (row.payload ?? {}) as { expected_solution?: string; test_cases?: any[]; function_signature?: string };
      const enriched = {
        ...payload,
        task: row.task,
        concept: (row as any).concept ?? undefined,
        difficulty: (row as any).difficulty ?? undefined,
        expected_solution: stored.expected_solution ?? "",
        test_cases: stored.test_cases ?? [],
        function_signature: stored.function_signature ?? "",
      };
      return callJavaEngine(command, enriched);
    }

    // Non-sensitive commands (hint, debug, visualize) carry no answer key.
    return callJavaEngine(command, payload);
  });
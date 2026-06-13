import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM_PROMPT = `You are a Senior Python Engineer + interview mentor.
You generate realistic Python coding interview questions (FAANG/MNC style) and grade user solutions semantically by mentally executing the code against the test cases (no real sandbox). Be terse, precise, and always reply by calling the supplied tool with valid arguments.

Cover the full Python landscape across a session: data structures (list, dict, set, tuple, deque, heap), strings, recursion, two-pointers, sliding window, hashing, sorting, binary search, stacks/queues, trees, graphs, DP, greedy, bit manipulation, OOP/dataclasses, decorators, generators/iterators, comprehensions, itertools/collections, file I/O, regex, exception handling, type hints, pandas basics, numpy basics, async/await.

Difficulty rules — beginner: single concept, ~5-10 lines; intermediate: multi-concept, 10-25 lines, edge cases; advanced: optimized algo, 20+ lines, time/space analysis required.

When target_concept is provided, the question MUST exercise that concept as its primary teaching point.`;

const TOOLS_BY_COMMAND: Record<string, any> = {
  INIT_PYTHON_ENVIRONMENT: {
    name: "init_python_environment",
    description: "Generate a complete Python practice question with starter code and tests.",
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
                  input_repr: { type: "string", description: "Python literal repr of the call args." },
                  expected_repr: { type: "string", description: "Python literal repr of expected output." },
                  explanation: { type: "string" },
                },
                required: ["input_repr", "expected_repr"],
              },
            },
            expected_solution: { type: "string", description: "Reference Python solution." },
            time_complexity: { type: "string" },
            space_complexity: { type: "string" },
          },
          required: ["question_id", "difficulty", "task", "function_signature", "starter_code", "test_cases", "expected_solution"],
        },
      },
      required: ["question"],
    },
  },
  NEXT_PYTHON_QUESTION: {
    name: "next_python_question",
    description: "Generate the next Python question, avoiding repeats.",
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
  EVALUATE_PYTHON: {
    name: "evaluate_python",
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
  PYTHON_HINT: {
    name: "python_hint",
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
  REVEAL_PYTHON_SOLUTION: {
    name: "reveal_python_solution",
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
  PYTHON_DEBUG: {
    name: "python_debug",
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
  PYTHON_VISUALIZE: {
    name: "python_visualize",
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
  PYTHON_OPTIMIZE: {
    name: "python_optimize",
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
};

function buildUserPrompt(command: string, payload: any): string {
  switch (command) {
    case "INIT_PYTHON_ENVIRONMENT":
      return `Generate a Python interview question.\nDifficulty: ${payload.difficulty}\nTarget concept: ${payload.target_concept}\nContext theme: ${payload.topic || "general"}`;
    case "NEXT_PYTHON_QUESTION":
      return `Generate the next Python question.\nDifficulty: ${payload.target_difficulty}\nTarget concept: ${payload.target_concept}\nAlready covered concepts (avoid same teaching point): ${(payload.covered_concepts || []).join(", ")}\nAlready asked IDs: ${(payload.previous_question_ids || []).join(", ")}`;
    case "EVALUATE_PYTHON":
      return `Question task:\n${payload.task}\n\nReference solution:\n${payload.expected_solution}\n\nTest cases:\n${JSON.stringify(payload.test_cases)}\n\nUser code:\n${payload.user_code}\n\nMentally execute the user's code against each test case. Compare actual vs expected. Grade fairly.`;
    case "PYTHON_HINT":
      return `Task:\n${payload.task}\n\nUser current code:\n${payload.user_code}\n\nGive ONE Socratic hint.`;
    case "REVEAL_PYTHON_SOLUTION":
      return `Task:\n${payload.task}\n\nReference solution:\n${payload.expected_solution}\n\nProvide the solution with a clear line-by-line walkthrough.`;
    case "PYTHON_DEBUG":
      return `Task:\n${payload.task}\n\nUser code:\n${payload.user_code}\n\nIdentify the bug. Do NOT give the full solution — just explain what's wrong and the concept to apply.`;
    case "PYTHON_VISUALIZE":
      return `Task:\n${payload.task}\n\nCode to trace:\n${payload.user_code}\n\nMentally execute the code on a representative sample input. Return concise step-by-step trace (max 12 steps) showing line, action, and the state of key variables.`;
    case "PYTHON_OPTIMIZE":
      return `Task:\n${payload.task}\n\nUser code:\n${payload.user_code}\n\nReference:\n${payload.expected_solution}\n\nAct as a senior Python engineer reviewing this code. Provide a cleaner / more idiomatic / faster version with improvements list and complexity comparison.`;
    default:
      return JSON.stringify(payload);
  }
}

const PayloadSchemas = {
  INIT_PYTHON_ENVIRONMENT: z.object({
    difficulty: z.string().max(50),
    target_concept: z.string().max(200),
    topic: z.string().max(500).optional(),
  }),
  NEXT_PYTHON_QUESTION: z.object({
    target_difficulty: z.string().max(50),
    target_concept: z.string().max(200),
    covered_concepts: z.array(z.string().max(100)).max(200).optional(),
    previous_question_ids: z.array(z.number()).max(500).optional(),
  }),
  EVALUATE_PYTHON: z.object({
    session_question_id: z.string().uuid(),
    user_code: z.string().max(10_000),
  }),
  PYTHON_HINT: z.object({
    task: z.string().max(10_000),
    user_code: z.string().max(10_000),
  }),
  REVEAL_PYTHON_SOLUTION: z.object({
    session_question_id: z.string().uuid(),
  }),
  PYTHON_DEBUG: z.object({
    task: z.string().max(10_000),
    user_code: z.string().max(10_000),
  }),
  PYTHON_VISUALIZE: z.object({
    task: z.string().max(10_000),
    user_code: z.string().max(10_000),
  }),
  PYTHON_OPTIMIZE: z.object({
    session_question_id: z.string().uuid(),
    user_code: z.string().max(10_000),
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

async function callPythonEngine(
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

export const runPythonEngine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const command = data.command as keyof typeof PayloadSchemas;
    const payload: any = data.payload;

    // Question generation: persist the answer key server-side and return only
    // a session id + a sanitized question (no expected_solution) to the client.
    if (command === "INIT_PYTHON_ENVIRONMENT" || command === "NEXT_PYTHON_QUESTION") {
      const res = await callPythonEngine(command, payload);
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
          subject: "python",
          topic_slug: String(q.concept || "python").slice(0, 100),
          concept: q.concept ?? null,
          difficulty,
          task: q.task,
          question_id_external: q.question_id ?? null,
          payload: {
            expected_solution: q.expected_solution ?? "",
            test_cases: q.test_cases ?? [],
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
      command === "EVALUATE_PYTHON" ||
      command === "REVEAL_PYTHON_SOLUTION" ||
      command === "PYTHON_OPTIMIZE"
    ) {
      const { data: row, error } = await supabaseAdmin
        .from("question_sessions")
        .select("task, payload")
        .eq("id", payload.session_question_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (error || !row) return { error: "Question session not found." };
      const stored = (row.payload ?? {}) as { expected_solution?: string; test_cases?: any[] };
      const enriched = {
        ...payload,
        task: row.task,
        expected_solution: stored.expected_solution ?? "",
        test_cases: stored.test_cases ?? [],
      };
      return callPythonEngine(command, enriched);
    }

    // Non-sensitive commands (hint, debug, visualize) carry no answer key.
    return callPythonEngine(command, payload);
  });
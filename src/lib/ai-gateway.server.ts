/**
 * Shared AI-gateway call layer for every practice engine (SQL / Python /
 * Java / C-C++ / PySpark).
 *
 * Why this exists:
 *  - one retry path for transient gateway failures and malformed tool output
 *  - one timeout so a stalled generation cannot hang a server function
 *  - two-tier model routing: a fast model for hints / questions, a stronger
 *    reasoning model for grading and code review
 *  - one place to reconcile a grading verdict so the per-test rows are the
 *    source of truth instead of the model's self-reported counters
 *
 * Server-only. Never import from client code.
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Fast + cheap: question generation, hints, debug, visualize, theory. */
export const FAST_MODEL = "google/gemini-3-flash-preview";
/** Stronger reasoning: grading verdicts and senior-engineer code review. */
export const REASONING_MODEL = "google/gemini-3.1-pro-preview";

/** Commands whose correctness matters most get the reasoning model. */
const REASONING_COMMAND_RE =
  /^(EVALUATE|GRADE|CHECK|ANALYZE|ANALYSE|OPTIMIZE)/i;

export function modelForCommand(command: string): string {
  return REASONING_COMMAND_RE.test(command) ? REASONING_MODEL : FAST_MODEL;
}

const DEFAULT_TIMEOUT_MS = 90_000;

export interface GatewayToolCallOptions {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  /** OpenAI-style function definition; the model is forced to call it. */
  tool: { name: string; description?: string; parameters: unknown };
  timeoutMs?: number;
  /** Extra attempts after the first one. Default 1. */
  retries?: number;
}

export interface GatewayResult<T = any> {
  data?: T;
  error?: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Force a single structured tool call and return its parsed arguments.
 * Retries once on network failure, 5xx, empty tool call, or malformed JSON.
 * Rate limit (429) and credit exhaustion (402) are surfaced immediately —
 * retrying those only wastes the user's time.
 */
export async function callGatewayTool<T = any>(
  opts: GatewayToolCallOptions,
): Promise<GatewayResult<T>> {
  const { apiKey, model, system, user, tool } = opts;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const attempts = (opts.retries ?? 1) + 1;

  const body = JSON.stringify({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    tools: [{ type: "function", function: tool }],
    tool_choice: { type: "function", function: { name: tool.name } },
  });

  let lastError = "The AI service did not respond. Please try again.";

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(400 * attempt);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let resp: Response;
    try {
      resp = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body,
        signal: controller.signal,
      });
    } catch (e: any) {
      clearTimeout(timer);
      lastError =
        e?.name === "AbortError"
          ? "The AI service took too long. Please try again."
          : "Could not reach the AI service. Please check your connection and try again.";
      continue;
    }
    clearTimeout(timer);

    if (resp.status === 429) {
      return { error: "Too many requests right now. Please wait a few seconds and try again." };
    }
    if (resp.status === 402) {
      return { error: "AI credits are exhausted. Add credits in Workspace → Usage." };
    }
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("AI gateway error", resp.status, text.slice(0, 500));
      lastError = `The AI service returned an error (${resp.status}).`;
      if (resp.status < 500) return { error: lastError };
      continue;
    }

    let json: any;
    try {
      json = await resp.json();
    } catch {
      lastError = "The AI service returned an unreadable response.";
      continue;
    }

    const argsStr =
      json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) {
      console.error("No tool call in response", JSON.stringify(json).slice(0, 600));
      lastError = "The AI did not return structured output.";
      continue;
    }
    try {
      return { data: JSON.parse(argsStr) as T };
    } catch {
      console.error("Malformed tool args", String(argsStr).slice(0, 400));
      lastError = "The AI returned malformed output.";
      continue;
    }
  }

  return { error: `${lastError} (retried automatically)` };
}

export interface PerTestRow {
  input_repr?: string;
  expected_repr?: string;
  actual_repr?: string;
  passed?: boolean;
  note?: string;
}

export interface Verdict {
  is_correct?: boolean;
  passed?: number;
  total?: number;
  per_test?: PerTestRow[];
  explanation?: string;
  [k: string]: any;
}

/**
 * The model's `passed` / `total` / `is_correct` counters routinely disagree
 * with its own per-test rows. The rows carry the actual reasoning, so they
 * win: we recount from them and rewrite the summary fields.
 *
 * `expectedTotal` (the real number of test cases) also guards against a model
 * that silently drops or invents test rows.
 */
export function reconcileVerdict<T extends Verdict>(
  verdict: T,
  expectedTotal?: number,
): T {
  if (!verdict || typeof verdict !== "object") return verdict;
  const rows = Array.isArray(verdict.per_test) ? verdict.per_test : [];

  if (rows.length > 0) {
    const passedCount = rows.filter((r) => r?.passed === true).length;
    const total =
      typeof expectedTotal === "number" && expectedTotal > 0
        ? Math.max(expectedTotal, rows.length)
        : rows.length;
    verdict.passed = passedCount;
    verdict.total = total;
    verdict.is_correct = passedCount === total && total > 0;
    return verdict;
  }

  // No rows to trust: keep the counters coherent with each other.
  const total =
    typeof verdict.total === "number" && verdict.total > 0
      ? verdict.total
      : (expectedTotal ?? 0);
  const passed =
    typeof verdict.passed === "number" ? Math.min(verdict.passed, total || Infinity) : 0;
  verdict.total = total;
  verdict.passed = passed;
  if (total > 0) verdict.is_correct = passed === total;
  return verdict;
}

/**
 * Cheap deterministic checks that run BEFORE the model. Catching an empty or
 * unchanged submission locally removes the most common source of a wrong AI
 * verdict (and saves a paid call).
 */
export function preCheckSubmission(
  code: string,
  lang: "sql" | "python" | "java" | "c" | "cpp" | "pyspark" | string,
  totalTests: number,
): Verdict | null {
  const src = (code ?? "").trim();
  const fail = (explanation: string): Verdict => ({
    is_correct: false,
    passed: 0,
    total: totalTests,
    per_test: [],
    explanation,
    improvements: [],
  });

  if (!src) return fail("You haven't written any code yet. Add your implementation and run it again.");

  // Strip comments so a solution made only of comments is caught.
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/[^\n]*/g, "$1")
    .replace(/(^|\s)--[^\n]*/g, "$1")
    .replace(/(^|\s)#[^\n]*/g, "$1")
    .trim();
  if (!stripped) return fail("Your submission only contains comments — no executable code yet.");

  // Untouched starter: body is still just the TODO placeholder.
  if (/\bTODO\b/i.test(src) && stripped.length < 40) {
    return fail("The starter code is still unchanged. Replace the TODO with your implementation.");
  }

  if (lang !== "sql") {
    // Unbalanced brackets are a guaranteed syntax error; report it precisely
    // instead of asking the model to imagine running broken code.
    const pairs: Array<[string, string]> = [["(", ")"], ["[", "]"], ["{", "}"]];
    const noStrings = stripped
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      .replace(/'(?:\\.|[^'\\])*'/g, "''");
    for (const [open, close] of pairs) {
      const o = noStrings.split(open).length - 1;
      const c = noStrings.split(close).length - 1;
      if (o !== c) {
        return fail(
          `Syntax error: unbalanced ${open}${close} — ${o} "${open}" vs ${c} "${close}". Fix the brackets before running.`,
        );
      }
    }
  }

  return null;
}

/**
 * SQL variant of the pre-check. The SQL verdict has its own shape (no
 * per-test rows), so it gets its own local fail object.
 */
export function preCheckSql(sql: string): Record<string, any> | null {
  const src = (sql ?? "").trim();
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)--[^\n]*/g, "$1")
    .trim();

  const fail = (title: string, message: string) => ({
    is_correct: false,
    is_syntax_error: true,
    status_title: title,
    feedback_message: message,
    performance_note: "",
    best_practice_tip: "",
    mistake_tag: "empty-submission",
    user_result_preview: "Could not run: no query to execute.",
    expected_result_preview: "",
  });

  if (!src) return fail("Nothing to run", "You haven't written a query yet. Write your SQL and run it again.");
  if (!stripped) return fail("Nothing to run", "Your submission only contains comments — no SQL statement yet.");

  const noStrings = stripped.replace(/'(?:''|[^'])*'/g, "''");
  const open = noStrings.split("(").length - 1;
  const close = noStrings.split(")").length - 1;
  if (open !== close) {
    return {
      ...fail(
        "Syntax error",
        `Unbalanced parentheses: ${open} "(" vs ${close} ")". Fix the brackets before running.`,
      ),
      mistake_tag: "syntax-error",
    };
  }
  return null;
}

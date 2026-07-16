import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM = `You are a Java interview coach. Given a student's free-text goal
("test my basic commands", "make me a pro at decorators and generators", "drill me on pandas"),
produce a focused, ordered learning plan of 4-10 Java concept slugs that an AI question
generator can use as target_concept values. Pick a difficulty that matches the goal.

Allowed concept slugs (pick the most relevant — order matters, easiest first):
lists, dict, set, tuple, strings, loops, comprehensions, slicing, functions-args, exception-handling,
oop-design, dataclasses, decorators, generators, iterators, context-managers,
sliding-window, two-pointers, binary-search, stack, queue, deque, heap, hashmap-counting,
recursion, backtracking-easy, linked-list, tree-traversal, regex,
dp-1d, dp-2d, graph-bfs, graph-dfs, dijkstra, union-find, trie, topological-sort,
bit-manipulation, concurrency-asyncio, multiprocessing,
collections, itertools, functools, datetime, json, csv, pathlib, os-sys, subprocess, hashlib,
pandas-io, pandas-filtering, pandas-groupby, pandas-merge, pandas-pivot, pandas-apply,
pandas-window, pandas-timeseries, pandas-missing, pandas-perf,
numpy-arrays, numpy-indexing, numpy-broadcasting, numpy-vectorization, numpy-linalg,
pyspark-dataframe, pyspark-transformations, pyspark-joins, pyspark-window, pyspark-udf,
airflow-dag, requests, fastapi, pytest, pydantic.`;

const TOOL = {
  name: "plan_java_focus",
  description: "Turn a student goal into an ordered Java concept plan.",
  parameters: {
    type: "object",
    properties: {
      focus_title: { type: "string" },
      difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
      concepts: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 12 },
      intro: { type: "string" },
    },
    required: ["focus_title", "difficulty", "concepts", "intro"],
  },
};

export const planJavaFocus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ goal: z.string().min(2).max(2000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { error: "LOVABLE_API_KEY is not configured." };

    let resp: Response;
    try {
      resp = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: `Student goal:\n${data.goal}` },
          ],
          tools: [{ type: "function", function: TOOL }],
          tool_choice: { type: "function", function: { name: TOOL.name } },
        }),
      });
    } catch {
      return { error: "Could not reach AI gateway." };
    }
    if (resp.status === 429) return { error: "Rate limit reached. Please wait and try again." };
    if (resp.status === 402) return { error: "AI credits exhausted." };
    if (!resp.ok) return { error: `AI gateway error (${resp.status}).` };
    const json: any = await resp.json();
    const argsStr = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) return { error: "AI did not return a plan." };
    let plan: any;
    try { plan = JSON.parse(argsStr); } catch { return { error: "AI returned malformed JSON." }; }
    const concepts = Array.isArray(plan.concepts)
      ? plan.concepts.filter((c: unknown) => typeof c === "string" && c.trim().length > 0).slice(0, 12)
      : [];
    if (concepts.length === 0) return { error: "Could not derive concepts from that goal." };
    const difficulty = ["beginner", "intermediate", "advanced"].includes(plan.difficulty)
      ? plan.difficulty : "intermediate";
    return {
      data: {
        focus_title: String(plan.focus_title ?? "Focused Java practice"),
        difficulty,
        concepts,
        intro: String(plan.intro ?? "Let's drill the areas you asked about."),
      },
    };
  });
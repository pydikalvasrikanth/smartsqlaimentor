// Planner & mastery server functions. Each one is auth-protected via the
// requireSupabaseAuth middleware, so all queries run as the signed-in user
// and respect RLS.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generateCurriculum, type Tier } from "./topic-catalog";
import { callEngineCommand } from "./sql-engine.functions";

const TIER = z.enum(["beginner", "intermediate", "advanced", "professional"]);

// ---- GENERATE_PLAN ---------------------------------------------------------
export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ days: z.number().int().min(7).max(180), target_level: TIER }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Deactivate any current plans
    await supabase.from("practice_plans").update({ active: false }).eq("user_id", userId);

    const { data: plan, error } = await supabase
      .from("practice_plans")
      .insert({ user_id: userId, days: data.days, target_level: data.target_level, active: true })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const curriculum = generateCurriculum(data.days, data.target_level as Tier);
    const rows = curriculum.map((d) => ({ ...d, plan_id: plan.id, user_id: userId }));
    const { error: dErr } = await supabase.from("plan_days").insert(rows);
    if (dErr) throw new Error(dErr.message);

    return { plan_id: plan.id };
  });

// ---- GET_PLAN_STATE --------------------------------------------------------
export const getPlanState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: plan } = await supabase
      .from("practice_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!plan) return { plan: null, days: [], today: null };

    const { data: days } = await supabase
      .from("plan_days")
      .select("*")
      .eq("plan_id", plan.id)
      .order("day_index", { ascending: true });

    const elapsedMs = Date.now() - new Date(plan.started_at).getTime();
    const dayNumber = Math.min(plan.days, Math.floor(elapsedMs / 86_400_000) + 1);
    const today = (days ?? []).find((d) => d.day_index === dayNumber) ?? null;

    return { plan, days: days ?? [], today, day_number: dayNumber };
  });

// ---- GET_LEARNING_STATE ----------------------------------------------------
export const getLearningState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: mastery } = await supabase
      .from("topic_mastery")
      .select("*")
      .eq("user_id", userId);

    // last 100 attempts → compute weak concepts (success rate < 0.6, min 3 tries)
    const { data: attempts } = await supabase
      .from("attempts")
      .select("concept, is_correct, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    const stats = new Map<string, { tries: number; correct: number }>();
    (attempts ?? []).forEach((a) => {
      if (!a.concept) return;
      const s = stats.get(a.concept) ?? { tries: 0, correct: 0 };
      s.tries += 1;
      if (a.is_correct) s.correct += 1;
      stats.set(a.concept, s);
    });
    const weak = Array.from(stats.entries())
      .filter(([, s]) => s.tries >= 3 && s.correct / s.tries < 0.6)
      .sort((a, b) => a[1].correct / a[1].tries - b[1].correct / b[1].tries)
      .slice(0, 5)
      .map(([concept, s]) => ({ concept, success_rate: s.correct / s.tries, tries: s.tries }));

    return { mastery: mastery ?? [], weak };
  });


// ---- INIT_PRACTICE / NEXT_PRACTICE -----------------------------------------
// These wrap the AI engine and persist the generated question (including the
// expected_sql answer key) server-side. The browser only ever receives a
// `session_question_id`; the answer key never crosses the client boundary,
// so users cannot cheat by submitting matching user_sql + expected_sql.

function stripExpected(question: any) {
  if (!question) return question;
  const { expected_sql, ...rest } = question;
  return rest;
}

function questionLooksValid(q: any) {
  return (
    !!q &&
    typeof q.task === "string" &&
    q.task.trim().length > 0 &&
    typeof q.business_context === "string" &&
    q.business_context.trim().length > 0 &&
    typeof q.expected_sql === "string" &&
    q.expected_sql.trim().length > 0
  );
}

async function callWithRetry(
  command: "INIT_ENVIRONMENT" | "NEXT_QUESTION",
  payload: any,
  validate: (data: any) => boolean,
  maxAttempts = 3,
) {
  let last: { data?: any; error?: string } = { error: "No response." };
  for (let i = 0; i < maxAttempts; i++) {
    last = await callEngineCommand(command, payload);
    if (!last.error && last.data && validate(last.data)) return last;
  }
  return last;
}

export const initPractice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        topic_slug: z.string().max(100),
        topic_prompt: z.string().max(2_000),
        difficulty: TIER,
        target_concept: z.string().max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const res = await callWithRetry(
      "INIT_ENVIRONMENT",
      {
        topic: data.topic_prompt,
        difficulty: data.difficulty,
        target_concept: data.target_concept,
      },
      (env: any) => questionLooksValid(env?.question) && !!env?.schema_sql,
    );
    if (res.error || !res.data) return { error: res.error ?? "Failed to init." };
    const env = res.data as any;
    const q = env.question;
    if (!questionLooksValid(q)) return { error: "AI returned an incomplete question. Try again." };
    const { data: sessionRow, error } = await supabaseAdmin
      .from("question_sessions")
      .insert({
        user_id: userId,
        topic_slug: data.topic_slug,
        concept: q?.concept ?? null,
        difficulty: data.difficulty,
        schema_sql: env.schema_sql,
        seed_data_sql: env.seed_data_sql,
        task: q?.task ?? "",
        expected_sql: q?.expected_sql ?? "",
        question_id_external: q?.question_id ?? null,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    return {
      data: {
        session_question_id: sessionRow.id,
        schema_sql: env.schema_sql,
        seed_data_sql: env.seed_data_sql,
        erd_mermaid: env.erd_mermaid,
        tables_description: env.tables_description,
        question: stripExpected(q),
      },
    };
  });

export const nextPractice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        topic_slug: z.string().max(100),
        schema_sql: z.string().max(50_000),
        seed_data_sql: z.string().max(100_000),
        schema_context: z.string().max(200_000),
        previous_question_ids: z.array(z.number()).max(200),
        covered_concepts: z.array(z.string().max(200)).max(200),
        weak_concepts: z.array(z.string().max(200)).max(50),
        target_difficulty: TIER,
        target_concept: z.string().max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const res = await callWithRetry(
      "NEXT_QUESTION",
      {
        schema_context: data.schema_context,
        previous_question_ids: data.previous_question_ids,
        covered_concepts: data.covered_concepts,
        weak_concepts: data.weak_concepts,
        target_difficulty: data.target_difficulty,
        target_concept: data.target_concept,
      },
      (out: any) => questionLooksValid(out?.question),
    );
    if (res.error || !res.data) return { error: res.error ?? "Failed to fetch next question." };
    const outer = res.data as any;
    const q = outer?.question ?? outer;
    if (!questionLooksValid(q)) {
      return { error: "AI returned an incomplete question. Click Next again." };
    }
    const { data: sessionRow, error } = await supabaseAdmin
      .from("question_sessions")
      .insert({
        user_id: userId,
        topic_slug: data.topic_slug,
        concept: q?.concept ?? null,
        difficulty: data.target_difficulty,
        schema_sql: data.schema_sql,
        seed_data_sql: data.seed_data_sql,
        task: q?.task ?? "",
        expected_sql: q?.expected_sql ?? "",
        question_id_external: q?.question_id ?? null,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    return {
      data: {
        session_question_id: sessionRow.id,
        question: stripExpected(q),
      },
    };
  });

// ---- REVEAL_SOLUTION (server-side) -----------------------------------------
export const revealSolution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ session_question_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: q, error } = await supabaseAdmin
      .from("question_sessions")
      .select("expected_sql")
      .eq("id", data.session_question_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !q) return { error: "Question not found." };
    const res = await callEngineCommand("REVEAL_SOLUTION", { expected_sql: q.expected_sql });
    return res;
  });

// ---- LOG_ATTEMPT (server-side evaluation; never trusts client correctness) -
const TIER_ORDER = ["beginner", "intermediate", "advanced", "professional"] as const;

export const logAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        session_question_id: z.string().uuid(),
        user_sql: z.string().max(10_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load the trusted question record (answer key never comes from the client).
    const { data: q, error: qErr } = await supabaseAdmin
      .from("question_sessions")
      .select("*")
      .eq("id", data.session_question_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (qErr || !q) return { error: "Question session not found." };

    const evalRes = await callEngineCommand("EVALUATE_SUBMISSION", {
      schema_sql: q.schema_sql,
      seed_data_sql: q.seed_data_sql,
      task: q.task,
      expected_sql: q.expected_sql,
      user_sql: data.user_sql,
    });
    if (evalRes.error || !evalRes.data) {
      return { error: evalRes.error ?? "Could not evaluate submission." };
    }
    const evaluation = evalRes.data;
    const isCorrect = !!evaluation.is_correct;
    const mistakeTag: string | null =
      typeof evaluation.mistake_tag === "string" && evaluation.mistake_tag.length > 0
        ? evaluation.mistake_tag.slice(0, 120)
        : null;

    await supabase.from("attempts").insert({
      user_id: userId,
      topic_slug: q.topic_slug,
      concept: q.concept ?? null,
      difficulty: q.difficulty,
      question_text: q.task,
      user_sql: data.user_sql,
      is_correct: isCorrect,
      mistake_tag: mistakeTag,
    });

    // Upsert mastery
    const { data: existing } = await supabase
      .from("topic_mastery")
      .select("*")
      .eq("user_id", userId)
      .eq("topic_slug", q.topic_slug)
      .maybeSingle();

    const attempted = (existing?.questions_attempted ?? 0) + 1;
    const correct = (existing?.questions_correct ?? 0) + (isCorrect ? 1 : 0);

    const successRate = attempted ? correct / attempted : 0;
    const currentTier = (existing?.current_tier ?? "beginner") as (typeof TIER_ORDER)[number];
    let { unlocked_intermediate, unlocked_advanced, unlocked_professional } = {
      unlocked_intermediate: existing?.unlocked_intermediate ?? false,
      unlocked_advanced: existing?.unlocked_advanced ?? false,
      unlocked_professional: existing?.unlocked_professional ?? false,
    };
    let nextTier: (typeof TIER_ORDER)[number] = currentTier;
    if (attempted >= 10 && successRate >= 0.7) {
      const idx = TIER_ORDER.indexOf(currentTier);
      if (idx < TIER_ORDER.length - 1) {
        nextTier = TIER_ORDER[idx + 1];
        if (nextTier === "intermediate") unlocked_intermediate = true;
        if (nextTier === "advanced") unlocked_advanced = true;
        if (nextTier === "professional") unlocked_professional = true;
      }
    }

    await supabase.from("topic_mastery").upsert(
      {
        user_id: userId,
        topic_slug: q.topic_slug,
        current_tier: nextTier,
        questions_attempted: attempted,
        questions_correct: correct,
        unlocked_intermediate,
        unlocked_advanced,
        unlocked_professional,
      },
      { onConflict: "user_id,topic_slug" },
    );

    return { evaluation, attempted, correct, current_tier: nextTier };
  });

// ---- COMPLETE_DAY ----------------------------------------------------------
export const completePlanDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ day_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("plan_days")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", data.day_id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- PLAN_FOCUS ------------------------------------------------------------
// Turn a student's free-text goal ("test my basic commands", "make me a pro at
// joins") into a focused, ordered concept plan that drives question generation.
export const planFocus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ goal: z.string().min(2).max(2_000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const res = await callEngineCommand("PLAN_FOCUS", { goal: data.goal });
    if (res.error || !res.data) return { error: res.error ?? "Could not build a plan." };
    const plan = res.data as any;
    const concepts = Array.isArray(plan.concepts)
      ? plan.concepts.filter((c: unknown) => typeof c === "string" && c.trim().length > 0).slice(0, 15)
      : [];
    if (concepts.length === 0) return { error: "Couldn't derive concepts from that goal. Try rephrasing." };
    const difficulty = ["beginner", "intermediate", "advanced"].includes(plan.difficulty)
      ? plan.difficulty
      : "beginner";
    return {
      data: {
        focus_title: String(plan.focus_title ?? "Focused practice"),
        difficulty,
        concepts,
        domain_prompt: String(plan.domain_prompt ?? data.goal),
        intro: String(plan.intro ?? "Let's drill the areas you asked about."),
      },
    };
  });

// ---- ANALYZE_FOCUS ---------------------------------------------------------
// Read back the stored attempts for a focus session and produce a mentor-style
// strengths/weaknesses analysis with a readiness verdict.
export const analyzeFocus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ topic_slug: z.string().max(100), goal: z.string().max(2_000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: attempts } = await supabase
      .from("attempts")
      .select("concept, is_correct, mistake_tag, question_text, created_at")
      .eq("user_id", userId)
      .eq("topic_slug", data.topic_slug)
      .order("created_at", { ascending: true })
      .limit(200);

    const list = attempts ?? [];
    if (list.length === 0) {
      return { error: "No attempts recorded yet — run at least one query before ending." };
    }

    const map = new Map<string, { tries: number; correct: number; mistakes: Record<string, number> }>();
    for (const a of list) {
      const c = a.concept ?? "general";
      const s = map.get(c) ?? { tries: 0, correct: 0, mistakes: {} };
      s.tries += 1;
      if (a.is_correct) s.correct += 1;
      if (!a.is_correct && a.mistake_tag) {
        s.mistakes[a.mistake_tag] = (s.mistakes[a.mistake_tag] ?? 0) + 1;
      }
      map.set(c, s);
    }
    const stats = Array.from(map.entries()).map(([concept, s]) => ({
      concept,
      tries: s.tries,
      correct: s.correct,
      accuracy: Number((s.correct / s.tries).toFixed(2)),
      mistakes: s.mistakes,
    }));
    const compact = list.map((a) => ({
      concept: a.concept,
      correct: a.is_correct,
      mistake: a.mistake_tag,
    }));

    const res = await callEngineCommand("ANALYZE_SESSION", {
      goal: data.goal,
      stats,
      attempts: compact,
    });

    const total = list.length;
    const correct = list.filter((a) => a.is_correct).length;
    return {
      data: {
        analysis: res.data ?? null,
        analysis_error: res.error ?? null,
        stats,
        total,
        correct,
      },
    };
  });

// ---- REWARD POINTS ---------------------------------------------------------
// Increments the signed-in user's profile points balance. Used to award 25
// points every time a learner completes another 5 questions in a session.
export const awardPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ amount: z.number().int().min(1).max(1000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("profiles")
      .select("points")
      .eq("user_id", userId)
      .maybeSingle();
    const current = existing?.points ?? 0;
    const next = current + data.amount;
    const { error } = await supabase
      .from("profiles")
      .update({ points: next })
      .eq("user_id", userId);
    if (error) return { error: error.message };
    return { data: { points: next, awarded: data.amount } };
  });

export const getProfilePoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("points")
      .eq("user_id", userId)
      .maybeSingle();
    return { points: data?.points ?? 0 };
  });

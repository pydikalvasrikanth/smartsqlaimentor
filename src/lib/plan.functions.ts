// Planner & mastery server functions. Each one is auth-protected via the
// requireSupabaseAuth middleware, so all queries run as the signed-in user
// and respect RLS.
//
// Thin wrapper only: all schemas, constants, helpers and handler bodies live in
// plan.server.ts so the Worker server-fn split can never drop siblings.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  GeneratePlanInput,
  InitPracticeInput,
  NextPracticeInput,
  RevealSolutionInput,
  LogAttemptInput,
  CompletePlanDayInput,
  PlanFocusInput,
  AnalyzeFocusInput,
  generatePlanImpl,
  getPlanStateImpl,
  getLearningStateImpl,
  initPracticeImpl,
  nextPracticeImpl,
  revealSolutionImpl,
  logAttemptImpl,
  completePlanDayImpl,
  planFocusImpl,
  analyzeFocusImpl,
  awardPointsImpl,
  getProfilePointsImpl,
} from "./plan.server";

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GeneratePlanInput.parse(input))
  .handler(async ({ data, context }) => generatePlanImpl(data, context));

export const getPlanState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getPlanStateImpl(context));

export const getLearningState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getLearningStateImpl(context));

export const initPractice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InitPracticeInput.parse(input))
  .handler(async ({ data, context }) => initPracticeImpl(data, context));

export const nextPractice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => NextPracticeInput.parse(input))
  .handler(async ({ data, context }) => nextPracticeImpl(data, context));

export const revealSolution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RevealSolutionInput.parse(input))
  .handler(async ({ data, context }) => revealSolutionImpl(data, context));

export const logAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LogAttemptInput.parse(input))
  .handler(async ({ data, context }) => logAttemptImpl(data, context));

export const completePlanDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CompletePlanDayInput.parse(input))
  .handler(async ({ data, context }) => completePlanDayImpl(data, context));

export const planFocus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PlanFocusInput.parse(input))
  .handler(async ({ data }) => planFocusImpl(data));

export const analyzeFocus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeFocusInput.parse(input))
  .handler(async ({ data, context }) => analyzeFocusImpl(data, context));

export const awardPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => awardPointsImpl(context));

export const getProfilePoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getProfilePointsImpl(context));

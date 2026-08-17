import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  interviewTurnImpl,
  interviewTranscribeImpl,
  interviewSpeakImpl,
  interviewReportImpl,
  interviewCorrectionsImpl,
  TurnInput,
  TranscribeInput,
  SpeakInput,
  ReportInput,
} from "./interview.server";

export const interviewTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TurnInput.parse(d))
  .handler(async ({ data }) => interviewTurnImpl(data));

export const interviewTranscribe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TranscribeInput.parse(d))
  .handler(async ({ data }) => interviewTranscribeImpl(data));

export const interviewSpeak = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SpeakInput.parse(d))
  .handler(async ({ data }) => interviewSpeakImpl(data));

export const interviewReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReportInput.parse(d))
  .handler(async ({ data }) => interviewReportImpl(data));

export const interviewCorrections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReportInput.parse(d))
  .handler(async ({ data }) => interviewCorrectionsImpl(data));

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Server-only implementation (prompts, gateway calls, payload schemas, and the
// Postgres-backed per-user rate limiter) lives in chat.server.ts.
import { ChatInput, chatImpl } from "./chat.server";

export const chat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ChatInput.parse(data))
  .handler(async ({ data, context }) => chatImpl(data, context.userId));

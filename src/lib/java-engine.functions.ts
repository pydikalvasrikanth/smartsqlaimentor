import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Server-only implementation (prompts, tool schemas, payload validation,
// gateway call, answer-key persistence) lives in java-engine.server.ts so it
// can never reach the client bundle and so the Worker's server-fn split can't
// drop sibling declarations.
import { InputSchema, runJavaEngineImpl } from "./java-engine.server";

export const runJavaEngine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => runJavaEngineImpl(data, context.userId));

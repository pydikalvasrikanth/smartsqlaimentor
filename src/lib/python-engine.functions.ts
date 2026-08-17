import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Server-only implementation (prompts, tool schemas, payload validation,
// gateway call, answer-key persistence) lives in python-engine.server.ts so it
// can never reach the client bundle and so the Worker's server-fn split can't
// drop sibling declarations.
import { InputSchema, runPythonEngineImpl } from "./python-engine.server";

export const runPythonEngine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => runPythonEngineImpl(data, context.userId));

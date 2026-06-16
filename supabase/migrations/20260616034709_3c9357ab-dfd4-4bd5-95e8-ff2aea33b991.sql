-- Remove Data API access to question_sessions; access is server-only via supabaseAdmin.
DROP POLICY IF EXISTS "question_sessions_own" ON public.question_sessions;
REVOKE ALL ON public.question_sessions FROM authenticated;
REVOKE ALL ON public.question_sessions FROM anon;
GRANT ALL ON public.question_sessions TO service_role;
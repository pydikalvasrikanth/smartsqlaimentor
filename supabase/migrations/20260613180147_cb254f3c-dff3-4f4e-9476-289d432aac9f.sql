REVOKE SELECT, INSERT, UPDATE, DELETE ON public.question_sessions FROM authenticated;
REVOKE SELECT ON public.question_sessions FROM anon;
DROP POLICY IF EXISTS "question_sessions_own" ON public.question_sessions;
DROP POLICY IF EXISTS "sessions_own" ON public.question_sessions;
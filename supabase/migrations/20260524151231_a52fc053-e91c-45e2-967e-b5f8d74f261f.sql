CREATE TABLE public.question_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic_slug text NOT NULL,
  concept text,
  difficulty skill_level NOT NULL,
  schema_sql text NOT NULL,
  seed_data_sql text NOT NULL,
  task text NOT NULL,
  expected_sql text NOT NULL,
  question_id_external integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.question_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY question_sessions_own ON public.question_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_question_sessions_user ON public.question_sessions(user_id, created_at DESC);
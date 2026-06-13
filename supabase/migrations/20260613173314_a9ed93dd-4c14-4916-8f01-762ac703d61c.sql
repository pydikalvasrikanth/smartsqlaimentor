CREATE TYPE public.skill_level AS ENUM ('beginner','intermediate','advanced','professional');

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END $$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  days INT NOT NULL CHECK (days BETWEEN 7 AND 180),
  target_level public.skill_level NOT NULL,
  subject text NOT NULL DEFAULT 'sql',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT practice_plans_subject_check CHECK (subject IN ('sql','python','gcp_de'))
);
CREATE INDEX practice_plans_user_active_idx ON public.practice_plans(user_id) WHERE active;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_plans TO authenticated;
GRANT ALL ON public.practice_plans TO service_role;
ALTER TABLE public.practice_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_own" ON public.practice_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.practice_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_index INT NOT NULL,
  topic_slug TEXT NOT NULL,
  target_concept TEXT NOT NULL,
  difficulty public.skill_level NOT NULL,
  subject text NOT NULL DEFAULT 'sql',
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE (plan_id, day_index),
  CONSTRAINT plan_days_subject_check CHECK (subject IN ('sql','python','gcp_de'))
);
CREATE INDEX plan_days_user_idx ON public.plan_days(user_id, plan_id, day_index);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_days TO authenticated;
GRANT ALL ON public.plan_days TO service_role;
ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_days_own" ON public.plan_days FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.topic_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_slug TEXT NOT NULL,
  current_tier public.skill_level NOT NULL DEFAULT 'beginner',
  subject text NOT NULL DEFAULT 'sql',
  questions_attempted INT NOT NULL DEFAULT 0,
  questions_correct INT NOT NULL DEFAULT 0,
  unlocked_intermediate BOOLEAN NOT NULL DEFAULT false,
  unlocked_advanced BOOLEAN NOT NULL DEFAULT false,
  unlocked_professional BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT topic_mastery_subject_check CHECK (subject IN ('sql','python','gcp_de'))
);
CREATE UNIQUE INDEX topic_mastery_user_subject_topic_uniq ON public.topic_mastery (user_id, subject, topic_slug);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topic_mastery TO authenticated;
GRANT ALL ON public.topic_mastery TO service_role;
ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mastery_own" ON public.topic_mastery FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER mastery_touch BEFORE UPDATE ON public.topic_mastery
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_slug TEXT NOT NULL,
  concept TEXT,
  difficulty public.skill_level NOT NULL,
  subject text NOT NULL DEFAULT 'sql',
  question_text TEXT,
  user_sql TEXT,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  mistake_tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT attempts_subject_check CHECK (subject IN ('sql','python','gcp_de'))
);
CREATE INDEX attempts_user_recent_idx ON public.attempts(user_id, created_at DESC);
CREATE INDEX attempts_user_concept_idx ON public.attempts(user_id, concept);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attempts TO authenticated;
GRANT ALL ON public.attempts TO service_role;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts_own" ON public.attempts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TABLE public.question_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT 'sql',
  topic_slug text NOT NULL,
  concept text,
  difficulty public.skill_level NOT NULL,
  schema_sql text,
  seed_data_sql text,
  task text NOT NULL,
  expected_sql text,
  payload jsonb,
  question_id_external integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_sessions_subject_check CHECK (subject IN ('sql','python','gcp_de'))
);
CREATE INDEX idx_question_sessions_user ON public.question_sessions(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_sessions TO authenticated;
GRANT ALL ON public.question_sessions TO service_role;
ALTER TABLE public.question_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY question_sessions_own ON public.question_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
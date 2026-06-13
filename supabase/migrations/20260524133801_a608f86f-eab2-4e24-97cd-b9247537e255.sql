CREATE TYPE public.skill_level AS ENUM ('beginner','intermediate','advanced','professional');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  days INT NOT NULL CHECK (days BETWEEN 7 AND 180),
  target_level public.skill_level NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX practice_plans_user_active_idx ON public.practice_plans(user_id) WHERE active;
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
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE (plan_id, day_index)
);
CREATE INDEX plan_days_user_idx ON public.plan_days(user_id, plan_id, day_index);
ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_days_own" ON public.plan_days FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.topic_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_slug TEXT NOT NULL,
  current_tier public.skill_level NOT NULL DEFAULT 'beginner',
  questions_attempted INT NOT NULL DEFAULT 0,
  questions_correct INT NOT NULL DEFAULT 0,
  unlocked_intermediate BOOLEAN NOT NULL DEFAULT false,
  unlocked_advanced BOOLEAN NOT NULL DEFAULT false,
  unlocked_professional BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_slug)
);
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
  question_text TEXT,
  user_sql TEXT,
  is_correct BOOLEAN NOT NULL,
  mistake_tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX attempts_user_recent_idx ON public.attempts(user_id, created_at DESC);
CREATE INDEX attempts_user_concept_idx ON public.attempts(user_id, concept);
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts_own" ON public.attempts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
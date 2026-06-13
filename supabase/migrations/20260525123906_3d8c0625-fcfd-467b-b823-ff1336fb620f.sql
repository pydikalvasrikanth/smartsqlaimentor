-- Add subject support to all user-data tables.
-- subject is one of: 'sql' | 'python' | 'gcp_de'. Existing rows keep 'sql'.

ALTER TABLE public.attempts        ADD COLUMN IF NOT EXISTS subject text NOT NULL DEFAULT 'sql';
ALTER TABLE public.practice_plans  ADD COLUMN IF NOT EXISTS subject text NOT NULL DEFAULT 'sql';
ALTER TABLE public.plan_days       ADD COLUMN IF NOT EXISTS subject text NOT NULL DEFAULT 'sql';
ALTER TABLE public.topic_mastery   ADD COLUMN IF NOT EXISTS subject text NOT NULL DEFAULT 'sql';
ALTER TABLE public.question_sessions ADD COLUMN IF NOT EXISTS subject text NOT NULL DEFAULT 'sql';

-- Constrain values
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attempts_subject_check') THEN
    ALTER TABLE public.attempts ADD CONSTRAINT attempts_subject_check CHECK (subject IN ('sql','python','gcp_de'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'practice_plans_subject_check') THEN
    ALTER TABLE public.practice_plans ADD CONSTRAINT practice_plans_subject_check CHECK (subject IN ('sql','python','gcp_de'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plan_days_subject_check') THEN
    ALTER TABLE public.plan_days ADD CONSTRAINT plan_days_subject_check CHECK (subject IN ('sql','python','gcp_de'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'topic_mastery_subject_check') THEN
    ALTER TABLE public.topic_mastery ADD CONSTRAINT topic_mastery_subject_check CHECK (subject IN ('sql','python','gcp_de'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'question_sessions_subject_check') THEN
    ALTER TABLE public.question_sessions ADD CONSTRAINT question_sessions_subject_check CHECK (subject IN ('sql','python','gcp_de'));
  END IF;
END $$;

-- Mastery uniqueness now scoped by subject.
ALTER TABLE public.topic_mastery DROP CONSTRAINT IF EXISTS topic_mastery_user_id_topic_slug_key;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='topic_mastery_user_subject_topic_uniq') THEN
    CREATE UNIQUE INDEX topic_mastery_user_subject_topic_uniq ON public.topic_mastery (user_id, subject, topic_slug);
  END IF;
END $$;

-- Make SQL-specific columns nullable for Python/GCP rows
ALTER TABLE public.question_sessions ALTER COLUMN schema_sql DROP NOT NULL;
ALTER TABLE public.question_sessions ALTER COLUMN seed_data_sql DROP NOT NULL;
ALTER TABLE public.question_sessions ALTER COLUMN expected_sql DROP NOT NULL;

-- Optional payload for non-SQL questions (Python starter code, GCP answer/explanation)
ALTER TABLE public.question_sessions ADD COLUMN IF NOT EXISTS payload jsonb;

-- Generic user-answer column (Python code, free-text); leaves existing user_sql intact.
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS user_answer text;
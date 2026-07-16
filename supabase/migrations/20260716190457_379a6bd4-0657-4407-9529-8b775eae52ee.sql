
ALTER TABLE public.question_sessions DROP CONSTRAINT question_sessions_subject_check;
ALTER TABLE public.question_sessions ADD CONSTRAINT question_sessions_subject_check CHECK (subject = ANY (ARRAY['sql','python','gcp_de','java']));

ALTER TABLE public.attempts DROP CONSTRAINT attempts_subject_check;
ALTER TABLE public.attempts ADD CONSTRAINT attempts_subject_check CHECK (subject = ANY (ARRAY['sql','python','gcp_de','java']));

ALTER TABLE public.practice_plans DROP CONSTRAINT practice_plans_subject_check;
ALTER TABLE public.practice_plans ADD CONSTRAINT practice_plans_subject_check CHECK (subject = ANY (ARRAY['sql','python','gcp_de','java']));

ALTER TABLE public.plan_days DROP CONSTRAINT plan_days_subject_check;
ALTER TABLE public.plan_days ADD CONSTRAINT plan_days_subject_check CHECK (subject = ANY (ARRAY['sql','python','gcp_de','java']));

ALTER TABLE public.topic_mastery DROP CONSTRAINT topic_mastery_subject_check;
ALTER TABLE public.topic_mastery ADD CONSTRAINT topic_mastery_subject_check CHECK (subject = ANY (ARRAY['sql','python','gcp_de','java']));

CREATE TABLE public.telegram_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  username text,
  first_name text,
  last_name text,
  language_code text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  message_count integer NOT NULL DEFAULT 1,
  UNIQUE(chat_id)
);

ALTER TABLE public.telegram_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to telegram_interactions" ON public.telegram_interactions
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
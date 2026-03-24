
CREATE TABLE public.telegram_config (
  id int PRIMARY KEY CHECK (id = 1),
  bot_token_encrypted text,
  bot_username text,
  bot_name text,
  is_connected boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_config (id) VALUES (1);

ALTER TABLE public.telegram_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to telegram_config"
ON public.telegram_config
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

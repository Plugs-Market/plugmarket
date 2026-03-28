
CREATE TABLE public.telegram_welcome (
  id integer PRIMARY KEY CHECK (id = 1),
  image_url text,
  message_text text NOT NULL DEFAULT 'Bienvenue ! 👋',
  buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_welcome (id) VALUES (1);

ALTER TABLE public.telegram_welcome ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to telegram_welcome"
  ON public.telegram_welcome
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

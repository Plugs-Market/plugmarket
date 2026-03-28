
ALTER TABLE public.telegram_welcome 
ADD COLUMN captcha_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN captcha_message text NOT NULL DEFAULT 'Veuillez entrer le code affiché dans l''image : {captcha}';

CREATE TABLE public.telegram_captcha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

CREATE INDEX idx_telegram_captcha_chat_id ON public.telegram_captcha (chat_id);

ALTER TABLE public.telegram_captcha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to telegram_captcha" ON public.telegram_captcha
FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

ALTER TABLE public.telegram_interactions
  ADD COLUMN is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN ban_reason text,
  ADD COLUMN ban_until timestamptz,
  ADD COLUMN banned_at timestamptz;
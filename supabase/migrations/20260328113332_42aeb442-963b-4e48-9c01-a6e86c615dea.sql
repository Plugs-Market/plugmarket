CREATE OR REPLACE FUNCTION public.track_telegram_interaction(
  p_chat_id bigint,
  p_username text DEFAULT NULL,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_language_code text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO telegram_interactions (chat_id, username, first_name, last_name, language_code)
  VALUES (p_chat_id, p_username, p_first_name, p_last_name, p_language_code)
  ON CONFLICT (chat_id) DO UPDATE SET
    username = COALESCE(EXCLUDED.username, telegram_interactions.username),
    first_name = COALESCE(EXCLUDED.first_name, telegram_interactions.first_name),
    last_name = COALESCE(EXCLUDED.last_name, telegram_interactions.last_name),
    language_code = COALESCE(EXCLUDED.language_code, telegram_interactions.language_code),
    last_seen_at = now(),
    message_count = telegram_interactions.message_count + 1;
END;
$$;
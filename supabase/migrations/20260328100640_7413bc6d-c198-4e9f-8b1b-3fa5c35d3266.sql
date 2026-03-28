INSERT INTO storage.buckets (id, name, public) VALUES ('telegram-images', 'telegram-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read telegram-images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'telegram-images');

CREATE POLICY "Service role manage telegram-images" ON storage.objects FOR ALL TO service_role USING (bucket_id = 'telegram-images') WITH CHECK (bucket_id = 'telegram-images');
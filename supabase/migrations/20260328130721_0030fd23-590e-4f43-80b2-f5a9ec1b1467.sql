
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product_reviews" ON public.product_reviews
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "deny_write_product_reviews" ON public.product_reviews
  FOR INSERT TO anon, authenticated WITH CHECK (false);

CREATE POLICY "deny_update_product_reviews" ON public.product_reviews
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_delete_product_reviews" ON public.product_reviews
  FOR DELETE TO anon, authenticated USING (false);

CREATE INDEX idx_product_reviews_product_id ON public.product_reviews (product_id);
CREATE INDEX idx_product_reviews_user_id ON public.product_reviews (user_id);

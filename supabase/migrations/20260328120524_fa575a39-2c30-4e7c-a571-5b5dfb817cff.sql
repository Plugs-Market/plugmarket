
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read product_variants" ON public.product_variants
  AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

-- Deny writes from client
CREATE POLICY "deny_write_product_variants" ON public.product_variants
  AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);

CREATE POLICY "deny_update_product_variants" ON public.product_variants
  AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_delete_product_variants" ON public.product_variants
  AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);

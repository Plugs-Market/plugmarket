
-- Junction table: product <-> category (many-to-many)
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  UNIQUE(product_id, category_id)
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_categories" ON public.product_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "No direct write product_categories" ON public.product_categories FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update product_categories" ON public.product_categories FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete product_categories" ON public.product_categories FOR DELETE TO anon, authenticated USING (false);

-- Junction table: product <-> subcategory (many-to-many)
CREATE TABLE public.product_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
  UNIQUE(product_id, subcategory_id)
);

ALTER TABLE public.product_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_subcategories" ON public.product_subcategories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "No direct write product_subcategories" ON public.product_subcategories FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update product_subcategories" ON public.product_subcategories FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete product_subcategories" ON public.product_subcategories FOR DELETE TO anon, authenticated USING (false);

-- Migrate existing single FK data to junction tables
INSERT INTO public.product_categories (product_id, category_id)
SELECT id, category_id FROM public.products WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.product_subcategories (product_id, subcategory_id)
SELECT id, subcategory_id FROM public.products WHERE subcategory_id IS NOT NULL
ON CONFLICT DO NOTHING;

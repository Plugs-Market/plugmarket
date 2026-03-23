
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

CREATE TABLE public.farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read subcategories" ON public.subcategories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read farms" ON public.farms FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "No direct write categories" ON public.categories FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update categories" ON public.categories FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete categories" ON public.categories FOR DELETE TO anon, authenticated USING (false);

CREATE POLICY "No direct write subcategories" ON public.subcategories FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update subcategories" ON public.subcategories FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete subcategories" ON public.subcategories FOR DELETE TO anon, authenticated USING (false);

CREATE POLICY "No direct write farms" ON public.farms FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update farms" ON public.farms FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete farms" ON public.farms FOR DELETE TO anon, authenticated USING (false);

-- Seed initial data
INSERT INTO public.categories (name, sort_order) VALUES
  ('Fleurs', 1), ('Résines', 2), ('Extraits', 3), ('Comestibles', 4);

INSERT INTO public.subcategories (category_id, name, sort_order)
SELECT c.id, s.name, s.sort_order FROM public.categories c
CROSS JOIN LATERAL (VALUES
  ('Indoor', 1), ('Outdoor', 2), ('Greenhouse', 3)
) AS s(name, sort_order) WHERE c.name = 'Fleurs';

INSERT INTO public.subcategories (category_id, name, sort_order)
SELECT c.id, s.name, s.sort_order FROM public.categories c
CROSS JOIN LATERAL (VALUES
  ('Hash', 1), ('Dry Sift', 2), ('Charas', 3)
) AS s(name, sort_order) WHERE c.name = 'Résines';

INSERT INTO public.subcategories (category_id, name, sort_order)
SELECT c.id, s.name, s.sort_order FROM public.categories c
CROSS JOIN LATERAL (VALUES
  ('Rosin', 1), ('BHO', 2), ('Distillat', 3)
) AS s(name, sort_order) WHERE c.name = 'Extraits';

INSERT INTO public.subcategories (category_id, name, sort_order)
SELECT c.id, s.name, s.sort_order FROM public.categories c
CROSS JOIN LATERAL (VALUES
  ('Gummies', 1), ('Chocolats', 2), ('Boissons', 3)
) AS s(name, sort_order) WHERE c.name = 'Comestibles';

INSERT INTO public.farms (name, sort_order) VALUES
  ('Calitefarm', 1), ('GreenHouse Co.', 2), ('Pacific Farms', 3), ('Mountain Top', 4);

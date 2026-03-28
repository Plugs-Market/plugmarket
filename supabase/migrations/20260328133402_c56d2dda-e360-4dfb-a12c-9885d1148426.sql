CREATE TABLE public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read faq_items" ON public.faq_items
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "deny_write_faq_items" ON public.faq_items
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_faq_items" ON public.faq_items
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_faq_items" ON public.faq_items
  FOR DELETE TO anon, authenticated USING (false);

INSERT INTO public.faq_items (question, answer, sort_order) VALUES
  ('Comment passer commande ?', 'Contactez-nous directement via la section Contact pour passer votre commande. Notre équipe vous répondra dans les plus brefs délais.', 0),
  ('Quels sont les délais de livraison ?', 'Les délais varient selon votre localisation. En général, comptez entre 2 et 5 jours ouvrés.', 1),
  ('Quels modes de paiement acceptez-vous ?', 'Nous acceptons plusieurs modes de paiement. Contactez-nous pour plus de détails.', 2),
  ('Proposez-vous des échantillons ?', 'Oui, sous certaines conditions. N''hésitez pas à nous contacter pour en savoir plus.', 3);
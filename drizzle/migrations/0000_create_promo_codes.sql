CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  percent integer NOT NULL DEFAULT 0 CHECK (percent >= 0 AND percent <= 100),
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  min_order_cents integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY promo_admin_all ON public.promo_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.orders ADD COLUMN promo_code text;
ALTER TABLE public.orders ADD COLUMN discount_cents integer NOT NULL DEFAULT 0;
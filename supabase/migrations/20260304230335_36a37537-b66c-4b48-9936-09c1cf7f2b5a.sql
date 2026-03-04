
-- Service categories table
CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read service_categories" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Admin manages service_categories" ON public.service_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Services table
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL,
  name_ar text NOT NULL,
  name_en text,
  description_ar text,
  default_price numeric DEFAULT 0,
  duration_min integer DEFAULT 15,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admin manages services" ON public.services FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Sponsor types table
CREATE TABLE public.sponsor_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  description_ar text,
  tier_level integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsor_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read sponsor_types" ON public.sponsor_types FOR SELECT USING (true);
CREATE POLICY "Admin manages sponsor_types" ON public.sponsor_types FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Sponsors table
CREATE TABLE public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_type_id uuid REFERENCES public.sponsor_types(id) ON DELETE SET NULL,
  name_ar text NOT NULL,
  name_en text,
  logo_url text,
  contact_name text,
  contact_phone text,
  contact_email text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read sponsors" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Admin manages sponsors" ON public.sponsors FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

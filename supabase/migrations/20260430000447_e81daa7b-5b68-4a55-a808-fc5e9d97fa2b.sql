-- ============================================================
-- Medical Marketplace: Procurement RFQ + Provider Catalog
-- ============================================================

-- 1) Catalog categories (shared taxonomy)
CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
  name_ar text NOT NULL,
  name_en text,
  kind text NOT NULL DEFAULT 'product', -- product | service | consultation | device
  icon text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalog categories public read" ON public.catalog_categories
  FOR SELECT USING (true);
CREATE POLICY "Admin manages catalog categories" ON public.catalog_categories
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) Provider catalog items (each provider's offered SKUs/services)
CREATE TABLE IF NOT EXISTS public.provider_catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,                                      -- providers.id OR clinics.id OR doctors.id (polymorphic by owner_type)
  owner_type text NOT NULL DEFAULT 'provider',                    -- provider | clinic | doctor
  category_id uuid REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
  name_ar text NOT NULL,
  name_en text,
  brand text,
  unit text,                                                      -- box, piece, ml, test, session...
  default_price numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'YER',
  lead_time_days int DEFAULT 0,
  stock_qty int,
  specs jsonb DEFAULT '{}'::jsonb,                                -- arbitrary attrs (size, voltage, dosage, etc.)
  tags text[] DEFAULT '{}',                                       -- free-text matching keywords
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pci_provider ON public.provider_catalog_items(provider_id);
CREATE INDEX IF NOT EXISTS idx_pci_category ON public.provider_catalog_items(category_id);
CREATE INDEX IF NOT EXISTS idx_pci_tags ON public.provider_catalog_items USING gin(tags);

ALTER TABLE public.provider_catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalog items public read active" ON public.provider_catalog_items
  FOR SELECT USING (is_active = true OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner manages own catalog" ON public.provider_catalog_items
  FOR ALL TO authenticated
  USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_catalog_items.provider_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.clinics c WHERE c.id = provider_catalog_items.provider_id AND c.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = provider_catalog_items.provider_id AND d.user_id = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TRIGGER trg_pci_updated_at
  BEFORE UPDATE ON public.provider_catalog_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3) Procurement enums
DO $$ BEGIN
  CREATE TYPE procurement_status AS ENUM (
    'draft','published','closed','awarded','fulfilled','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE procurement_bid_status AS ENUM (
    'submitted','shortlisted','accepted','rejected','withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE procurement_award_mode AS ENUM ('manual','auto_suggest','auto_award');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) Procurement requests (RFQ)
CREATE TABLE IF NOT EXISTS public.procurement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_code text NOT NULL UNIQUE DEFAULT ('RFQ-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  buyer_id uuid NOT NULL DEFAULT auth.uid(),         -- profiles.id
  buyer_org_type text,                                -- clinic | doctor | hospital | admin
  buyer_org_id uuid,                                  -- clinics.id / doctors.id (optional)
  title_ar text NOT NULL,
  description_ar text,
  category_kind text DEFAULT 'mixed',                 -- product | service | consultation | device | mixed
  delivery_city text,
  delivery_address text,
  budget_max numeric(12,2),
  currency text DEFAULT 'YER',
  closes_at timestamptz NOT NULL,
  status procurement_status NOT NULL DEFAULT 'draft',
  award_mode procurement_award_mode NOT NULL DEFAULT 'manual',
  award_weights jsonb NOT NULL DEFAULT '{"price":50,"rating":25,"speed":15,"coverage":10}'::jsonb,
  allow_partial_bids boolean NOT NULL DEFAULT true,
  awarded_bid_id uuid,
  awarded_at timestamptz,
  published_at timestamptz,
  attachments jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pr_status ON public.procurement_requests(status);
CREATE INDEX IF NOT EXISTS idx_pr_buyer ON public.procurement_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_pr_closes ON public.procurement_requests(closes_at);

ALTER TABLE public.procurement_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyer manages own RFQ" ON public.procurement_requests
  FOR ALL TO authenticated
  USING (buyer_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (buyer_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Authenticated reads published RFQ" ON public.procurement_requests
  FOR SELECT TO authenticated
  USING (status IN ('published','closed','awarded','fulfilled') OR buyer_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_pr_updated_at
  BEFORE UPDATE ON public.procurement_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5) Procurement request items (line items)
CREATE TABLE IF NOT EXISTS public.procurement_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.procurement_requests(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
  name_ar text NOT NULL,
  brand_preferred text,
  unit text,
  qty numeric(12,2) NOT NULL DEFAULT 1,
  specs jsonb DEFAULT '{}'::jsonb,
  notes text,
  position int DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pri_request ON public.procurement_request_items(request_id);

ALTER TABLE public.procurement_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RFQ items follow request" ON public.procurement_request_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.procurement_requests pr WHERE pr.id = request_id AND (pr.buyer_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.procurement_requests pr WHERE pr.id = request_id AND (pr.buyer_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role))));

CREATE POLICY "Auth reads items of visible RFQ" ON public.procurement_request_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.procurement_requests pr WHERE pr.id = request_id AND pr.status IN ('published','closed','awarded','fulfilled')));

-- 6) Procurement bids
CREATE TABLE IF NOT EXISTS public.procurement_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.procurement_requests(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL DEFAULT auth.uid(),
  bidder_org_type text,                          -- provider | clinic | pharmacy | lab
  bidder_org_id uuid,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'YER',
  delivery_days int,                             -- promised lead time
  warranty_months int,
  payment_terms text,
  coverage_pct numeric(5,2) DEFAULT 100,         -- % of requested items covered
  notes text,
  attachments jsonb DEFAULT '[]'::jsonb,
  status procurement_bid_status NOT NULL DEFAULT 'submitted',
  score numeric(6,2),                            -- computed by auto-award
  rejected_reason text,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pb_request ON public.procurement_bids(request_id);
CREATE INDEX IF NOT EXISTS idx_pb_bidder ON public.procurement_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_pb_status ON public.procurement_bids(status);

ALTER TABLE public.procurement_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bidder manages own bid" ON public.procurement_bids
  FOR ALL TO authenticated
  USING (bidder_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (bidder_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Buyer reads bids on own RFQ" ON public.procurement_bids
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.procurement_requests pr WHERE pr.id = request_id AND pr.buyer_id = auth.uid()));

CREATE POLICY "Buyer can shortlist/accept bid" ON public.procurement_bids
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.procurement_requests pr WHERE pr.id = request_id AND pr.buyer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.procurement_requests pr WHERE pr.id = request_id AND pr.buyer_id = auth.uid()));

CREATE TRIGGER trg_pb_updated_at
  BEFORE UPDATE ON public.procurement_bids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 7) Procurement bid lines (per-item pricing for partial bids)
CREATE TABLE IF NOT EXISTS public.procurement_bid_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id uuid NOT NULL REFERENCES public.procurement_bids(id) ON DELETE CASCADE,
  request_item_id uuid NOT NULL REFERENCES public.procurement_request_items(id) ON DELETE CASCADE,
  catalog_item_id uuid REFERENCES public.provider_catalog_items(id) ON DELETE SET NULL,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  qty_offered numeric(12,2) NOT NULL DEFAULT 0,
  brand_offered text,
  notes text,
  UNIQUE (bid_id, request_item_id)
);

CREATE INDEX IF NOT EXISTS idx_pbl_bid ON public.procurement_bid_lines(bid_id);

ALTER TABLE public.procurement_bid_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bid lines follow bid" ON public.procurement_bid_lines
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.procurement_bids pb WHERE pb.id = bid_id AND (pb.bidder_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR EXISTS (SELECT 1 FROM public.procurement_requests pr WHERE pr.id = pb.request_id AND pr.buyer_id = auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.procurement_bids pb WHERE pb.id = bid_id AND (pb.bidder_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role))));

-- 8) Notifications log (who got notified, for audit + dedupe)
CREATE TABLE IF NOT EXISTS public.procurement_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.procurement_requests(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL,
  matched_items_count int DEFAULT 0,
  match_details jsonb DEFAULT '{}'::jsonb,
  channel text DEFAULT 'in_app',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, recipient_user_id, channel)
);

ALTER TABLE public.procurement_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipient or admin reads notif log" ON public.procurement_notifications
  FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Auth inserts notif log" ON public.procurement_notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 9) Reviews (post-fulfillment ratings)
CREATE TABLE IF NOT EXISTS public.procurement_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.procurement_requests(id) ON DELETE CASCADE,
  bid_id uuid NOT NULL REFERENCES public.procurement_bids(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL DEFAULT auth.uid(),
  reviewee_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, reviewer_id)
);

ALTER TABLE public.procurement_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads reviews" ON public.procurement_reviews
  FOR SELECT USING (true);
CREATE POLICY "Buyer creates review on awarded bid" ON public.procurement_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.procurement_requests pr
      WHERE pr.id = request_id AND pr.buyer_id = auth.uid() AND pr.awarded_bid_id = bid_id
    )
  );

-- 10) Auto-publish trigger: set published_at on status change
CREATE OR REPLACE FUNCTION public.handle_procurement_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  IF NEW.status = 'awarded' AND OLD.status IS DISTINCT FROM 'awarded' AND NEW.awarded_at IS NULL THEN
    NEW.awarded_at := now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_procurement_status ON public.procurement_requests;
CREATE TRIGGER trg_procurement_status
  BEFORE UPDATE ON public.procurement_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_procurement_status_change();

-- 11) Compute total_amount on bid lines change
CREATE OR REPLACE FUNCTION public.recalc_bid_total()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_bid uuid;
BEGIN
  v_bid := COALESCE(NEW.bid_id, OLD.bid_id);
  UPDATE public.procurement_bids
    SET total_amount = COALESCE((SELECT SUM(unit_price * qty_offered) FROM public.procurement_bid_lines WHERE bid_id = v_bid), 0)
  WHERE id = v_bid;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_bid_total ON public.procurement_bid_lines;
CREATE TRIGGER trg_bid_total
  AFTER INSERT OR UPDATE OR DELETE ON public.procurement_bid_lines
  FOR EACH ROW EXECUTE FUNCTION public.recalc_bid_total();

-- 12) Award helper RPC (used by UI and edge function)
CREATE OR REPLACE FUNCTION public.award_procurement_bid(_request_id uuid, _bid_id uuid, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pr procurement_requests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success',false,'error','unauthenticated'); END IF;
  SELECT * INTO v_pr FROM procurement_requests WHERE id = _request_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'error','not_found'); END IF;
  IF v_pr.buyer_id <> auth.uid() AND NOT has_role(auth.uid(),'admin'::app_role) THEN
    RETURN jsonb_build_object('success',false,'error','forbidden');
  END IF;
  IF v_pr.status NOT IN ('published','closed') THEN
    RETURN jsonb_build_object('success',false,'error','invalid_state');
  END IF;
  UPDATE procurement_bids SET status = 'rejected', rejected_reason = COALESCE(rejected_reason,'not selected') WHERE request_id = _request_id AND id <> _bid_id AND status NOT IN ('withdrawn','rejected');
  UPDATE procurement_bids SET status = 'accepted' WHERE id = _bid_id;
  UPDATE procurement_requests SET status = 'awarded', awarded_bid_id = _bid_id, awarded_at = now() WHERE id = _request_id;
  RETURN jsonb_build_object('success',true,'bid_id',_bid_id);
END $$;

-- 13) Compute auto-award score (returns ranked bids)
CREATE OR REPLACE FUNCTION public.score_procurement_bids(_request_id uuid)
RETURNS TABLE (bid_id uuid, bidder_id uuid, total_amount numeric, score numeric) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pr procurement_requests%ROWTYPE;
  v_w jsonb;
  v_min_price numeric; v_max_price numeric;
  v_max_speed int;
BEGIN
  SELECT * INTO v_pr FROM procurement_requests WHERE id = _request_id;
  IF NOT FOUND THEN RETURN; END IF;
  v_w := v_pr.award_weights;

  SELECT MIN(total_amount), MAX(total_amount), MAX(COALESCE(delivery_days,0))
    INTO v_min_price, v_max_price, v_max_speed
  FROM procurement_bids WHERE request_id = _request_id AND status IN ('submitted','shortlisted');

  RETURN QUERY
  SELECT pb.id, pb.bidder_id, pb.total_amount,
    ROUND(
      ( (v_w->>'price')::numeric  * CASE WHEN v_max_price = v_min_price THEN 1 ELSE (v_max_price - pb.total_amount) / NULLIF(v_max_price - v_min_price,0) END )
    + ( (v_w->>'speed')::numeric  * CASE WHEN v_max_speed = 0 THEN 1 ELSE (v_max_speed - COALESCE(pb.delivery_days,0))::numeric / NULLIF(v_max_speed,0) END )
    + ( (v_w->>'coverage')::numeric * COALESCE(pb.coverage_pct,0)/100 )
    + ( (v_w->>'rating')::numeric * COALESCE((SELECT AVG(rating) FROM procurement_reviews pr WHERE pr.reviewee_id = pb.bidder_id),3)/5 )
    , 2)::numeric AS score
  FROM procurement_bids pb
  WHERE pb.request_id = _request_id AND pb.status IN ('submitted','shortlisted')
  ORDER BY score DESC;
END $$;

-- Seed core categories
INSERT INTO public.catalog_categories (name_ar, name_en, kind, sort_order) VALUES
  ('أدوية', 'Pharmaceuticals', 'product', 1),
  ('مستلزمات طبية', 'Medical Supplies', 'product', 2),
  ('أجهزة طبية', 'Medical Devices', 'device', 3),
  ('خدمات مختبرات', 'Lab Services', 'service', 4),
  ('خدمات الأشعة', 'Imaging Services', 'service', 5),
  ('نقل المرضى', 'Patient Transport', 'service', 6),
  ('استشارات طبية', 'Medical Consultations', 'consultation', 7),
  ('خدمات تمريضية', 'Nursing Services', 'service', 8)
ON CONFLICT DO NOTHING;

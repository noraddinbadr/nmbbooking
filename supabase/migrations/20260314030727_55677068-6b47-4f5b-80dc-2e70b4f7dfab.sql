
-- ============================================================
-- MS-RAG Module: Medical Services Reverse Auction & Grants
-- ============================================================

-- 1. Enums
CREATE TYPE public.auction_initiator_type AS ENUM ('doctor', 'patient', 'admin');
CREATE TYPE public.auction_request_status AS ENUM (
  'draft', 'pending_doctor', 'pending_patient_consent', 'pending_admin', 
  'published', 'awarded', 'fulfilled', 'cancelled'
);
CREATE TYPE public.auction_bid_type AS ENUM ('full_coverage', 'partial', 'split');
CREATE TYPE public.auction_bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- 2. Auction Settings (singleton governance config)
CREATE TABLE public.auction_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  can_patient_post_directly BOOLEAN NOT NULL DEFAULT false,
  require_doctor_signature BOOLEAN NOT NULL DEFAULT true,
  require_patient_otp_consent BOOLEAN NOT NULL DEFAULT true,
  require_social_report BOOLEAN NOT NULL DEFAULT false,
  auto_publish_after_verify BOOLEAN NOT NULL DEFAULT false,
  default_patient_action TEXT NOT NULL DEFAULT 'require_doctor',
  bid_duration_hours INTEGER NOT NULL DEFAULT 72,
  max_bids_per_request INTEGER NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default settings row
INSERT INTO public.auction_settings (id) VALUES (gen_random_uuid());

-- 3. Auction Requests
CREATE TABLE public.auction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  initiator_id UUID NOT NULL,
  initiator_type public.auction_initiator_type NOT NULL DEFAULT 'doctor',
  status public.auction_request_status NOT NULL DEFAULT 'draft',
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  diagnosis_code TEXT,
  diagnosis_summary TEXT,
  treatment_plan TEXT,
  medical_priority INTEGER NOT NULL DEFAULT 3 CHECK (medical_priority BETWEEN 1 AND 5),
  estimated_cost NUMERIC NOT NULL DEFAULT 0,
  funded_amount NUMERIC NOT NULL DEFAULT 0,
  anonymization_level INTEGER NOT NULL DEFAULT 2 CHECK (anonymization_level BETWEEN 0 AND 3),
  poverty_score INTEGER CHECK (poverty_score IS NULL OR (poverty_score BETWEEN 0 AND 100)),
  specialty TEXT,
  city TEXT,
  camp_id UUID REFERENCES public.medical_camps(id),
  doctor_id UUID REFERENCES public.doctors(id),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Auction Verifications
CREATE TABLE public.auction_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.auction_requests(id) ON DELETE CASCADE,
  verified_by UUID NOT NULL,
  verification_type TEXT NOT NULL DEFAULT 'medical',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Auction Consents
CREATE TABLE public.auction_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.auction_requests(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_method TEXT DEFAULT 'digital',
  consented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Auction Bids
CREATE TABLE public.auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.auction_requests(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id),
  bidder_id UUID NOT NULL,
  bid_type public.auction_bid_type NOT NULL DEFAULT 'full_coverage',
  status public.auction_bid_status NOT NULL DEFAULT 'pending',
  amount NUMERIC NOT NULL DEFAULT 0,
  coverage_details JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Auction State Log (immutable audit trail)
CREATE TABLE public.auction_state_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.auction_requests(id) ON DELETE CASCADE,
  from_status public.auction_request_status,
  to_status public.auction_request_status NOT NULL,
  changed_by UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.auction_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_state_log ENABLE ROW LEVEL SECURITY;

-- auction_settings: admin only write, authenticated read
CREATE POLICY "Admin manages auction_settings" ON public.auction_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth reads auction_settings" ON public.auction_settings
  FOR SELECT TO authenticated USING (true);

-- auction_requests
CREATE POLICY "Creator manages own requests" ON public.auction_requests
  FOR ALL TO authenticated USING (initiator_id = auth.uid() OR patient_id = auth.uid());
CREATE POLICY "Admin manages all requests" ON public.auction_requests
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Doctor views for verification" ON public.auction_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Provider views published" ON public.auction_requests
  FOR SELECT TO authenticated USING (status = 'published');

-- auction_verifications
CREATE POLICY "Verifier manages own" ON public.auction_verifications
  FOR ALL TO authenticated USING (verified_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Request owner reads verifications" ON public.auction_verifications
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.auction_requests ar WHERE ar.id = request_id AND (ar.initiator_id = auth.uid() OR ar.patient_id = auth.uid()))
  );

-- auction_consents
CREATE POLICY "Patient manages own consent" ON public.auction_consents
  FOR ALL TO authenticated USING (patient_id = auth.uid());
CREATE POLICY "Admin reads consents" ON public.auction_consents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- auction_bids
CREATE POLICY "Bidder manages own bids" ON public.auction_bids
  FOR ALL TO authenticated USING (bidder_id = auth.uid());
CREATE POLICY "Request owner reads bids" ON public.auction_bids
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.auction_requests ar WHERE ar.id = request_id AND (ar.initiator_id = auth.uid() OR ar.patient_id = auth.uid()))
  );
CREATE POLICY "Admin manages all bids" ON public.auction_bids
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- auction_state_log (immutable - insert only + read)
CREATE POLICY "Auth inserts state log" ON public.auction_state_log
  FOR INSERT TO authenticated WITH CHECK (changed_by = auth.uid());
CREATE POLICY "Auth reads state log" ON public.auction_state_log
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.auction_requests ar WHERE ar.id = request_id AND (ar.initiator_id = auth.uid() OR ar.patient_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'doctor')
  );

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-update updated_at
CREATE TRIGGER trg_auction_requests_updated_at
  BEFORE UPDATE ON public.auction_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_auction_bids_updated_at
  BEFORE UPDATE ON public.auction_bids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_auction_settings_updated_at
  BEFORE UPDATE ON public.auction_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- State change audit log trigger
CREATE OR REPLACE FUNCTION public.log_auction_state_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.auction_state_log (request_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auction_state_log
  AFTER UPDATE ON public.auction_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_auction_state_change();

-- Enable realtime for auction_requests and auction_bids
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;

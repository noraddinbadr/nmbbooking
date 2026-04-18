-- Drop policies that reference soon-to-be-dropped columns
DROP POLICY IF EXISTS "Creator manages own requests" ON public.auction_requests;
DROP POLICY IF EXISTS "Request owner reads verifications" ON public.auction_verifications;
DROP POLICY IF EXISTS "Auth reads state log" ON public.auction_state_log;
DROP POLICY IF EXISTS "Request owner reads bids" ON public.auction_bids;

-- 1) Drop the duplicated bids table
DROP TABLE IF EXISTS public.auction_bids CASCADE;

-- 2) Extend donations to support bids
DO $$ BEGIN
  CREATE TYPE public.donation_kind AS ENUM ('donation', 'bid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS kind public.donation_kind NOT NULL DEFAULT 'donation',
  ADD COLUMN IF NOT EXISTS bid_type public.auction_bid_type NULL,
  ADD COLUMN IF NOT EXISTS bid_status public.auction_bid_status NULL,
  ADD COLUMN IF NOT EXISTS provider_id uuid NULL,
  ADD COLUMN IF NOT EXISTS coverage_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notes text NULL,
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_donations_case_kind ON public.donations(case_id, kind);
CREATE INDEX IF NOT EXISTS idx_donations_provider ON public.donations(provider_id);

-- 3) Slim auction_requests
ALTER TABLE public.auction_requests
  DROP COLUMN IF EXISTS title_ar,
  DROP COLUMN IF EXISTS title_en,
  DROP COLUMN IF EXISTS description_ar,
  DROP COLUMN IF EXISTS description_en,
  DROP COLUMN IF EXISTS diagnosis_code,
  DROP COLUMN IF EXISTS diagnosis_summary,
  DROP COLUMN IF EXISTS treatment_plan,
  DROP COLUMN IF EXISTS estimated_cost,
  DROP COLUMN IF EXISTS funded_amount,
  DROP COLUMN IF EXISTS anonymization_level,
  DROP COLUMN IF EXISTS poverty_score,
  DROP COLUMN IF EXISTS specialty,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS camp_id,
  DROP COLUMN IF EXISTS doctor_id,
  DROP COLUMN IF EXISTS patient_id;

ALTER TABLE public.auction_requests
  ADD COLUMN IF NOT EXISTS case_id uuid REFERENCES public.medical_cases(id) ON DELETE CASCADE;

-- Make case_id required after deletion of orphaned rows (table is empty in dev)
DELETE FROM public.auction_requests WHERE case_id IS NULL;
ALTER TABLE public.auction_requests ALTER COLUMN case_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_auction_requests_case ON public.auction_requests(case_id);
CREATE INDEX IF NOT EXISTS idx_auction_requests_status ON public.auction_requests(status);

-- 4) Extend medical_cases with the relocated fields
ALTER TABLE public.medical_cases
  ADD COLUMN IF NOT EXISTS title_ar text,
  ADD COLUMN IF NOT EXISTS diagnosis_code text,
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES public.doctors(id),
  ADD COLUMN IF NOT EXISTS camp_id uuid REFERENCES public.medical_camps(id),
  ADD COLUMN IF NOT EXISTS patient_id uuid,
  ADD COLUMN IF NOT EXISTS medical_priority integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS poverty_score integer,
  ADD COLUMN IF NOT EXISTS anonymization_level integer NOT NULL DEFAULT 2;

-- 5) Recreate RLS policies traversing via case
CREATE POLICY "Creator manages own requests" ON public.auction_requests
  FOR ALL TO authenticated
  USING (
    initiator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.medical_cases mc
      WHERE mc.id = auction_requests.case_id
        AND (mc.created_by = auth.uid() OR mc.patient_id = auth.uid())
    )
  );

CREATE POLICY "Request owner reads verifications" ON public.auction_verifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.auction_requests ar
      JOIN public.medical_cases mc ON mc.id = ar.case_id
      WHERE ar.id = auction_verifications.request_id
        AND (ar.initiator_id = auth.uid() OR mc.created_by = auth.uid() OR mc.patient_id = auth.uid())
    )
  );

CREATE POLICY "Auth reads state log" ON public.auction_state_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.auction_requests ar
      JOIN public.medical_cases mc ON mc.id = ar.case_id
      WHERE ar.id = auction_state_log.request_id
        AND (ar.initiator_id = auth.uid() OR mc.created_by = auth.uid() OR mc.patient_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'doctor'::app_role)
  );

DROP POLICY IF EXISTS "Patient manages own consent" ON public.auction_consents;
CREATE POLICY "Patient manages own consent" ON public.auction_consents
  FOR ALL TO authenticated
  USING (
    patient_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.auction_requests ar
      JOIN public.medical_cases mc ON mc.id = ar.case_id
      WHERE ar.id = auction_consents.request_id AND mc.created_by = auth.uid()
    )
  );

-- 6) Trigger: keep medical_cases.funded_amount in sync with received donations / accepted bids
CREATE OR REPLACE FUNCTION public.sync_case_funded_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.case_id IS NOT NULL THEN
    UPDATE public.medical_cases mc
    SET funded_amount = COALESCE((
      SELECT SUM(amount) FROM public.donations
      WHERE case_id = NEW.case_id
        AND (status IN ('received','verified') OR bid_status = 'accepted')
    ), 0)
    WHERE mc.id = NEW.case_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_case_funded ON public.donations;
CREATE TRIGGER trg_sync_case_funded
  AFTER INSERT OR UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.sync_case_funded_amount();
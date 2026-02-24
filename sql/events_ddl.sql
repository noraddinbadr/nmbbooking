-- ============================================================
-- Sehtak (صحتك) — Medical Events / Camps Module DDL
-- Supabase/PostgreSQL compatible
-- ============================================================

-- ============ ENUMS ============

CREATE TYPE public.app_role AS ENUM ('admin','doctor','clinic_admin','staff','patient','donor','provider');
CREATE TYPE public.camp_status AS ENUM ('draft','published','active','completed','cancelled');
CREATE TYPE public.registration_status AS ENUM ('held','confirmed','checked_in','completed','expired','cancelled');
CREATE TYPE public.case_status AS ENUM ('open','funded','partially_funded','in_treatment','closed');
CREATE TYPE public.donation_status AS ENUM ('pledged','received','verified','refunded');
CREATE TYPE public.order_status AS ENUM ('pending','received','sample_taken','results_uploaded','delivered');

-- ============ TABLES ============

-- 1. user_roles (RBAC — separate from profiles per security rules)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. user_profiles (family members under same auth user)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male','female')),
  date_of_birth DATE,
  relationship TEXT DEFAULT 'self', -- self | spouse | child | parent | other
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. clinics
CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- 4. clinic_doctors
CREATE TABLE IF NOT EXISTS public.clinic_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  specialty TEXT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE (clinic_id, doctor_id)
);

-- 5. clinic_staff (permissions JSON for granular access)
CREATE TABLE IF NOT EXISTS public.clinic_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permissions JSONB DEFAULT '{"manage_bookings":true,"view_patients":false,"manage_events":false}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  UNIQUE (clinic_id, user_id)
);

-- 6. medical_camps (core events table)
CREATE TABLE IF NOT EXISTS public.medical_camps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  clinic_id UUID REFERENCES public.clinics(id),
  organizer_id UUID REFERENCES auth.users(id) NOT NULL,
  location_name TEXT NOT NULL,
  location_city TEXT NOT NULL,
  location_coords POINT,
  status camp_status DEFAULT 'draft',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_capacity INT NOT NULL DEFAULT 100,
  services JSONB DEFAULT '[]'::jsonb, -- e.g. ["general","cardiology","ophthalmology"]
  sponsors JSONB DEFAULT '[]'::jsonb, -- [{name, logo_url, tier}]
  cover_image TEXT,
  is_free BOOLEAN DEFAULT true,
  target_fund NUMERIC(12,2) DEFAULT 0,
  raised_fund NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.medical_camps ENABLE ROW LEVEL SECURITY;

-- 7. event_schedules (time slots per camp per day)
CREATE TABLE IF NOT EXISTS public.event_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID REFERENCES public.medical_camps(id) ON DELETE CASCADE NOT NULL,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'general',
  total_slots INT NOT NULL DEFAULT 20,
  available_slots INT NOT NULL DEFAULT 20,
  location_note TEXT,
  CHECK (available_slots >= 0),
  CHECK (available_slots <= total_slots)
);
ALTER TABLE public.event_schedules ENABLE ROW LEVEL SECURITY;

-- 8. registrations (with hold pattern)
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID REFERENCES public.medical_camps(id) ON DELETE CASCADE NOT NULL,
  schedule_id UUID REFERENCES public.event_schedules(id) ON DELETE CASCADE NOT NULL,
  booked_by UUID REFERENCES auth.users(id) NOT NULL,
  patient_profile_id UUID REFERENCES public.user_profiles(id),
  patient_info JSONB, -- for non-registered patients: {name, phone, gender, age}
  status registration_status DEFAULT 'held',
  hold_token UUID DEFAULT gen_random_uuid(),
  hold_expires_at TIMESTAMPTZ DEFAULT (now() + interval '5 minutes'),
  case_code TEXT UNIQUE DEFAULT ('C-' || substr(gen_random_uuid()::text, 1, 8)),
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reg_hold ON public.registrations(status, hold_expires_at) WHERE status = 'held';
CREATE INDEX idx_reg_camp ON public.registrations(camp_id, status);

-- 9. cases (anonymized patient cases for sponsorship)
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.registrations(id),
  case_code TEXT NOT NULL,
  diagnosis_summary TEXT,
  treatment_plan TEXT,
  estimated_cost NUMERIC(12,2) DEFAULT 0,
  funded_amount NUMERIC(12,2) DEFAULT 0,
  status case_status DEFAULT 'open',
  is_anonymous BOOLEAN DEFAULT true,
  patient_age INT,
  patient_gender TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- 10. donations
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id),
  camp_id UUID REFERENCES public.medical_camps(id),
  donor_id UUID REFERENCES auth.users(id),
  donor_name TEXT,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT DEFAULT 'bank_transfer', -- bank_transfer | wallet | cash
  payment_reference TEXT,
  status donation_status DEFAULT 'pledged',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- 11. providers (labs, pharmacies, imaging centers)
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  type TEXT NOT NULL CHECK (type IN ('lab','pharmacy','imaging','supplies')),
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- 12. provider_orders
CREATE TABLE IF NOT EXISTS public.provider_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) NOT NULL,
  camp_id UUID REFERENCES public.medical_camps(id),
  registration_id UUID REFERENCES public.registrations(id),
  order_type TEXT NOT NULL, -- lab_test | medicine | imaging
  order_details JSONB NOT NULL,
  status order_status DEFAULT 'pending',
  results_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.provider_orders ENABLE ROW LEVEL SECURITY;

-- 13. event_logs (audit trail)
CREATE TABLE IF NOT EXISTS public.event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- camp | registration | case | donation | order
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- created | updated | held | confirmed | expired | checked_in | donated
  actor_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ SECURITY DEFINER FUNCTIONS ============

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============ ATOMIC BOOKING FUNCTION ============
-- Pattern: single UPDATE with WHERE available > 0, then INSERT registration
-- This prevents race conditions without explicit locks

CREATE OR REPLACE FUNCTION public.hold_event_slot(
  _camp_id UUID,
  _schedule_id UUID,
  _booked_by UUID,
  _patient_profile_id UUID DEFAULT NULL,
  _patient_info JSONB DEFAULT NULL
)
RETURNS TABLE(registration_id UUID, hold_token UUID, hold_expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _reg_id UUID;
  _token UUID;
  _expires TIMESTAMPTZ;
  _updated_rows INT;
BEGIN
  -- Atomic decrement: only succeeds if available_slots > 0
  UPDATE event_schedules
  SET available_slots = available_slots - 1
  WHERE id = _schedule_id
    AND camp_id = _camp_id
    AND available_slots > 0;

  GET DIAGNOSTICS _updated_rows = ROW_COUNT;

  IF _updated_rows = 0 THEN
    RAISE EXCEPTION 'no_slots' USING ERRCODE = 'P0001';
  END IF;

  _token := gen_random_uuid();
  _expires := now() + interval '5 minutes';

  INSERT INTO registrations (
    camp_id, schedule_id, booked_by,
    patient_profile_id, patient_info,
    status, hold_token, hold_expires_at
  ) VALUES (
    _camp_id, _schedule_id, _booked_by,
    _patient_profile_id, _patient_info,
    'held', _token, _expires
  ) RETURNING id INTO _reg_id;

  -- Audit log
  INSERT INTO event_logs (entity_type, entity_id, action, actor_id, metadata)
  VALUES ('registration', _reg_id, 'held', _booked_by,
    jsonb_build_object('schedule_id', _schedule_id, 'hold_token', _token));

  RETURN QUERY SELECT _reg_id, _token, _expires;
END;
$$;

-- ============ CONFIRM HOLD FUNCTION ============

CREATE OR REPLACE FUNCTION public.confirm_hold(
  _registration_id UUID,
  _hold_token UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated INT;
BEGIN
  UPDATE registrations
  SET status = 'confirmed', updated_at = now()
  WHERE id = _registration_id
    AND hold_token = _hold_token
    AND status = 'held'
    AND hold_expires_at > now();

  GET DIAGNOSTICS _updated = ROW_COUNT;

  IF _updated = 0 THEN
    RETURN false;
  END IF;

  INSERT INTO event_logs (entity_type, entity_id, action, metadata)
  VALUES ('registration', _registration_id, 'confirmed',
    jsonb_build_object('hold_token', _hold_token));

  RETURN true;
END;
$$;

-- ============ RECLAIM EXPIRED HOLDS ============

CREATE OR REPLACE FUNCTION public.reclaim_expired_holds()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INT := 0;
  _rec RECORD;
BEGIN
  FOR _rec IN
    SELECT id, schedule_id FROM registrations
    WHERE status = 'held' AND hold_expires_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE registrations SET status = 'expired', updated_at = now() WHERE id = _rec.id;
    UPDATE event_schedules SET available_slots = available_slots + 1 WHERE id = _rec.schedule_id;
    INSERT INTO event_logs (entity_type, entity_id, action, metadata)
    VALUES ('registration', _rec.id, 'expired', '{"reason":"hold_ttl_exceeded"}'::jsonb);
    _count := _count + 1;
  END LOOP;
  RETURN _count;
END;
$$;

-- ============ RLS POLICIES (BASIC) ============

-- medical_camps: anyone can read published, organizers can manage
CREATE POLICY "camps_read" ON public.medical_camps FOR SELECT USING (status != 'draft' OR organizer_id = auth.uid());
CREATE POLICY "camps_manage" ON public.medical_camps FOR ALL USING (
  organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);

-- registrations: booked_by can read own, admin/staff can read all for camp
CREATE POLICY "reg_own" ON public.registrations FOR SELECT USING (booked_by = auth.uid());
CREATE POLICY "reg_admin" ON public.registrations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- cases: anonymized public read, creator manages
CREATE POLICY "cases_read" ON public.cases FOR SELECT USING (is_anonymous = true OR created_by = auth.uid());
CREATE POLICY "cases_manage" ON public.cases FOR ALL USING (
  created_by = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor')
);

-- donations: donor reads own, admin reads all
CREATE POLICY "donations_own" ON public.donations FOR SELECT USING (donor_id = auth.uid());
CREATE POLICY "donations_admin" ON public.donations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============ ATOMIC BOOKING SQL EXAMPLES (for reference) ============

/*
-- PATTERN 1: Single-statement atomic decrement
UPDATE event_schedules
SET available_slots = available_slots - 1
WHERE id = $1 AND available_slots > 0
RETURNING *;

-- PATTERN 2: Explicit transaction with SELECT FOR UPDATE
BEGIN;
  SELECT available_slots FROM event_schedules WHERE id = $1 FOR UPDATE;
  -- application checks if available_slots > 0
  UPDATE event_schedules SET available_slots = available_slots - 1 WHERE id = $1;
  INSERT INTO registrations (...) VALUES (...) RETURNING id;
COMMIT;
*/

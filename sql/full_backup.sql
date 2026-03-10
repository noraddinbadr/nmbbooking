-- ============================================================
-- صحتك (Sihhatak) — Full Database Backup
-- Generated: 2026-03-10
-- Includes: Enums, Tables DDL, Functions, Triggers, RLS, Seed Data
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'clinic_admin', 'staff', 'patient', 'donor', 'provider');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE public.booking_type AS ENUM ('clinic', 'hospital', 'home', 'video', 'voice', 'lab');
CREATE TYPE public.camp_status AS ENUM ('draft', 'published', 'active', 'completed', 'cancelled');
CREATE TYPE public.case_status AS ENUM ('open', 'funded', 'partially_funded', 'in_treatment', 'closed');
CREATE TYPE public.discount_type AS ENUM ('none', 'percentage', 'fixed');
CREATE TYPE public.donation_status AS ENUM ('pledged', 'received', 'verified', 'refunded');
CREATE TYPE public.order_status AS ENUM ('pending', 'received', 'sample_taken', 'results_uploaded', 'delivered');
CREATE TYPE public.registration_status AS ENUM ('held', 'confirmed', 'checked_in', 'completed', 'expired', 'cancelled');

-- ============================================================
-- 2. TABLES DDL
-- ============================================================

-- profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  full_name TEXT,
  full_name_ar TEXT,
  avatar_url TEXT,
  phone TEXT,
  gender TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- clinics
CREATE TABLE public.clinics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  owner_id UUID NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- doctors
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  specialty TEXT,
  specialty_ar TEXT,
  city TEXT,
  city_ar TEXT,
  gender TEXT,
  profile_image TEXT,
  about_ar TEXT,
  about_en TEXT,
  education TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  years_experience INT DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  total_reviews INT DEFAULT 0,
  base_price NUMERIC DEFAULT 0,
  discount_type discount_type DEFAULT 'none',
  discount_value NUMERIC DEFAULT 0,
  free_cases_per_shift INT DEFAULT 0,
  booking_types booking_type[] DEFAULT '{clinic}',
  available_today BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_sponsored BOOLEAN DEFAULT false,
  wait_time TEXT DEFAULT '15 دقيقة',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- doctor_shifts
CREATE TABLE public.doctor_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  label TEXT NOT NULL DEFAULT 'الفترة الصباحية',
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '13:00',
  days_of_week INT[] DEFAULT '{0,1,2,3,4}',
  consultation_duration_min INT DEFAULT 15,
  max_capacity INT,
  enable_slot_generation BOOLEAN DEFAULT false,
  late_tolerance_min INT DEFAULT 10,
  free_cases_count INT DEFAULT 0,
  free_cases_frequency TEXT DEFAULT 'shift',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- bookings
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  patient_id UUID NOT NULL,
  shift_id UUID REFERENCES public.doctor_shifts(id),
  family_member_id UUID REFERENCES public.family_members(id),
  booking_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  booking_type booking_type DEFAULT 'clinic',
  status booking_status DEFAULT 'pending',
  queue_position INT,
  final_price NUMERIC DEFAULT 0,
  funding_amount NUMERIC DEFAULT 0,
  is_free_case BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- family_members
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name_ar TEXT NOT NULL,
  full_name TEXT,
  relationship TEXT NOT NULL DEFAULT 'self',
  gender TEXT,
  phone TEXT,
  date_of_birth DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- staff_members
CREATE TABLE public.staff_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  name_ar TEXT NOT NULL,
  staff_role TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{"canCheckIn":false,"canOrderLabs":false,"canPrescribe":false,"canExportData":false,"canManageStaff":false,"canViewReports":false,"canEditPatients":false,"canManageEvents":false,"canOrderImaging":false,"canViewPatients":true,"canManageBookings":false,"canManageSettings":false}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'booking',
  title_ar TEXT NOT NULL,
  body_ar TEXT,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- treatment_sessions
CREATE TABLE public.treatment_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  patient_id UUID NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  symptoms TEXT,
  examination TEXT,
  diagnosis TEXT,
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- prescriptions
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.treatment_sessions(id),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  patient_id UUID NOT NULL,
  notes TEXT,
  pharmacy_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- prescription_items
CREATE TABLE public.prescription_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id),
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT
);

-- medical_files
CREATE TABLE public.medical_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id),
  booking_id UUID REFERENCES public.bookings(id),
  session_id UUID REFERENCES public.treatment_sessions(id),
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'other',
  mime_type TEXT,
  file_size INT,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- medical_camps
CREATE TABLE public.medical_camps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  cover_image TEXT,
  location_name TEXT,
  location_city TEXT,
  start_date DATE,
  end_date DATE,
  total_capacity INT DEFAULT 0,
  status camp_status DEFAULT 'draft',
  services TEXT[] DEFAULT '{}',
  sponsors JSONB DEFAULT '[]',
  is_free BOOLEAN DEFAULT true,
  target_fund NUMERIC DEFAULT 0,
  raised_fund NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- event_schedules
CREATE TABLE public.event_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  camp_id UUID NOT NULL REFERENCES public.medical_camps(id),
  schedule_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  service_type TEXT,
  location_note TEXT,
  total_slots INT DEFAULT 0,
  available_slots INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- registrations
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  camp_id UUID NOT NULL REFERENCES public.medical_camps(id),
  schedule_id UUID NOT NULL REFERENCES public.event_schedules(id),
  booked_by UUID NOT NULL,
  case_code TEXT NOT NULL DEFAULT ('C-' || substr(gen_random_uuid()::text, 1, 8)),
  patient_info JSONB,
  status registration_status DEFAULT 'held',
  hold_token TEXT,
  hold_expires_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- medical_cases
CREATE TABLE public.medical_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_code TEXT NOT NULL,
  created_by UUID NOT NULL,
  registration_id UUID REFERENCES public.registrations(id),
  diagnosis_summary TEXT,
  treatment_plan TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  funded_amount NUMERIC DEFAULT 0,
  status case_status DEFAULT 'open',
  is_anonymous BOOLEAN DEFAULT true,
  patient_age INT,
  patient_gender TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- donations
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.medical_cases(id),
  camp_id UUID REFERENCES public.medical_camps(id),
  donor_id UUID,
  donor_name TEXT,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  status donation_status DEFAULT 'pledged',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- providers
CREATE TABLE public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  provider_type TEXT,
  contact_phone TEXT,
  user_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- provider_orders
CREATE TABLE public.provider_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  camp_id UUID REFERENCES public.medical_camps(id),
  registration_id UUID REFERENCES public.registrations(id),
  order_type TEXT,
  order_details JSONB DEFAULT '{}',
  status order_status DEFAULT 'pending',
  results_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- service_categories
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- services
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  category_id UUID REFERENCES public.service_categories(id),
  default_price NUMERIC DEFAULT 0,
  duration_min INT DEFAULT 15,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sponsor_types
CREATE TABLE public.sponsor_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  tier_level INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sponsors
CREATE TABLE public.sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  sponsor_type_id UUID REFERENCES public.sponsor_types(id),
  logo_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- audit_logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. FUNCTIONS
-- ============================================================

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- is_clinic_member
CREATE OR REPLACE FUNCTION public.is_clinic_member(_user_id UUID, _clinic_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.doctors WHERE user_id = _user_id AND clinic_id = _clinic_id
    UNION ALL
    SELECT 1 FROM public.staff_members WHERE user_id = _user_id AND clinic_id = _clinic_id AND is_active = true
  );
$$;

-- get_staff_permission
CREATE OR REPLACE FUNCTION public.get_staff_permission(_user_id UUID, _clinic_id UUID, _permission TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(
    (SELECT (permissions->>_permission)::boolean
     FROM public.staff_members
     WHERE user_id = _user_id AND clinic_id = _clinic_id AND is_active = true
     LIMIT 1),
    false
  );
$$;

-- update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- check_shift_overlap
CREATE OR REPLACE FUNCTION public.check_shift_overlap()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.doctor_shifts ds
    WHERE ds.doctor_id = NEW.doctor_id
      AND ds.id IS DISTINCT FROM NEW.id
      AND ds.days_of_week && NEW.days_of_week
      AND ds.start_time < NEW.end_time
      AND ds.end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'يوجد تعارض في أوقات الفترات لهذا الطبيب. لا يمكن إضافة فترة متداخلة.'
      USING ERRCODE = 'unique_violation';
  END IF;
  RETURN NEW;
END;
$$;

-- notify_doctor_on_booking
CREATE OR REPLACE FUNCTION public.notify_doctor_on_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _doctor_user_id UUID;
  _patient_name TEXT;
BEGIN
  SELECT user_id INTO _doctor_user_id FROM public.doctors WHERE id = NEW.doctor_id;
  IF _doctor_user_id IS NULL THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name_ar, full_name, 'مريض') INTO _patient_name
  FROM public.profiles WHERE id = NEW.patient_id;
  INSERT INTO public.notifications (user_id, type, title_ar, body_ar, entity_type, entity_id)
  VALUES (_doctor_user_id, 'booking', 'حجز جديد',
    'حجز جديد من ' || _patient_name || ' — ' || COALESCE(NEW.start_time, 'طابور مرن') || ' بتاريخ ' || NEW.booking_date,
    'booking', NEW.id);
  RETURN NEW;
END;
$$;

-- notify_on_booking_update
CREATE OR REPLACE FUNCTION public.notify_on_booking_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _doctor_user_id UUID; _patient_name TEXT; _doctor_name TEXT;
  _notif_title TEXT; _notif_body_doctor TEXT; _notif_body_patient TEXT; _notif_type TEXT;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  SELECT user_id, name_ar INTO _doctor_user_id, _doctor_name FROM public.doctors WHERE id = NEW.doctor_id;
  SELECT COALESCE(full_name_ar, full_name, 'مريض') INTO _patient_name FROM public.profiles WHERE id = NEW.patient_id;
  IF NEW.status = 'cancelled' THEN
    _notif_type := 'booking_cancelled'; _notif_title := 'حجز ملغي';
    _notif_body_doctor := 'تم إلغاء حجز ' || _patient_name || ' بتاريخ ' || NEW.booking_date;
    _notif_body_patient := 'تم إلغاء حجزك مع د. ' || COALESCE(_doctor_name, '') || ' بتاريخ ' || NEW.booking_date;
  ELSIF NEW.status = 'confirmed' THEN
    _notif_type := 'booking_confirmed'; _notif_title := 'تأكيد حجز';
    _notif_body_doctor := 'تم تأكيد حجز ' || _patient_name || ' بتاريخ ' || NEW.booking_date;
    _notif_body_patient := 'تم تأكيد حجزك مع د. ' || COALESCE(_doctor_name, '') || ' بتاريخ ' || NEW.booking_date;
  ELSIF NEW.status = 'completed' THEN
    _notif_type := 'booking_completed'; _notif_title := 'حجز مكتمل';
    _notif_body_doctor := 'تم إكمال جلسة ' || _patient_name || ' بتاريخ ' || NEW.booking_date;
    _notif_body_patient := 'تمت جلستك مع د. ' || COALESCE(_doctor_name, '') || ' بتاريخ ' || NEW.booking_date || '. نتمنى لك الشفاء العاجل';
  ELSE RETURN NEW; END IF;
  IF _doctor_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title_ar, body_ar, entity_type, entity_id)
    VALUES (_doctor_user_id, _notif_type, _notif_title, _notif_body_doctor, 'booking', NEW.id);
  END IF;
  INSERT INTO public.notifications (user_id, type, title_ar, body_ar, entity_type, entity_id)
  VALUES (NEW.patient_id, _notif_type, _notif_title, _notif_body_patient, 'booking', NEW.id);
  RETURN NEW;
END;
$$;

-- notify_on_order_results
CREATE OR REPLACE FUNCTION public.notify_on_order_results()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _patient_id UUID; _doctor_id UUID; _doctor_user_id UUID;
  _patient_name TEXT; _order_type_ar TEXT;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('results_uploaded', 'delivered') THEN RETURN NEW; END IF;
  _patient_id := (NEW.order_details->>'patient_id')::UUID;
  _doctor_id := (NEW.order_details->>'doctor_id')::UUID;
  IF _patient_id IS NULL THEN RETURN NEW; END IF;
  SELECT user_id INTO _doctor_user_id FROM public.doctors WHERE id = _doctor_id;
  SELECT COALESCE(full_name_ar, full_name, 'مريض') INTO _patient_name FROM public.profiles WHERE id = _patient_id;
  _order_type_ar := CASE NEW.order_type
    WHEN 'lab' THEN 'نتائج التحاليل' WHEN 'imaging' THEN 'نتائج الأشعة' ELSE 'نتائج الطلب' END;
  INSERT INTO public.notifications (user_id, type, title_ar, body_ar, entity_type, entity_id)
  VALUES (_patient_id, 'results_ready', _order_type_ar || ' جاهزة', _order_type_ar || ' الخاصة بك جاهزة للمراجعة', 'provider_order', NEW.id);
  IF _doctor_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title_ar, body_ar, entity_type, entity_id)
    VALUES (_doctor_user_id, 'results_ready', _order_type_ar || ' جاهزة', _order_type_ar || ' لـ ' || _patient_name || ' جاهزة', 'provider_order', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, full_name_ar, phone, gender, date_of_birth)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'gender', NULL),
    CASE WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL AND NEW.raw_user_meta_data->>'date_of_birth' != ''
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::date ELSE NULL END
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');
  RETURN NEW;
END;
$$;

-- hold_event_slot
CREATE OR REPLACE FUNCTION public.hold_event_slot(_camp_id UUID, _schedule_id UUID, _booked_by UUID, _patient_info JSONB DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _reg_id UUID; _token TEXT; _expires TIMESTAMPTZ; _updated INT;
BEGIN
  UPDATE public.event_schedules SET available_slots = available_slots - 1
  WHERE id = _schedule_id AND camp_id = _camp_id AND available_slots > 0;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated = 0 THEN RETURN jsonb_build_object('error','no_slots'); END IF;
  _token := encode(gen_random_bytes(16),'hex');
  _expires := now() + interval '5 minutes';
  _reg_id := gen_random_uuid();
  INSERT INTO public.registrations (id,camp_id,schedule_id,booked_by,patient_info,status,hold_token,hold_expires_at)
  VALUES (_reg_id,_camp_id,_schedule_id,_booked_by,_patient_info,'held',_token,_expires);
  RETURN jsonb_build_object('registration_id',_reg_id,'hold_token',_token,'hold_expires_at',_expires);
END;
$$;

-- confirm_hold
CREATE OR REPLACE FUNCTION public.confirm_hold(_registration_id UUID, _hold_token TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _reg RECORD;
BEGIN
  SELECT * INTO _reg FROM public.registrations WHERE id = _registration_id AND hold_token = _hold_token;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','invalid_token'); END IF;
  IF _reg.hold_expires_at < now() THEN
    UPDATE public.registrations SET status = 'expired' WHERE id = _registration_id;
    UPDATE public.event_schedules SET available_slots = available_slots + 1 WHERE id = _reg.schedule_id;
    RETURN jsonb_build_object('error','hold_expired');
  END IF;
  UPDATE public.registrations SET status = 'confirmed', hold_token = NULL WHERE id = _registration_id;
  RETURN jsonb_build_object('status','confirmed');
END;
$$;

-- reclaim_expired_holds
CREATE OR REPLACE FUNCTION public.reclaim_expired_holds()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _count INT;
BEGIN
  WITH expired AS (
    UPDATE public.registrations SET status = 'expired' WHERE status = 'held' AND hold_expires_at < now() RETURNING schedule_id
  )
  UPDATE public.event_schedules es SET available_slots = es.available_slots + sub.cnt
  FROM (SELECT schedule_id, COUNT(*) AS cnt FROM expired GROUP BY schedule_id) sub
  WHERE es.id = sub.schedule_id;
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- updated_at triggers
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clinics_updated BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_doctors_updated BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON public.staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON public.family_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_treatment_sessions_updated_at BEFORE UPDATE ON public.treatment_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- business logic triggers
CREATE TRIGGER trg_check_shift_overlap BEFORE INSERT OR UPDATE ON public.doctor_shifts FOR EACH ROW EXECUTE FUNCTION check_shift_overlap();
CREATE TRIGGER trg_notify_doctor_on_booking AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION notify_doctor_on_booking();
CREATE TRIGGER trg_notify_on_booking_update AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION notify_on_booking_update();
CREATE TRIGGER trg_notify_order_results AFTER UPDATE ON public.provider_orders FOR EACH ROW EXECUTE FUNCTION notify_on_order_results();

-- auth trigger (on auth.users — handled by Supabase)
-- CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 5. RLS POLICIES (All tables have RLS enabled)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- clinics
CREATE POLICY "Clinics public read" ON public.clinics FOR SELECT USING (true);
CREATE POLICY "Insert clinics" ON public.clinics FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') OR auth.uid() = owner_id);
CREATE POLICY "Owner updates clinic" ON public.clinics FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

-- doctors
CREATE POLICY "Doctors public read" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Insert doctors" ON public.doctors FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') OR user_id = auth.uid());
CREATE POLICY "Doctor updates own" ON public.doctors FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- doctor_shifts
CREATE POLICY "Shifts read auth" ON public.doctor_shifts FOR SELECT USING (true);
CREATE POLICY "Doctor manages shifts" ON public.doctor_shifts FOR ALL USING (EXISTS (SELECT 1 FROM doctors d WHERE d.id = doctor_shifts.doctor_id AND d.user_id = auth.uid()));

-- bookings
CREATE POLICY "Patient sees bookings" ON public.bookings FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Doctor sees bookings" ON public.bookings FOR SELECT USING (EXISTS (SELECT 1 FROM doctors d WHERE d.id = bookings.doctor_id AND d.user_id = auth.uid()));
CREATE POLICY "Admin sees bookings" ON public.bookings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated creates booking" ON public.bookings FOR INSERT WITH CHECK (patient_id = auth.uid() OR has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'clinic_admin'));
CREATE POLICY "Booking update" ON public.bookings FOR UPDATE USING (patient_id = auth.uid() OR EXISTS (SELECT 1 FROM doctors d WHERE d.id = bookings.doctor_id AND d.user_id = auth.uid()) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'clinic_admin'));

-- family_members
CREATE POLICY "User manages own family" ON public.family_members FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Staff reads family" ON public.family_members FOR SELECT USING (has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'clinic_admin'));

-- staff_members
CREATE POLICY "Owner manages staff" ON public.staff_members FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM clinics c WHERE c.id = staff_members.clinic_id AND c.owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff read clinic" ON public.staff_members FOR SELECT TO authenticated USING (is_clinic_member(auth.uid(), clinic_id) OR has_role(auth.uid(), 'admin'));

-- notifications
CREATE POLICY "User reads own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User updates own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Authenticated inserts notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- treatment_sessions
CREATE POLICY "Doctor manages own sessions" ON public.treatment_sessions FOR ALL USING (EXISTS (SELECT 1 FROM doctors d WHERE d.id = treatment_sessions.doctor_id AND d.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Patient reads own sessions" ON public.treatment_sessions FOR SELECT USING (patient_id = auth.uid());

-- prescriptions
CREATE POLICY "Doctor manages prescriptions" ON public.prescriptions FOR ALL USING (EXISTS (SELECT 1 FROM doctors d WHERE d.id = prescriptions.doctor_id AND d.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Patient reads own prescriptions" ON public.prescriptions FOR SELECT USING (patient_id = auth.uid());

-- prescription_items
CREATE POLICY "Doctor manages prescription items" ON public.prescription_items FOR ALL USING (EXISTS (SELECT 1 FROM prescriptions p JOIN doctors d ON d.id = p.doctor_id WHERE p.id = prescription_items.prescription_id AND d.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Patient reads own prescription items" ON public.prescription_items FOR SELECT USING (EXISTS (SELECT 1 FROM prescriptions p WHERE p.id = prescription_items.prescription_id AND p.patient_id = auth.uid()));

-- medical_files
CREATE POLICY "Doctor manages medical files" ON public.medical_files FOR ALL TO authenticated USING (uploaded_by = auth.uid() OR has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM doctors d WHERE d.id = medical_files.doctor_id AND d.user_id = auth.uid()));
CREATE POLICY "Patient reads own medical files" ON public.medical_files FOR SELECT TO authenticated USING (patient_id = auth.uid());

-- medical_camps
CREATE POLICY "Published camps public" ON public.medical_camps FOR SELECT USING (status IN ('published', 'active', 'completed'));
CREATE POLICY "Organizer sees camps" ON public.medical_camps FOR SELECT TO authenticated USING (organizer_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor'));
CREATE POLICY "Create camps" ON public.medical_camps FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'clinic_admin'));
CREATE POLICY "Update camps" ON public.medical_camps FOR UPDATE TO authenticated USING (organizer_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- event_schedules
CREATE POLICY "Schedules with published camp" ON public.event_schedules FOR SELECT USING (EXISTS (SELECT 1 FROM medical_camps mc WHERE mc.id = event_schedules.camp_id AND mc.status IN ('published', 'active', 'completed')));
CREATE POLICY "Auth sees schedules" ON public.event_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Organizer manages schedules" ON public.event_schedules FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM medical_camps mc WHERE mc.id = event_schedules.camp_id AND (mc.organizer_id = auth.uid() OR has_role(auth.uid(), 'admin'))));

-- registrations
CREATE POLICY "Own registrations" ON public.registrations FOR SELECT TO authenticated USING (booked_by = auth.uid());
CREATE POLICY "Admin registrations" ON public.registrations FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Create registration" ON public.registrations FOR INSERT TO authenticated WITH CHECK (booked_by = auth.uid());
CREATE POLICY "Update registration" ON public.registrations FOR UPDATE TO authenticated USING (booked_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- medical_cases
CREATE POLICY "Cases read" ON public.medical_cases FOR SELECT TO authenticated USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctor creates case" ON public.medical_cases FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'doctor') AND created_by = auth.uid());
CREATE POLICY "Update case" ON public.medical_cases FOR UPDATE TO authenticated USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- donations
CREATE POLICY "Donations read" ON public.donations FOR SELECT USING (true);
CREATE POLICY "Create donation" ON public.donations FOR INSERT TO authenticated WITH CHECK (donor_id IS NULL OR donor_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admin updates donation" ON public.donations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- providers
CREATE POLICY "Providers read" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Authenticated inserts provider" ON public.providers FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'clinic_admin'));
CREATE POLICY "Provider updates own" ON public.providers FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- provider_orders
CREATE POLICY "Orders read" ON public.provider_orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_orders.provider_id AND p.user_id = auth.uid()) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor'));
CREATE POLICY "Create order" ON public.provider_orders FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));
CREATE POLICY "Update order" ON public.provider_orders FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_orders.provider_id AND p.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- service_categories
CREATE POLICY "Public read service_categories" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Admin or doctor manages service_categories" ON public.service_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'clinic_admin'));

-- services
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admin or doctor manages services" ON public.services FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'clinic_admin'));

-- sponsor_types
CREATE POLICY "Public read sponsor_types" ON public.sponsor_types FOR SELECT USING (true);
CREATE POLICY "Admin manages sponsor_types" ON public.sponsor_types FOR ALL USING (has_role(auth.uid(), 'admin'));

-- sponsors
CREATE POLICY "Public read sponsors" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Admin manages sponsors" ON public.sponsors FOR ALL USING (has_role(auth.uid(), 'admin'));

-- audit_logs
CREATE POLICY "Admin reads logs" ON public.audit_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 6. REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- 7. STORAGE BUCKETS
-- ============================================================
-- Bucket: avatars (public)
-- Bucket: medical-files (private)

-- ============================================================
-- 8. SEED DATA
-- ============================================================

-- 8.1 Clinics
INSERT INTO public.clinics (id, name_ar, name_en, owner_id, address, city, phone) VALUES
  ('10000000-0000-0000-0000-000000000001', 'مركز رعاية القلب', 'Heart Care Center', '5c07ee24-2b99-4eac-93ce-6bbfa2873843', 'شارع الزبيري، صنعاء', 'صنعاء', '01-234567'),
  ('10000000-0000-0000-0000-000000000002', 'عيادة صحة الأطفال', 'Kids Health Clinic', '00000000-0000-0000-0000-000000000001', 'شارع تعز، صنعاء', 'صنعاء', '01-345678'),
  ('10000000-0000-0000-0000-000000000003', 'مركز العظام والمفاصل', 'Bone & Joint Center', '00000000-0000-0000-0000-000000000001', 'شارع المعلا، عدن', 'عدن', '02-456789'),
  ('10000000-0000-0000-0000-000000000004', 'عيادة العناية بالبشرة', 'Skin Care Clinic', '00000000-0000-0000-0000-000000000001', 'حدة، صنعاء', 'صنعاء', '01-567890'),
  ('10000000-0000-0000-0000-000000000005', 'الابتسامة المثالية', 'Perfect Smile', '00000000-0000-0000-0000-000000000001', 'شارع جمال، تعز', 'تعز', '04-678901'),
  ('10000000-0000-0000-0000-000000000006', 'مركز صحة المرأة', 'Women''s Health Center', '00000000-0000-0000-0000-000000000001', 'شارع الستين، صنعاء', 'صنعاء', '01-789012')
ON CONFLICT DO NOTHING;

-- 8.2 Doctors
INSERT INTO public.doctors (id, user_id, clinic_id, name_ar, name_en, specialty, specialty_ar, city, city_ar, gender, about_ar, about_en, education, languages, years_experience, rating, total_reviews, base_price, discount_type, discount_value, free_cases_per_shift, booking_types, available_today, is_verified, is_sponsored, wait_time) VALUES
  ('20000000-0000-0000-0000-000000000001', '5c07ee24-2b99-4eac-93ce-6bbfa2873843', '10000000-0000-0000-0000-000000000001',
   'د. أحمد محمد العليمي', 'Dr. Ahmed Al-Alimi', 'cardiology', 'قلب وأوعية دموية', 'sanaa', 'صنعاء', 'male',
   'استشاري أمراض القلب والأوعية الدموية، حاصل على البورد العربي في أمراض القلب. خبرة 15 عاماً في تشخيص وعلاج أمراض القلب.',
   'Consultant cardiologist with Arab Board certification.',
   ARRAY['بورد عربي - أمراض القلب', 'ماجستير طب القلب - جامعة صنعاء'],
   ARRAY['العربية', 'English'], 15, 4.8, 247, 5000, 'percentage', 10, 2,
   '{clinic,video}', true, true, false, '15 دقيقة'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   'د. فاطمة علي الحكيمي', 'Dr. Fatima Al-Hakimi', 'pediatrics', 'أطفال', 'sanaa', 'صنعاء', 'female',
   'أخصائية طب الأطفال وحديثي الولادة. متخصصة في أمراض الأطفال الشائعة والتطعيمات.',
   'Pediatrics specialist.',
   ARRAY['ماجستير طب الأطفال - جامعة عدن'],
   ARRAY['العربية'], 12, 4.9, 512, 3000, 'percentage', 20, 3,
   '{clinic,home,video}', true, true, true, '10 دقائق'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
   'د. عبدالله حسن المقطري', 'Dr. Abdullah Al-Maqtari', 'orthopedics', 'عظام', 'aden', 'عدن', 'male',
   'استشاري جراحة العظام والمفاصل. خبرة واسعة في جراحات الركبة والكتف.',
   'Orthopedic surgery consultant.',
   ARRAY['زمالة جراحة العظام - القاهرة', 'بورد عربي'],
   ARRAY['العربية', 'English'], 20, 4.7, 189, 4000, 'fixed', 500, 1,
   '{clinic,hospital}', false, true, false, '20 دقيقة'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
   'د. سارة يحيى الشرعبي', 'Dr. Sara Al-Sharabi', 'dermatology', 'جلدية', 'sanaa', 'صنعاء', 'female',
   'أخصائية الأمراض الجلدية والتجميل. متخصصة في علاج حب الشباب والأمراض الجلدية المزمنة.',
   'Dermatology specialist.',
   ARRAY['ماجستير أمراض جلدية - الأردن'],
   ARRAY['العربية', 'English'], 8, 4.6, 334, 3500, 'percentage', 15, 1,
   '{clinic,video}', true, true, false, '15 دقيقة'),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005',
   'د. محمد عبدالرحمن النعمان', 'Dr. Mohammed Al-Numan', 'dentistry', 'أسنان', 'taiz', 'تعز', 'male',
   'طبيب أسنان متخصص في تقويم الأسنان وزراعة الأسنان.',
   'Dental specialist.',
   ARRAY['بكالوريوس طب أسنان - جامعة تعز', 'دبلوم تقويم أسنان'],
   ARRAY['العربية'], 10, 4.5, 423, 2500, 'none', 0, 2,
   '{clinic}', true, true, true, '30 دقيقة'),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006',
   'د. نورا خالد البيضاني', 'Dr. Noura Al-Baidani', 'gynecology', 'نساء وتوليد', 'sanaa', 'صنعاء', 'female',
   'استشارية أمراض النساء والتوليد. متخصصة في متابعة الحمل والولادة.',
   'OB/GYN consultant.',
   ARRAY['زمالة نساء وتوليد - مصر', 'بورد عربي'],
   ARRAY['العربية', 'English'], 18, 4.9, 678, 4500, 'none', 0, 3,
   '{clinic,hospital,video}', true, true, false, '20 دقيقة')
ON CONFLICT DO NOTHING;

-- 8.3 Doctor Shifts
INSERT INTO public.doctor_shifts (id, doctor_id, label, start_time, end_time, days_of_week, consultation_duration_min, max_capacity, enable_slot_generation, late_tolerance_min, free_cases_count, free_cases_frequency) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'الفترة الصباحية', '09:00', '13:00', '{0,1,2,3,4,6}', 20, 12, true, 10, 0, 'shift'),
  ('71ba35cd-f357-4a04-a7ce-b49a27bf72d8', '20000000-0000-0000-0000-000000000001', 'الفترة المسائية', '16:00', '21:00', '{0,1,2,3,6}', NULL, 20, false, 15, 1, 'day'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'الفترة الصباحية', '09:00', '13:00', '{0,1,2,3,4}', NULL, 20, false, 10, 0, 'shift'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'الفترة المسائية', '16:00', '20:00', '{0,1,3}', 15, 16, true, 10, 0, 'shift'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'الفترة الصباحية', '09:00', '13:00', '{0,2,4}', 30, 8, true, 10, 0, 'shift'),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', 'الفترة الصباحية', '09:00', '13:00', '{0,1,2,3,4}', 20, 12, true, 10, 0, 'shift'),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000004', 'الفترة المسائية', '16:00', '20:00', '{1,3}', 20, 10, true, 10, 0, 'shift'),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000005', 'الفترة الصباحية', '09:00', '13:00', '{0,1,2,3,4}', NULL, 15, false, 10, 0, 'shift'),
  ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000006', 'الفترة الصباحية', '09:00', '13:00', '{0,1,2,3,4}', 20, 12, true, 10, 0, 'shift'),
  ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000006', 'الفترة المسائية', '16:00', '20:00', '{0,2,4}', 20, 10, true, 10, 0, 'shift')
ON CONFLICT DO NOTHING;

-- 8.4 Service Categories
INSERT INTO public.service_categories (id, name_ar, sort_order) VALUES
  ('5e619dac-b5e9-4323-8dfa-c2b3b480823b', 'مجاوحة', 0)
ON CONFLICT DO NOTHING;

-- 8.5 Services
INSERT INTO public.services (id, name_ar, category_id, default_price, duration_min) VALUES
  ('18a5507a-f7a3-4ec8-8efd-3f3453d3589c', 'مجارحة الكسور', '5e619dac-b5e9-4323-8dfa-c2b3b480823b', 1000, 0)
ON CONFLICT DO NOTHING;

-- 8.6 Providers
INSERT INTO public.providers (id, name_ar, provider_type, contact_phone) VALUES
  ('908c43e8-06cd-4aaf-8e47-4eee218dc85d', 'Fg', 'pharmacy', '5666')
ON CONFLICT DO NOTHING;

-- 8.7 Provider Orders
INSERT INTO public.provider_orders (id, provider_id, order_type, status) VALUES
  ('2a72b892-8a12-4b97-b86d-1611e847089a', '908c43e8-06cd-4aaf-8e47-4eee218dc85d', 'medicine', 'pending')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. USER ACCOUNTS (for reference — created via auth.users)
-- ============================================================
-- admin@sihhatak.com → مالك المنصة (admin) → 1739bc5b-c822-46e0-be6d-e2bfcaa91960
-- doctor@sihhatak.com → د. أحمد العليمي (doctor) → 5c07ee24-2b99-4eac-93ce-6bbfa2873843
-- patient@sihhatak.com → محمد المريض (patient) → 53365438-5d9f-4cf3-946c-fc90a18ec23c
-- staff@sihhatak.com → سارة الموظفة (staff) → 638d4940-e2e8-4561-ac74-b5825aad5c36
-- clinic_admin@sihhatak.com → خالد مدير العيادة (clinic_admin) → 913d20d9-76db-4f6f-9341-d323d1ed970f
-- donor@sihhatak.com → علي المتبرع (donor) → b363b49c-8735-49ee-ad60-f2602fd2ef86
-- provider@sihhatak.com → مختبر الأمل (provider) → cd182368-f982-4b93-a81b-7383ab62e674

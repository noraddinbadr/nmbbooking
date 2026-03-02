
-- ============================================================
-- 1. ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin','doctor','clinic_admin','staff','patient','donor','provider');
CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','completed','cancelled');
CREATE TYPE public.booking_type AS ENUM ('clinic','hospital','home','video','voice','lab');
CREATE TYPE public.camp_status AS ENUM ('draft','published','active','completed','cancelled');
CREATE TYPE public.registration_status AS ENUM ('held','confirmed','checked_in','completed','expired','cancelled');
CREATE TYPE public.case_status AS ENUM ('open','funded','partially_funded','in_treatment','closed');
CREATE TYPE public.donation_status AS ENUM ('pledged','received','verified','refunded');
CREATE TYPE public.order_status AS ENUM ('pending','received','sample_taken','results_uploaded','delivered');
CREATE TYPE public.discount_type AS ENUM ('none','percentage','fixed');

-- ============================================================
-- 2. USER ROLES TABLE
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. has_role function (only depends on user_roles)
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- ============================================================
-- 4. PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  full_name_ar TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male','female')),
  date_of_birth DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. CLINICS
-- ============================================================
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  city TEXT,
  address TEXT,
  phone TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. DOCTORS
-- ============================================================
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  specialty TEXT,
  specialty_ar TEXT,
  city TEXT,
  city_ar TEXT,
  rating NUMERIC(2,1) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  base_price NUMERIC(10,2) DEFAULT 0,
  discount_type public.discount_type DEFAULT 'none',
  discount_value NUMERIC(10,2) DEFAULT 0,
  free_cases_per_shift INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  profile_image TEXT,
  gender TEXT CHECK (gender IN ('male','female')),
  years_experience INT DEFAULT 0,
  about_ar TEXT,
  about_en TEXT,
  languages TEXT[] DEFAULT '{}',
  education TEXT[] DEFAULT '{}',
  booking_types public.booking_type[] DEFAULT '{clinic}',
  wait_time TEXT DEFAULT '15 دقيقة',
  available_today BOOLEAN DEFAULT true,
  is_sponsored BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. DOCTOR SHIFTS
-- ============================================================
CREATE TABLE public.doctor_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'الفترة الصباحية',
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '13:00',
  days_of_week INT[] DEFAULT '{0,1,2,3,4}',
  enable_slot_generation BOOLEAN DEFAULT false,
  consultation_duration_min INT DEFAULT 15,
  max_capacity INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.doctor_shifts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. BOOKINGS
-- ============================================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  shift_id UUID REFERENCES public.doctor_shifts(id),
  booking_type public.booking_type DEFAULT 'clinic',
  status public.booking_status DEFAULT 'pending',
  booking_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  queue_position INT,
  final_price NUMERIC(10,2) DEFAULT 0,
  funding_amount NUMERIC(10,2) DEFAULT 0,
  is_free_case BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. STAFF MEMBERS
-- ============================================================
CREATE TABLE public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  staff_role TEXT NOT NULL CHECK (staff_role IN ('doctor','assistant','receptionist')),
  permissions JSONB NOT NULL DEFAULT '{"canViewPatients":true,"canEditPatients":false,"canManageBookings":false,"canPrescribe":false,"canOrderLabs":false,"canOrderImaging":false,"canCheckIn":false,"canViewReports":false,"canManageStaff":false,"canManageSettings":false,"canManageEvents":false,"canExportData":false}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, clinic_id)
);
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. MEDICAL CAMPS
-- ============================================================
CREATE TABLE public.medical_camps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  clinic_id UUID REFERENCES public.clinics(id),
  organizer_id UUID NOT NULL REFERENCES auth.users(id),
  location_name TEXT,
  location_city TEXT,
  status public.camp_status DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  total_capacity INT DEFAULT 0,
  services TEXT[] DEFAULT '{}',
  sponsors JSONB DEFAULT '[]',
  cover_image TEXT,
  is_free BOOLEAN DEFAULT true,
  target_fund NUMERIC(12,2) DEFAULT 0,
  raised_fund NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_camps ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. EVENT SCHEDULES
-- ============================================================
CREATE TABLE public.event_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID NOT NULL REFERENCES public.medical_camps(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  service_type TEXT,
  total_slots INT DEFAULT 0,
  available_slots INT DEFAULT 0,
  location_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. REGISTRATIONS
-- ============================================================
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID NOT NULL REFERENCES public.medical_camps(id),
  schedule_id UUID NOT NULL REFERENCES public.event_schedules(id),
  booked_by UUID NOT NULL REFERENCES auth.users(id),
  patient_info JSONB,
  status public.registration_status DEFAULT 'held',
  hold_token TEXT,
  hold_expires_at TIMESTAMPTZ,
  case_code TEXT NOT NULL DEFAULT ('C-' || substr(gen_random_uuid()::text, 1, 8)),
  checked_in_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 13. MEDICAL CASES
-- ============================================================
CREATE TABLE public.medical_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.registrations(id),
  case_code TEXT NOT NULL,
  diagnosis_summary TEXT,
  treatment_plan TEXT,
  estimated_cost NUMERIC(10,2) DEFAULT 0,
  funded_amount NUMERIC(10,2) DEFAULT 0,
  status public.case_status DEFAULT 'open',
  is_anonymous BOOLEAN DEFAULT true,
  patient_age INT,
  patient_gender TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_cases ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 14. DONATIONS
-- ============================================================
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.medical_cases(id),
  camp_id UUID REFERENCES public.medical_camps(id),
  donor_id UUID REFERENCES auth.users(id),
  donor_name TEXT,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('bank_transfer','wallet','cash')),
  payment_reference TEXT,
  status public.donation_status DEFAULT 'pledged',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 15. PROVIDERS
-- ============================================================
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  provider_type TEXT CHECK (provider_type IN ('lab','pharmacy','imaging','supplies')),
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 16. PROVIDER ORDERS
-- ============================================================
CREATE TABLE public.provider_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  camp_id UUID REFERENCES public.medical_camps(id),
  registration_id UUID REFERENCES public.registrations(id),
  order_type TEXT CHECK (order_type IN ('lab_test','medicine','imaging')),
  order_details JSONB DEFAULT '{}',
  status public.order_status DEFAULT 'pending',
  results_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_orders ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 17. AUDIT LOGS
-- ============================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 18. HELPER FUNCTIONS (tables now exist)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_clinic_member(_user_id UUID, _clinic_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.doctors WHERE user_id = _user_id AND clinic_id = _clinic_id
    UNION ALL
    SELECT 1 FROM public.staff_members WHERE user_id = _user_id AND clinic_id = _clinic_id AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_staff_permission(_user_id UUID, _clinic_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (permissions->>_permission)::boolean
     FROM public.staff_members
     WHERE user_id = _user_id AND clinic_id = _clinic_id AND is_active = true
     LIMIT 1),
    false
  );
$$;

-- ============================================================
-- 19. TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_clinics_updated BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_doctors_updated BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON public.staff_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 20. RLS POLICIES — user_roles
-- ============================================================
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- profiles
CREATE POLICY "Profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- clinics
CREATE POLICY "Clinics public read" ON public.clinics FOR SELECT USING (true);
CREATE POLICY "Owner updates clinic" ON public.clinics FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Insert clinics" ON public.clinics FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = owner_id);

-- doctors
CREATE POLICY "Doctors public read" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Doctor updates own" ON public.doctors FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert doctors" ON public.doctors FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- doctor_shifts
CREATE POLICY "Shifts read auth" ON public.doctor_shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Doctor manages shifts" ON public.doctor_shifts FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
);

-- bookings
CREATE POLICY "Patient sees bookings" ON public.bookings FOR SELECT TO authenticated USING (patient_id = auth.uid());
CREATE POLICY "Doctor sees bookings" ON public.bookings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
);
CREATE POLICY "Admin sees bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patient creates booking" ON public.bookings FOR INSERT TO authenticated WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Booking update" ON public.bookings FOR UPDATE TO authenticated USING (
  patient_id = auth.uid() OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

-- staff_members
CREATE POLICY "Staff read clinic" ON public.staff_members FOR SELECT TO authenticated USING (
  public.is_clinic_member(auth.uid(), clinic_id) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Owner manages staff" ON public.staff_members FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

-- medical_camps
CREATE POLICY "Published camps public" ON public.medical_camps FOR SELECT USING (status IN ('published','active','completed'));
CREATE POLICY "Organizer sees camps" ON public.medical_camps FOR SELECT TO authenticated USING (organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Create camps" ON public.medical_camps FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Update camps" ON public.medical_camps FOR UPDATE TO authenticated USING (organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- event_schedules
CREATE POLICY "Schedules with published camp" ON public.event_schedules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.medical_camps mc WHERE mc.id = camp_id AND mc.status IN ('published','active','completed'))
);
CREATE POLICY "Auth sees schedules" ON public.event_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Organizer manages schedules" ON public.event_schedules FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.medical_camps mc WHERE mc.id = camp_id AND (mc.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- registrations
CREATE POLICY "Own registrations" ON public.registrations FOR SELECT TO authenticated USING (booked_by = auth.uid());
CREATE POLICY "Admin registrations" ON public.registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Create registration" ON public.registrations FOR INSERT TO authenticated WITH CHECK (booked_by = auth.uid());
CREATE POLICY "Update registration" ON public.registrations FOR UPDATE TO authenticated USING (booked_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- medical_cases
CREATE POLICY "Cases read" ON public.medical_cases FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctor creates case" ON public.medical_cases FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'doctor') AND created_by = auth.uid());
CREATE POLICY "Update case" ON public.medical_cases FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- donations
CREATE POLICY "Donations read" ON public.donations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create donation" ON public.donations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin updates donation" ON public.donations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- providers
CREATE POLICY "Providers read" ON public.providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Provider updates own" ON public.providers FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin inserts provider" ON public.providers FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- provider_orders
CREATE POLICY "Orders read" ON public.provider_orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor')
);
CREATE POLICY "Create order" ON public.provider_orders FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Update order" ON public.provider_orders FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

-- audit_logs
CREATE POLICY "Admin reads logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- 21. ATOMIC HOLD + CONFIRM + RECLAIM FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.hold_event_slot(_camp_id UUID, _schedule_id UUID, _booked_by UUID, _patient_info JSONB DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

CREATE OR REPLACE FUNCTION public.confirm_hold(_registration_id UUID, _hold_token TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

CREATE OR REPLACE FUNCTION public.reclaim_expired_holds()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

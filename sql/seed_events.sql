-- ============================================================
-- Seed Data for Medical Events Module
-- Run after events_ddl.sql
-- ============================================================

-- NOTE: In production, user_id values come from auth.users.
-- These use placeholder UUIDs for local/mock testing.

-- Placeholder user IDs
DO $$
DECLARE
  admin_id UUID := '00000000-0000-0000-0000-000000000001';
  doctor1_id UUID := '00000000-0000-0000-0000-000000000002';
  doctor2_id UUID := '00000000-0000-0000-0000-000000000003';
  patient1_id UUID := '00000000-0000-0000-0000-000000000004';
  patient2_id UUID := '00000000-0000-0000-0000-000000000005';
  donor1_id UUID := '00000000-0000-0000-0000-000000000006';
  clinic1_id UUID;
  clinic2_id UUID;
  camp1_id UUID;
  camp2_id UUID;
  sched1_id UUID;
  sched2_id UUID;
  sched3_id UUID;
  sched4_id UUID;
BEGIN

-- 2 Clinics
INSERT INTO public.clinics (id, name_ar, name_en, city, address, phone, owner_id)
VALUES
  (gen_random_uuid(), 'عيادة الأمل', 'Al-Amal Clinic', 'صنعاء', 'شارع الزبيري، صنعاء', '01-234567', doctor1_id),
  (gen_random_uuid(), 'مركز الشفاء الطبي', 'Al-Shifaa Medical Center', 'عدن', 'شارع المعلا، عدن', '02-345678', doctor2_id)
RETURNING id INTO clinic1_id;

SELECT id INTO clinic1_id FROM public.clinics WHERE name_en = 'Al-Amal Clinic';
SELECT id INTO clinic2_id FROM public.clinics WHERE name_en = 'Al-Shifaa Medical Center';

-- Clinic doctors
INSERT INTO public.clinic_doctors (clinic_id, doctor_id, specialty)
VALUES
  (clinic1_id, doctor1_id, 'cardiology'),
  (clinic2_id, doctor2_id, 'ophthalmology');

-- 2 Medical Camps
INSERT INTO public.medical_camps (id, title_ar, title_en, description_ar, clinic_id, organizer_id,
  location_name, location_city, status, start_date, end_date, total_capacity, services, sponsors)
VALUES
  (gen_random_uuid(),
   'مخيم صنعاء الطبي المجاني',
   'Sanaa Free Medical Camp',
   'مخيم طبي مجاني يقدم خدمات القلب والباطنية والعيون',
   clinic1_id, doctor1_id,
   'مدرسة الكويت', 'صنعاء', 'published',
   '2026-03-15', '2026-03-17', 200,
   '["cardiology","internal","ophthalmology"]'::jsonb,
   '[{"name":"مؤسسة الخير","tier":"gold"},{"name":"شركة يمن فارما","tier":"silver"}]'::jsonb
  ),
  (gen_random_uuid(),
   'مخيم عدن لطب العيون',
   'Aden Eye Care Camp',
   'مخيم متخصص في جراحات العيون المجانية',
   clinic2_id, doctor2_id,
   'مستشفى الصداقة', 'عدن', 'published',
   '2026-04-01', '2026-04-02', 100,
   '["ophthalmology"]'::jsonb,
   '[{"name":"جمعية النور","tier":"gold"}]'::jsonb
  );

SELECT id INTO camp1_id FROM public.medical_camps WHERE title_en = 'Sanaa Free Medical Camp';
SELECT id INTO camp2_id FROM public.medical_camps WHERE title_en = 'Aden Eye Care Camp';

-- 4 Event Schedules
INSERT INTO public.event_schedules (id, camp_id, schedule_date, start_time, end_time, service_type, total_slots, available_slots)
VALUES
  (gen_random_uuid(), camp1_id, '2026-03-15', '08:00', '12:00', 'cardiology', 30, 28),
  (gen_random_uuid(), camp1_id, '2026-03-15', '13:00', '17:00', 'ophthalmology', 25, 25),
  (gen_random_uuid(), camp1_id, '2026-03-16', '08:00', '12:00', 'internal', 30, 30),
  (gen_random_uuid(), camp2_id, '2026-04-01', '09:00', '15:00', 'ophthalmology', 50, 48);

SELECT id INTO sched1_id FROM public.event_schedules WHERE camp_id = camp1_id AND service_type = 'cardiology';
SELECT id INTO sched4_id FROM public.event_schedules WHERE camp_id = camp2_id;

-- 3 Registrations (held + confirmed)
INSERT INTO public.registrations (camp_id, schedule_id, booked_by, patient_info, status, hold_expires_at)
VALUES
  (camp1_id, sched1_id, patient1_id,
   '{"name":"أحمد محمد","phone":"777111222","gender":"male","age":45}'::jsonb,
   'confirmed', now() + interval '1 hour'),
  (camp1_id, sched1_id, patient2_id,
   '{"name":"فاطمة علي","phone":"777333444","gender":"female","age":32}'::jsonb,
   'confirmed', now() + interval '1 hour'),
  (camp2_id, sched4_id, patient1_id,
   '{"name":"أحمد محمد","phone":"777111222","gender":"male","age":45}'::jsonb,
   'held', now() + interval '5 minutes');

END $$;

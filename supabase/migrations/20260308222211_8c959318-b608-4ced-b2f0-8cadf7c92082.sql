-- Update doctor record to match the actual authenticated user
UPDATE public.doctors 
SET user_id = '5c07ee24-2b99-4eac-93ce-6bbfa2873843'
WHERE id = '20000000-0000-0000-0000-000000000001';

-- Update the clinic owner too
UPDATE public.clinics
SET owner_id = '5c07ee24-2b99-4eac-93ce-6bbfa2873843'
WHERE id = '10000000-0000-0000-0000-000000000001';

-- Add doctor_shifts seed data for this doctor
INSERT INTO public.doctor_shifts (doctor_id, label, start_time, end_time, days_of_week, enable_slot_generation, consultation_duration_min, max_capacity, late_tolerance_min, free_cases_count, free_cases_frequency)
VALUES 
  ('20000000-0000-0000-0000-000000000001', 'الفترة الصباحية', '08:00', '13:00', '{0,1,2,3,4}', true, 20, 15, 10, 2, 'shift'),
  ('20000000-0000-0000-0000-000000000001', 'الفترة المسائية', '16:00', '21:00', '{0,1,2,3}', false, null, 20, 15, 1, 'day')
ON CONFLICT DO NOTHING;
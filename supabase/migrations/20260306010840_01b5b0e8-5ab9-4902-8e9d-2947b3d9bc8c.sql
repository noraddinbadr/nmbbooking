ALTER TABLE public.doctor_shifts
  ADD COLUMN IF NOT EXISTS late_tolerance_min integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS free_cases_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_cases_frequency text DEFAULT 'shift';

-- Drop FK constraints that reference auth.users (we use RLS + app logic instead)
ALTER TABLE public.clinics DROP CONSTRAINT IF EXISTS clinics_owner_id_fkey;
ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_user_id_fkey;
ALTER TABLE public.staff_members DROP CONSTRAINT IF EXISTS staff_members_user_id_fkey;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_patient_id_fkey;

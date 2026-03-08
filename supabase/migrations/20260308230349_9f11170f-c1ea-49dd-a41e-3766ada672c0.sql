
-- Prevent overlapping shifts for the same doctor on the same days
CREATE OR REPLACE FUNCTION public.check_shift_overlap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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

CREATE TRIGGER trg_check_shift_overlap
BEFORE INSERT OR UPDATE ON public.doctor_shifts
FOR EACH ROW EXECUTE FUNCTION public.check_shift_overlap();

-- Also add unique constraint on bookings to prevent double-booking same slot
ALTER TABLE public.bookings ADD CONSTRAINT unique_doctor_slot
  UNIQUE (doctor_id, booking_date, shift_id, start_time);


-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'booking',
  title_ar TEXT NOT NULL,
  body_ar TEXT,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "User updates own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System inserts notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime on bookings and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function: auto-create notification when booking is inserted
CREATE OR REPLACE FUNCTION public.notify_doctor_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _doctor_user_id UUID;
  _patient_name TEXT;
BEGIN
  -- Get doctor's user_id
  SELECT user_id INTO _doctor_user_id FROM public.doctors WHERE id = NEW.doctor_id;
  IF _doctor_user_id IS NULL THEN RETURN NEW; END IF;

  -- Get patient name
  SELECT COALESCE(full_name_ar, full_name, 'مريض') INTO _patient_name
  FROM public.profiles WHERE id = NEW.patient_id;

  INSERT INTO public.notifications (user_id, type, title_ar, body_ar, entity_type, entity_id)
  VALUES (
    _doctor_user_id,
    'booking',
    'حجز جديد',
    'حجز جديد من ' || _patient_name || ' — ' || COALESCE(NEW.start_time, 'طابور مرن') || ' بتاريخ ' || NEW.booking_date,
    'booking',
    NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_doctor_on_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_doctor_on_booking();

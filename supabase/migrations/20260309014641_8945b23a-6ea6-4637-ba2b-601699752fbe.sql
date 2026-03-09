
CREATE OR REPLACE FUNCTION public.notify_on_booking_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _doctor_user_id UUID;
  _patient_name TEXT;
  _doctor_name TEXT;
  _notif_title TEXT;
  _notif_body_doctor TEXT;
  _notif_body_patient TEXT;
  _notif_type TEXT;
BEGIN
  -- Only fire on status changes
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  -- Get doctor's user_id and name
  SELECT user_id, name_ar INTO _doctor_user_id, _doctor_name
  FROM public.doctors WHERE id = NEW.doctor_id;

  -- Get patient name
  SELECT COALESCE(full_name_ar, full_name, 'مريض') INTO _patient_name
  FROM public.profiles WHERE id = NEW.patient_id;

  IF NEW.status = 'cancelled' THEN
    _notif_type := 'booking_cancelled';
    _notif_title := 'حجز ملغي';
    _notif_body_doctor := 'تم إلغاء حجز ' || _patient_name || ' بتاريخ ' || NEW.booking_date;
    _notif_body_patient := 'تم إلغاء حجزك مع د. ' || COALESCE(_doctor_name, '') || ' بتاريخ ' || NEW.booking_date;

  ELSIF NEW.status = 'confirmed' THEN
    _notif_type := 'booking_confirmed';
    _notif_title := 'تأكيد حجز';
    _notif_body_doctor := 'تم تأكيد حجز ' || _patient_name || ' بتاريخ ' || NEW.booking_date;
    _notif_body_patient := 'تم تأكيد حجزك مع د. ' || COALESCE(_doctor_name, '') || ' بتاريخ ' || NEW.booking_date;

  ELSIF NEW.status = 'completed' THEN
    _notif_type := 'booking_completed';
    _notif_title := 'حجز مكتمل';
    _notif_body_doctor := 'تم إكمال جلسة ' || _patient_name || ' بتاريخ ' || NEW.booking_date;
    _notif_body_patient := 'تمت جلستك مع د. ' || COALESCE(_doctor_name, '') || ' بتاريخ ' || NEW.booking_date || '. نتمنى لك الشفاء العاجل';

  ELSE
    RETURN NEW;
  END IF;

  -- Notify doctor
  IF _doctor_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title_ar, body_ar, entity_type, entity_id)
    VALUES (_doctor_user_id, _notif_type, _notif_title, _notif_body_doctor, 'booking', NEW.id);
  END IF;

  -- Notify patient
  INSERT INTO public.notifications (user_id, type, title_ar, body_ar, entity_type, entity_id)
  VALUES (NEW.patient_id, _notif_type, _notif_title, _notif_body_patient, 'booking', NEW.id);

  RETURN NEW;
END;
$$;

-- Create trigger on bookings for UPDATE
CREATE TRIGGER trg_notify_on_booking_update
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_booking_update();

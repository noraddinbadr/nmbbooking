-- Forbid workflow-progressing transitions on past bookings, even for admins.
-- Allowed on past bookings: cancelled, no_show, rescheduled (which moves the date).
CREATE OR REPLACE FUNCTION public.validate_booking_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_valid boolean := false;
  v_is_past boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  v_is_admin := has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'clinic_admin'::app_role);
  v_is_past  := is_booking_past(OLD.booking_date, OLD.start_time);

  -- Block any change to past bookings for non-admins
  IF (NOT v_is_admin) AND v_is_past THEN
    RAISE EXCEPTION 'BOOKING_PAST: لا يمكن تعديل حجز منتهٍ. يلزم صلاحية المسؤول.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Even admins cannot "confirm" / "start" / "complete" a booking whose date is already in the past.
  IF v_is_past AND NEW.status IN ('confirmed','in_progress','completed')
     AND OLD.status IS DISTINCT FROM NEW.status
     AND (NEW.booking_date = OLD.booking_date AND COALESCE(NEW.start_time,'') = COALESCE(OLD.start_time,'')) THEN
    RAISE EXCEPTION 'BOOKING_PAST_WORKFLOW: لا يمكن تأكيد أو بدء أو إكمال حجز في الماضي. أعد جدولته أولاً.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  v_valid := CASE OLD.status
    WHEN 'pending'     THEN NEW.status IN ('confirmed','cancelled','rescheduled','no_show')
    WHEN 'confirmed'   THEN NEW.status IN ('in_progress','completed','cancelled','rescheduled','no_show')
    WHEN 'rescheduled' THEN NEW.status IN ('confirmed','cancelled','in_progress','no_show')
    WHEN 'in_progress' THEN NEW.status IN ('completed','cancelled')
    WHEN 'completed'   THEN false
    WHEN 'cancelled'   THEN v_is_admin
    WHEN 'no_show'     THEN v_is_admin
    ELSE false
  END;

  IF NOT v_valid AND NOT v_is_admin THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: انتقال غير مسموح من % إلى %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END $function$;
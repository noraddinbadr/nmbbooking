
-- 1. Extend booking_status enum
DO $$ BEGIN
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'in_progress';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'rescheduled';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'no_show';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Add reschedule history column
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS rescheduled_from jsonb DEFAULT '[]'::jsonb;

-- 3. Audit log table
CREATE TABLE IF NOT EXISTS public.booking_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  changed_by uuid,
  action text NOT NULL,
  from_status booking_status,
  to_status booking_status,
  from_date date,
  to_date date,
  from_time text,
  to_time text,
  reason text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.booking_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit read by stakeholders" ON public.booking_audit_log;
CREATE POLICY "Audit read by stakeholders" ON public.booking_audit_log
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_audit_log.booking_id
    AND (b.patient_id = auth.uid()
      OR EXISTS (SELECT 1 FROM doctors d WHERE d.id = b.doctor_id AND d.user_id = auth.uid())))
);

DROP POLICY IF EXISTS "Audit insert by auth" ON public.booking_audit_log;
CREATE POLICY "Audit insert by auth" ON public.booking_audit_log
FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_booking_audit_booking ON public.booking_audit_log(booking_id, created_at DESC);

-- 4. Helper: is booking past?
CREATE OR REPLACE FUNCTION public.is_booking_past(_date date, _time text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT (_date::timestamp + COALESCE(_time, '23:59')::time) < now()
$$;

-- 5. Validate status transition trigger
CREATE OR REPLACE FUNCTION public.validate_booking_transition()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_is_admin boolean;
  v_valid boolean := false;
BEGIN
  -- Skip checks for inserts
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  v_is_admin := has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'clinic_admin'::app_role);

  -- Block any change to past bookings for non-admins
  IF (NOT v_is_admin) AND is_booking_past(OLD.booking_date, OLD.start_time) THEN
    -- Allow only admin override; everything else blocked
    RAISE EXCEPTION 'BOOKING_PAST: لا يمكن تعديل حجز منتهٍ. يلزم صلاحية المسؤول.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- If status is unchanged, allow
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- State machine: allowed transitions
  v_valid := CASE OLD.status
    WHEN 'pending'     THEN NEW.status IN ('confirmed','cancelled','rescheduled','no_show')
    WHEN 'confirmed'   THEN NEW.status IN ('in_progress','completed','cancelled','rescheduled','no_show')
    WHEN 'rescheduled' THEN NEW.status IN ('confirmed','cancelled','in_progress','no_show')
    WHEN 'in_progress' THEN NEW.status IN ('completed','cancelled')
    WHEN 'completed'   THEN false
    WHEN 'cancelled'   THEN v_is_admin -- admin can revive
    WHEN 'no_show'     THEN v_is_admin
    ELSE false
  END;

  IF NOT v_valid AND NOT v_is_admin THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: انتقال غير مسموح من % إلى %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_booking_transition ON public.bookings;
CREATE TRIGGER trg_validate_booking_transition
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_transition();

-- 6. Block delete on past bookings for non-admins
CREATE OR REPLACE FUNCTION public.validate_booking_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'clinic_admin'::app_role)) THEN
    IF is_booking_past(OLD.booking_date, OLD.start_time) THEN
      RAISE EXCEPTION 'BOOKING_PAST: لا يمكن حذف حجز منتهٍ.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS trg_validate_booking_delete ON public.bookings;
CREATE TRIGGER trg_validate_booking_delete
  BEFORE DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_delete();

-- 7. Audit log trigger (status change + insert + delete)
CREATE OR REPLACE FUNCTION public.log_booking_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO booking_audit_log(booking_id, changed_by, action, to_status, to_date, to_time)
      VALUES (NEW.id, auth.uid(), 'created', NEW.status, NEW.booking_date, NEW.start_time);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.booking_date IS DISTINCT FROM OLD.booking_date
       OR NEW.start_time IS DISTINCT FROM OLD.start_time THEN
      INSERT INTO booking_audit_log(booking_id, changed_by, action, from_status, to_status, from_date, to_date, from_time, to_time)
        VALUES (NEW.id, auth.uid(),
          CASE WHEN NEW.booking_date IS DISTINCT FROM OLD.booking_date OR NEW.start_time IS DISTINCT FROM OLD.start_time
               THEN 'rescheduled_or_status_change' ELSE 'status_change' END,
          OLD.status, NEW.status, OLD.booking_date, NEW.booking_date, OLD.start_time, NEW.start_time);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO booking_audit_log(booking_id, changed_by, action, from_status, from_date, from_time)
      VALUES (OLD.id, auth.uid(), 'deleted', OLD.status, OLD.booking_date, OLD.start_time);
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_log_booking_status_change ON public.bookings;
CREATE TRIGGER trg_log_booking_status_change
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_booking_status_change();

-- 8. Reschedule RPC with conflict check
CREATE OR REPLACE FUNCTION public.reschedule_booking(
  _booking_id uuid,
  _new_date date,
  _new_start_time text,
  _new_end_time text DEFAULT NULL,
  _reason text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_b bookings%ROWTYPE;
  v_is_admin boolean;
  v_is_owner boolean;
  v_is_doctor boolean;
  v_conflict uuid;
  v_history jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthenticated');
  END IF;

  SELECT * INTO v_b FROM bookings WHERE id = _booking_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  v_is_admin := has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'clinic_admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role);
  v_is_owner := v_b.patient_id = auth.uid();
  v_is_doctor := EXISTS (SELECT 1 FROM doctors d WHERE d.id = v_b.doctor_id AND d.user_id = auth.uid());

  IF NOT (v_is_admin OR v_is_owner OR v_is_doctor) THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  -- Cannot reschedule completed/cancelled
  IF v_b.status IN ('completed','cancelled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_state', 'message', 'لا يمكن إعادة جدولة حجز مكتمل أو ملغي');
  END IF;

  -- Cannot reschedule past booking unless admin
  IF NOT v_is_admin AND is_booking_past(v_b.booking_date, v_b.start_time) THEN
    RETURN jsonb_build_object('success', false, 'error', 'past_booking', 'message', 'لا يمكن إعادة جدولة حجز منتهٍ');
  END IF;

  -- New time must not be in past (unless admin)
  IF NOT v_is_admin AND is_booking_past(_new_date, _new_start_time) THEN
    RETURN jsonb_build_object('success', false, 'error', 'past_target', 'message', 'الموعد الجديد في الماضي');
  END IF;

  -- Conflict check: same doctor, same date, overlapping start_time, not cancelled
  SELECT id INTO v_conflict FROM bookings
   WHERE doctor_id = v_b.doctor_id
     AND id <> _booking_id
     AND booking_date = _new_date
     AND start_time = _new_start_time
     AND status NOT IN ('cancelled','no_show','completed')
   LIMIT 1;

  IF v_conflict IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'conflict', 'message', 'يوجد حجز آخر في نفس الموعد', 'conflict_id', v_conflict);
  END IF;

  -- Append history
  v_history := COALESCE(v_b.rescheduled_from, '[]'::jsonb) || jsonb_build_object(
    'from_date', v_b.booking_date,
    'from_start_time', v_b.start_time,
    'from_end_time', v_b.end_time,
    'rescheduled_at', now(),
    'rescheduled_by', auth.uid(),
    'reason', _reason
  );

  UPDATE bookings SET
    booking_date = _new_date,
    start_time = _new_start_time,
    end_time = COALESCE(_new_end_time, end_time),
    status = CASE WHEN status = 'pending' THEN 'rescheduled'::booking_status
                  WHEN status = 'confirmed' THEN 'rescheduled'::booking_status
                  ELSE status END,
    rescheduled_from = v_history,
    updated_at = now()
  WHERE id = _booking_id;

  -- Add reason to most recent audit row
  UPDATE booking_audit_log SET reason = _reason, action = 'rescheduled'
   WHERE booking_id = _booking_id
     AND id = (SELECT id FROM booking_audit_log WHERE booking_id = _booking_id ORDER BY created_at DESC LIMIT 1);

  RETURN jsonb_build_object('success', true, 'booking_id', _booking_id, 'new_date', _new_date, 'new_start_time', _new_start_time);
END $$;

GRANT EXECUTE ON FUNCTION public.reschedule_booking(uuid, date, text, text, text) TO authenticated;

-- 9. Status change RPC (carries reason)
CREATE OR REPLACE FUNCTION public.set_booking_status(
  _booking_id uuid,
  _new_status booking_status,
  _reason text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_b bookings%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthenticated');
  END IF;

  SELECT * INTO v_b FROM bookings WHERE id = _booking_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  -- The transition trigger will validate; just attempt the update.
  UPDATE bookings SET status = _new_status, updated_at = now() WHERE id = _booking_id;

  -- Persist reason on latest audit row
  UPDATE booking_audit_log SET reason = _reason
   WHERE booking_id = _booking_id
     AND id = (SELECT id FROM booking_audit_log WHERE booking_id = _booking_id ORDER BY created_at DESC LIMIT 1);

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END $$;

GRANT EXECUTE ON FUNCTION public.set_booking_status(uuid, booking_status, text) TO authenticated;

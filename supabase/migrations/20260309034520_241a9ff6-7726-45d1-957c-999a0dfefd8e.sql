
-- Trigger: notify when provider order results are uploaded
CREATE OR REPLACE FUNCTION public.notify_on_order_results()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _patient_id UUID;
  _doctor_id UUID;
  _doctor_user_id UUID;
  _patient_name TEXT;
  _order_type_ar TEXT;
BEGIN
  -- Only fire when status changes to results_uploaded or delivered
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('results_uploaded', 'delivered') THEN RETURN NEW; END IF;

  -- Extract patient and doctor from order_details
  _patient_id := (NEW.order_details->>'patient_id')::UUID;
  _doctor_id := (NEW.order_details->>'doctor_id')::UUID;

  IF _patient_id IS NULL THEN RETURN NEW; END IF;

  -- Get doctor user_id
  SELECT user_id INTO _doctor_user_id FROM public.doctors WHERE id = _doctor_id;

  -- Get patient name
  SELECT COALESCE(full_name_ar, full_name, 'مريض') INTO _patient_name
  FROM public.profiles WHERE id = _patient_id;

  -- Determine order type label
  _order_type_ar := CASE NEW.order_type
    WHEN 'lab' THEN 'نتائج التحاليل'
    WHEN 'imaging' THEN 'نتائج الأشعة'
    ELSE 'نتائج الطلب'
  END;

  -- Notify patient
  INSERT INTO public.notifications (user_id, type, title_ar, body_ar, entity_type, entity_id)
  VALUES (
    _patient_id,
    'results_ready',
    _order_type_ar || ' جاهزة',
    _order_type_ar || ' الخاصة بك جاهزة للمراجعة',
    'provider_order',
    NEW.id
  );

  -- Notify doctor
  IF _doctor_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title_ar, body_ar, entity_type, entity_id)
    VALUES (
      _doctor_user_id,
      'results_ready',
      _order_type_ar || ' جاهزة',
      _order_type_ar || ' لـ ' || _patient_name || ' جاهزة',
      'provider_order',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_notify_order_results
AFTER UPDATE ON public.provider_orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_order_results();

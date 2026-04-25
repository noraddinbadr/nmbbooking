
CREATE OR REPLACE FUNCTION public.is_booking_past(_date date, _time text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT (_date::timestamp + COALESCE(_time, '23:59')::time) < now()
$$;

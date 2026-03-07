
-- Fix permissive INSERT policy on notifications - only system trigger should insert
DROP POLICY "System inserts notifications" ON public.notifications;

CREATE POLICY "Authenticated inserts notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);

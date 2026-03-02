
-- Fix donation insert policy to require donor_id = auth.uid() when donor_id is set
DROP POLICY "Create donation" ON public.donations;
CREATE POLICY "Create donation" ON public.donations
  FOR INSERT TO authenticated
  WITH CHECK (donor_id IS NULL OR donor_id = auth.uid());

-- Fix audit log insert to only allow system/self logging
DROP POLICY "Insert logs" ON public.audit_logs;
CREATE POLICY "Insert logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

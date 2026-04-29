-- Allow admin and clinic_admin (besides doctor) to insert medical_cases.
DROP POLICY IF EXISTS "Doctor creates case" ON public.medical_cases;

CREATE POLICY "Authorized creates case"
ON public.medical_cases
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    has_role(auth.uid(), 'doctor'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'clinic_admin'::app_role)
  )
);
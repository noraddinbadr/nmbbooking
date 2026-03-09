
-- Create medical-files storage bucket (private - accessed via signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-files', 'medical-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create medical_files metadata table
CREATE TABLE public.medical_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  uploaded_by UUID NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id),
  session_id UUID REFERENCES public.treatment_sessions(id),
  booking_id UUID REFERENCES public.bookings(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'other',
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.medical_files ENABLE ROW LEVEL SECURITY;

-- Doctors/admin can manage files they uploaded or for their patients
CREATE POLICY "Doctor manages medical files"
ON public.medical_files FOR ALL
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.doctors d WHERE d.id = medical_files.doctor_id AND d.user_id = auth.uid()
  )
);

-- Patients can view their own files
CREATE POLICY "Patient reads own medical files"
ON public.medical_files FOR SELECT
TO authenticated
USING (patient_id = auth.uid());

-- Storage policies for medical-files bucket
CREATE POLICY "Medical staff upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-files'
  AND (
    has_role(auth.uid(), 'doctor'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  )
);

CREATE POLICY "Medical staff update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'medical-files'
  AND (
    has_role(auth.uid(), 'doctor'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  )
);

CREATE POLICY "Authenticated read medical files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'medical-files');

CREATE POLICY "Medical staff delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-files'
  AND (
    has_role(auth.uid(), 'doctor'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);


-- Treatment sessions: records each consultation/visit
CREATE TABLE public.treatment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  symptoms TEXT,
  examination TEXT,
  diagnosis TEXT,
  notes TEXT,
  follow_up_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prescriptions linked to a session
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.treatment_sessions(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) NOT NULL,
  pharmacy_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual medicine items in a prescription
CREATE TABLE public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT
);

-- Enable RLS
ALTER TABLE public.treatment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

-- treatment_sessions RLS
CREATE POLICY "Doctor manages own sessions" ON public.treatment_sessions FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = treatment_sessions.doctor_id AND d.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Patient reads own sessions" ON public.treatment_sessions FOR SELECT TO authenticated
  USING (patient_id = auth.uid());

-- prescriptions RLS
CREATE POLICY "Doctor manages prescriptions" ON public.prescriptions FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = prescriptions.doctor_id AND d.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Patient reads own prescriptions" ON public.prescriptions FOR SELECT TO authenticated
  USING (patient_id = auth.uid());

-- prescription_items RLS (inherit via prescription)
CREATE POLICY "Doctor manages prescription items" ON public.prescription_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prescriptions p
      JOIN public.doctors d ON d.id = p.doctor_id
      WHERE p.id = prescription_items.prescription_id AND d.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Patient reads own prescription items" ON public.prescription_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prescriptions p
      WHERE p.id = prescription_items.prescription_id AND p.patient_id = auth.uid()
    )
  );

-- Updated_at triggers
CREATE TRIGGER update_treatment_sessions_updated_at BEFORE UPDATE ON public.treatment_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime for treatment_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.treatment_sessions;

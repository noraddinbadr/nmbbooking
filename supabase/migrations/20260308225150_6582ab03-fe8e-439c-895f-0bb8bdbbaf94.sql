
-- Fix doctor_shifts RLS: drop restrictive SELECT and recreate as permissive
DROP POLICY IF EXISTS "Shifts read auth" ON public.doctor_shifts;
CREATE POLICY "Shifts read auth" ON public.doctor_shifts FOR SELECT USING (true);

-- Fix doctors RLS: ensure public read is permissive
DROP POLICY IF EXISTS "Doctors public read" ON public.doctors;
CREATE POLICY "Doctors public read" ON public.doctors FOR SELECT USING (true);

-- Fix clinics RLS
DROP POLICY IF EXISTS "Clinics public read" ON public.clinics;
CREATE POLICY "Clinics public read" ON public.clinics FOR SELECT USING (true);

-- Fix bookings: patient and doctor need to read
DROP POLICY IF EXISTS "Patient sees bookings" ON public.bookings;
CREATE POLICY "Patient sees bookings" ON public.bookings FOR SELECT USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "Doctor sees bookings" ON public.bookings;
CREATE POLICY "Doctor sees bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM doctors d WHERE d.id = bookings.doctor_id AND d.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admin sees bookings" ON public.bookings;
CREATE POLICY "Admin sees bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated creates booking" ON public.bookings;
CREATE POLICY "Authenticated creates booking" ON public.bookings FOR INSERT 
WITH CHECK (
  patient_id = auth.uid() OR 
  public.has_role(auth.uid(), 'doctor') OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR 
  public.has_role(auth.uid(), 'clinic_admin')
);

DROP POLICY IF EXISTS "Booking update" ON public.bookings;
CREATE POLICY "Booking update" ON public.bookings FOR UPDATE USING (
  patient_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM doctors d WHERE d.id = bookings.doctor_id AND d.user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR 
  public.has_role(auth.uid(), 'clinic_admin')
);

-- Fix profiles
DROP POLICY IF EXISTS "Profiles public read" ON public.profiles;
CREATE POLICY "Profiles public read" ON public.profiles FOR SELECT USING (true);

-- Fix notifications
DROP POLICY IF EXISTS "User reads own notifications" ON public.notifications;
CREATE POLICY "User reads own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "User updates own notifications" ON public.notifications;
CREATE POLICY "User updates own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated inserts notifications" ON public.notifications;
CREATE POLICY "Authenticated inserts notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix treatment_sessions
DROP POLICY IF EXISTS "Doctor manages own sessions" ON public.treatment_sessions;
CREATE POLICY "Doctor manages own sessions" ON public.treatment_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM doctors d WHERE d.id = treatment_sessions.doctor_id AND d.user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Patient reads own sessions" ON public.treatment_sessions;
CREATE POLICY "Patient reads own sessions" ON public.treatment_sessions FOR SELECT USING (patient_id = auth.uid());

-- Fix prescriptions
DROP POLICY IF EXISTS "Doctor manages prescriptions" ON public.prescriptions;
CREATE POLICY "Doctor manages prescriptions" ON public.prescriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM doctors d WHERE d.id = prescriptions.doctor_id AND d.user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Patient reads own prescriptions" ON public.prescriptions;
CREATE POLICY "Patient reads own prescriptions" ON public.prescriptions FOR SELECT USING (patient_id = auth.uid());

-- Fix prescription_items
DROP POLICY IF EXISTS "Doctor manages prescription items" ON public.prescription_items;
CREATE POLICY "Doctor manages prescription items" ON public.prescription_items FOR ALL USING (
  EXISTS (SELECT 1 FROM prescriptions p JOIN doctors d ON d.id = p.doctor_id WHERE p.id = prescription_items.prescription_id AND d.user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Patient reads own prescription items" ON public.prescription_items;
CREATE POLICY "Patient reads own prescription items" ON public.prescription_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM prescriptions p WHERE p.id = prescription_items.prescription_id AND p.patient_id = auth.uid())
);

-- Fix doctor_shifts doctor manages
DROP POLICY IF EXISTS "Doctor manages shifts" ON public.doctor_shifts;
CREATE POLICY "Doctor manages shifts" ON public.doctor_shifts FOR ALL USING (
  EXISTS (SELECT 1 FROM doctors d WHERE d.id = doctor_shifts.doctor_id AND d.user_id = auth.uid())
);

-- Fix other tables used in the app
DROP POLICY IF EXISTS "Providers read" ON public.providers;
CREATE POLICY "Providers read" ON public.providers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Donations read" ON public.donations;
CREATE POLICY "Donations read" ON public.donations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read services" ON public.services;
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read service_categories" ON public.service_categories;
CREATE POLICY "Public read service_categories" ON public.service_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read sponsor_types" ON public.sponsor_types;
CREATE POLICY "Public read sponsor_types" ON public.sponsor_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read sponsors" ON public.sponsors;
CREATE POLICY "Public read sponsors" ON public.sponsors FOR SELECT USING (true);

-- Fix user_roles
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Ensure the notification trigger exists
DROP TRIGGER IF EXISTS trg_notify_doctor_on_booking ON public.bookings;
CREATE TRIGGER trg_notify_doctor_on_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_doctor_on_booking();

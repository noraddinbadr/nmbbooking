
-- Allow doctors to create bookings (for their own patients)
DROP POLICY IF EXISTS "Patient creates booking" ON public.bookings;
CREATE POLICY "Authenticated creates booking"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (
    patient_id = auth.uid()
    OR has_role(auth.uid(), 'doctor')
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'staff')
    OR has_role(auth.uid(), 'clinic_admin')
  );

-- Allow doctors to create medical_camps
DROP POLICY IF EXISTS "Create camps" ON public.medical_camps;
CREATE POLICY "Create camps"
  ON public.medical_camps FOR INSERT TO authenticated
  WITH CHECK (
    organizer_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'doctor')
    OR has_role(auth.uid(), 'clinic_admin')
  );

-- Allow doctors to see all camps they organize or admin
DROP POLICY IF EXISTS "Organizer sees camps" ON public.medical_camps;
CREATE POLICY "Organizer sees camps"
  ON public.medical_camps FOR SELECT TO authenticated
  USING (
    organizer_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'doctor')
  );

-- Allow doctor to also see all bookings for their clinic
DROP POLICY IF EXISTS "Booking update" ON public.bookings;
CREATE POLICY "Booking update"
  ON public.bookings FOR UPDATE TO authenticated
  USING (
    patient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM doctors d WHERE d.id = bookings.doctor_id AND d.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'staff')
    OR has_role(auth.uid(), 'clinic_admin')
  );

-- Allow doctor/admin to insert providers
DROP POLICY IF EXISTS "Admin inserts provider" ON public.providers;
CREATE POLICY "Authenticated inserts provider"
  ON public.providers FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'doctor')
    OR has_role(auth.uid(), 'clinic_admin')
  );

-- Allow doctor to manage services (read already public, need insert/update)
DROP POLICY IF EXISTS "Admin manages services" ON public.services;
CREATE POLICY "Admin or doctor manages services"
  ON public.services FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'clinic_admin'));

DROP POLICY IF EXISTS "Admin manages service_categories" ON public.service_categories;
CREATE POLICY "Admin or doctor manages service_categories"
  ON public.service_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'clinic_admin'));

-- Allow doctor to create provider_orders
DROP POLICY IF EXISTS "Create order" ON public.provider_orders;
CREATE POLICY "Create order"
  ON public.provider_orders FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'doctor')
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'staff')
  );

-- Allow doctor to manage donations
DROP POLICY IF EXISTS "Create donation" ON public.donations;
CREATE POLICY "Create donation"
  ON public.donations FOR INSERT TO authenticated
  WITH CHECK (
    donor_id IS NULL
    OR donor_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'doctor')
  );


-- Enable safe DELETE operations across CRUD-managed tables.
-- Pattern: admins can delete; owners/creators can delete their own.

-- clinics: admin or owner can delete
CREATE POLICY "Owner or admin deletes clinic"
ON public.clinics FOR DELETE TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- doctors: admin or self
CREATE POLICY "Admin or self deletes doctor"
ON public.doctors FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- staff_members: clinic owner or admin
CREATE POLICY "Clinic owner deletes staff"
ON public.staff_members FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.clinics c WHERE c.id = staff_members.clinic_id AND c.owner_id = auth.uid())
);

-- doctor_shifts: doctor (self) or admin
CREATE POLICY "Doctor or admin deletes shift"
ON public.doctor_shifts FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_shifts.doctor_id AND d.user_id = auth.uid())
);

-- bookings: patient owner, doctor, admin, clinic_admin, staff
CREATE POLICY "Booking delete"
ON public.bookings FOR DELETE TO authenticated
USING (
  patient_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = bookings.doctor_id AND d.user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'clinic_admin') OR
  public.has_role(auth.uid(), 'staff')
);

-- services / service_categories / sponsors / sponsor_types: admin or doctor/clinic_admin
CREATE POLICY "Admin manages services delete"
ON public.services FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'clinic_admin') OR public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Admin manages service_categories delete"
ON public.service_categories FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'clinic_admin') OR public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Admin deletes sponsors"
ON public.sponsors FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin deletes sponsor_types"
ON public.sponsor_types FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- providers + provider_orders
CREATE POLICY "Admin or self deletes provider"
ON public.providers FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin deletes provider_orders"
ON public.provider_orders FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_orders.provider_id AND p.user_id = auth.uid())
);

-- medical_camps + event_schedules + registrations + donations
CREATE POLICY "Organizer or admin deletes camp"
ON public.medical_camps FOR DELETE TO authenticated
USING (organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Organizer or admin deletes schedule"
ON public.event_schedules FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.medical_camps mc WHERE mc.id = event_schedules.camp_id AND mc.organizer_id = auth.uid())
);

CREATE POLICY "Owner or admin deletes registration"
ON public.registrations FOR DELETE TO authenticated
USING (booked_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin deletes donations"
ON public.donations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- medical_cases + medical_files
CREATE POLICY "Creator or admin deletes case"
ON public.medical_cases FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Uploader or admin deletes medical_file"
ON public.medical_files FOR DELETE TO authenticated
USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- prescriptions / prescription_items / treatment_sessions
CREATE POLICY "Doctor or admin deletes prescription"
ON public.prescriptions FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = prescriptions.doctor_id AND d.user_id = auth.uid())
);

CREATE POLICY "Doctor or admin deletes rx item"
ON public.prescription_items FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.prescriptions p JOIN public.doctors d ON d.id = p.doctor_id
    WHERE p.id = prescription_items.prescription_id AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Doctor or admin deletes session"
ON public.treatment_sessions FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = treatment_sessions.doctor_id AND d.user_id = auth.uid())
);

-- profiles: only admin can delete
CREATE POLICY "Admin deletes profile"
ON public.profiles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- notifications: user can delete own, admin can delete any
CREATE POLICY "User or admin deletes notification"
ON public.notifications FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

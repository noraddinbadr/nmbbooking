# Sehtak — Roadmap & Progress

## ✅ Done
- Modular architecture foundation: `src/shared/*` kernel + `src/modules/bookings/*` pilot (repo / service / hooks / schemas).
- Login fixed: dev accounts reset to `Admin123` via `seed-users` edge fn; email auto-confirmed.
- Triggers (P0): 14 missing triggers attached (audit, notify, FSM, status stamping, bid total, funded_amount, shift overlap, updated_at).
- Trigger cleanup: removed 12 duplicate triggers; restored `auth.users → handle_new_user`.
- DB backup: `/mnt/documents/sehtak_full_backup.sql` (schema + data, column-inserts).
- Decision: Auctions (MS-RAG) and Procurement (RFQ) remain separate domains.
- **Bookings module finalised**: deleted `src/components/booking/*`, `src/lib/bookingState.ts`; `BookingQRButton` moved to module; all callers go via `@/modules/bookings`.
- **Auth module**: `src/modules/auth/*` (repo, service, schemas, AuthProvider). `src/contexts/AuthContext` is now a thin re-export shim.
- **Doctors module**: `src/modules/doctors/*` (repo, service, schemas, hooks). All 5 callers migrated; `src/hooks/useDoctors.ts` removed.
- **Clinics module**: `src/modules/clinics/*` (repo, service, schemas, hooks).

## 🔴 Next — Phase 3 (Consultation pipeline)
- [ ] `src/modules/consultations/*` wrapping `treatment_sessions` + `prescriptions` + `prescription_items` + `medical_files`.
- [ ] "Start consultation" from a confirmed booking → opens a session; saving the session transitions booking → `completed`.
- [ ] Patient comprehensive file: visits + prescriptions + medical files + lab/imaging in one page.
- [ ] QR code on booking + Kiosk scan → set status `in_progress`.

## 🟡 Phase 4 — Migrate remaining domains to modular layout
- [ ] `procurement`, `auctions`, `events`, `notifications`, `patients`, `catalog`.
- [ ] Replace direct supabase calls in pages with module hooks.
- [ ] Migrate remaining `@/contexts/AuthContext` imports (24 files) to `@/modules/auth`, then delete the shim.

## 🧱 Phase 5 — Decompose monolithic pages (>500L)
- [ ] `DashboardBookings` (545L) → split into list / filters / actions / dialogs inside `modules/bookings/components/`.
- [ ] `ActiveConsultation` → split into Symptoms / Diagnosis / Prescription / Orders inside `modules/consultations/components/`.
- [ ] `DashboardProcurement`, `DashboardAuctions`, `DashboardEventsAdmin` — same approach.

## 🟢 Phase 3 — Reports & polish
- [ ] Historical charts (recharts): monthly revenue, top services.
- [ ] Email confirmation via edge function.

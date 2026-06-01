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

## ✅ Phase 3 — Consultation pipeline (done)
- `src/modules/consultations/*` — schemas, repos (sessions / prescriptions / providerOrders), service, components.
- `consultationsService.openForBooking` resumes or creates an active session; `endSession` persists notes + prescription + provider orders + transitions booking → `completed`.
- `ActiveConsultation` page rewritten on top of the module (675L → 382L) using `PatientHistoryPanel`, `ConsultationNotesCard`, `PrescriptionBuilder`, `CatalogPicker`.

## 🟡 Phase 3.1 — Remaining consultation polish
- [ ] Patient comprehensive file page (visits + prescriptions + files + lab/imaging) on top of `consultationsService.loadHistory`.
- [ ] QR code on booking + Kiosk scan → set status `in_progress`.

## 🟡 Phase 4 — Migrate remaining domains to modular layout
- [x] `procurement` module: `src/modules/procurement/{api,services,index}` — `useProcurement` hooks now delegate to repo + service (no direct supabase).
- [x] `auctions` module: `src/modules/auctions/{api,components,index}` — `useAuctionRequests` delegates to repo.
- [ ] `events`, `notifications`, `patients`, `catalog`.
- [ ] Replace direct supabase calls in pages with module hooks.
- [ ] Migrate remaining `@/contexts/AuthContext` imports (24 files) to `@/modules/auth`, then delete the shim.

## 🧱 Phase 5 — Decompose monolithic pages (>500L)
- [x] `DashboardBookings` (543L → 265L) — extracted `BookingsStatsBar`, `BookingsFilters`, `BookingCard` into `modules/bookings/components/`.
- [x] `ActiveConsultation` (675L → 382L) — extracted `PatientHistoryPanel`, `ConsultationNotesCard`, `PrescriptionBuilder`, `CatalogPicker` into `modules/consultations/components/`.
- [x] `DashboardAuctions` — `AuctionsStatsBar` extracted; remaining file under 200L.
- [x] `DashboardProcurement` (85L) and `DashboardEventsAdmin` (96L) already within budget — no decomposition needed.

## 🟢 Phase 3 — Reports & polish
- [ ] Historical charts (recharts): monthly revenue, top services.
- [ ] Email confirmation via edge function.

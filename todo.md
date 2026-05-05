# Sehtak — Roadmap & Progress

## ✅ Done
- Modular architecture foundation: `src/shared/*` kernel + `src/modules/bookings/*` pilot (repo / service / hooks / schemas).
- Login fixed: dev accounts reset to `Admin123` via `seed-users` edge fn; email auto-confirmed.
- Triggers (P0): 14 missing triggers attached (audit, notify, FSM, status stamping, bid total, funded_amount, shift overlap, updated_at).
- Trigger cleanup: removed 12 duplicate triggers; restored `auth.users → handle_new_user`.
- DB backup: `/mnt/documents/sehtak_full_backup.sql` (schema + data, column-inserts).
- Decision: Auctions (MS-RAG) and Procurement (RFQ) remain separate domains.

## 🔴 Next — Phase 1 (Booking → Consultation pipeline)
- [ ] Wire `treatment_sessions` to bookings UI: "Start consultation" from a confirmed booking creates a session; session completion transitions booking → `completed`.
- [ ] Patient comprehensive file: visits + prescriptions + medical files + lab/imaging in one page.
- [ ] QR code on booking + Kiosk scan → set status `in_progress`.

## 🟡 Phase 2 — Migrate remaining domains to modular layout
- [ ] `auth`, `doctors`, `clinics`, `procurement`, `auctions`, `events`, `notifications`.
- [ ] Replace direct supabase calls in pages with module hooks.

## 🟢 Phase 3 — Reports & polish
- [ ] Historical charts (recharts): monthly revenue, top services.
- [ ] Email confirmation via edge function.

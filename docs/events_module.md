# Events / Medical Camps Module — Documentation

## Overview
Complete "Events / Medical Camps" module for the Sehtak platform, enabling creation and management of free medical camps with registration, sponsorship, and provider integration.

## Created Files

### SQL
- `sql/events_ddl.sql` — Full DDL with 13 tables, atomic booking functions, RLS policies
- `sql/seed_events.sql` — Seed data: 2 clinics, 2 camps, 4 schedules, 3 registrations

### Types & Data
- `src/data/eventsTypes.ts` — TypeScript interfaces for all entities
- `src/data/eventsMockData.ts` — Mock data for development
- `src/api/camps.ts` — Backend endpoint stubs (pseudocode)

### Components (src/components/events/)
- `EventCard.tsx` — Camp card with progress bars and sponsor badges
- `SchedulePicker.tsx` — Day tabs + time slot picker
- `SlotButton.tsx` — Slot with capacity badge
- `RegisterModal.tsx` — Book for self/other, sponsorship request, hold flow
- `HoldCountdown.tsx` — 5-min TTL countdown timer
- `DonateModal.tsx` — Wallet/bank donation flow
- `AdminEventForm.tsx` — Full camp builder (schedules, sponsors)
- `RegistrationsTable.tsx` — Filtered table with CSV export
- `CSVExport.tsx` — PII-masked CSV download
- `ProviderOrderCard.tsx` — Order status flow card

### Pages
- `src/pages/events/EventList.tsx` — Public event listing with filters
- `src/pages/events/EventDetail.tsx` — Event detail + schedule + cases
- `src/pages/CasesList.tsx` — Anonymized cases for donation
- `src/pages/dashboard/DashboardEventsAdmin.tsx` — Admin event management
- `src/pages/dashboard/DashboardProviders.tsx` — Provider portal
- `src/pages/KioskCheckin.tsx` — Kiosk check-in by code/phone

### Hooks
- `src/hooks/useHolds.ts` — Hold creation, confirmation, release, countdown

### Tests
- `src/test/concurrency.test.ts` — Parallel hold simulation

## Routes Added
| Route | Page |
|---|---|
| `/events` | Event listing |
| `/events/:id` | Event detail |
| `/cases` | Cases for donation |
| `/dashboard/events` | Admin event management |
| `/dashboard/providers` | Provider portal |
| `/dashboard/kiosk` | Kiosk check-in |

## Migration Steps
1. Enable Lovable Cloud (Supabase)
2. Run `sql/events_ddl.sql` to create tables
3. Run `sql/seed_events.sql` to seed test data
4. Enable RLS on all tables
5. Set up cron: `SELECT public.reclaim_expired_holds()` every minute

## Atomic Booking Pattern
Uses `UPDATE ... WHERE available_slots > 0` for race-condition-free slot reservation with 5-minute hold TTL.

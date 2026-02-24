

# Plan: Project Summary and Overview Files

## What will be created

Two files at the project root:

### 1. `project_summary.md`
A Markdown document covering:
- **Project identity**: "Sehtak" (صحتك) — Community Healthcare Booking Platform for Yemen. Status: Editor/Preview (no production backend). Last modified: 2026-02-24.
- **What's been built** (numbered list):
  1. Public-facing pages: Homepage with hero search, specialty grid, featured doctors
  2. Doctor listing page with filters (specialty, city, gender, sort)
  3. Doctor profile page with booking sidebar, reviews, about section
  4. Patient bookings page (My Bookings)
  5. Auth pages: Sign In, Sign Up, Forgot Password
  6. Doctor Dashboard — 9 screens: Home, Calendar, Bookings, Patients, Profile, Services (catalog), Treatment Files, Reports, Active Consultation
  7. Service Catalog system: 12 medicines, 12 lab tests, 8 imaging types, 10 procedures with doctor price overrides
  8. Dashboard Layout with header profile dropdown, notifications, slim sidebar
  9. Mock data layer: 6 doctors, 12 specialties, 6 cities, 6 patients, 11 appointments, prescriptions, lab orders, treatment files
- **Project structure**: file tree summary
- **Development roadmap** (priority-ordered):
  1. Enable Lovable Cloud (Supabase) — database, auth, RLS
  2. Connect auth to all routes (doctor login, patient login, admin)
  3. Persist all mock data to real DB tables
  4. Real-time booking flow with double-booking prevention
  5. SMS/WhatsApp notifications (Twilio integration)
  6. Payment/commission system (Stripe)
  7. Admin dashboard for platform management
  8. **New modules**: Medical Events (free medical camps), Sponsors/Donors management, Patient case sponsorship (full/partial funding)
  9. PWA + dark mode
  10. Arabic/English language toggle
- **Entity samples**: JSON examples for doctors, patients, appointments, prescriptions (2-3 each)
- **External connections status**: All currently mock/not-configured (no Supabase, no Firebase, no Stripe, no external APIs). Only `LOVABLE_API_KEY` exists.
- **Next 3 immediate steps**: (1) Enable Supabase for DB + Auth, (2) Add booking conflict prevention logic, (3) Connect Stripe sandbox for payments

### 2. `project_overview.json`
A structured JSON file with keys:
- `project`: name, status ("editor/preview"), last_modified
- `pages`: 14 routes with titles and component lists
- `components`: all custom components with props/state summary
- `data_sources`: 4 local mock data files
- `integrations`: SMS (not-configured), WhatsApp (not-configured), Google Calendar (not-configured), Supabase (not-configured), Stripe (not-configured)
- `missing_endpoints`: auth API, booking API, prescriptions API, lab orders API, notifications API
- `issues`: 7 items (no backend/auth = urgent, all data mock = high, no double-booking prevention = high, no RTL English toggle = medium, etc.)
- `next_steps_top5`: Enable Supabase, implement auth, persist data, real-time bookings, payment integration
- `entity_samples`: Same JSON samples embedded

## Technical Details

- Both files will be created at the project root (`/project_summary.md` and `/project_overview.json`)
- No existing files will be modified
- The JSON file will be valid, well-structured JSON
- Entity samples will use actual data from the existing mock files (`mockData.ts`, `dashboardMockData.ts`)
- All integration statuses will accurately reflect current state (all mock or not-configured)


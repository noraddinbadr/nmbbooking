# Sehtak (صحتك) — Project Summary

## Project Identity

| Field | Value |
|---|---|
| **Name** | Sehtak (صحتك) — Community Healthcare Booking Platform for Yemen |
| **Status** | Editor / Preview (no production backend) |
| **Last Modified** | 2026-02-24 |
| **Tech Stack** | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion |

---

## What Has Been Built

1. **Homepage** — Hero search (doctor name, specialty, city), specialty grid (12 specialties), featured doctors carousel.
2. **Doctor Listing (`/doctors`)** — Filterable list (specialty, city, gender, sort by rating/price), doctor cards with booking-type badges.
3. **Doctor Profile (`/doctor/:id`)** — About section, education, reviews, booking sidebar with date/time-slot picker.
4. **Patient Bookings (`/my-bookings`)** — View upcoming & past bookings with status indicators.
5. **Auth Pages** — Sign In, Sign Up, Forgot Password (UI only, no backend auth).
6. **Doctor Dashboard (9 screens)**:
   - Home (stats, today's queue, revenue chart)
   - Calendar
   - Bookings (with "Start Session" action)
   - Patients (list + details)
   - Profile & Settings (in header dropdown)
   - Services / Catalog (medicines, labs, imaging, procedures with price overrides)
   - Treatment Files
   - Reports
   - Active Consultation (central workspace: patient context → diagnosis → prescriptions → lab orders → end session)
7. **Service Catalog** — 12 medicines, 12 lab tests, 8 imaging types, 10 procedures; each with system default price + optional doctor/clinic override.
8. **Dashboard Layout** — Slim sidebar, header with profile dropdown & notifications.
9. **Mock Data Layer** — 6 doctors, 12 specialties, 6 cities, 6 patients, 11 appointments, 2 prescriptions, 3 lab orders, 2 treatment files, 5 notifications.

---

## Project Structure

```
src/
├── pages/
│   ├── Index.tsx, Doctors.tsx, DoctorProfile.tsx
│   ├── MyBookings.tsx, SignIn.tsx, SignUp.tsx, ForgotPassword.tsx
│   └── dashboard/
│       ├── DashboardHome.tsx, DashboardCalendar.tsx, DashboardBookings.tsx
│       ├── DashboardPatients.tsx, DashboardProfile.tsx, DashboardServices.tsx
│       ├── DashboardTreatment.tsx, DashboardReports.tsx, ActiveConsultation.tsx
├── components/
│   ├── Navbar.tsx, Footer.tsx, HeroSearch.tsx, SpecialtyGrid.tsx
│   ├── FeaturedDoctors.tsx, DoctorCard.tsx, NavLink.tsx
│   ├── doctor/ (BookingSidebar, DoctorAbout, DoctorProfileHeader, DoctorReviews)
│   ├── dashboard/ (DashboardLayout)
│   └── ui/ (40+ shadcn components)
├── data/
│   ├── mockData.ts        — doctors, specialties, cities, reviews, bookings
│   ├── dashboardMockData.ts — patients, appointments, prescriptions, lab orders, treatment files
│   ├── serviceCatalog.ts  — medicines, lab tests, imaging, procedures
│   └── types.ts           — shared TypeScript interfaces
```

---

## Development Roadmap (Priority Order)

1. **Enable Lovable Cloud (Supabase)** — PostgreSQL database, authentication, RLS policies.
2. **Connect auth to all routes** — Doctor login, patient login, admin role.
3. **Persist all mock data to real DB tables** — doctors, patients, appointments, prescriptions, lab orders, services catalog.
4. **Real-time booking flow** — Double-booking prevention, slot locking, confirmation workflow.
5. **SMS / WhatsApp notifications** — Twilio integration for appointment reminders & confirmations.
6. **Payment / commission system** — Stripe sandbox → production for consultation fees.
7. **Admin dashboard** — Platform management, doctor verification, analytics.
8. **New modules**:
   - **Medical Events** — Create and manage free medical camps, volunteer registration.
   - **Sponsors & Donors** — Manage sponsors/partners who fund patient treatments.
   - **Patient Case Sponsorship** — Full or partial funding of medical cases by donors.
9. **PWA + Dark mode** — Installable app, offline support, theme toggle.
10. **Arabic / English language toggle** — Full RTL/LTR with i18n.

---

## Entity Samples (Current Mock Data)

### Doctor
```json
{
  "id": "dr-1",
  "nameAr": "د. أحمد محمد العليمي",
  "nameEn": "Dr. Ahmed Al-Alimi",
  "specialty": "cardiology",
  "city": "sanaa",
  "rating": 4.8,
  "basePrice": 5000,
  "bookingTypes": ["clinic", "video"],
  "isVerified": true
}
```

### Patient (Dashboard)
```json
{
  "id": "p1",
  "name": "أحمد محمد علي",
  "phone": "777123456",
  "gender": "male",
  "age": 35,
  "classification": "regular",
  "totalVisits": 5
}
```

### Appointment
```json
{
  "id": "a1",
  "patientId": "p1",
  "patientName": "أحمد محمد علي",
  "slotTime": "09:00",
  "slotDate": "2026-02-22",
  "bookingType": "clinic",
  "status": "confirmed",
  "price": 5000,
  "priority": "normal"
}
```

### Prescription
```json
{
  "id": "rx1",
  "patientId": "p1",
  "medicines": [
    { "name": "أسبرين", "dosage": "100mg", "frequency": "مرة يومياً", "duration": "3 أشهر" },
    { "name": "أتورفاستاتين", "dosage": "20mg", "frequency": "مرة يومياً", "duration": "6 أشهر" }
  ],
  "pharmacySent": true
}
```

> **Note**: Entities like `events`, `registrations`, `users`, `cases`, `donations` do **not exist yet** — they are planned for the Medical Events & Sponsorship modules.

---

## External Connections Status

| Service | Status |
|---|---|
| Supabase / Lovable Cloud | **not-configured** |
| Firebase | **not-configured** |
| Stripe | **not-configured** |
| Twilio (SMS) | **not-configured** |
| WhatsApp API | **not-configured** |
| Google Calendar | **not-configured** |
| GitHub | **not-configured** |
| Vercel / Netlify | **not-configured** |
| n8n | **not-configured** |

**Secrets found**: `LOVABLE_API_KEY` (system-managed, cannot be deleted).

---

## Next Steps — 3 Immediate Actions

1. **Enable Lovable Cloud (DB + Auth)** — Activate Supabase to create `doctors`, `patients`, `appointments`, `prescriptions`, `lab_orders`, `services` tables with RLS policies. Implement email/password auth for doctors and patients.

2. **Prevent double-booking** — Add server-side slot-locking logic: check slot availability before confirming, use database constraints (`UNIQUE` on doctor_id + date + time), and optimistic UI with conflict resolution.

3. **Connect Stripe sandbox for payments** — Enable Stripe integration, create a checkout flow for consultation fees, implement commission splitting (platform % + doctor %), and add payment status tracking to bookings.

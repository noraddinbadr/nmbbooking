# Architecture — Sehtak Modular Layout

_Last updated: 2026-05-02_

## 1. Goals

Rebuild the codebase around **explicit module boundaries** with a single owner per
domain and strict separation of concerns. No page or component talks to Supabase
directly. All cross-module communication goes through a module's public
`index.ts` (its API surface). Anything not exported from `index.ts` is private.

## 2. Top-level layout

```
src/
  shared/                   # Cross-cutting kernel (no domain logic)
    supabase.ts             # Re-exports the typed Supabase client
    queryKeys.ts            # Centralised React Query key factory
    errors.ts               # AppError + Supabase → AppError mapping
    result.ts               # Result<T, E> helpers for service returns
    types.ts                # Shared primitive types (UUID, ISODate, ...)
    mapper.ts               # snake_case ↔ camelCase utilities

  modules/
    bookings/
      api/                  # Repository — only place allowed to import supabase
        bookings.repo.ts
      services/             # Use-cases — pure business logic, testable w/o React
        bookings.service.ts
      schemas/              # Zod schemas + inferred types (single source of truth)
        booking.schema.ts
      hooks/                # React Query wrappers (UI's only entry point)
        useBookings.ts
        useBookingMutations.ts
      components/           # Module-owned UI (Form, RescheduleModal, AuditLog...)
      state/                # State machines / FSMs / pure helpers
        bookingState.ts
      types.ts              # Public TS types (re-exported from index.ts)
      index.ts              # PUBLIC API — only thing other modules may import

    auth/  doctors/  clinics/  events/  cases/
    auctions/  procurement/  notifications/  patients/  catalog/  reports/

  app/                      # App shell (router, providers) — depends on modules
  pages/                    # Thin route components — orchestration only
  components/ui/            # shadcn primitives — no domain logic
```

## 3. Layering rules (enforced by review + later by ESLint boundaries)

```
pages  →  modules/<x>/index.ts     ✅
modules/<x>/hooks → services       ✅
modules/<x>/services → api + schemas ✅
modules/<x>/api → shared/supabase  ✅

pages → integrations/supabase      ❌   (must go through a module)
module A → module B internals      ❌   (only via B's index.ts)
services → React / hooks           ❌   (services must be framework-agnostic)
repositories → other repositories  ❌   (cross-domain calls go through services)
```

## 4. Each module exposes

- **Schemas (Zod)** — runtime validation + `z.infer` types. The DB shape
  (snake_case) is mapped at the repository boundary; the rest of the module
  speaks camelCase.
- **Repository** — only file in the module allowed to import the Supabase
  client. Returns plain DTOs, never `PostgrestError`.
- **Service** — orchestrates repositories + state machine + side effects.
  Returns `Result<T, AppError>` (no thrown exceptions in happy paths).
- **Hooks** — `useQuery` / `useMutation` wrappers using `queryKeys.*`.
- **Components** — UI owned by the module; consumes its own hooks only.

## 5. Strangler migration order

1. ✅ `bookings` (pilot — defines the conventions)
2. `auth` + `doctors` + `clinics` (used everywhere)
3. `notifications`
4. `events` + `cases`
5. `auctions` + `procurement` (will be unified later)
6. `patients` + `catalog` + `reports`

While a module is mid-migration, the old path stays as a thin **re-export shim**
so unmigrated callers keep compiling. Shims are deleted at the end of each
module's migration.

## 6. Naming & conventions

- Files: `bookings.repo.ts`, `bookings.service.ts`, `booking.schema.ts`.
- Hooks: `useBookings`, `useBooking(id)`, `useCreateBooking`, `useReschedule…`.
- Query keys: `qk.bookings.list(params)`, `qk.bookings.detail(id)`.
- Public types are PascalCase camelCase (`Booking`, `BookingStatus`).
- Internal DB rows are typed via `Database['public']['Tables']['bookings']['Row']`.

## 7. Testing

- **Services** are pure → covered by Vitest with mocked repositories.
- **State machines** (`bookingState.ts`) are pure functions → unit tested.
- **Components** stay thin; integration tests via Testing Library when needed.

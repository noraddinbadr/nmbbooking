/**
 * Centralised React Query key factory.
 *
 * Every module declares its keys here so cache invalidation works across
 * modules without any hard-coded strings scattered around the codebase.
 */
export const qk = {
  bookings: {
    all: ['bookings'] as const,
    list: (params?: Record<string, unknown>) =>
      [...qk.bookings.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...qk.bookings.all, 'detail', id] as const,
    byPatient: (patientId: string) =>
      [...qk.bookings.all, 'patient', patientId] as const,
    byDoctor: (doctorId: string) =>
      [...qk.bookings.all, 'doctor', doctorId] as const,
    audit: (id: string) => [...qk.bookings.all, 'audit', id] as const,
  },
  doctors: {
    all: ['doctors'] as const,
    list: () => [...qk.doctors.all, 'list'] as const,
    detail: (id: string) => [...qk.doctors.all, 'detail', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    forUser: (userId: string) => [...qk.notifications.all, userId] as const,
  },
} as const;
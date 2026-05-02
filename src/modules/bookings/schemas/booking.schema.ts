import { z } from 'zod';

/**
 * Single source of truth for the Booking shape used by the rest of the app.
 * Repository maps DB rows into this shape, services validate via these schemas.
 */

export const bookingStatusSchema = z.enum([
  'pending',
  'confirmed',
  'rescheduled',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const bookingTypeSchema = z.enum([
  'clinic', 'hospital', 'home', 'video', 'voice', 'lab',
]);
export type BookingType = z.infer<typeof bookingTypeSchema>;

export const bookingSchema = z.object({
  id: z.string().uuid(),
  doctorId: z.string().uuid(),
  patientId: z.string().uuid(),
  shiftId: z.string().uuid().nullable(),
  familyMemberId: z.string().uuid().nullable(),
  bookingDate: z.string(),                  // YYYY-MM-DD
  startTime: z.string().nullable(),         // HH:MM
  endTime: z.string().nullable(),
  status: bookingStatusSchema,
  bookingType: bookingTypeSchema,
  finalPrice: z.number(),
  fundingAmount: z.number(),
  isFreeCase: z.boolean(),
  queuePosition: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Booking = z.infer<typeof bookingSchema>;

/** Input for creating a booking (camelCase). */
export const createBookingInput = z.object({
  doctorId: z.string().uuid(),
  patientId: z.string().uuid(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}/).nullable().optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}/).nullable().optional(),
  bookingType: bookingTypeSchema.default('clinic'),
  status: bookingStatusSchema.default('pending'),
  finalPrice: z.number().nonnegative().default(0),
  fundingAmount: z.number().nonnegative().default(0),
  isFreeCase: z.boolean().default(false),
  shiftId: z.string().uuid().nullable().optional(),
  familyMemberId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type CreateBookingInput = z.infer<typeof createBookingInput>;

export const rescheduleInput = z.object({
  bookingId: z.string().uuid(),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newStartTime: z.string().regex(/^\d{2}:\d{2}/),
  newEndTime: z.string().regex(/^\d{2}:\d{2}/).nullable().optional(),
  reason: z.string().nullable().optional(),
});
export type RescheduleInput = z.infer<typeof rescheduleInput>;

/** DB row → domain mapper (snake_case → camelCase). */
export type BookingRow = {
  id: string;
  doctor_id: string;
  patient_id: string;
  shift_id: string | null;
  family_member_id: string | null;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  status: BookingStatus | null;
  booking_type: BookingType | null;
  final_price: number | null;
  funding_amount: number | null;
  is_free_case: boolean | null;
  queue_position: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function mapBookingRow(row: BookingRow): Booking {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    shiftId: row.shift_id,
    familyMemberId: row.family_member_id,
    bookingDate: row.booking_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: (row.status ?? 'pending') as BookingStatus,
    bookingType: (row.booking_type ?? 'clinic') as BookingType,
    finalPrice: Number(row.final_price ?? 0),
    fundingAmount: Number(row.funding_amount ?? 0),
    isFreeCase: row.is_free_case ?? false,
    queuePosition: row.queue_position,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Domain → DB payload for inserts/updates. */
export function toBookingRow(input: Partial<CreateBookingInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.doctorId !== undefined) row.doctor_id = input.doctorId;
  if (input.patientId !== undefined) row.patient_id = input.patientId;
  if (input.bookingDate !== undefined) row.booking_date = input.bookingDate;
  if (input.startTime !== undefined) row.start_time = input.startTime;
  if (input.endTime !== undefined) row.end_time = input.endTime;
  if (input.bookingType !== undefined) row.booking_type = input.bookingType;
  if (input.status !== undefined) row.status = input.status;
  if (input.finalPrice !== undefined) row.final_price = input.finalPrice;
  if (input.fundingAmount !== undefined) row.funding_amount = input.fundingAmount;
  if (input.isFreeCase !== undefined) row.is_free_case = input.isFreeCase;
  if (input.shiftId !== undefined) row.shift_id = input.shiftId;
  if (input.familyMemberId !== undefined) row.family_member_id = input.familyMemberId;
  if (input.notes !== undefined) row.notes = input.notes;
  return row;
}
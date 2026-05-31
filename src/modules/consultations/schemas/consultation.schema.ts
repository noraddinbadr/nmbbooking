import { z } from 'zod';

export const treatmentSessionStatusSchema = z.enum(['active', 'completed', 'cancelled']);
export type TreatmentSessionStatus = z.infer<typeof treatmentSessionStatusSchema>;

export const treatmentSessionSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid().nullable(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  sessionDate: z.string(),
  status: treatmentSessionStatusSchema,
  symptoms: z.string().nullable(),
  examination: z.string().nullable(),
  diagnosis: z.string().nullable(),
  notes: z.string().nullable(),
  followUpDate: z.string().nullable(),
  createdAt: z.string(),
});
export type TreatmentSession = z.infer<typeof treatmentSessionSchema>;

export const prescriptionItemInputSchema = z.object({
  medicineName: z.string().min(1),
  dosage: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
});
export type PrescriptionItemInput = z.infer<typeof prescriptionItemInputSchema>;

export const endSessionInputSchema = z.object({
  sessionId: z.string().uuid(),
  bookingId: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  symptoms: z.string().nullable(),
  examination: z.string().nullable(),
  diagnosis: z.string().nullable(),
  notes: z.string().nullable(),
  followUpDate: z.string().nullable(),
  medicines: z.array(prescriptionItemInputSchema).default([]),
  providerId: z.string().uuid().nullable().optional(),
  labs: z.array(z.any()).default([]),
  imaging: z.array(z.any()).default([]),
  procedures: z.array(z.any()).default([]),
});
export type EndSessionInput = z.infer<typeof endSessionInputSchema>;
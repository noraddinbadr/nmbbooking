import { supabase } from '@/shared/supabase';
import { sessionsRepo } from '../api/sessions.repo';
import { prescriptionsRepo } from '../api/prescriptions.repo';
import { providerOrdersRepo, type ProviderOrderInput } from '../api/providerOrders.repo';
import type { EndSessionInput } from '../schemas/consultation.schema';

export const consultationsService = {
  /** Resume an active session for a booking or create one. Returns sessionId + initial fields. */
  async openForBooking(input: { bookingId: string; patientId: string; doctorId: string; sessionDate: string }) {
    const existing = await sessionsRepo.findActiveForBooking(input.bookingId);
    if (existing) return { sessionId: existing.id, existing };
    const id = await sessionsRepo.createActive(input);
    return { sessionId: id, existing: null };
  },

  /** Best-effort auto-save of WIP fields. */
  async autoSave(sessionId: string, fields: { symptoms: string | null; examination: string | null; diagnosis: string | null; notes: string | null; followUpDate: string | null }) {
    await sessionsRepo.update(sessionId, {
      symptoms: fields.symptoms,
      examination: fields.examination,
      diagnosis: fields.diagnosis,
      notes: fields.notes,
      follow_up_date: fields.followUpDate,
    });
  },

  /** Complete the session: persist notes, create prescription + orders, transition booking → completed. */
  async endSession(input: EndSessionInput) {
    await sessionsRepo.update(input.sessionId, {
      symptoms: input.symptoms,
      examination: input.examination,
      diagnosis: input.diagnosis,
      notes: input.notes,
      follow_up_date: input.followUpDate,
      status: 'completed',
    });

    const validMeds = input.medicines.filter((m) => m.medicineName.trim());
    if (validMeds.length > 0) {
      await prescriptionsRepo.create({
        sessionId: input.sessionId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        items: validMeds,
      });
    }

    if (input.providerId && (input.labs.length || input.imaging.length || input.procedures.length)) {
      const base = { patient_id: input.patientId, booking_id: input.bookingId, doctor_id: input.doctorId };
      const orders: ProviderOrderInput[] = [];
      if (input.labs.length) {
        orders.push({
          providerId: input.providerId,
          orderType: 'lab',
          notes: `تحاليل: ${input.labs.map((x: any) => x?.nameAr).filter(Boolean).join('، ')}`,
          orderDetails: { ...base, items: input.labs },
        });
      }
      if (input.imaging.length) {
        orders.push({
          providerId: input.providerId,
          orderType: 'imaging',
          notes: `أشعة: ${input.imaging.map((x: any) => x?.nameAr).filter(Boolean).join('، ')}`,
          orderDetails: { ...base, items: input.imaging },
        });
      }
      if (input.procedures.length) {
        orders.push({
          providerId: input.providerId,
          orderType: 'procedure',
          notes: `إجراءات: ${input.procedures.map((x: any) => x?.nameAr).filter(Boolean).join('، ')}`,
          orderDetails: { ...base, items: input.procedures },
        });
      }
      await providerOrdersRepo.insertMany(orders);
    }

    const { error } = await supabase.from('bookings').update({ status: 'completed' }).eq('id', input.bookingId);
    if (error) throw error;
  },

  /** Aggregate read for the consultation workspace: past sessions, prescriptions, orders, visit count. */
  async loadHistory(patientId: string) {
    const [past, rx, orders, visits] = await Promise.all([
      sessionsRepo.listPastForPatient(patientId, 10),
      prescriptionsRepo.listForPatient(patientId, 10),
      providerOrdersRepo.listForPatient(patientId, 50),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('patient_id', patientId),
    ]);
    return {
      pastSessions: past,
      pastPrescriptions: rx,
      pastOrders: orders,
      totalVisits: visits.count || 0,
    };
  },
};
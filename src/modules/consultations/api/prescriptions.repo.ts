import { supabase } from '@/shared/supabase';
import type { PrescriptionItemInput } from '../schemas/consultation.schema';

export const prescriptionsRepo = {
  async create(input: {
    sessionId: string;
    patientId: string;
    doctorId: string;
    items: PrescriptionItemInput[];
  }) {
    const { data: rx, error } = await supabase
      .from('prescriptions')
      .insert({
        session_id: input.sessionId,
        patient_id: input.patientId,
        doctor_id: input.doctorId,
      })
      .select('id')
      .single();
    if (error) throw error;
    if (input.items.length > 0) {
      const { error: itemsErr } = await supabase.from('prescription_items').insert(
        input.items.map((m) => ({
          prescription_id: rx.id,
          medicine_name: m.medicineName,
          dosage: m.dosage ?? null,
          frequency: m.frequency ?? null,
          duration: m.duration ?? null,
          instructions: m.instructions ?? null,
        })),
      );
      if (itemsErr) throw itemsErr;
    }
    return rx.id as string;
  },
  async listForPatient(patientId: string, limit = 10) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*, prescription_items(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};
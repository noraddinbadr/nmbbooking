import { supabase } from '@/shared/supabase';

export interface ActiveSessionRow {
  id: string;
  booking_id: string | null;
  patient_id: string;
  doctor_id: string;
  session_date: string;
  status: string;
  symptoms: string | null;
  examination: string | null;
  diagnosis: string | null;
  notes: string | null;
  follow_up_date: string | null;
}

export const sessionsRepo = {
  async findActiveForBooking(bookingId: string) {
    const { data, error } = await supabase
      .from('treatment_sessions')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('status', 'active')
      .maybeSingle();
    if (error) throw error;
    return data as ActiveSessionRow | null;
  },
  async createActive(input: { bookingId: string; patientId: string; doctorId: string; sessionDate: string }) {
    const { data, error } = await supabase
      .from('treatment_sessions')
      .insert({
        booking_id: input.bookingId,
        patient_id: input.patientId,
        doctor_id: input.doctorId,
        session_date: input.sessionDate,
        status: 'active',
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  },
  async update(sessionId: string, fields: Partial<Pick<ActiveSessionRow, 'symptoms' | 'examination' | 'diagnosis' | 'notes' | 'follow_up_date' | 'status'>>) {
    const { error } = await supabase.from('treatment_sessions').update(fields).eq('id', sessionId);
    if (error) throw error;
  },
  async listPastForPatient(patientId: string, limit = 10) {
    const { data, error } = await supabase
      .from('treatment_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .neq('status', 'active')
      .order('session_date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};
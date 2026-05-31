import { supabase } from '@/shared/supabase';

export interface ProviderOrderInput {
  providerId: string;
  orderType: 'lab' | 'imaging' | 'procedure';
  notes: string;
  orderDetails: Record<string, unknown>;
}

export const providerOrdersRepo = {
  async insertMany(orders: ProviderOrderInput[]) {
    if (orders.length === 0) return;
    const rows = orders.map((o) => ({
      provider_id: o.providerId,
      order_type: o.orderType,
      notes: o.notes,
      order_details: o.orderDetails as any,
    }));
    const { error } = await supabase.from('provider_orders').insert(rows as any);
    if (error) throw error;
  },
  async listForPatient(patientId: string, limit = 50) {
    const { data, error } = await supabase
      .from('provider_orders')
      .select('*, providers(name_ar)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).filter((o: any) => o?.order_details?.patient_id === patientId);
  },
  async listActiveProviders() {
    const { data, error } = await supabase
      .from('providers')
      .select('id, name_ar')
      .eq('is_active', true);
    if (error) throw error;
    return (data || []) as { id: string; name_ar: string }[];
  },
};
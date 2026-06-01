import { supabase } from '@/shared/supabase';
import type {
  AuctionRequest,
  AuctionRequestStatus,
  AuctionInitiatorType,
  MedicalCaseLite,
} from '@/data/auctionTypes';

export const auctionsRepo = {
  async listRequests(statusFilter?: AuctionRequestStatus[]) {
    let query = supabase
      .from('auction_requests')
      .select('*, medical_case:medical_cases!inner(*)')
      .order('created_at', { ascending: false });
    if (statusFilter && statusFilter.length > 0) query = query.in('status', statusFilter);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((r) => ({ ...r, medical_case: r.medical_case as MedicalCaseLite })) as AuctionRequest[];
  },

  async insertRequest(payload: {
    case_id: string;
    initiator_id: string;
    initiator_type: AuctionInitiatorType;
    status?: AuctionRequestStatus;
    expires_at?: string | null;
    published_at?: string | null;
  }) {
    const { data, error } = await supabase.from('auction_requests').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, newStatus: AuctionRequestStatus) {
    const updates: { status: AuctionRequestStatus; published_at?: string } = { status: newStatus };
    if (newStatus === 'published') updates.published_at = new Date().toISOString();
    const { error } = await supabase.from('auction_requests').update(updates).eq('id', id);
    if (error) throw error;
  },
};
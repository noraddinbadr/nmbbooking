import { supabase } from '@/shared/supabase';
import type {
  ProcurementRequest,
  ProcurementBid,
  ProcurementStatus,
  ProviderCatalogItem,
  CatalogCategory,
} from '@/data/procurementTypes';

export const procurementRepo = {
  async listCategories() {
    const { data, error } = await supabase
      .from('catalog_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return (data || []) as CatalogCategory[];
  },

  async listMyCatalog(userId: string) {
    const { data, error } = await supabase
      .from('provider_catalog_items')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ProviderCatalogItem[];
  },

  async upsertCatalogItem(row: Record<string, unknown> & { id?: string }) {
    if (row.id) {
      const { error } = await supabase
        .from('provider_catalog_items')
        .update(row as never)
        .eq('id', row.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('provider_catalog_items')
        .insert(row as never);
      if (error) throw error;
    }
  },

  async deleteCatalogItem(id: string) {
    const { error } = await supabase.from('provider_catalog_items').delete().eq('id', id);
    if (error) throw error;
  },

  async listRequests(opts: { scope: 'mine' | 'open' | 'all'; userId?: string }) {
    let q = supabase
      .from('procurement_requests')
      .select('*, items:procurement_request_items(*), bids_count:procurement_bids(count)')
      .order('created_at', { ascending: false });
    if (opts.scope === 'mine' && opts.userId) q = q.eq('buyer_id', opts.userId);
    if (opts.scope === 'open') q = q.eq('status', 'published');
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r: { bids_count?: { count: number }[] | number } & Record<string, unknown>) => ({
      ...r,
      bids_count: Array.isArray(r.bids_count) ? r.bids_count[0]?.count ?? 0 : (r.bids_count as number) ?? 0,
    })) as ProcurementRequest[];
  },

  async getRequest(id: string) {
    const { data, error } = await supabase
      .from('procurement_requests')
      .select('*, items:procurement_request_items(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as ProcurementRequest;
  },

  async createRequest(req: Record<string, unknown>, userId: string, publish: boolean) {
    const { data, error } = await supabase
      .from('procurement_requests')
      .insert({ ...req, buyer_id: userId, status: publish ? 'published' : 'draft' } as never)
      .select()
      .single();
    if (error) throw error;
    return data as ProcurementRequest;
  },

  async insertRequestItems(rows: Record<string, unknown>[]) {
    if (!rows.length) return;
    const { error } = await supabase.from('procurement_request_items').insert(rows as never);
    if (error) throw error;
  },

  async updateRequestStatus(id: string, status: ProcurementStatus) {
    const { error } = await supabase.from('procurement_requests').update({ status }).eq('id', id);
    if (error) throw error;
  },

  async listBids(requestId: string) {
    const { data, error } = await supabase
      .from('procurement_bids')
      .select('*, lines:procurement_bid_lines(*), bidder:profiles!procurement_bids_bidder_id_fkey(id, full_name_ar, full_name)')
      .eq('request_id', requestId)
      .order('total_amount', { ascending: true });
    if (error) {
      const r = await supabase
        .from('procurement_bids')
        .select('*, lines:procurement_bid_lines(*)')
        .eq('request_id', requestId)
        .order('total_amount', { ascending: true });
      if (r.error) throw r.error;
      return (r.data || []) as ProcurementBid[];
    }
    return (data || []) as ProcurementBid[];
  },

  async createBid(bid: Record<string, unknown>, userId: string) {
    const { data, error } = await supabase
      .from('procurement_bids')
      .insert({ ...bid, bidder_id: userId } as never)
      .select()
      .single();
    if (error) throw error;
    return data as ProcurementBid;
  },

  async insertBidLines(rows: Record<string, unknown>[]) {
    if (!rows.length) return;
    const { error } = await supabase.from('procurement_bid_lines').insert(rows as never);
    if (error) throw error;
  },

  async awardBidRpc(requestId: string, bidId: string, reason?: string) {
    const { data, error } = await supabase.rpc('award_procurement_bid', {
      _request_id: requestId,
      _bid_id: bidId,
      _reason: reason ?? null,
    });
    if (error) throw error;
    return data as { success: boolean; error?: string };
  },

  async scoreBidsRpc(requestId: string) {
    const { data, error } = await supabase.rpc('score_procurement_bids', { _request_id: requestId });
    if (error) throw error;
    return (data || []) as Array<{ bid_id: string; bidder_id: string; total_amount: number; score: number }>;
  },

  async notifyMatched(requestId: string) {
    await supabase.functions.invoke('notify-matched-providers', { body: { request_id: requestId } });
  },
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type {
  ProcurementRequest,
  ProcurementRequestItem,
  ProcurementBid,
  ProcurementBidLine,
  ProcurementStatus,
  ProviderCatalogItem,
  CatalogCategory,
} from '@/data/procurementTypes';

// ----------------- Categories -----------------
export function useCatalogCategories() {
  return useQuery({
    queryKey: ['catalog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as CatalogCategory[];
    },
  });
}

// ----------------- Provider catalog items -----------------
export function useMyCatalogItems() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['my-catalog-items', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_catalog_items')
        .select('*')
        .eq('created_by', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ProviderCatalogItem[];
    },
  });

  const upsertItem = useMutation({
    mutationFn: async (payload: Partial<ProviderCatalogItem> & { id?: string }) => {
      if (!user) throw new Error('غير مسجل الدخول');
      const row = { ...payload, created_by: user.id, provider_id: payload.provider_id || user.id };
      if (payload.id) {
        const { error } = await supabase.from('provider_catalog_items').update(row).eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('provider_catalog_items').insert(row as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-catalog-items'] });
      toast.success('تم الحفظ');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('provider_catalog_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-catalog-items'] });
      toast.success('تم الحذف');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { items, isLoading, upsertItem, deleteItem };
}

// ----------------- Procurement requests -----------------
export function useProcurementRequests(scope: 'mine' | 'open' | 'all' = 'open') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['procurement-requests', scope, user?.id],
    queryFn: async () => {
      let q = supabase
        .from('procurement_requests')
        .select('*, items:procurement_request_items(*), bids_count:procurement_bids(count)')
        .order('created_at', { ascending: false });
      if (scope === 'mine' && user) q = q.eq('buyer_id', user.id);
      if (scope === 'open') q = q.eq('status', 'published');
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((r: { bids_count?: { count: number }[] | number } & Record<string, unknown>) => ({
        ...r,
        bids_count: Array.isArray(r.bids_count) ? r.bids_count[0]?.count ?? 0 : (r.bids_count as number) ?? 0,
      })) as ProcurementRequest[];
    },
    enabled: scope !== 'mine' || !!user,
  });
}

export function useProcurementRequest(id: string | null) {
  return useQuery({
    queryKey: ['procurement-request', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procurement_requests')
        .select('*, items:procurement_request_items(*)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as ProcurementRequest;
    },
  });
}

export function useCreateProcurementRequest() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      title_ar: string;
      description_ar?: string;
      delivery_city?: string;
      budget_max?: number | null;
      closes_at: string;
      award_mode: 'manual' | 'auto_suggest' | 'auto_award';
      allow_partial_bids: boolean;
      category_kind?: string;
      items: Array<{ name_ar: string; qty: number; unit?: string; brand_preferred?: string; category_id?: string | null; specs?: Record<string, unknown>; notes?: string }>;
      publish?: boolean;
    }) => {
      if (!user) throw new Error('غير مسجل الدخول');
      const { items, publish, ...req } = payload;
      const { data: created, error: e1 } = await supabase
        .from('procurement_requests')
        .insert({ ...req, buyer_id: user.id, status: publish ? 'published' : 'draft' } as never)
        .select()
        .single();
      if (e1) throw e1;
      if (items.length) {
        const rows = items.map((it, i) => ({ ...it, request_id: created.id, position: i }));
        const { error: e2 } = await supabase.from('procurement_request_items').insert(rows as never);
        if (e2) throw e2;
      }
      // Trigger matching notifications
      if (publish) {
        await supabase.functions.invoke('notify-matched-providers', { body: { request_id: created.id } });
      }
      return created as ProcurementRequest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['procurement-requests'] });
      toast.success('تم إنشاء طلب الشراء');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProcurementStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProcurementStatus }) => {
      const { error } = await supabase.from('procurement_requests').update({ status }).eq('id', id);
      if (error) throw error;
      if (status === 'published') {
        await supabase.functions.invoke('notify-matched-providers', { body: { request_id: id } });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['procurement-requests'] });
      qc.invalidateQueries({ queryKey: ['procurement-request'] });
      toast.success('تم تحديث الحالة');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ----------------- Bids -----------------
export function useProcurementBids(requestId: string | null) {
  return useQuery({
    queryKey: ['procurement-bids', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procurement_bids')
        .select('*, lines:procurement_bid_lines(*), bidder:profiles!procurement_bids_bidder_id_fkey(id, full_name_ar, full_name)')
        .eq('request_id', requestId!)
        .order('total_amount', { ascending: true });
      if (error) {
        // Fallback without join (FK name may differ)
        const r = await supabase
          .from('procurement_bids')
          .select('*, lines:procurement_bid_lines(*)')
          .eq('request_id', requestId!)
          .order('total_amount', { ascending: true });
        if (r.error) throw r.error;
        return (r.data || []) as ProcurementBid[];
      }
      return (data || []) as ProcurementBid[];
    },
  });
}

export function useSubmitBid() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      request_id: string;
      delivery_days?: number;
      warranty_months?: number;
      payment_terms?: string;
      coverage_pct?: number;
      notes?: string;
      is_anonymous?: boolean;
      lines: Array<{ request_item_id: string; unit_price: number; qty_offered: number; brand_offered?: string; notes?: string; catalog_item_id?: string | null }>;
    }) => {
      if (!user) throw new Error('غير مسجل الدخول');
      const { lines, ...bid } = payload;
      const { data: created, error: e1 } = await supabase
        .from('procurement_bids')
        .insert({ ...bid, bidder_id: user.id } as never)
        .select()
        .single();
      if (e1) throw e1;
      if (lines.length) {
        const rows = lines.map(l => ({ ...l, bid_id: created.id }));
        const { error: e2 } = await supabase.from('procurement_bid_lines').insert(rows as never);
        if (e2) throw e2;
      }
      return created as ProcurementBid;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['procurement-bids', vars.request_id] });
      toast.success('تم تقديم العرض');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAwardBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ request_id, bid_id, reason }: { request_id: string; bid_id: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('award_procurement_bid', { _request_id: request_id, _bid_id: bid_id, _reason: reason ?? null });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'فشل');
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['procurement-requests'] });
      qc.invalidateQueries({ queryKey: ['procurement-request', vars.request_id] });
      qc.invalidateQueries({ queryKey: ['procurement-bids', vars.request_id] });
      toast.success('تمت الترسية');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useScoredBids(requestId: string | null) {
  return useQuery({
    queryKey: ['scored-bids', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('score_procurement_bids', { _request_id: requestId! });
      if (error) throw error;
      return (data || []) as Array<{ bid_id: string; bidder_id: string; total_amount: number; score: number }>;
    },
  });
}

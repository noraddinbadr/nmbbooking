import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { procurementRepo, procurementService } from '@/modules/procurement';
import type { ProcurementStatus, ProviderCatalogItem } from '@/data/procurementTypes';

// ----------------- Categories -----------------
export function useCatalogCategories() {
  return useQuery({
    queryKey: ['catalog-categories'],
    queryFn: () => procurementRepo.listCategories(),
  });
}

// ----------------- Provider catalog items -----------------
export function useMyCatalogItems() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['my-catalog-items', user?.id],
    enabled: !!user,
    queryFn: () => procurementRepo.listMyCatalog(user!.id),
  });

  const upsertItem = useMutation({
    mutationFn: async (payload: Partial<Omit<ProviderCatalogItem, 'specs'>> & { id?: string; specs?: Record<string, unknown> }) => {
      if (!user) throw new Error('غير مسجل الدخول');
      await procurementRepo.upsertCatalogItem({ ...payload, created_by: user.id, provider_id: payload.provider_id || user.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-catalog-items'] });
      toast.success('تم الحفظ');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => procurementRepo.deleteCatalogItem(id),
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
    queryFn: () => procurementRepo.listRequests({ scope, userId: user?.id }),
    enabled: scope !== 'mine' || !!user,
  });
}

export function useProcurementRequest(id: string | null) {
  return useQuery({
    queryKey: ['procurement-request', id],
    enabled: !!id,
    queryFn: () => procurementRepo.getRequest(id!),
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
      return procurementService.createRequestWithItems({ userId: user.id, req, items, publish: !!publish });
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
    mutationFn: ({ id, status }: { id: string; status: ProcurementStatus }) =>
      procurementService.transitionStatus(id, status),
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
    queryFn: () => procurementRepo.listBids(requestId!),
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
      return procurementService.submitBidWithLines({ userId: user.id, bid, lines });
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
    mutationFn: ({ request_id, bid_id, reason }: { request_id: string; bid_id: string; reason?: string }) =>
      procurementService.awardBid(request_id, bid_id, reason),
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
    queryFn: () => procurementRepo.scoreBidsRpc(requestId!),
  });
}

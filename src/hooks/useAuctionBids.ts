import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AuctionBid, AuctionBidStatus, AuctionBidType } from '@/data/auctionTypes';

/**
 * Bids are stored in the unified `donations` table with kind='bid'.
 * This hook reads/writes bids for a given medical case.
 */
export function useAuctionBids(caseId?: string) {
  const qc = useQueryClient();

  const { data: bids = [], isLoading } = useQuery<AuctionBid[]>({
    queryKey: ['auction-bids', caseId],
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('case_id', caseId!)
        .eq('kind', 'bid')
        .order('amount', { ascending: true });
      if (error) throw error;
      return (data || []).map((d): AuctionBid => ({
        id: d.id,
        case_id: d.case_id,
        amount: Number(d.amount),
        kind: 'bid',
        bid_type: (d.bid_type as AuctionBidType | null) ?? 'full_coverage',
        bid_status: (d.bid_status as AuctionBidStatus | null) ?? 'pending',
        provider_id: d.provider_id,
        donor_id: d.donor_id,
        donor_name: d.donor_name,
        coverage_details: (d.coverage_details as Record<string, unknown>) || {},
        notes: d.notes,
        is_anonymous: !!d.is_anonymous,
        accepted_at: d.accepted_at,
        created_at: d.created_at,
      }));
    },
  });

  const createBid = useMutation({
    mutationFn: async (payload: {
      case_id: string;
      amount: number;
      bid_type: AuctionBidType;
      provider_id?: string | null;
      donor_id?: string | null;
      donor_name?: string | null;
      notes?: string | null;
      coverage_details?: Record<string, unknown>;
      is_anonymous?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('donations')
        .insert({
          case_id: payload.case_id,
          amount: payload.amount,
          kind: 'bid',
          bid_type: payload.bid_type,
          bid_status: 'pending',
          provider_id: payload.provider_id ?? null,
          donor_id: payload.donor_id ?? null,
          donor_name: payload.donor_name ?? null,
          notes: payload.notes ?? null,
          coverage_details: payload.coverage_details ?? {},
          is_anonymous: payload.is_anonymous ?? false,
          status: 'pledged',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction-bids'] });
      toast.success('تم تقديم العرض بنجاح');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateBidStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AuctionBidStatus }) => {
      const updates: { bid_status: AuctionBidStatus; accepted_at?: string; status?: 'received' } = { bid_status: status };
      if (status === 'accepted') {
        updates.accepted_at = new Date().toISOString();
        updates.status = 'received'; // accepted bid counts toward funded_amount via trigger
      }
      const { error } = await supabase
        .from('donations')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction-bids'] });
      qc.invalidateQueries({ queryKey: ['medical-cases'] });
      toast.success('تم تحديث حالة العرض');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { bids, isLoading, createBid, updateBidStatus };
}

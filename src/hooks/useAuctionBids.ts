import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AuctionBid, AuctionBidStatus } from '@/data/auctionTypes';

export function useAuctionBids(requestId?: string) {
  const qc = useQueryClient();

  const { data: bids = [], isLoading } = useQuery({
    queryKey: ['auction-bids', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('request_id', requestId!)
        .order('amount', { ascending: true });
      if (error) throw error;
      return data as AuctionBid[];
    },
  });

  const createBid = useMutation({
    mutationFn: async (payload: Partial<AuctionBid>) => {
      const { data, error } = await supabase
        .from('auction_bids')
        .insert(payload as any)
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
      const updates: any = { status };
      if (status === 'accepted') updates.accepted_at = new Date().toISOString();
      const { error } = await supabase
        .from('auction_bids')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction-bids'] });
      qc.invalidateQueries({ queryKey: ['auction-requests'] });
      toast.success('تم تحديث حالة العرض');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { bids, isLoading, createBid, updateBidStatus };
}

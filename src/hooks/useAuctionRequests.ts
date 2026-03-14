import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AuctionRequest, AuctionRequestStatus } from '@/data/auctionTypes';
import { useAuth } from '@/contexts/AuthContext';

export function useAuctionRequests(statusFilter?: AuctionRequestStatus[]) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['auction-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('auction_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as AuctionRequest[];
    },
  });

  const createRequest = useMutation({
    mutationFn: async (payload: Partial<AuctionRequest>) => {
      const { data, error } = await supabase
        .from('auction_requests')
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction-requests'] });
      toast.success('تم إنشاء الطلب بنجاح');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<AuctionRequest>) => {
      const { error } = await supabase
        .from('auction_requests')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction-requests'] });
      toast.success('تم تحديث الطلب');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const transitionStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: AuctionRequestStatus }) => {
      const updates: any = { status: newStatus };
      if (newStatus === 'published') updates.published_at = new Date().toISOString();
      const { error } = await supabase
        .from('auction_requests')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction-requests'] });
      toast.success('تم تحديث حالة الطلب');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { requests, isLoading, createRequest, updateRequest, transitionStatus };
}

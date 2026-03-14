import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AuctionSettings } from '@/data/auctionTypes';

export function useAuctionSettings() {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['auction-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auction_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data as AuctionSettings;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<AuctionSettings>) => {
      if (!settings?.id) throw new Error('No settings found');
      const { error } = await supabase
        .from('auction_settings')
        .update({ ...updates, updated_by: (await supabase.auth.getUser()).data.user?.id })
        .eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction-settings'] });
      toast.success('تم حفظ إعدادات الحوكمة');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { settings, isLoading, updateSettings };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAuctionSettings } from './useAuctionSettings';
import type {
  AuctionRequest,
  AuctionRequestStatus,
  AuctionInitiatorType,
  MedicalCaseLite,
} from '@/data/auctionTypes';

/**
 * Auction requests are now joined to medical_cases — all clinical data
 * (title, diagnosis, cost, funding, anonymization, etc.) is read from the case.
 */
export function useAuctionRequests(statusFilter?: AuctionRequestStatus[]) {
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['auction-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('auction_requests')
        .select('*, medical_case:medical_cases!inner(*)')
        .order('created_at', { ascending: false });
      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        medical_case: r.medical_case as MedicalCaseLite,
      })) as AuctionRequest[];
    },
  });

  const createRequest = useMutation({
    mutationFn: async (payload: { case_id: string; initiator_id: string; initiator_type: AuctionInitiatorType; status?: AuctionRequestStatus; expires_at?: string | null }) => {
      const { data, error } = await supabase
        .from('auction_requests')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction-requests'] });
      qc.invalidateQueries({ queryKey: ['medical-cases'] });
      toast.success('تم إنشاء طلب المزاد بنجاح');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const transitionStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: AuctionRequestStatus }) => {
      const updates: { status: AuctionRequestStatus; published_at?: string } = { status: newStatus };
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

  return { requests, isLoading, createRequest, transitionStatus };
}

/**
 * Helper hook: given a medical case, publish it as an auction.
 * This is the **single entry point** for converting any case into a public auction.
 */
export function usePublishCaseAsAuction() {
  const qc = useQueryClient();
  const { user, roles } = useAuth();
  const { settings } = useAuctionSettings();

  return useMutation({
    mutationFn: async (caseId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Determine initial workflow status based on initiator role + governance settings
      const isDoctor = roles.includes('doctor');
      const isAdmin = roles.includes('admin');
      const initiatorType: AuctionInitiatorType = isDoctor ? 'doctor' : isAdmin ? 'admin' : 'patient';

      let initialStatus: AuctionRequestStatus = 'draft';
      if (initiatorType === 'doctor') {
        if (settings?.require_patient_otp_consent) initialStatus = 'pending_patient_consent';
        else if (!settings?.auto_publish_after_verify) initialStatus = 'pending_admin';
        else initialStatus = 'published';
      } else if (initiatorType === 'patient') {
        if (settings?.require_doctor_signature) initialStatus = 'pending_doctor';
        else if (!settings?.auto_publish_after_verify) initialStatus = 'pending_admin';
        else initialStatus = 'published';
      } else {
        initialStatus = settings?.auto_publish_after_verify ? 'published' : 'pending_admin';
      }

      const expires_at = settings?.bid_duration_hours
        ? new Date(Date.now() + settings.bid_duration_hours * 3600000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('auction_requests')
        .insert({
          case_id: caseId,
          initiator_id: user.id,
          initiator_type: initiatorType,
          status: initialStatus,
          expires_at,
          published_at: initialStatus === 'published' ? new Date().toISOString() : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction-requests'] });
      qc.invalidateQueries({ queryKey: ['medical-cases'] });
      toast.success('تم نشر الحالة كمزاد');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

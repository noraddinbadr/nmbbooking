import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAuctionSettings } from './useAuctionSettings';
import { auctionsRepo } from '@/modules/auctions';
import type {
  AuctionRequestStatus,
  AuctionInitiatorType,
} from '@/data/auctionTypes';

/**
 * Auction requests are now joined to medical_cases — all clinical data
 * (title, diagnosis, cost, funding, anonymization, etc.) is read from the case.
 */
export function useAuctionRequests(statusFilter?: AuctionRequestStatus[]) {
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['auction-requests', statusFilter],
    queryFn: () => auctionsRepo.listRequests(statusFilter),
  });

  const createRequest = useMutation({
    mutationFn: (payload: { case_id: string; initiator_id: string; initiator_type: AuctionInitiatorType; status?: AuctionRequestStatus; expires_at?: string | null }) =>
      auctionsRepo.insertRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction-requests'] });
      qc.invalidateQueries({ queryKey: ['medical-cases'] });
      toast.success('تم إنشاء طلب المزاد بنجاح');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const transitionStatus = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: AuctionRequestStatus }) =>
      auctionsRepo.updateStatus(id, newStatus),
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

      return auctionsRepo.insertRequest({
        case_id: caseId,
        initiator_id: user.id,
        initiator_type: initiatorType,
        status: initialStatus,
        expires_at,
        published_at: initialStatus === 'published' ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction-requests'] });
      qc.invalidateQueries({ queryKey: ['medical-cases'] });
      toast.success('تم نشر الحالة كمزاد');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

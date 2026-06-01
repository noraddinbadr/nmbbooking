import { procurementRepo } from '../api/procurement.repo';
import type { ProcurementStatus } from '@/data/procurementTypes';

export const procurementService = {
  async createRequestWithItems(payload: {
    userId: string;
    req: Record<string, unknown>;
    items: Array<Record<string, unknown>>;
    publish: boolean;
  }) {
    const created = await procurementRepo.createRequest(payload.req, payload.userId, payload.publish);
    if (payload.items.length) {
      await procurementRepo.insertRequestItems(
        payload.items.map((it, i) => ({ ...it, request_id: created.id, position: i })),
      );
    }
    if (payload.publish) await procurementRepo.notifyMatched(created.id);
    return created;
  },

  async transitionStatus(id: string, status: ProcurementStatus) {
    await procurementRepo.updateRequestStatus(id, status);
    if (status === 'published') await procurementRepo.notifyMatched(id);
  },

  async submitBidWithLines(payload: {
    userId: string;
    bid: Record<string, unknown>;
    lines: Array<Record<string, unknown>>;
  }) {
    const created = await procurementRepo.createBid(payload.bid, payload.userId);
    if (payload.lines.length) {
      await procurementRepo.insertBidLines(payload.lines.map((l) => ({ ...l, bid_id: created.id })));
    }
    return created;
  },

  async awardBid(requestId: string, bidId: string, reason?: string) {
    const result = await procurementRepo.awardBidRpc(requestId, bidId, reason);
    if (!result.success) throw new Error(result.error || 'فشل');
  },
};
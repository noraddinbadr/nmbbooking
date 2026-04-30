import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Award, CheckCircle2, Loader2, Send, Sparkles, Trophy } from 'lucide-react';
import { useProcurementRequest, useProcurementBids, useScoredBids, useAwardBid, useUpdateProcurementStatus } from '@/hooks/useProcurement';
import { PROCUREMENT_STATUS_LABELS, PROCUREMENT_STATUS_COLORS, BID_STATUS_LABELS, AWARD_MODE_LABELS } from '@/data/procurementTypes';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import SubmitBidModal from './SubmitBidModal';

interface Props { requestId: string | null; onClose: () => void }

export default function RFQDetailDrawer({ requestId, onClose }: Props) {
  const { user } = useAuth();
  const { data: rfq, isLoading } = useProcurementRequest(requestId);
  const { data: bids = [] } = useProcurementBids(requestId);
  const { data: scored = [] } = useScoredBids(requestId);
  const award = useAwardBid();
  const updateStatus = useUpdateProcurementStatus();
  const [bidOpen, setBidOpen] = useState(false);

  const isOwner = rfq?.buyer_id === user?.id;
  const myBid = bids.find(b => b.bidder_id === user?.id);
  const isClosed = rfq && new Date(rfq.closes_at) < new Date();
  const canBid = !isOwner && rfq?.status === 'published' && !isClosed && !myBid;

  const scoreMap = new Map(scored.map(s => [s.bid_id, s.score]));
  const sortedBids = [...bids].sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));
  const topScored = scored[0];

  return (
    <>
      <Sheet open={!!requestId} onOpenChange={onClose}>
        <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto" dir="rtl">
          <SheetHeader>
            <SheetTitle className="font-cairo">{rfq?.rfq_code || '...'}</SheetTitle>
          </SheetHeader>

          {isLoading || !rfq ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="space-y-4 mt-4 font-cairo">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">{rfq.title_ar}</h3>
                  <Badge className={PROCUREMENT_STATUS_COLORS[rfq.status]}>{PROCUREMENT_STATUS_LABELS[rfq.status]}</Badge>
                </div>
                {rfq.description_ar && <p className="text-sm text-muted-foreground">{rfq.description_ar}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <Stat label="الإغلاق" value={new Date(rfq.closes_at).toLocaleString('ar')} />
                <Stat label="الترسية" value={AWARD_MODE_LABELS[rfq.award_mode]} />
                {rfq.budget_max && <Stat label="الميزانية" value={`${rfq.budget_max.toLocaleString()} ر.ي`} />}
                {rfq.delivery_city && <Stat label="مدينة التسليم" value={rfq.delivery_city} />}
              </div>

              <Separator />

              <div>
                <h4 className="font-bold mb-2">الأصناف المطلوبة ({rfq.items?.length || 0})</h4>
                <div className="space-y-2">
                  {rfq.items?.map(it => (
                    <div key={it.id} className="flex justify-between items-center rounded-lg border p-2 text-sm">
                      <span>{it.name_ar} {it.brand_preferred && <span className="text-muted-foreground">({it.brand_preferred})</span>}</span>
                      <span className="text-muted-foreground">{it.qty} {it.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {isOwner && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">العروض المقدمة ({bids.length})</h4>
                      {rfq.status === 'published' && bids.length > 0 && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: rfq.id, status: 'closed' })}>
                          إغلاق المزاد
                        </Button>
                      )}
                    </div>

                    {topScored && rfq.status !== 'awarded' && (
                      <div className="rounded-lg border-2 border-primary bg-primary/5 p-3 mb-3 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary shrink-0" />
                        <div className="text-sm">
                          <p className="font-bold">اقتراح النظام</p>
                          <p className="text-muted-foreground text-xs">أعلى نقاط ترجيح: {topScored.score} — قيمة العرض {topScored.total_amount.toLocaleString()} ر.ي</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {sortedBids.map((b, idx) => {
                        const score = scoreMap.get(b.id);
                        const isWinner = rfq.awarded_bid_id === b.id;
                        return (
                          <div key={b.id} className={`rounded-lg border p-3 ${isWinner ? 'border-primary bg-primary/5' : ''}`}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                {idx === 0 && !isWinner && <Trophy className="h-4 w-4 text-amber-500" />}
                                {isWinner && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                <div>
                                  <p className="font-bold text-sm">{b.is_anonymous ? 'مزود مجهول' : `مزود ${b.bidder_id.slice(0, 6)}`}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {b.delivery_days} يوم • تغطية {b.coverage_pct}% {b.warranty_months ? `• ضمان ${b.warranty_months} شهر` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-primary">{b.total_amount.toLocaleString()} ر.ي</p>
                                {score !== undefined && <p className="text-xs text-muted-foreground">نقاط: {score}</p>}
                              </div>
                            </div>
                            {b.notes && <p className="text-xs text-muted-foreground border-t pt-2 mt-2">{b.notes}</p>}
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <Badge variant="outline">{BID_STATUS_LABELS[b.status]}</Badge>
                              {(rfq.status === 'published' || rfq.status === 'closed') && !isWinner && (
                                <Button size="sm" variant="default" className="gap-1" onClick={() => award.mutate({ request_id: rfq.id, bid_id: b.id })} disabled={award.isPending}>
                                  <Award className="h-3.5 w-3.5" /> ترسية
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {!bids.length && <p className="text-sm text-muted-foreground text-center py-6">لا توجد عروض بعد</p>}
                    </div>
                  </div>
                </>
              )}

              {!isOwner && (
                <>
                  <Separator />
                  {myBid ? (
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="font-bold text-sm mb-1">عرضك المُقدَّم</p>
                      <p className="text-sm">القيمة: {myBid.total_amount.toLocaleString()} ر.ي</p>
                      <Badge className="mt-2">{BID_STATUS_LABELS[myBid.status]}</Badge>
                    </div>
                  ) : canBid ? (
                    <Button onClick={() => setBidOpen(true)} className="w-full gap-2">
                      <Send className="h-4 w-4" /> تقديم عرض
                    </Button>
                  ) : (
                    <p className="text-sm text-center text-muted-foreground">{isClosed ? 'انتهى المزاد' : 'غير متاح للعرض'}</p>
                  )}
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {rfq && <SubmitBidModal open={bidOpen} onClose={() => setBidOpen(false)} request={rfq} />}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
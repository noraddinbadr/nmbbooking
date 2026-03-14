import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  CheckCircle, XCircle, ArrowLeft, Gavel, ShieldCheck, FileText, Clock, Loader2
} from 'lucide-react';
import { useAuctionRequests } from '@/hooks/useAuctionRequests';
import { useAuctionBids } from '@/hooks/useAuctionBids';
import { useAuctionSettings } from '@/hooks/useAuctionSettings';
import { useAuth } from '@/contexts/AuthContext';
import {
  REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS,
  PRIORITY_LABELS, BID_TYPE_LABELS
} from '@/data/auctionTypes';
import type { AuctionRequestStatus } from '@/data/auctionTypes';
import AuctionBidForm from './AuctionBidForm';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  requestId: string;
}

const AuctionRequestDetail = ({ requestId }: Props) => {
  const { user, roles } = useAuth();
  const { requests, transitionStatus } = useAuctionRequests();
  const { bids, isLoading: bidsLoading, updateBidStatus } = useAuctionBids(requestId);
  const { settings } = useAuctionSettings();
  const [showBidForm, setShowBidForm] = useState(false);

  const request = requests.find(r => r.id === requestId);
  const isAdmin = roles.includes('admin');
  const isDoctor = roles.includes('doctor');
  const isProvider = roles.includes('provider');
  const isOwner = request?.initiator_id === user?.id || request?.patient_id === user?.id;

  // Fetch state log
  const { data: stateLog = [] } = useQuery({
    queryKey: ['auction-state-log', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auction_state_log')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch verifications
  const { data: verifications = [] } = useQuery({
    queryKey: ['auction-verifications', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auction_verifications')
        .select('*')
        .eq('request_id', requestId);
      if (error) throw error;
      return data;
    },
  });

  if (!request) return <div className="text-center py-8 text-muted-foreground font-cairo">الطلب غير موجود</div>;

  const getNextActions = (): { label: string; status: AuctionRequestStatus; variant: 'default' | 'destructive' }[] => {
    const actions: { label: string; status: AuctionRequestStatus; variant: 'default' | 'destructive' }[] = [];
    const s = request.status;
    if (s === 'draft' && (isOwner || isAdmin)) {
      if (settings?.require_doctor_signature && !isDoctor) {
        actions.push({ label: 'إرسال للطبيب', status: 'pending_doctor', variant: 'default' });
      } else {
        actions.push({ label: 'إرسال للمراجعة', status: 'pending_admin', variant: 'default' });
      }
    }
    if (s === 'pending_doctor' && isDoctor) {
      actions.push({ label: 'تأكيد طبي ونشر', status: settings?.auto_publish_after_verify ? 'published' : 'pending_admin', variant: 'default' });
    }
    if (s === 'pending_patient_consent' && (isOwner || isAdmin)) {
      actions.push({ label: 'الموافقة والمتابعة', status: settings?.auto_publish_after_verify ? 'published' : 'pending_admin', variant: 'default' });
    }
    if (s === 'pending_admin' && isAdmin) {
      actions.push({ label: 'الموافقة والنشر', status: 'published', variant: 'default' });
      actions.push({ label: 'رفض', status: 'cancelled', variant: 'destructive' });
    }
    if (s === 'published' && isAdmin) {
      actions.push({ label: 'إلغاء المزاد', status: 'cancelled', variant: 'destructive' });
    }
    if (s === 'awarded' && isAdmin) {
      actions.push({ label: 'تأكيد الإتمام', status: 'fulfilled', variant: 'default' });
    }
    return actions;
  };

  const handleVerify = async () => {
    if (!user) return;
    const { error } = await supabase.from('auction_verifications').insert({
      request_id: requestId,
      verified_by: user.id,
      verification_type: 'medical',
      is_verified: true,
      verified_at: new Date().toISOString(),
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success('تم التحقق الطبي');
  };

  const handleAcceptBid = async (bidId: string) => {
    await updateBidStatus.mutateAsync({ id: bidId, status: 'accepted' });
    await transitionStatus.mutateAsync({ id: requestId, newStatus: 'awarded' });
  };

  const fundingPercent = request.estimated_cost > 0
    ? Math.round((request.funded_amount / request.estimated_cost) * 100)
    : 0;

  return (
    <div className="space-y-4 font-cairo">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">{request.title_ar}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className={`${REQUEST_STATUS_COLORS[request.status]} text-xs`}>
              {REQUEST_STATUS_LABELS[request.status]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              أولوية: {PRIORITY_LABELS[request.medical_priority]}
            </Badge>
            {request.diagnosis_code && (
              <Badge variant="outline" className="text-xs">ICD: {request.diagnosis_code}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        {getNextActions().map(action => (
          <Button
            key={action.status}
            variant={action.variant}
            size="sm"
            className="font-cairo gap-1"
            onClick={() => transitionStatus.mutate({ id: requestId, newStatus: action.status })}
            disabled={transitionStatus.isPending}
          >
            {action.label}
          </Button>
        ))}
        {isDoctor && request.status === 'pending_doctor' && (
          <Button size="sm" variant="outline" onClick={handleVerify} className="font-cairo gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            تأكيد طبي
          </Button>
        )}
        {(isProvider || isDoctor) && request.status === 'published' && (
          <Dialog open={showBidForm} onOpenChange={setShowBidForm}>
            <DialogTrigger asChild>
              <Button size="sm" className="font-cairo gap-1 bg-green-600 hover:bg-green-700">
                <Gavel className="h-3.5 w-3.5" />
                تقديم عرض
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-cairo">تقديم عرض للمزاد</DialogTitle>
              </DialogHeader>
              <AuctionBidForm requestId={requestId} onSuccess={() => setShowBidForm(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList className="font-cairo">
          <TabsTrigger value="details">التفاصيل</TabsTrigger>
          <TabsTrigger value="bids">العروض ({bids.length})</TabsTrigger>
          <TabsTrigger value="log">سجل التغييرات</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">المعلومات الطبية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {request.diagnosis_summary && <div><span className="text-muted-foreground">التشخيص:</span> {request.diagnosis_summary}</div>}
                {request.treatment_plan && <div><span className="text-muted-foreground">خطة العلاج:</span> {request.treatment_plan}</div>}
                {request.specialty && <div><span className="text-muted-foreground">التخصص:</span> {request.specialty}</div>}
                {request.city && <div><span className="text-muted-foreground">المدينة:</span> {request.city}</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">المعلومات المالية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-muted-foreground">التكلفة المقدرة:</span> {request.estimated_cost.toLocaleString()} ر.ي</div>
                <div><span className="text-muted-foreground">التمويل:</span> {request.funded_amount.toLocaleString()} ر.ي ({fundingPercent}%)</div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(fundingPercent, 100)}%` }} />
                </div>
                {request.poverty_score !== null && (
                  <div><span className="text-muted-foreground">درجة الفقر:</span> {request.poverty_score}/100</div>
                )}
              </CardContent>
            </Card>
          </div>

          {request.description_ar && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">الوصف</CardTitle></CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">{request.description_ar}</CardContent>
            </Card>
          )}

          {/* Verifications */}
          {verifications.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">التحققات</CardTitle></CardHeader>
              <CardContent>
                {verifications.map(v => (
                  <div key={v.id} className="flex items-center gap-2 text-sm">
                    {v.is_verified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-yellow-500" />}
                    <span>{v.verification_type === 'medical' ? 'تحقق طبي' : 'تحقق اجتماعي'}</span>
                    {v.verified_at && <span className="text-muted-foreground text-xs">{new Date(v.verified_at).toLocaleString('ar-YE')}</span>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bids" className="mt-4">
          {bidsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : bids.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">لا توجد عروض بعد</CardContent></Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">ملاحظات</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      {(isAdmin || isOwner) && <TableHead className="text-right">إجراء</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bids.map(bid => (
                      <TableRow key={bid.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{BID_TYPE_LABELS[bid.bid_type]}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{bid.amount.toLocaleString()} ر.ي</TableCell>
                        <TableCell>
                          <Badge variant={bid.status === 'accepted' ? 'default' : 'outline'} className="text-xs">
                            {bid.status === 'pending' ? 'معلق' : bid.status === 'accepted' ? 'مقبول' : bid.status === 'rejected' ? 'مرفوض' : 'مسحوب'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{bid.notes}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(bid.created_at).toLocaleDateString('ar-YE')}</TableCell>
                        {(isAdmin || isOwner) && (
                          <TableCell>
                            {bid.status === 'pending' && request.status === 'published' && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={() => handleAcceptBid(bid.id)}>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => updateBidStatus.mutate({ id: bid.id, status: 'rejected' })}>
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="log" className="mt-4">
          <Card>
            <CardContent className="py-4">
              {stateLog.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">لا توجد تغييرات مسجلة</p>
              ) : (
                <div className="space-y-3">
                  {stateLog.map((log: any) => (
                    <div key={log.id} className="flex items-center gap-3 text-sm border-b border-border pb-2 last:border-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {log.from_status && (
                            <Badge variant="outline" className="text-xs">{REQUEST_STATUS_LABELS[log.from_status as keyof typeof REQUEST_STATUS_LABELS] || log.from_status}</Badge>
                          )}
                          <ArrowLeft className="h-3 w-3 text-muted-foreground" />
                          <Badge className={`text-xs ${REQUEST_STATUS_COLORS[log.to_status as keyof typeof REQUEST_STATUS_COLORS] || ''}`}>
                            {REQUEST_STATUS_LABELS[log.to_status as keyof typeof REQUEST_STATUS_LABELS] || log.to_status}
                          </Badge>
                        </div>
                        {log.reason && <p className="text-xs text-muted-foreground mt-1">{log.reason}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(log.created_at).toLocaleString('ar-YE')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuctionRequestDetail;

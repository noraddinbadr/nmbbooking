import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Gavel, Eye, ArrowLeftRight, Loader2 } from 'lucide-react';
import { useAuctionRequests } from '@/hooks/useAuctionRequests';
import { useAuth } from '@/contexts/AuthContext';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, PRIORITY_LABELS } from '@/data/auctionTypes';
import type { AuctionRequestStatus } from '@/data/auctionTypes';
import AuctionRequestForm from '@/components/auction/AuctionRequestForm';
import AuctionRequestDetail from '@/components/auction/AuctionRequestDetail';

const DashboardAuctions = () => {
  const { roles } = useAuth();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const statusMap: Record<string, AuctionRequestStatus[] | undefined> = {
    all: undefined,
    pending: ['draft', 'pending_doctor', 'pending_patient_consent', 'pending_admin'],
    published: ['published'],
    awarded: ['awarded', 'fulfilled'],
    cancelled: ['cancelled'],
  };

  const { requests, isLoading } = useAuctionRequests(statusMap[tab]);
  const isAdmin = roles.includes('admin');
  const isDoctor = roles.includes('doctor');

  const filtered = requests.filter(r =>
    !search || r.medical_case?.title_ar?.includes(search) || r.medical_case?.diagnosis_code?.includes(search) || r.medical_case?.case_code?.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold font-cairo text-foreground flex items-center gap-2">
              <Gavel className="h-6 w-6 text-primary" />
              المزادات العكسية
            </h1>
            <p className="text-sm text-muted-foreground font-cairo">إدارة طلبات الخدمات الطبية والعروض المقدمة</p>
          </div>
          <div className="flex gap-2">
            {(isAdmin || isDoctor) && (
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button className="font-cairo gap-2">
                    <Plus className="h-4 w-4" />
                    طلب جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="font-cairo">إنشاء طلب مزاد جديد</DialogTitle>
                  </DialogHeader>
                  <AuctionRequestForm onSuccess={() => setShowCreate(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الطلبات', value: requests.length, color: 'text-foreground' },
            { label: 'منشورة', value: requests.filter(r => r.status === 'published').length, color: 'text-green-600' },
            { label: 'بانتظار المراجعة', value: requests.filter(r => ['pending_doctor', 'pending_admin', 'pending_patient_consent'].includes(r.status)).length, color: 'text-yellow-600' },
            { label: 'تم الترسية', value: requests.filter(r => r.status === 'awarded' || r.status === 'fulfilled').length, color: 'text-purple-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground font-cairo">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالعنوان أو كود التشخيص..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 font-cairo"
          />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="font-cairo">
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="pending">قيد المراجعة</TabsTrigger>
            <TabsTrigger value="published">منشورة</TabsTrigger>
            <TabsTrigger value="awarded">مُرسَاة</TabsTrigger>
            <TabsTrigger value="cancelled">ملغاة</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Gavel className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-cairo">لا توجد طلبات في هذا التصنيف</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-cairo text-right">العنوان</TableHead>
                        <TableHead className="font-cairo text-right">الأولوية</TableHead>
                        <TableHead className="font-cairo text-right">التكلفة المقدرة</TableHead>
                        <TableHead className="font-cairo text-right">التمويل</TableHead>
                        <TableHead className="font-cairo text-right">الحالة</TableHead>
                        <TableHead className="font-cairo text-right">المبادر</TableHead>
                        <TableHead className="font-cairo text-right">التاريخ</TableHead>
                        <TableHead className="font-cairo text-right">إجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(req => {
                        const mc = req.medical_case;
                        const cost = Number(mc?.estimated_cost ?? 0);
                        const funded = Number(mc?.funded_amount ?? 0);
                        return (
                        <TableRow key={req.id}>
                          <TableCell className="font-cairo font-medium">{mc?.title_ar || mc?.case_code || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-cairo text-xs">
                              {PRIORITY_LABELS[mc?.medical_priority ?? 3] || mc?.medical_priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-cairo">{cost.toLocaleString()} ر.ي</TableCell>
                          <TableCell className="font-cairo">
                            <div className="flex items-center gap-1">
                              <span>{funded.toLocaleString()}</span>
                              {cost > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ({Math.round((funded / cost) * 100)}%)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${REQUEST_STATUS_COLORS[req.status]} font-cairo text-xs`}>
                              {REQUEST_STATUS_LABELS[req.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-cairo text-sm">
                            {req.initiator_type === 'doctor' ? 'طبيب' : req.initiator_type === 'patient' ? 'مريض' : 'أدمن'}
                          </TableCell>
                          <TableCell className="font-cairo text-sm text-muted-foreground">
                            {new Date(req.created_at).toLocaleDateString('ar-YE')}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="font-cairo gap-1"
                              onClick={() => setSelectedRequest(req.id)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              عرض
                            </Button>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-cairo">تفاصيل الطلب</DialogTitle>
            </DialogHeader>
            {selectedRequest && <AuctionRequestDetail requestId={selectedRequest} />}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardAuctions;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText, Search, Calendar, Clock, User, Play, Pill,
  TestTube, History, Printer, Share2, Download, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface BookingWithPatient {
  id: string;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  booking_type: string | null;
  notes: string | null;
  patient_id: string;
  doctor_id: string;
  patient_name?: string;
}

interface TreatmentSession {
  id: string;
  booking_id: string | null;
  patient_id: string;
  doctor_id: string;
  session_date: string;
  symptoms: string | null;
  examination: string | null;
  diagnosis: string | null;
  notes: string | null;
  follow_up_date: string | null;
  status: string;
  created_at: string;
}

interface PrescriptionWithItems {
  id: string;
  session_id: string;
  patient_id: string;
  pharmacy_sent: boolean | null;
  notes: string | null;
  created_at: string;
  prescription_items: { id: string; medicine_name: string; dosage: string | null; frequency: string | null; duration: string | null; instructions: string | null }[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'معلّق', color: 'bg-amber-500' },
  confirmed: { label: 'مؤكد', color: 'bg-blue-500' },
  completed: { label: 'مكتمل', color: 'bg-emerald-500' },
  cancelled: { label: 'ملغي', color: 'bg-red-500' },
};

const bookingTypeLabels: Record<string, string> = {
  clinic: 'عيادة', hospital: 'مستشفى', home: 'منزلي', video: 'فيديو', voice: 'صوتي', lab: 'مختبر',
};

const DashboardTreatment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState<BookingWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [sessions, setSessions] = useState<TreatmentSession[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithItems[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [doctorId, setDoctorId] = useState<string | null>(null);

  // Get doctor record for current user
  useEffect(() => {
    if (!user) return;
    const fetchDoctor = async () => {
      const { data } = await supabase.from('doctors').select('id').eq('user_id', user.id).maybeSingle();
      if (data) setDoctorId(data.id);
    };
    fetchDoctor();
  }, [user]);

  // Fetch today's bookings
  useEffect(() => {
    if (!doctorId) { setLoading(false); return; }
    const fetchBookings = async () => {
      setLoading(true);
      const { data: bks } = await supabase
        .from('bookings')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('booking_date', dateFilter)
        .order('start_time', { ascending: true });

      if (bks && bks.length > 0) {
        // Fetch patient names
        const patientIds = [...new Set(bks.map(b => b.patient_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name_ar, full_name')
          .in('id', patientIds);
        const nameMap = new Map(profiles?.map(p => [p.id, p.full_name_ar || p.full_name || 'مريض']) || []);
        setBookings(bks.map(b => ({ ...b, patient_name: nameMap.get(b.patient_id) || 'مريض' })));
      } else {
        setBookings([]);
      }
      setLoading(false);
    };
    fetchBookings();
  }, [doctorId, dateFilter]);

  // Fetch patient medical history
  const openPatientHistory = async (patientId: string, patientName: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setHistoryLoading(true);

    const [sessionsRes, prescriptionsRes, ordersRes] = await Promise.all([
      supabase
        .from('treatment_sessions')
        .select('*')
        .eq('patient_id', patientId)
        .order('session_date', { ascending: false }),
      supabase
        .from('prescriptions')
        .select('*, prescription_items(*)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('provider_orders')
        .select('*, providers(name_ar)')
        .order('created_at', { ascending: false }),
    ]);

    setSessions((sessionsRes.data as TreatmentSession[]) || []);
    setPrescriptions((prescriptionsRes.data as PrescriptionWithItems[]) || []);
    setLabOrders(ordersRes.data || []);
    setHistoryLoading(false);
  };

  const startConsultation = (bookingId: string) => {
    navigate(`/dashboard/consultation?booking=${bookingId}`);
  };

  const todayBookings = bookings.filter(b => !search ||
    b.patient_name?.includes(search) || b.notes?.includes(search));

  const activeCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-cairo text-xl font-bold text-foreground">ملفات العلاج والجلسات</h1>
            <p className="font-cairo text-sm text-muted-foreground">إدارة حجوزات اليوم وملفات المرضى الطبية</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-40 text-sm"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-card"><CardContent className="p-3 text-center">
            <p className="font-cairo text-2xl font-bold text-primary">{bookings.length}</p>
            <p className="font-cairo text-xs text-muted-foreground">إجمالي الحجوزات</p>
          </CardContent></Card>
          <Card className="shadow-card"><CardContent className="p-3 text-center">
            <p className="font-cairo text-2xl font-bold text-amber-500">{activeCount}</p>
            <p className="font-cairo text-xs text-muted-foreground">في الانتظار</p>
          </CardContent></Card>
          <Card className="shadow-card"><CardContent className="p-3 text-center">
            <p className="font-cairo text-2xl font-bold text-emerald-500">{completedCount}</p>
            <p className="font-cairo text-xs text-muted-foreground">مكتمل</p>
          </CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو الملاحظات..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 font-cairo" />
        </div>

        {/* Bookings Queue */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : todayBookings.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-cairo text-muted-foreground">لا توجد حجوزات في هذا التاريخ</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayBookings.map((booking, idx) => {
              const st = statusLabels[booking.status || 'pending'];
              return (
                <Card key={booking.id} className="shadow-card hover:shadow-card-hover transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-cairo font-bold text-primary text-sm">{idx + 1}</span>
                        </div>
                        <div>
                          <p className="font-cairo font-bold text-foreground">{booking.patient_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-cairo">
                            <Clock className="h-3 w-3" />
                            <span>{booking.start_time || '--:--'}</span>
                            <span>•</span>
                            <span>{bookingTypeLabels[booking.booking_type || 'clinic']}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`font-cairo text-xs text-white ${st.color}`}>{st.label}</Badge>
                      </div>
                    </div>

                    {booking.notes && (
                      <p className="font-cairo text-xs text-muted-foreground bg-muted/30 p-2 rounded mb-3">📝 {booking.notes}</p>
                    )}

                    <div className="flex items-center gap-2">
                      {(booking.status === 'confirmed' || booking.status === 'pending') && (
                        <Button size="sm" className="font-cairo text-xs gap-1" onClick={() => startConsultation(booking.id)}>
                          <Play className="h-3 w-3" /> بدء الجلسة
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="font-cairo text-xs gap-1"
                        onClick={() => openPatientHistory(booking.patient_id, booking.patient_name || 'مريض')}>
                        <History className="h-3 w-3" /> السجل الطبي
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Printer className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Share2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Patient Full Medical Record Dialog */}
        <Dialog open={!!selectedPatientId} onOpenChange={() => setSelectedPatientId(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl">الملف الطبي — {selectedPatientName}</DialogTitle>
            </DialogHeader>

            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="sessions" className="mt-2">
                <TabsList className="font-cairo w-full grid grid-cols-3 h-9">
                  <TabsTrigger value="sessions" className="font-cairo text-xs gap-1">
                    <FileText className="h-3 w-3" /> الجلسات ({sessions.length})
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions" className="font-cairo text-xs gap-1">
                    <Pill className="h-3 w-3" /> الوصفات ({prescriptions.length})
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="font-cairo text-xs gap-1">
                    <TestTube className="h-3 w-3" /> الطلبات ({labOrders.length})
                  </TabsTrigger>
                </TabsList>

                {/* Sessions */}
                <TabsContent value="sessions" className="space-y-3 mt-3">
                  {sessions.length === 0 ? (
                    <p className="font-cairo text-sm text-muted-foreground text-center py-6">لا توجد جلسات سابقة — زيارة أولى</p>
                  ) : sessions.map(s => (
                    <div key={s.id} className="p-3 rounded-lg bg-muted/50 font-cairo text-sm space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" /> {s.session_date}
                        </span>
                        {s.diagnosis && <Badge variant="secondary" className="font-cairo text-xs">{s.diagnosis}</Badge>}
                      </div>
                      {s.symptoms && <p><span className="text-muted-foreground">الأعراض:</span> {s.symptoms}</p>}
                      {s.examination && <p><span className="text-muted-foreground">الفحص:</span> {s.examination}</p>}
                      {s.follow_up_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> متابعة: {s.follow_up_date}
                        </p>
                      )}
                      {s.notes && <p className="text-xs text-muted-foreground/80">📝 {s.notes}</p>}
                    </div>
                  ))}
                </TabsContent>

                {/* Prescriptions */}
                <TabsContent value="prescriptions" className="space-y-3 mt-3">
                  {prescriptions.length === 0 ? (
                    <p className="font-cairo text-sm text-muted-foreground text-center py-6">لا توجد وصفات سابقة</p>
                  ) : prescriptions.map(rx => (
                    <div key={rx.id} className="p-3 rounded-lg bg-muted/50 font-cairo text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{new Date(rx.created_at).toLocaleDateString('ar')}</span>
                        <Badge className={`font-cairo text-xs ${rx.pharmacy_sent ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                          {rx.pharmacy_sent ? 'تم الإرسال' : 'لم يُرسل'}
                        </Badge>
                      </div>
                      {rx.prescription_items?.map((item, i) => (
                        <p key={item.id}>
                          <span className="text-primary font-medium">{item.medicine_name}</span>
                          {item.dosage && ` — ${item.dosage}`}
                          {item.frequency && ` — ${item.frequency}`}
                          {item.duration && ` — ${item.duration}`}
                        </p>
                      ))}
                      {rx.notes && <p className="text-xs text-muted-foreground mt-1">📝 {rx.notes}</p>}
                    </div>
                  ))}
                </TabsContent>

                {/* Lab/Imaging Orders */}
                <TabsContent value="orders" className="space-y-3 mt-3">
                  {labOrders.length === 0 ? (
                    <p className="font-cairo text-sm text-muted-foreground text-center py-6">لا توجد طلبات سابقة</p>
                  ) : labOrders.map(order => (
                    <div key={order.id} className="p-3 rounded-lg bg-muted/50 font-cairo text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('ar')}
                          {order.providers?.name_ar && ` — ${order.providers.name_ar}`}
                        </span>
                        <Badge className={`font-cairo text-xs ${
                          order.status === 'results_uploaded' || order.status === 'delivered' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {order.status === 'pending' ? 'معلّق' :
                           order.status === 'received' ? 'مستلم' :
                           order.status === 'sample_taken' ? 'عينة' :
                           order.status === 'results_uploaded' ? 'جاهز' :
                           order.status === 'delivered' ? 'مسلّم' : order.status}
                        </Badge>
                      </div>
                      <p className="text-foreground">{order.order_type || 'طلب طبي'}</p>
                      {order.notes && <p className="text-xs text-muted-foreground">📝 {order.notes}</p>}
                      {order.results_url && (
                        <a href={order.results_url} target="_blank" className="text-xs text-primary underline">عرض النتائج</a>
                      )}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardTreatment;

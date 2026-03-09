import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, User, Phone, Calendar, Heart, Stethoscope, FileText, FlaskConical, ClipboardList, Loader2 } from 'lucide-react';

function calcAge(dob: string | null): string {
  if (!dob) return '—';
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} سنة`;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};
const statusLabels: Record<string, string> = {
  pending: 'معلّق', confirmed: 'مؤكد', completed: 'مكتمل', cancelled: 'ملغي',
};

const DashboardPatientRecord = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['patient-profile', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', patientId!).single();
      return data;
    },
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ['patient-family', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data } = await supabase.from('family_members').select('*').eq('user_id', patientId!).eq('is_active', true);
      return data || [];
    },
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['patient-sessions', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data } = await supabase
        .from('treatment_sessions')
        .select('*, doctors(name_ar)')
        .eq('patient_id', patientId!)
        .order('session_date', { ascending: false });
      return data || [];
    },
  });

  const { data: prescriptions = [], isLoading: loadingRx } = useQuery({
    queryKey: ['patient-prescriptions', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data } = await supabase
        .from('prescriptions')
        .select('*, prescription_items(*), doctors(name_ar)')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['patient-bookings', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, doctors(name_ar)')
        .eq('patient_id', patientId!)
        .order('booking_date', { ascending: false });
      return data || [];
    },
  });

  if (loadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-16 font-cairo text-muted-foreground">لم يتم العثور على المريض</div>
      </DashboardLayout>
    );
  }

  const displayName = profile.full_name_ar || profile.full_name || 'مريض';

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Back */}
        <Button variant="ghost" size="sm" className="font-cairo gap-1.5 text-muted-foreground" onClick={() => navigate('/dashboard/patients')}>
          <ArrowRight className="h-4 w-4" /> العودة للمرضى
        </Button>

        {/* Profile Header */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-cairo text-xl font-bold text-foreground">{displayName}</h2>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground font-cairo">
                {profile.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {profile.phone}</span>
                )}
                {profile.gender && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {profile.gender === 'male' ? 'ذكر' : 'أنثى'}
                  </span>
                )}
                {profile.date_of_birth && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {calcAge(profile.date_of_birth)}
                  </span>
                )}
              </div>
            </div>
            {/* Quick stats */}
            <div className="flex gap-3 flex-wrap sm:flex-nowrap">
              {[
                { label: 'حجوزات', value: bookings.length, icon: ClipboardList, color: 'text-blue-600' },
                { label: 'جلسات', value: sessions.length, icon: Stethoscope, color: 'text-green-600' },
                { label: 'وصفات', value: prescriptions.length, icon: FileText, color: 'text-purple-600' },
              ].map(s => (
                <div key={s.label} className="text-center min-w-[60px]">
                  <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                  <p className="font-cairo font-bold text-foreground text-lg">{s.value}</p>
                  <p className="font-cairo text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Family Members */}
        {familyMembers.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-cairo font-semibold text-foreground mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" /> أفراد العائلة المسجلون
            </h3>
            <div className="flex flex-wrap gap-2">
              {familyMembers.map((m: any) => (
                <div key={m.id} className="rounded-lg bg-muted px-3 py-2">
                  <p className="font-cairo text-sm font-medium text-foreground">{m.full_name_ar}</p>
                  <p className="font-cairo text-xs text-muted-foreground">{m.relationship}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="sessions">
          <TabsList className="font-cairo">
            <TabsTrigger value="sessions" className="font-cairo gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" /> الجلسات ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="font-cairo gap-1.5">
              <FileText className="h-3.5 w-3.5" /> الوصفات ({prescriptions.length})
            </TabsTrigger>
            <TabsTrigger value="bookings" className="font-cairo gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" /> الحجوزات ({bookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="mt-4">
            {loadingSessions ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-cairo text-sm">لا توجد جلسات علاج</div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s: any) => (
                  <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-cairo text-sm font-semibold text-foreground">{s.session_date}</p>
                        {s.doctors?.name_ar && <p className="font-cairo text-xs text-muted-foreground">د. {s.doctors.name_ar}</p>}
                      </div>
                      <Badge variant="outline" className={`font-cairo text-[10px] ${s.status === 'completed' ? 'border-green-300 text-green-700' : 'border-blue-300 text-blue-700'}`}>
                        {s.status === 'completed' ? 'مكتملة' : 'نشطة'}
                      </Badge>
                    </div>
                    {s.symptoms && <p className="font-cairo text-xs text-muted-foreground mb-1"><span className="font-medium text-foreground">الأعراض:</span> {s.symptoms}</p>}
                    {s.diagnosis && <p className="font-cairo text-xs text-muted-foreground mb-1"><span className="font-medium text-foreground">التشخيص:</span> {s.diagnosis}</p>}
                    {s.notes && <p className="font-cairo text-xs text-muted-foreground"><span className="font-medium text-foreground">ملاحظات:</span> {s.notes}</p>}
                    {s.follow_up_date && <p className="font-cairo text-xs text-primary mt-1">متابعة: {s.follow_up_date}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="mt-4">
            {loadingRx ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-cairo text-sm">لا توجد وصفات طبية</div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx: any) => (
                  <div key={rx.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-cairo text-sm font-semibold text-foreground">
                          {new Date(rx.created_at).toLocaleDateString('ar-YE')}
                        </p>
                        {rx.doctors?.name_ar && <p className="font-cairo text-xs text-muted-foreground">د. {rx.doctors.name_ar}</p>}
                      </div>
                      {rx.pharmacy_sent && (
                        <Badge variant="outline" className="font-cairo text-[10px] border-green-300 text-green-700">أُرسل للصيدلية</Badge>
                      )}
                    </div>
                    {rx.prescription_items?.length > 0 && (
                      <div className="space-y-2">
                        {rx.prescription_items.map((item: any) => (
                          <div key={item.id} className="rounded-lg bg-muted px-3 py-2">
                            <p className="font-cairo text-sm font-medium text-foreground">{item.medicine_name}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-cairo mt-0.5">
                              {item.dosage && <span>الجرعة: {item.dosage}</span>}
                              {item.frequency && <span>التكرار: {item.frequency}</span>}
                              {item.duration && <span>المدة: {item.duration}</span>}
                            </div>
                            {item.instructions && <p className="font-cairo text-xs text-muted-foreground mt-1">{item.instructions}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {rx.notes && <p className="font-cairo text-xs text-muted-foreground mt-2">{rx.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="mt-4">
            {loadingBookings ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-cairo text-sm">لا توجد حجوزات</div>
            ) : (
              <div className="space-y-2">
                {bookings.map((b: any) => (
                  <div key={b.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-cairo text-sm font-medium text-foreground">{b.booking_date}</p>
                      {b.doctors?.name_ar && <p className="font-cairo text-xs text-muted-foreground">د. {b.doctors.name_ar}</p>}
                      {b.start_time && <p className="font-cairo text-xs text-muted-foreground">{b.start_time}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {b.final_price ? <span className="font-cairo text-sm font-semibold text-primary">{b.final_price.toLocaleString()} ر.ي</span> : null}
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-cairo font-medium ${statusColors[b.status] || 'bg-muted text-muted-foreground'}`}>
                        {statusLabels[b.status] || b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPatientRecord;

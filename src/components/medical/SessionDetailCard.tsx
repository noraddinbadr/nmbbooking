import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Pill, FlaskConical, FileImage, FileText, Loader2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  session: any;
  patientId: string;
}

const orderStatusLabels: Record<string, string> = {
  pending: 'معلّق', received: 'مستلم', sample_taken: 'تم أخذ العينة',
  results_uploaded: 'النتائج جاهزة', delivered: 'تم التسليم',
};

export const SessionDetailCard = ({ session, patientId }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rx, setRx] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      const [rxRes, ordersRes, filesRes] = await Promise.all([
        supabase.from('prescriptions').select('*, prescription_items(*)').eq('session_id', session.id),
        supabase.from('provider_orders').select('*, providers(name_ar)').order('created_at', { ascending: false }),
        supabase.from('medical_files').select('*').eq('session_id', session.id),
      ]);
      setRx(rxRes.data || []);
      setOrders((ordersRes.data || []).filter((o: any) => o?.order_details?.session_id === session.id));
      setFiles(filesRes.data || []);
      setLoading(false);
    };
    load();

    // Realtime subscription for session-related orders & files
    const channel = supabase
      .channel(`session-${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_orders' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medical_files', filter: `session_id=eq.${session.id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions', filter: `session_id=eq.${session.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, session.id, patientId]);

  const openFile = async (path: string) => {
    const { data } = await supabase.storage.from('medical-files').createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-cairo text-sm font-semibold text-foreground">{session.session_date}</p>
          {session.doctors?.name_ar && <p className="font-cairo text-xs text-muted-foreground">د. {session.doctors.name_ar}</p>}
        </div>
        <Badge variant="outline" className={`font-cairo text-[10px] ${session.status === 'completed' ? 'border-emerald-300 text-emerald-700' : 'border-blue-300 text-blue-700'}`}>
          {session.status === 'completed' ? 'مكتملة' : 'نشطة'}
        </Badge>
      </div>
      {session.symptoms && <p className="font-cairo text-xs text-muted-foreground mb-1"><span className="font-medium text-foreground">الأعراض:</span> {session.symptoms}</p>}
      {session.diagnosis && <p className="font-cairo text-xs text-muted-foreground mb-1"><span className="font-medium text-foreground">التشخيص:</span> {session.diagnosis}</p>}
      {session.notes && <p className="font-cairo text-xs text-muted-foreground"><span className="font-medium text-foreground">ملاحظات:</span> {session.notes}</p>}
      {session.follow_up_date && <p className="font-cairo text-xs text-primary mt-1">📅 متابعة: {session.follow_up_date}</p>}

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="font-cairo gap-1 mt-2 h-7 text-xs w-full justify-center">
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {open ? 'إخفاء التفاصيل' : 'عرض الوصفات والتحاليل والملفات المرتبطة'}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3 pt-3 border-t border-border">
          {loading ? (
            <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Prescriptions */}
              <div>
                <p className="font-cairo text-xs font-semibold text-foreground mb-2 flex items-center gap-1"><Pill className="h-3 w-3 text-purple-600" /> الوصفات ({rx.length})</p>
                {rx.length === 0 ? <p className="font-cairo text-[11px] text-muted-foreground">لا توجد وصفات</p> :
                  rx.map(r => (
                    <div key={r.id} className="rounded-lg bg-muted/50 p-2 mb-1">
                      {r.prescription_items?.map((item: any) => (
                        <p key={item.id} className="font-cairo text-xs text-foreground">
                          • {item.medicine_name} {item.dosage && <span className="text-muted-foreground">— {item.dosage}</span>}
                        </p>
                      ))}
                    </div>
                  ))
                }
              </div>

              {/* Lab/Imaging Orders */}
              <div>
                <p className="font-cairo text-xs font-semibold text-foreground mb-2 flex items-center gap-1"><FlaskConical className="h-3 w-3 text-amber-600" /> الطلبات ({orders.length})</p>
                {orders.length === 0 ? <p className="font-cairo text-[11px] text-muted-foreground">لا توجد طلبات</p> :
                  orders.map(o => (
                    <div key={o.id} className="rounded-lg bg-muted/50 p-2 mb-1 flex justify-between items-center">
                      <span className="font-cairo text-xs text-foreground">
                        {o.order_type === 'imaging' ? '📷' : '🧪'} {o.providers?.name_ar || '—'}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-cairo text-[9px]">{orderStatusLabels[o.status] || o.status}</Badge>
                        {o.results_url && <a href={o.results_url} target="_blank" rel="noopener noreferrer" className="font-cairo text-[10px] text-primary">عرض</a>}
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Files */}
              <div>
                <p className="font-cairo text-xs font-semibold text-foreground mb-2 flex items-center gap-1"><FileImage className="h-3 w-3 text-slate-600" /> الملفات ({files.length})</p>
                {files.length === 0 ? <p className="font-cairo text-[11px] text-muted-foreground">لا توجد ملفات</p> :
                  files.map(f => (
                    <div key={f.id} className="rounded-lg bg-muted/50 p-2 mb-1 flex justify-between items-center gap-2">
                      <span className="font-cairo text-xs text-foreground truncate flex-1">{f.file_name}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openFile(f.file_path)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                }
              </div>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

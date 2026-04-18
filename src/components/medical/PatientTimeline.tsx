import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, Stethoscope, Pill, FlaskConical, FileImage, FileText, Filter, RefreshCw } from 'lucide-react';
import { usePatientTimeline, TimelineEvent, TimelineEventType } from '@/hooks/usePatientTimeline';

const typeConfig: Record<TimelineEventType, { label: string; icon: any; color: string; bg: string }> = {
  booking:        { label: 'حجز',     icon: Calendar,    color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
  session:        { label: 'جلسة',    icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  prescription:   { label: 'وصفة',    icon: Pill,        color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200' },
  lab_order:      { label: 'تحاليل',  icon: FlaskConical,color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
  imaging_order:  { label: 'أشعة',    icon: FileImage,   color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200' },
  file:           { label: 'ملف',     icon: FileText,    color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200' },
  donation:       { label: 'تبرع',    icon: FileText,    color: 'text-pink-600',    bg: 'bg-pink-50 border-pink-200' },
};

interface Props {
  patientId: string;
  pageSize?: number;
}

export const PatientTimeline = ({ patientId, pageSize = 25 }: Props) => {
  const { events, loading, refetch, counts } = usePatientTimeline({ patientId });
  const [filter, setFilter] = useState<TimelineEventType | 'all'>('all');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [visible, setVisible] = useState(pageSize);

  const filtered = useMemo(() => {
    let list = filter === 'all' ? events : events.filter(e => e.type === filter);
    if (sortDir === 'asc') list = [...list].reverse();
    return list;
  }, [events, filter, sortDir]);

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (events.length === 0) {
    return <div className="text-center py-10 font-cairo text-sm text-muted-foreground">لا توجد أحداث في الملف الطبي</div>;
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={v => { setFilter(v as any); setVisible(pageSize); }}>
          <SelectTrigger className="font-cairo h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-cairo text-xs">الكل ({counts.all || 0})</SelectItem>
            {(Object.keys(typeConfig) as TimelineEventType[]).map(t => (
              <SelectItem key={t} value={t} className="font-cairo text-xs">{typeConfig[t].label} ({counts[t] || 0})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortDir} onValueChange={v => setSortDir(v as any)}>
          <SelectTrigger className="font-cairo h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="desc" className="font-cairo text-xs">الأحدث أولاً</SelectItem>
            <SelectItem value="asc" className="font-cairo text-xs">الأقدم أولاً</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={refetch} className="font-cairo gap-1 text-xs h-8">
          <RefreshCw className="h-3.5 w-3.5" /> تحديث
        </Button>
        <span className="font-cairo text-[11px] text-muted-foreground mr-auto">عرض {Math.min(visible, filtered.length)} من {filtered.length}</span>
      </div>

      {/* Timeline */}
      <div className="relative pr-4 border-r-2 border-border space-y-3">
        {filtered.slice(0, visible).map(ev => <TimelineRow key={ev.id} event={ev} />)}
      </div>

      {visible < filtered.length && (
        <div className="text-center pt-2">
          <Button variant="outline" size="sm" className="font-cairo" onClick={() => setVisible(v => v + pageSize)}>
            عرض المزيد ({filtered.length - visible})
          </Button>
        </div>
      )}
    </div>
  );
};

const TimelineRow = ({ event }: { event: TimelineEvent }) => {
  const cfg = typeConfig[event.type];
  const Icon = cfg.icon;
  const dateStr = new Date(event.date).toLocaleString('ar-YE', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <div className="relative">
      {/* Dot */}
      <div className={`absolute -right-[1.4rem] top-3 h-3 w-3 rounded-full ${cfg.color.replace('text-', 'bg-')} ring-2 ring-background`} />
      <div className={`rounded-xl border ${cfg.bg} p-3`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
            <div className="min-w-0">
              <p className="font-cairo text-sm font-semibold text-foreground">{event.title}</p>
              {event.subtitle && <p className="font-cairo text-xs text-muted-foreground truncate">{event.subtitle}</p>}
              {event.doctorName && <p className="font-cairo text-[11px] text-muted-foreground mt-0.5">د. {event.doctorName}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className="font-cairo text-[10px] bg-background">{cfg.label}</Badge>
            {event.status && <span className="font-cairo text-[10px] text-muted-foreground">{event.status}</span>}
          </div>
        </div>
        <p className="font-cairo text-[10px] text-muted-foreground mt-2">{dateStr}</p>
      </div>
    </div>
  );
};

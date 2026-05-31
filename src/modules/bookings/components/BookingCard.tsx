import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar, Clock, Stethoscope, User, Lock, Loader2,
  CheckCircle2, PlayCircle, CheckCheck, CalendarClock,
  FileText, History, XCircle, Edit, Trash2, UserX, MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  STATUS_LABELS, STATUS_COLORS, getTimeStatus, isBookingPast,
  canActOnBooking, canRunWorkflowAction, type BookingStatus,
} from '@/modules/bookings';
import { BookingAuditLog } from '@/modules/bookings/components/BookingAuditLog';

export interface BookingRow {
  id: string;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  status: BookingStatus;
  booking_type: string | null;
  final_price: number | null;
  notes: string | null;
  is_free_case: boolean | null;
  patient_id: string;
  doctor_id: string;
  family_member_id: string | null;
  rescheduled_from?: any;
  patient_name?: string;
  doctor_name?: string;
  family_name?: string;
}

const bookingTypeLabels: Record<string, string> = {
  clinic: '🏥 عيادة', hospital: '🏨 مستشفى', home: '🏠 منزلي',
  video: '📹 فيديو', voice: '📞 صوتي', lab: '🧪 مختبر',
};
const TIME_LABELS = { upcoming: 'قادم', today: 'اليوم', past: 'منتهٍ' } as const;
const TIME_COLORS = {
  upcoming: 'bg-sky-50 text-sky-700 border-sky-200',
  today: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  past: 'bg-slate-100 text-slate-600 border-slate-200',
} as const;

interface Props {
  booking: BookingRow;
  isAdmin: boolean;
  isStaff: boolean;
  canManage: boolean;
  updating: boolean;
  auditOpen: boolean;
  onToggleAudit: () => void;
  onChangeStatus: (status: BookingStatus) => void;
  onStartConsultation: () => void;
  onOpenPatient: () => void;
  onReschedule: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function BookingCard({
  booking, isAdmin, isStaff, canManage, updating, auditOpen,
  onToggleAudit, onChangeStatus, onStartConsultation, onOpenPatient, onReschedule, onEdit, onDelete,
}: Props) {
  const statusLabel = STATUS_LABELS[booking.status] || booking.status;
  const statusColor = STATUS_COLORS[booking.status] || 'bg-muted';
  const timeStatus = getTimeStatus(booking.booking_date, booking.start_time);
  const past = isBookingPast(booking.booking_date, booking.start_time);
  const gate = canActOnBooking(booking.booking_date, booking.start_time, booking.status, isAdmin);
  const wf = canRunWorkflowAction(booking.booking_date, booking.start_time, booking.status);
  const displayName = booking.family_name || booking.patient_name;
  const hasReschedule = Array.isArray(booking.rescheduled_from) && booking.rescheduled_from.length > 0;

  const primary: { label: string; icon: any; onClick: () => void; tone: 'primary' | 'success' | 'neutral' } | null =
    !wf.allowed ? null
    : booking.status === 'pending' ? { label: 'تأكيد الحجز', icon: CheckCircle2, onClick: () => onChangeStatus('confirmed'), tone: 'success' }
    : (booking.status === 'confirmed' || booking.status === 'rescheduled') && canManage
        ? { label: 'بدء الجلسة', icon: PlayCircle, onClick: onStartConsultation, tone: 'primary' }
    : booking.status === 'in_progress'
        ? { label: 'إكمال الجلسة', icon: CheckCheck, onClick: () => onChangeStatus('completed'), tone: 'success' }
    : null;

  const primaryClass =
    primary?.tone === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
    : primary?.tone === 'primary' ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
    : 'bg-secondary text-secondary-foreground';

  return (
    <div className={`rounded-xl border overflow-hidden transition-shadow ${past ? 'border-dashed border-muted bg-muted/20' : 'border-border bg-card hover:shadow-sm'}`}>
      {past && !isAdmin && (
        <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-3 py-2 text-amber-900">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <p className="font-cairo text-xs">هذا الحجز في الماضي ولا يمكن تعديله — يلزم صلاحية المسؤول.</p>
        </div>
      )}

      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${past ? 'bg-muted' : 'bg-primary/10'}`}>
            <User className={`h-5 w-5 ${past ? 'text-muted-foreground' : 'text-primary'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-cairo font-bold text-sm text-foreground truncate">{displayName}</span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-cairo font-semibold ${statusColor}`}>
                {statusLabel}
              </span>
              <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-cairo ${TIME_COLORS[timeStatus]}`}>
                {TIME_LABELS[timeStatus]}
              </span>
            </div>
            {booking.family_name && (
              <p className="font-cairo text-[11px] text-muted-foreground mt-0.5 truncate">نيابة عن: {booking.patient_name}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-cairo w-52">
              <DropdownMenuItem onClick={onOpenPatient}>
                <FileText className="h-4 w-4 ml-2" /> فتح ملف المريض
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleAudit}>
                <History className="h-4 w-4 ml-2" /> {auditOpen ? 'إخفاء السجل الزمني' : 'عرض السجل الزمني'}
              </DropdownMenuItem>
              {gate.allowed && canManage && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                <DropdownMenuItem onClick={onReschedule}>
                  <CalendarClock className="h-4 w-4 ml-2" /> إعادة جدولة
                </DropdownMenuItem>
              )}
              {gate.allowed && (booking.status === 'confirmed' || booking.status === 'rescheduled') && (
                <DropdownMenuItem onClick={() => onChangeStatus('no_show')}>
                  <UserX className="h-4 w-4 ml-2" /> لم يحضر
                </DropdownMenuItem>
              )}
              {gate.allowed && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                <DropdownMenuItem onClick={() => onChangeStatus('cancelled')} className="text-destructive focus:text-destructive">
                  <XCircle className="h-4 w-4 ml-2" /> إلغاء الحجز
                </DropdownMenuItem>
              )}
              {canManage && gate.allowed && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 ml-2" /> تعديل البيانات
                  </DropdownMenuItem>
                </>
              )}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 ml-2" /> حذف الحجز
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-cairo">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span dir="ltr">{booking.booking_date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span dir="ltr">{booking.start_time || '—'}</span>
          </div>
          {(isAdmin || isStaff) && (
            <div className="flex items-center gap-1.5 text-muted-foreground col-span-2 truncate">
              <Stethoscope className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">د. {booking.doctor_name}</span>
            </div>
          )}
          {booking.booking_type && (
            <span className="text-muted-foreground">{bookingTypeLabels[booking.booking_type] || booking.booking_type}</span>
          )}
          {booking.final_price ? (
            <span className="text-primary font-bold text-end">{booking.final_price.toLocaleString()} ر.ي</span>
          ) : null}
        </div>

        {(hasReschedule || booking.is_free_case) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hasReschedule && (
              <Badge variant="outline" className="font-cairo text-[10px] border-purple-300 text-purple-700 bg-purple-50">
                <CalendarClock className="h-2.5 w-2.5 ml-0.5" /> أُعيد جدولته
              </Badge>
            )}
            {booking.is_free_case && (
              <Badge variant="outline" className="font-cairo text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">
                حالة مجانية
              </Badge>
            )}
          </div>
        )}

        {booking.notes && (
          <p className="font-cairo text-xs text-muted-foreground mt-2 line-clamp-2 bg-muted/30 rounded-md px-2 py-1.5">{booking.notes}</p>
        )}

        {(primary || past || (!wf.allowed && !past)) && (
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              {past ? (
                <span className="font-cairo text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" /> هذا الحجز في الماضي
                </span>
              ) : !wf.allowed ? (
                <span className="font-cairo text-[11px] text-muted-foreground truncate inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" /> {wf.reason}
                </span>
              ) : null}
            </div>
            {primary && (
              <Button onClick={primary.onClick} disabled={updating} size="sm" className={`font-cairo h-9 px-4 gap-1.5 rounded-full shrink-0 ${primaryClass}`}>
                {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <primary.icon className="h-3.5 w-3.5" />}
                {primary.label}
              </Button>
            )}
          </div>
        )}
      </div>

      {auditOpen && (
        <div className="px-3 sm:px-4 py-3 border-t border-border bg-muted/20">
          <BookingAuditLog bookingId={booking.id} />
        </div>
      )}
    </div>
  );
}
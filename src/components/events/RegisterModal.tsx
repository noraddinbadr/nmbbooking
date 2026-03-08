import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useHolds } from '@/hooks/useHolds';
import HoldCountdown from './HoldCountdown';
import type { EventSchedule, MedicalCamp } from '@/data/eventsTypes';
import { serviceLabels } from '@/data/constants';
import { CheckCircle, Loader2 } from 'lucide-react';

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  camp: MedicalCamp;
  schedule: EventSchedule;
}

const RegisterModal = ({ open, onClose, camp, schedule }: RegisterModalProps) => {
  const [bookingFor, setBookingFor] = useState<'self' | 'other'>('self');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'male' | 'female'>('male');
  const [requestSponsorship, setRequestSponsorship] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const { hold, loading, error, createHold, confirmHold } = useHolds();

  const handleCreateHold = async () => {
    try {
      await createHold({
        campId: camp.id,
        scheduleId: schedule.id,
        bookedBy: 'current-user', // TODO: from auth
        patientInfo: bookingFor === 'other' ? {
          name: patientName,
          phone: patientPhone,
          age: parseInt(patientAge) || 0,
          gender: patientGender,
        } : undefined,
      });
    } catch {
      // error handled by hook
    }
  };

  const handleConfirm = async () => {
    if (!hold) return;
    const success = await confirmHold(hold.registrationId, hold.holdToken);
    if (success) setConfirmed(true);
  };

  const handleClose = () => {
    setConfirmed(false);
    setBookingFor('self');
    setPatientName('');
    setPatientPhone('');
    setPatientAge('');
    setRequestSponsorship(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md font-cairo" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo text-lg">تسجيل في الحدث</DialogTitle>
          <DialogDescription className="font-cairo text-sm">
            {camp.titleAr} — {serviceLabels[schedule.serviceType] || schedule.serviceType}
            <br />
            {schedule.scheduleDate} | {schedule.startTime} - {schedule.endTime}
          </DialogDescription>
        </DialogHeader>

        {confirmed ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h3 className="font-cairo font-bold text-lg text-foreground">تم تأكيد التسجيل بنجاح!</h3>
            <p className="text-sm text-muted-foreground font-cairo">ستصلك رسالة تأكيد قريباً</p>
            <Button onClick={handleClose} className="font-cairo mt-2">إغلاق</Button>
          </div>
        ) : hold ? (
          <div className="space-y-4">
            <HoldCountdown expiresAt={hold.holdExpiresAt} onExpired={() => {}} />
            <div className="bg-secondary rounded-lg p-3 text-sm font-cairo space-y-1">
              <p><span className="text-muted-foreground">رقم التسجيل:</span> {hold.registrationId}</p>
            </div>
            {error && <p className="text-destructive text-sm font-cairo">{error}</p>}
            <Button onClick={handleConfirm} disabled={loading} className="w-full font-cairo">
              {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              تأكيد الحجز
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Booking for whom */}
            <div className="space-y-2">
              <Label className="font-cairo">التسجيل لـ</Label>
              <RadioGroup
                value={bookingFor}
                onValueChange={(v) => setBookingFor(v as 'self' | 'other')}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="self" id="self" />
                  <Label htmlFor="self" className="font-cairo cursor-pointer">نفسي</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-cairo cursor-pointer">لشخص آخر</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Patient info for "other" */}
            {bookingFor === 'other' && (
              <div className="space-y-3 border border-border rounded-lg p-3">
                <div className="space-y-1">
                  <Label className="font-cairo text-xs">اسم المريض</Label>
                  <Input
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="الاسم الكامل"
                    className="font-cairo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-cairo text-xs">رقم الهاتف</Label>
                    <Input
                      value={patientPhone}
                      onChange={e => setPatientPhone(e.target.value)}
                      placeholder="777123456"
                      className="font-cairo"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-cairo text-xs">العمر</Label>
                    <Input
                      value={patientAge}
                      onChange={e => setPatientAge(e.target.value)}
                      placeholder="35"
                      type="number"
                      className="font-cairo"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="font-cairo text-xs">الجنس</Label>
                  <RadioGroup
                    value={patientGender}
                    onValueChange={(v) => setPatientGender(v as 'male' | 'female')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="font-cairo cursor-pointer text-xs">ذكر</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="font-cairo cursor-pointer text-xs">أنثى</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Sponsorship request */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="sponsor"
                checked={requestSponsorship}
                onCheckedChange={(v) => setRequestSponsorship(v === true)}
              />
              <Label htmlFor="sponsor" className="font-cairo text-sm cursor-pointer">
                طلب رعاية مالية للعلاج
              </Label>
            </div>

            {error && <p className="text-destructive text-sm font-cairo">{error}</p>}

            <Button
              onClick={handleCreateHold}
              disabled={loading || (bookingFor === 'other' && !patientName)}
              className="w-full font-cairo"
            >
              {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حجز مؤقت (5 دقائق)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;

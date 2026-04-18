import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';

interface Props {
  bookingId: string;
  patientName?: string;
  bookingDate?: string;
  startTime?: string | null;
}

export const BookingQRButton = ({ bookingId, patientName, bookingDate, startTime }: Props) => {
  const [open, setOpen] = useState(false);
  // QR encodes a deeplink the kiosk scanner can parse
  const payload = `sehtak://checkin/booking/${bookingId}`;

  return (
    <>
      <Button variant="outline" size="sm" className="font-cairo gap-1.5 text-xs h-8" onClick={() => setOpen(true)}>
        <QrCode className="h-3.5 w-3.5" /> رمز الحضور
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">رمز الحضور (QR)</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="bg-white p-3 rounded-lg">
              <QRCodeCanvas value={payload} size={200} level="M" includeMargin={false} />
            </div>
            {patientName && <p className="font-cairo text-sm font-semibold text-foreground">{patientName}</p>}
            <p className="font-cairo text-xs text-muted-foreground text-center">
              {bookingDate}{startTime ? ` • ${startTime}` : ''}
            </p>
            <p className="font-cairo text-[11px] text-muted-foreground text-center">
              امسح هذا الرمز عند الكاونتر لتسجيل الحضور
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

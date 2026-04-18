import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { statusLabels } from '@/data/constants';
import { Search, CheckCircle, UserCheck, Loader2, ScanLine, Calendar as CalIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Html5Qrcode } from 'html5-qrcode';

interface RegistrationResult {
  id: string;
  case_code: string;
  status: string | null;
  patient_info: any;
}

interface BookingResult {
  id: string;
  booking_date: string;
  start_time: string | null;
  status: string | null;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
}

const KioskCheckin = () => {
  const [search, setSearch] = useState('');
  const [foundReg, setFoundReg] = useState<RegistrationResult | null>(null);
  const [foundBooking, setFoundBooking] = useState<BookingResult | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'kiosk-qr-reader';
  const { toast } = useToast();

  const reset = () => { setFoundReg(null); setFoundBooking(null); setCheckedIn(false); };

  // Stop scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const lookupBooking = async (bookingId: string) => {
    setLoading(true);
    reset();
    const { data: bk } = await supabase
      .from('bookings')
      .select('id, booking_date, start_time, status, patient_id, doctor_id')
      .eq('id', bookingId)
      .maybeSingle();

    if (!bk) {
      setLoading(false);
      toast({ title: 'لم يتم العثور على الحجز', variant: 'destructive' });
      return;
    }
    const [{ data: patient }, { data: doctor }] = await Promise.all([
      supabase.from('profiles').select('full_name_ar, full_name').eq('id', bk.patient_id).maybeSingle(),
      supabase.from('doctors').select('name_ar').eq('id', bk.doctor_id).maybeSingle(),
    ]);
    setFoundBooking({
      id: bk.id,
      booking_date: bk.booking_date,
      start_time: bk.start_time,
      status: bk.status,
      patient_id: bk.patient_id,
      patient_name: patient?.full_name_ar || patient?.full_name || 'مريض',
      doctor_name: doctor?.name_ar || 'طبيب',
    });
    setLoading(false);
  };

  const handleSearch = async () => {
    const q = search.trim();
    if (!q) return;

    // QR deeplink format: sehtak://checkin/booking/<uuid>
    const qrMatch = q.match(/checkin\/booking\/([0-9a-f-]{36})/i);
    if (qrMatch) {
      await lookupBooking(qrMatch[1]);
      return;
    }
    // Pure UUID
    if (/^[0-9a-f-]{36}$/i.test(q)) {
      await lookupBooking(q);
      return;
    }

    // Fallback: event registration lookup
    setLoading(true);
    reset();
    const { data } = await supabase
      .from('registrations')
      .select('id, case_code, status, patient_info')
      .or(`case_code.ilike.${q},patient_info->>phone.eq.${q}`)
      .limit(1)
      .maybeSingle();

    setLoading(false);
    if (data) setFoundReg(data as RegistrationResult);
    else toast({ title: 'لم يتم العثور على نتائج', variant: 'destructive' });
  };

  const startScanner = async () => {
    setScanning(true);
    reset();
    setTimeout(async () => {
      try {
        const html5Qr = new Html5Qrcode(scannerDivId);
        scannerRef.current = html5Qr;
        await html5Qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText) => {
            await html5Qr.stop().catch(() => {});
            setScanning(false);
            setSearch(decodedText);
            // Auto-process
            const qrMatch = decodedText.match(/checkin\/booking\/([0-9a-f-]{36})/i);
            if (qrMatch) await lookupBooking(qrMatch[1]);
            else if (/^[0-9a-f-]{36}$/i.test(decodedText)) await lookupBooking(decodedText);
          },
          () => {}
        );
      } catch (err: any) {
        setScanning(false);
        toast({ title: 'تعذّر فتح الكاميرا', description: err?.message || 'تأكد من السماح بالوصول للكاميرا', variant: 'destructive' });
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) await scannerRef.current.stop().catch(() => {});
    setScanning(false);
  };

  const handleCheckinReg = async () => {
    if (!foundReg) return;
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
      .eq('id', foundReg.id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setCheckedIn(true);
    toast({ title: '✅ تم تسجيل الحضور بنجاح' });
  };

  const handleCheckinBooking = async () => {
    if (!foundBooking) return;
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', foundBooking.id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setCheckedIn(true);
    toast({ title: '✅ تم تسجيل الحضور للموعد' });
  };

  const patientInfo = foundReg?.patient_info as { name?: string; phone?: string } | null;

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-6 py-6" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-cairo font-bold text-2xl text-foreground">تسجيل الحضور</h1>
          <p className="font-cairo text-sm text-muted-foreground">امسح رمز QR أو ابحث يدويًا</p>
        </div>

        <Tabs defaultValue="qr">
          <TabsList className="font-cairo w-full">
            <TabsTrigger value="qr" className="font-cairo gap-1.5 flex-1"><ScanLine className="h-4 w-4" /> مسح QR</TabsTrigger>
            <TabsTrigger value="manual" className="font-cairo gap-1.5 flex-1"><Search className="h-4 w-4" /> بحث يدوي</TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="mt-4 space-y-3">
            {!scanning ? (
              <Button onClick={startScanner} className="w-full font-cairo gap-2 py-6 text-lg" size="lg">
                <ScanLine className="h-5 w-5" /> ابدأ المسح
              </Button>
            ) : (
              <>
                <div id={scannerDivId} className="w-full rounded-lg overflow-hidden border border-border bg-black" />
                <Button onClick={stopScanner} variant="outline" className="w-full font-cairo">إيقاف المسح</Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <div className="flex gap-2">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="كود الحالة / هاتف / معرف الحجز"
                className="font-cairo text-center"
                autoFocus
              />
              <Button onClick={handleSearch} className="font-cairo gap-1" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} بحث
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Booking result (from QR or UUID search) */}
        {foundBooking && (
          <Card className="animate-fade-in">
            <CardContent className="p-6 space-y-4 text-center">
              <Badge className="text-sm font-cairo" variant={foundBooking.status === 'confirmed' ? 'default' : 'secondary'}>
                <CalIcon className="h-3.5 w-3.5 ml-1" />
                {foundBooking.status === 'confirmed' ? 'حاضر' : 'موعد طبي'}
              </Badge>
              <div className="space-y-1">
                <p className="font-cairo font-bold text-lg text-foreground">{foundBooking.patient_name}</p>
                <p className="font-cairo text-sm text-muted-foreground">د. {foundBooking.doctor_name}</p>
                <p className="font-cairo text-xs text-muted-foreground">
                  {foundBooking.booking_date}{foundBooking.start_time ? ` • ${foundBooking.start_time}` : ''}
                </p>
              </div>
              {checkedIn ? (
                <div className="py-2">
                  <CheckCircle className="h-14 w-14 text-primary mx-auto mb-1" />
                  <p className="font-cairo font-bold text-primary">تم تسجيل الحضور ✓</p>
                </div>
              ) : (
                <Button onClick={handleCheckinBooking} className="w-full font-cairo text-lg py-6" size="lg">
                  <CheckCircle className="h-5 w-5 ml-2" /> تأكيد الحضور
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Event registration result */}
        {foundReg && (
          <Card className="animate-fade-in">
            <CardContent className="p-6 space-y-4 text-center">
              <Badge className="text-sm font-cairo" variant={foundReg.status === 'confirmed' ? 'default' : 'secondary'}>
                {statusLabels[foundReg.status || 'held']}
              </Badge>
              <div className="space-y-2">
                <p className="font-cairo font-bold text-lg text-foreground">{patientInfo?.name || 'مريض'}</p>
                <p className="font-cairo text-sm text-muted-foreground">كود: {foundReg.case_code}</p>
                {patientInfo?.phone && <p className="font-cairo text-sm text-muted-foreground">هاتف: {patientInfo.phone}</p>}
              </div>
              {checkedIn ? (
                <div className="py-4">
                  <CheckCircle className="h-16 w-16 text-primary mx-auto mb-2" />
                  <p className="font-cairo font-bold text-primary text-lg">تم تسجيل الحضور ✓</p>
                </div>
              ) : foundReg.status === 'confirmed' ? (
                <Button onClick={handleCheckinReg} className="w-full font-cairo text-lg py-6" size="lg">
                  <CheckCircle className="h-5 w-5 ml-2" /> تأكيد الحضور
                </Button>
              ) : (
                <p className="font-cairo text-destructive text-sm">
                  لا يمكن تسجيل الحضور — الحالة: {statusLabels[foundReg.status || 'held']}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default KioskCheckin;

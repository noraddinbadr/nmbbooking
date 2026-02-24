import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';

interface ScheduleRow {
  date: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  totalSlots: number;
}

interface SponsorRow {
  name: string;
  tier: 'gold' | 'silver' | 'bronze';
}

interface AdminEventFormProps {
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown>;
}

const AdminEventForm = ({ onSubmit, initialData }: AdminEventFormProps) => {
  const [titleAr, setTitleAr] = useState((initialData?.titleAr as string) || '');
  const [titleEn, setTitleEn] = useState((initialData?.titleEn as string) || '');
  const [descriptionAr, setDescriptionAr] = useState((initialData?.descriptionAr as string) || '');
  const [locationName, setLocationName] = useState((initialData?.locationName as string) || '');
  const [locationCity, setLocationCity] = useState((initialData?.locationCity as string) || '');
  const [startDate, setStartDate] = useState((initialData?.startDate as string) || '');
  const [endDate, setEndDate] = useState((initialData?.endDate as string) || '');
  const [totalCapacity, setTotalCapacity] = useState((initialData?.totalCapacity as number) || 100);
  const [targetFund, setTargetFund] = useState((initialData?.targetFund as number) || 0);

  const [schedules, setSchedules] = useState<ScheduleRow[]>([
    { date: '', startTime: '08:00', endTime: '12:00', serviceType: 'general', totalSlots: 20 },
  ]);
  const [sponsors, setSponsors] = useState<SponsorRow[]>([]);

  const addSchedule = () => {
    setSchedules(prev => [...prev, { date: startDate, startTime: '08:00', endTime: '12:00', serviceType: 'general', totalSlots: 20 }]);
  };

  const removeSchedule = (i: number) => {
    setSchedules(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateSchedule = (i: number, field: keyof ScheduleRow, value: string | number) => {
    setSchedules(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const addSponsor = () => {
    setSponsors(prev => [...prev, { name: '', tier: 'silver' }]);
  };

  const removeSponsor = (i: number) => {
    setSponsors(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = () => {
    onSubmit({
      titleAr, titleEn, descriptionAr, locationName, locationCity,
      startDate, endDate, totalCapacity, targetFund, schedules, sponsors,
    });
  };

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">
      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle className="font-cairo text-base">معلومات الحدث</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="font-cairo text-xs">العنوان (عربي) *</Label>
              <Input value={titleAr} onChange={e => setTitleAr(e.target.value)} className="font-cairo" />
            </div>
            <div className="space-y-1">
              <Label className="font-cairo text-xs">Title (English)</Label>
              <Input value={titleEn} onChange={e => setTitleEn(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="font-cairo text-xs">الوصف</Label>
            <Textarea value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} className="font-cairo" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="font-cairo text-xs">الموقع</Label>
              <Input value={locationName} onChange={e => setLocationName(e.target.value)} className="font-cairo" placeholder="اسم المكان" />
            </div>
            <div className="space-y-1">
              <Label className="font-cairo text-xs">المدينة</Label>
              <Input value={locationCity} onChange={e => setLocationCity(e.target.value)} className="font-cairo" placeholder="صنعاء" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="font-cairo text-xs">تاريخ البدء</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="font-cairo text-xs">تاريخ الانتهاء</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="font-cairo text-xs">السعة الإجمالية</Label>
              <Input type="number" value={totalCapacity} onChange={e => setTotalCapacity(+e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="font-cairo text-xs">هدف التمويل (ر.ي)</Label>
              <Input type="number" value={targetFund} onChange={e => setTargetFund(+e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-cairo text-base">الجدول الزمني</CardTitle>
            <Button variant="outline" size="sm" onClick={addSchedule} className="font-cairo gap-1">
              <Plus className="h-3 w-3" /> إضافة فترة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {schedules.map((s, i) => (
            <div key={i} className="flex items-end gap-2 p-3 rounded-lg bg-secondary/50">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2">
                <Input type="date" value={s.date} onChange={e => updateSchedule(i, 'date', e.target.value)} className="text-xs" />
                <Input type="time" value={s.startTime} onChange={e => updateSchedule(i, 'startTime', e.target.value)} className="text-xs" />
                <Input type="time" value={s.endTime} onChange={e => updateSchedule(i, 'endTime', e.target.value)} className="text-xs" />
                <Input value={s.serviceType} onChange={e => updateSchedule(i, 'serviceType', e.target.value)} className="text-xs font-cairo" placeholder="نوع الخدمة" />
                <Input type="number" value={s.totalSlots} onChange={e => updateSchedule(i, 'totalSlots', +e.target.value)} className="text-xs" placeholder="الأماكن" />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSchedule(i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sponsors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-cairo text-base">الرعاة والشركاء</CardTitle>
            <Button variant="outline" size="sm" onClick={addSponsor} className="font-cairo gap-1">
              <Plus className="h-3 w-3" /> إضافة راعي
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sponsors.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={s.name}
                onChange={e => setSponsors(prev => prev.map((sp, idx) => idx === i ? { ...sp, name: e.target.value } : sp))}
                className="font-cairo flex-1"
                placeholder="اسم الراعي"
              />
              <select
                value={s.tier}
                onChange={e => setSponsors(prev => prev.map((sp, idx) => idx === i ? { ...sp, tier: e.target.value as SponsorRow['tier'] } : sp))}
                className="px-2 py-1.5 rounded-md border border-input text-sm bg-background"
              >
                <option value="gold">ذهبي</option>
                <option value="silver">فضي</option>
                <option value="bronze">برونزي</option>
              </select>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSponsor(i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {sponsors.length === 0 && (
            <p className="text-center text-muted-foreground font-cairo text-sm py-4">لا يوجد رعاة حالياً</p>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} className="w-full font-cairo" size="lg">
        حفظ الحدث
      </Button>
    </div>
  );
};

export default AdminEventForm;

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

interface Props {
  symptoms: string;
  examination: string;
  diagnosis: string;
  notes: string;
  onChange: (patch: Partial<{ symptoms: string; examination: string; diagnosis: string; notes: string }>) => void;
}

export function ConsultationNotesCard({ symptoms, examination, diagnosis, notes, onChange }: Props) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="font-cairo text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> التشخيص والملاحظات
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="font-cairo text-xs">الأعراض</Label>
            <Textarea value={symptoms} onChange={(e) => onChange({ symptoms: e.target.value })} className="font-cairo mt-1 text-sm min-h-[80px]" placeholder="ما يشتكي منه المريض..." />
          </div>
          <div>
            <Label className="font-cairo text-xs">الفحص السريري</Label>
            <Textarea value={examination} onChange={(e) => onChange({ examination: e.target.value })} className="font-cairo mt-1 text-sm min-h-[80px]" placeholder="نتائج الفحص..." />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="font-cairo text-xs">التشخيص</Label>
            <Input value={diagnosis} onChange={(e) => onChange({ diagnosis: e.target.value })} className="font-cairo mt-1 text-sm" placeholder="التشخيص النهائي" />
          </div>
          <div>
            <Label className="font-cairo text-xs">ملاحظات إضافية</Label>
            <Input value={notes} onChange={(e) => onChange({ notes: e.target.value })} className="font-cairo mt-1 text-sm" placeholder="ملاحظات..." />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
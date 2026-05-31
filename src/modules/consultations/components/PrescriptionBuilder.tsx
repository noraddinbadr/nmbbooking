import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Printer, Send, X } from 'lucide-react';

export interface MedicineLine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Props {
  medicines: MedicineLine[];
  onChange: (medicines: MedicineLine[]) => void;
}

const empty: MedicineLine = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };

export function PrescriptionBuilder({ medicines, onChange }: Props) {
  const update = (idx: number, patch: Partial<MedicineLine>) => {
    const next = [...medicines];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  return (
    <div className="space-y-2 mt-2">
      {medicines.map((med, i) => (
        <div key={i} className="p-3 rounded-lg bg-muted/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-bold text-foreground">الدواء {i + 1}</span>
            {medicines.length > 1 && (
              <button onClick={() => onChange(medicines.filter((_, x) => x !== i))} className="text-destructive hover:text-destructive/80">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Input placeholder="اسم الدواء" className="font-cairo text-sm" value={med.name} onChange={(e) => update(i, { name: e.target.value })} />
            <Input placeholder="الجرعة" className="font-cairo text-sm" value={med.dosage} onChange={(e) => update(i, { dosage: e.target.value })} />
            <Input placeholder="التكرار" className="font-cairo text-sm" value={med.frequency} onChange={(e) => update(i, { frequency: e.target.value })} />
            <Input placeholder="المدة" className="font-cairo text-sm" value={med.duration} onChange={(e) => update(i, { duration: e.target.value })} />
          </div>
          <Input placeholder="تعليمات الاستخدام" className="font-cairo text-sm" value={med.instructions} onChange={(e) => update(i, { instructions: e.target.value })} />
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onChange([...medicines, { ...empty }])} className="font-cairo text-xs gap-1">
          <Plus className="h-3 w-3" /> دواء آخر
        </Button>
        <Button size="sm" className="font-cairo text-xs gap-1"><Printer className="h-3 w-3" /> طباعة الوصفة</Button>
        <Button size="sm" variant="secondary" className="font-cairo text-xs gap-1"><Send className="h-3 w-3" /> إرسال للصيدلية</Button>
      </div>
    </div>
  );
}
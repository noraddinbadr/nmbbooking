import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Send, Loader2, Save } from 'lucide-react';
import { useCatalogCategories, useCreateProcurementRequest } from '@/hooks/useProcurement';

interface Props { open: boolean; onClose: () => void }

interface ItemRow { name_ar: string; qty: number; unit: string; brand_preferred: string; category_id: string | null; notes: string }

const newItem = (): ItemRow => ({ name_ar: '', qty: 1, unit: 'قطعة', brand_preferred: '', category_id: null, notes: '' });

export default function CreateRFQModal({ open, onClose }: Props) {
  const { data: categories = [] } = useCatalogCategories();
  const create = useCreateProcurementRequest();

  const [form, setForm] = useState({
    title_ar: '',
    description_ar: '',
    delivery_city: '',
    budget_max: '' as string,
    closes_at: '',
    award_mode: 'manual' as 'manual' | 'auto_suggest' | 'auto_award',
    allow_partial_bids: true,
    category_kind: 'mixed',
  });
  const [items, setItems] = useState<ItemRow[]>([newItem()]);

  const handleSubmit = async (publish: boolean) => {
    if (!form.title_ar.trim()) return;
    if (!form.closes_at) return;
    if (items.some(i => !i.name_ar.trim() || i.qty <= 0)) return;

    await create.mutateAsync({
      title_ar: form.title_ar.trim(),
      description_ar: form.description_ar.trim() || undefined,
      delivery_city: form.delivery_city.trim() || undefined,
      budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
      closes_at: new Date(form.closes_at).toISOString(),
      award_mode: form.award_mode,
      allow_partial_bids: form.allow_partial_bids,
      category_kind: form.category_kind,
      items: items.map(i => ({
        name_ar: i.name_ar.trim(),
        qty: i.qty,
        unit: i.unit,
        brand_preferred: i.brand_preferred || undefined,
        category_id: i.category_id,
        notes: i.notes || undefined,
      })),
      publish,
    });
    onClose();
    setForm({ title_ar: '', description_ar: '', delivery_city: '', budget_max: '', closes_at: '', award_mode: 'manual', allow_partial_bids: true, category_kind: 'mixed' });
    setItems([newItem()]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo">طلب شراء جديد (RFQ)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 font-cairo">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2 space-y-1">
              <Label>عنوان الطلب *</Label>
              <Input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} placeholder="مثال: 100 علبة قفازات + 50 ماسك" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>الوصف التفصيلي</Label>
              <Textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>مدينة التسليم</Label>
              <Input value={form.delivery_city} onChange={e => setForm(f => ({ ...f, delivery_city: e.target.value }))} placeholder="صنعاء" />
            </div>
            <div className="space-y-1">
              <Label>الميزانية القصوى (ر.ي) — اختياري</Label>
              <Input type="number" value={form.budget_max} onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))} dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>تاريخ ووقت إغلاق المزاد *</Label>
              <Input type="datetime-local" value={form.closes_at} onChange={e => setForm(f => ({ ...f, closes_at: e.target.value }))} dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>نمط الترسية</Label>
              <Select value={form.award_mode} onValueChange={v => setForm(f => ({ ...f, award_mode: v as 'manual' | 'auto_suggest' | 'auto_award' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">يدوي — أنا أختار</SelectItem>
                  <SelectItem value="auto_suggest">النظام يقترح + أنا أوافق</SelectItem>
                  <SelectItem value="auto_award">تلقائي بالكامل عند الإغلاق</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>السماح بعروض جزئية</Label>
                <p className="text-xs text-muted-foreground">المزود يستطيع تغطية بعض الأصناف فقط</p>
              </div>
              <Switch checked={form.allow_partial_bids} onCheckedChange={v => setForm(f => ({ ...f, allow_partial_bids: v }))} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base">الأصناف المطلوبة</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => setItems(p => [...p, newItem()])} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> إضافة صنف
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                  <div className="grid md:grid-cols-12 gap-2">
                    <Input className="md:col-span-4" placeholder="اسم الصنف *" value={it.name_ar} onChange={e => setItems(p => p.map((x, idx) => idx === i ? { ...x, name_ar: e.target.value } : x))} />
                    <Input className="md:col-span-2" type="number" placeholder="الكمية" value={it.qty} onChange={e => setItems(p => p.map((x, idx) => idx === i ? { ...x, qty: parseFloat(e.target.value) || 0 } : x))} dir="ltr" />
                    <Input className="md:col-span-2" placeholder="الوحدة" value={it.unit} onChange={e => setItems(p => p.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))} />
                    <Select value={it.category_id || 'none'} onValueChange={v => setItems(p => p.map((x, idx) => idx === i ? { ...x, category_id: v === 'none' ? null : v } : x))}>
                      <SelectTrigger className="md:col-span-3"><SelectValue placeholder="الفئة" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— بدون فئة —</SelectItem>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} disabled={items.length === 1} className="md:col-span-1">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input placeholder="ماركة مفضلة (اختياري)" value={it.brand_preferred} onChange={e => setItems(p => p.map((x, idx) => idx === i ? { ...x, brand_preferred: e.target.value } : x))} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => handleSubmit(false)} disabled={create.isPending} className="gap-2 flex-1">
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ كمسودة
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={create.isPending} className="gap-2 flex-1">
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} نشر فوراً
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
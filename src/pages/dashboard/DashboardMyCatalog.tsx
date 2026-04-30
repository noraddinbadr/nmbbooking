import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Package, Loader2 } from 'lucide-react';
import { useMyCatalogItems, useCatalogCategories } from '@/hooks/useProcurement';
import type { ProviderCatalogItem } from '@/data/procurementTypes';

export default function DashboardMyCatalog() {
  const { items, isLoading, upsertItem, deleteItem } = useMyCatalogItems();
  const { data: categories = [] } = useCatalogCategories();
  const [editing, setEditing] = useState<Partial<ProviderCatalogItem> | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-4 font-cairo" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" /> كتالوج خدماتي وأصنافي
            </h1>
            <p className="text-sm text-muted-foreground mt-1">سجّل ما تقدمه — النظام يُشعرك تلقائياً عند ظهور طلب شراء يطابقها</p>
          </div>
          <Button onClick={() => setEditing({ name_ar: '', default_price: 0, lead_time_days: 1, is_active: true, currency: 'YER', tags: [] })} className="gap-2">
            <Plus className="h-4 w-4" /> إضافة صنف
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-bold">كتالوجك فارغ</p>
            <p className="text-sm text-muted-foreground mt-1">أضف الأصناف والخدمات التي تقدمها لتصلك طلبات شراء مطابقة</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(it => {
              const cat = categories.find(c => c.id === it.category_id);
              return (
                <Card key={it.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold">{it.name_ar}</h3>
                    <Badge variant={it.is_active ? 'default' : 'outline'}>{it.is_active ? 'نشط' : 'غير نشط'}</Badge>
                  </div>
                  {cat && <p className="text-xs text-muted-foreground">{cat.name_ar}</p>}
                  {it.brand && <p className="text-xs">الماركة: {it.brand}</p>}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <span className="text-primary font-bold">{Number(it.default_price).toLocaleString()} {it.currency}</span>
                    <span className="text-xs text-muted-foreground">توريد {it.lead_time_days} يوم</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setEditing(it)}><Edit2 className="h-3 w-3" /> تعديل</Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm('حذف هذا الصنف؟')) deleteItem.mutate(it.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle className="font-cairo">{editing?.id ? 'تعديل صنف' : 'صنف جديد'}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3 font-cairo">
                <div className="space-y-1">
                  <Label>اسم الصنف *</Label>
                  <Input value={editing.name_ar || ''} onChange={e => setEditing(p => ({ ...p, name_ar: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>الفئة</Label>
                  <Select value={editing.category_id || 'none'} onValueChange={v => setEditing(p => ({ ...p, category_id: v === 'none' ? null : v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— بدون —</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>السعر</Label>
                    <Input type="number" value={editing.default_price ?? 0} onChange={e => setEditing(p => ({ ...p, default_price: parseFloat(e.target.value) || 0 }))} dir="ltr" />
                  </div>
                  <div className="space-y-1">
                    <Label>الوحدة</Label>
                    <Input value={editing.unit || ''} onChange={e => setEditing(p => ({ ...p, unit: e.target.value }))} placeholder="قطعة" />
                  </div>
                  <div className="space-y-1">
                    <Label>الماركة</Label>
                    <Input value={editing.brand || ''} onChange={e => setEditing(p => ({ ...p, brand: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>وقت التوريد (أيام)</Label>
                    <Input type="number" value={editing.lead_time_days ?? 1} onChange={e => setEditing(p => ({ ...p, lead_time_days: parseInt(e.target.value) || 0 }))} dir="ltr" />
                  </div>
                </div>
                <Button onClick={async () => { await upsertItem.mutateAsync(editing); setEditing(null); }} disabled={upsertItem.isPending} className="w-full gap-2">
                  {upsertItem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} حفظ
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
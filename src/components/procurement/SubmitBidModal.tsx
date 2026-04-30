import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Send, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useSubmitBid, useMyCatalogItems } from '@/hooks/useProcurement';
import type { ProcurementRequest } from '@/data/procurementTypes';

interface Props { open: boolean; onClose: () => void; request: ProcurementRequest }

export default function SubmitBidModal({ open, onClose, request }: Props) {
  const submit = useSubmitBid();
  const { items: myCatalog } = useMyCatalogItems();

  const [meta, setMeta] = useState({ delivery_days: 3, warranty_months: 0, payment_terms: '', notes: '', is_anonymous: false });
  const [lines, setLines] = useState(() =>
    (request.items || []).map(it => ({
      request_item_id: it.id,
      name_ar: it.name_ar,
      qty_requested: it.qty,
      unit_price: 0,
      qty_offered: it.qty,
      brand_offered: '',
      catalog_item_id: null as string | null,
    })),
  );

  const total = useMemo(() => lines.reduce((s, l) => s + (l.unit_price * l.qty_offered || 0), 0), [lines]);
  const coverage = useMemo(() => {
    const total = lines.length || 1;
    const covered = lines.filter(l => l.unit_price > 0 && l.qty_offered > 0).length;
    return Math.round((covered / total) * 100);
  }, [lines]);

  const handleSubmit = async () => {
    const filled = lines.filter(l => l.unit_price > 0 && l.qty_offered > 0);
    if (!filled.length) return;
    if (!request.allow_partial_bids && filled.length < lines.length) return;

    await submit.mutateAsync({
      request_id: request.id,
      delivery_days: meta.delivery_days,
      warranty_months: meta.warranty_months,
      payment_terms: meta.payment_terms || undefined,
      coverage_pct: coverage,
      notes: meta.notes || undefined,
      is_anonymous: meta.is_anonymous,
      lines: filled.map(l => ({
        request_item_id: l.request_item_id,
        unit_price: l.unit_price,
        qty_offered: l.qty_offered,
        brand_offered: l.brand_offered || undefined,
        catalog_item_id: l.catalog_item_id,
      })),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo">تقديم عرض على {request.rfq_code}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 font-cairo">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-bold">{request.title_ar}</p>
            {request.description_ar && <p className="text-muted-foreground mt-1">{request.description_ar}</p>}
            <div className="flex gap-3 mt-2 text-xs">
              <span>الإغلاق: {new Date(request.closes_at).toLocaleString('ar')}</span>
              {request.budget_max && <span>الميزانية: {request.budget_max.toLocaleString()} ر.ي</span>}
              {!request.allow_partial_bids && <span className="text-amber-600">⚠ يجب تغطية كل الأصناف</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base">الأسعار لكل صنف</Label>
            <div className="space-y-2">
              {lines.map((l, i) => {
                const matched = myCatalog.filter(c => c.name_ar.includes(l.name_ar) || l.name_ar.includes(c.name_ar));
                return (
                  <div key={l.request_item_id} className="rounded-lg border p-3 bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-sm">{l.name_ar}</p>
                        <p className="text-xs text-muted-foreground">الكمية المطلوبة: {l.qty_requested}</p>
                      </div>
                      {matched.length > 0 && (
                        <button type="button" onClick={() => setLines(p => p.map((x, idx) => idx === i ? { ...x, unit_price: matched[0].default_price, brand_offered: matched[0].brand || '', catalog_item_id: matched[0].id } : x))} className="text-xs text-primary underline">
                          استخدم من كتالوجي ({matched[0].default_price} ر.ي)
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">سعر الوحدة</Label>
                        <Input type="number" value={l.unit_price || ''} onChange={e => setLines(p => p.map((x, idx) => idx === i ? { ...x, unit_price: parseFloat(e.target.value) || 0 } : x))} dir="ltr" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">الكمية المعروضة</Label>
                        <Input type="number" value={l.qty_offered || ''} onChange={e => setLines(p => p.map((x, idx) => idx === i ? { ...x, qty_offered: parseFloat(e.target.value) || 0 } : x))} dir="ltr" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">الماركة</Label>
                        <Input value={l.brand_offered} onChange={e => setLines(p => p.map((x, idx) => idx === i ? { ...x, brand_offered: e.target.value } : x))} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>مدة التوريد (أيام)</Label>
              <Input type="number" value={meta.delivery_days} onChange={e => setMeta(m => ({ ...m, delivery_days: parseInt(e.target.value) || 0 }))} dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>الضمان (أشهر)</Label>
              <Input type="number" value={meta.warranty_months} onChange={e => setMeta(m => ({ ...m, warranty_months: parseInt(e.target.value) || 0 }))} dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>شروط الدفع</Label>
              <Input value={meta.payment_terms} onChange={e => setMeta(m => ({ ...m, payment_terms: e.target.value }))} placeholder="نقداً عند التسليم" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>ملاحظات إضافية</Label>
            <Textarea value={meta.notes} onChange={e => setMeta(m => ({ ...m, notes: e.target.value }))} rows={2} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
            <div className="space-y-0.5">
              <Label>عرض مجهول الهوية</Label>
              <p className="text-xs text-muted-foreground">لن يرى المعلن اسمك حتى الترسية</p>
            </div>
            <Switch checked={meta.is_anonymous} onCheckedChange={v => setMeta(m => ({ ...m, is_anonymous: v }))} />
          </div>

          <div className="rounded-lg bg-primary/10 p-3 flex justify-between font-bold">
            <span>الإجمالي ({coverage}% تغطية)</span>
            <span className="text-primary">{total.toLocaleString()} ر.ي</span>
          </div>

          <Button onClick={handleSubmit} disabled={submit.isPending || total === 0} className="w-full gap-2">
            {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} تقديم العرض
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Send } from 'lucide-react';
import { useAuctionBids } from '@/hooks/useAuctionBids';
import { useAuth } from '@/contexts/AuthContext';
import type { AuctionBidType } from '@/data/auctionTypes';

interface Props {
  requestId: string;
  onSuccess: () => void;
}

const AuctionBidForm = ({ requestId, onSuccess }: Props) => {
  const { user } = useAuth();
  const { createBid } = useAuctionBids(requestId);

  const [form, setForm] = useState({
    bid_type: 'full_coverage' as AuctionBidType,
    amount: 0,
    notes: '',
    is_anonymous: false,
    coverage_details: {} as Record<string, unknown>,
  });

  const [splitParts, setSplitParts] = useState([
    { service: '', amount: 0 },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const coverageDetails = form.bid_type === 'split'
      ? { parts: splitParts.filter(p => p.service && p.amount > 0) }
      : {};

    await createBid.mutateAsync({
      request_id: requestId,
      bidder_id: user.id,
      bid_type: form.bid_type,
      amount: form.bid_type === 'split'
        ? splitParts.reduce((sum, p) => sum + p.amount, 0)
        : form.amount,
      notes: form.notes,
      is_anonymous: form.is_anonymous,
      coverage_details: coverageDetails,
    } as any);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-cairo">
      <div className="space-y-2">
        <Label>نوع العرض</Label>
        <Select
          value={form.bid_type}
          onValueChange={v => setForm(f => ({ ...f, bid_type: v as AuctionBidType }))}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full_coverage">تغطية كاملة (تبرع كامل)</SelectItem>
            <SelectItem value="partial">تغطية جزئية</SelectItem>
            <SelectItem value="split">تقسيم الخدمات</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.bid_type !== 'split' ? (
        <div className="space-y-2">
          <Label>المبلغ (ر.ي) {form.bid_type === 'full_coverage' && '— اتركه 0 للتبرع الكامل'}</Label>
          <Input
            type="number"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <Label>أجزاء العرض</Label>
          {splitParts.map((part, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="الخدمة (مثل: غرفة العمليات)"
                value={part.service}
                onChange={e => {
                  const updated = [...splitParts];
                  updated[i].service = e.target.value;
                  setSplitParts(updated);
                }}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="المبلغ"
                value={part.amount || ''}
                onChange={e => {
                  const updated = [...splitParts];
                  updated[i].amount = parseFloat(e.target.value) || 0;
                  setSplitParts(updated);
                }}
                className="w-32"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSplitParts(p => [...p, { service: '', amount: 0 }])}
          >
            + إضافة جزء
          </Button>
          <p className="text-xs text-muted-foreground">
            الإجمالي: {splitParts.reduce((s, p) => s + p.amount, 0).toLocaleString()} ر.ي
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>ملاحظات</Label>
        <Textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="تفاصيل إضافية عن العرض..."
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>عرض مجهول الهوية</Label>
          <p className="text-xs text-muted-foreground">إخفاء هويتك عن المريض</p>
        </div>
        <Switch
          checked={form.is_anonymous}
          onCheckedChange={v => setForm(f => ({ ...f, is_anonymous: v }))}
        />
      </div>

      <Separator />

      <Button type="submit" className="w-full gap-2" disabled={createBid.isPending}>
        {createBid.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        تقديم العرض
      </Button>
    </form>
  );
};

export default AuctionBidForm;

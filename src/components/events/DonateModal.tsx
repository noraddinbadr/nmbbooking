import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { MedicalCase } from '@/data/eventsTypes';
import { CheckCircle, Loader2, CreditCard } from 'lucide-react';

interface DonateModalProps {
  open: boolean;
  onClose: () => void;
  medicalCase: MedicalCase;
}

const DonateModal = ({ open, onClose, medicalCase }: DonateModalProps) => {
  const [amount, setAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'wallet' | 'cash'>('bank_transfer');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const remaining = medicalCase.estimatedCost - medicalCase.fundedAmount;

  const handleDonate = async () => {
    setLoading(true);
    // TODO: supabase.from('donations').insert(...)
    await new Promise(r => setTimeout(r, 800));
    setDone(true);
    setLoading(false);
  };

  const handleClose = () => {
    setDone(false);
    setAmount('');
    setDonorName('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md font-cairo" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo text-lg">التبرع للحالة {medicalCase.caseCode}</DialogTitle>
          <DialogDescription className="font-cairo text-sm">
            {medicalCase.diagnosisSummary}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h3 className="font-cairo font-bold text-lg text-foreground">شكراً لتبرعك!</h3>
            <p className="text-sm text-muted-foreground font-cairo">سيتم التحقق من تبرعك قريباً</p>
            <Button onClick={handleClose} className="font-cairo mt-2">إغلاق</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-secondary rounded-lg p-3 font-cairo text-sm space-y-1">
              <p>التكلفة المقدرة: <span className="font-bold">{medicalCase.estimatedCost.toLocaleString()} ر.ي</span></p>
              <p>تم تمويل: <span className="text-primary font-bold">{medicalCase.fundedAmount.toLocaleString()} ر.ي</span></p>
              <p>المتبقي: <span className="text-destructive font-bold">{remaining.toLocaleString()} ر.ي</span></p>
            </div>

            <div className="space-y-1">
              <Label className="font-cairo text-xs">المبلغ (ر.ي)</Label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={remaining.toString()}
                className="font-cairo"
              />
              <div className="flex gap-2 mt-1">
                {[10000, 25000, 50000].map(v => (
                  <button
                    key={v}
                    onClick={() => setAmount(v.toString())}
                    className="px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-cairo hover:bg-muted transition-colors"
                  >
                    {v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-cairo text-xs">اسم المتبرع (اختياري)</Label>
              <Input
                value={donorName}
                onChange={e => setDonorName(e.target.value)}
                placeholder="مجهول"
                className="font-cairo"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-cairo text-xs">طريقة الدفع</Label>
              <RadioGroup value={paymentMethod} onValueChange={v => setPaymentMethod(v as typeof paymentMethod)} className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-md border border-border">
                  <RadioGroupItem value="bank_transfer" id="bank" />
                  <Label htmlFor="bank" className="font-cairo text-sm cursor-pointer flex-1">تحويل بنكي</Label>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md border border-border">
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Label htmlFor="wallet" className="font-cairo text-sm cursor-pointer flex-1">محفظة إلكترونية</Label>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md border border-border">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="font-cairo text-sm cursor-pointer flex-1">نقداً</Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div className="bg-muted rounded-lg p-3 text-xs font-cairo space-y-1">
                <p className="font-bold text-foreground">بيانات التحويل:</p>
                <p>البنك: بنك اليمن والكويت</p>
                <p>رقم الحساب: 1234-5678-9012</p>
                <p>المرجع: {medicalCase.caseCode}</p>
              </div>
            )}

            <Button
              onClick={handleDonate}
              disabled={loading || !amount}
              className="w-full font-cairo"
            >
              {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              تأكيد التبرع
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DonateModal;

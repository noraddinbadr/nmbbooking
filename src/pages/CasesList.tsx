import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mockCases, statusLabels } from '@/data/eventsMockData';
import DonateModal from '@/components/events/DonateModal';
import type { MedicalCase } from '@/data/eventsTypes';
import { Heart, User } from 'lucide-react';

const CasesList = () => {
  const [donateCase, setDonateCase] = useState<MedicalCase | null>(null);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />

      <section className="bg-hero-gradient py-10 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <Heart className="h-8 w-8 text-primary-foreground/80 mx-auto mb-3" />
          <h1 className="font-cairo font-bold text-3xl text-primary-foreground mb-2">حالات تحتاج دعمك</h1>
          <p className="font-cairo text-primary-foreground/80 text-sm">ساهم في علاج حالة مرضية — كل تبرع يُحدث فرقاً</p>
        </div>
      </section>

      <section className="container max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockCases.map(c => {
            const percent = c.estimatedCost > 0 ? Math.round((c.fundedAmount / c.estimatedCost) * 100) : 0;
            const remaining = c.estimatedCost - c.fundedAmount;

            return (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="font-mono text-xs text-muted-foreground">{c.caseCode}</span>
                        {c.patientAge && (
                          <p className="text-[10px] text-muted-foreground font-cairo">
                            {c.patientGender === 'male' ? 'ذكر' : 'أنثى'} — {c.patientAge} سنة
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={c.status === 'open' ? 'bg-destructive/10 text-destructive' : 'bg-amber-50 text-amber-500'}
                      variant="secondary"
                    >
                      {statusLabels[c.status]}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-cairo font-bold text-sm text-foreground mb-1">{c.diagnosisSummary}</h3>
                    <p className="font-cairo text-xs text-muted-foreground">{c.treatmentPlan}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-cairo">
                      <span className="text-muted-foreground">التمويل</span>
                      <span className="text-primary font-bold">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                    <div className="flex justify-between text-[10px] font-cairo text-muted-foreground">
                      <span>تم تمويل {c.fundedAmount.toLocaleString()} ر.ي</span>
                      <span>المتبقي {remaining.toLocaleString()} ر.ي</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setDonateCase(c)}
                    className="w-full font-cairo gap-1"
                    variant={c.status === 'open' ? 'default' : 'outline'}
                  >
                    <Heart className="h-4 w-4" /> تبرع الآن
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {donateCase && (
        <DonateModal
          open={!!donateCase}
          onClose={() => setDonateCase(null)}
          medicalCase={donateCase}
        />
      )}

      <Footer />
    </div>
  );
};

export default CasesList;

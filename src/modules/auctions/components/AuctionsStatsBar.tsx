import { Card, CardContent } from '@/components/ui/card';
import type { AuctionRequest } from '@/data/auctionTypes';

export const AuctionsStatsBar = ({ requests }: { requests: AuctionRequest[] }) => {
  const stats = [
    { label: 'إجمالي الطلبات', value: requests.length, color: 'text-foreground' },
    { label: 'منشورة', value: requests.filter((r) => r.status === 'published').length, color: 'text-green-600' },
    {
      label: 'بانتظار المراجعة',
      value: requests.filter((r) => ['pending_doctor', 'pending_admin', 'pending_patient_consent'].includes(r.status)).length,
      color: 'text-yellow-600',
    },
    {
      label: 'تم الترسية',
      value: requests.filter((r) => r.status === 'awarded' || r.status === 'fulfilled').length,
      color: 'text-purple-600',
    },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-cairo">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
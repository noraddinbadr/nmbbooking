import { MapPin, Calendar, Users, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { MedicalCamp } from '@/data/eventsTypes';
import { serviceLabels, statusLabels } from '@/data/constants';
import { Link } from 'react-router-dom';

interface EventCardProps {
  camp: MedicalCamp;
}

const statusColor: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-primary/10 text-primary',
  active: 'bg-emerald-50 text-emerald-500',
  completed: 'bg-secondary text-secondary-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
};

const EventCard = ({ camp }: EventCardProps) => {
  const slotsUsedPercent = camp.totalCapacity > 0
    ? Math.round(((camp.totalCapacity - 0) / camp.totalCapacity) * 100) // TODO: get actual from schedules
    : 0;
  const fundPercent = camp.targetFund > 0
    ? Math.round((camp.raisedFund / camp.targetFund) * 100)
    : 0;

  return (
    <Link to={`/events/${camp.id}`}>
      <Card className="group hover:shadow-card-hover transition-all duration-300 overflow-hidden cursor-pointer">
        {/* Cover */}
        {camp.coverImage ? (
          <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${camp.coverImage})` }} />
        ) : (
          <div className="h-40 bg-hero-gradient flex items-center justify-center">
            <Heart className="h-12 w-12 text-primary-foreground/40" />
          </div>
        )}

        <CardContent className="p-4 space-y-3" dir="rtl">
          {/* Status + Services */}
          <div className="flex items-center justify-between">
            <Badge className={statusColor[camp.status] || 'bg-muted'} variant="secondary">
              {statusLabels[camp.status] || camp.status}
            </Badge>
            <div className="flex gap-1 flex-wrap justify-end">
              {camp.services.slice(0, 3).map(s => (
                <Badge key={s} variant="outline" className="text-[10px] font-cairo">
                  {serviceLabels[s] || s}
                </Badge>
              ))}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-cairo font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors">
            {camp.titleAr}
          </h3>

          {/* Meta */}
          <div className="space-y-1.5 text-xs text-muted-foreground font-cairo">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{camp.locationName} — {camp.locationCity}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{camp.startDate} → {camp.endDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>السعة: {camp.totalCapacity} مريض</span>
            </div>
          </div>

          {/* Fund progress */}
          {camp.targetFund > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-cairo">
                <span className="text-muted-foreground">التمويل</span>
                <span className="text-primary font-bold">{fundPercent}%</span>
              </div>
              <Progress value={fundPercent} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground font-cairo">
                {camp.raisedFund.toLocaleString()} / {camp.targetFund.toLocaleString()} ر.ي
              </p>
            </div>
          )}

          {/* Sponsors */}
          {camp.sponsors.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {camp.sponsors.map((s, i) => (
                <Badge key={i} variant="secondary" className="text-[9px] font-cairo bg-amber-50 text-amber-500">
                  {s.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default EventCard;

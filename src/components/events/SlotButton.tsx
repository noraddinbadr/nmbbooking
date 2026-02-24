import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, Users } from 'lucide-react';
import type { EventSchedule } from '@/data/eventsTypes';
import { serviceLabels } from '@/data/eventsMockData';

interface SlotButtonProps {
  schedule: EventSchedule;
  isSelected: boolean;
  onSelect: () => void;
}

const SlotButton = ({ schedule, isSelected, onSelect }: SlotButtonProps) => {
  const isFull = schedule.availableSlots <= 0;
  const isLow = schedule.availableSlots > 0 && schedule.availableSlots <= 5;

  return (
    <button
      onClick={onSelect}
      disabled={isFull}
      className={cn(
        'w-full flex items-center justify-between p-3 rounded-lg border transition-all text-right font-cairo',
        isFull && 'opacity-50 cursor-not-allowed bg-muted',
        isSelected && !isFull && 'border-primary bg-primary/5 ring-1 ring-primary',
        !isSelected && !isFull && 'border-border hover:border-primary/50 hover:bg-muted/50'
      )}
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center bg-secondary rounded-md px-2 py-1 min-w-[60px]">
          <Clock className="h-3 w-3 text-muted-foreground mb-0.5" />
          <span className="text-xs font-bold text-foreground">{schedule.startTime}</span>
          <span className="text-[10px] text-muted-foreground">{schedule.endTime}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {serviceLabels[schedule.serviceType] || schedule.serviceType}
          </p>
          {schedule.locationNote && (
            <p className="text-[11px] text-muted-foreground">{schedule.locationNote}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant={isFull ? 'destructive' : isLow ? 'secondary' : 'outline'}
          className={cn(
            'text-[10px]',
            isLow && 'bg-amber-50 text-amber-500 border-amber-500/20'
          )}
        >
          <Users className="h-3 w-3 ml-1" />
          {isFull ? 'مكتمل' : `${schedule.availableSlots} متاح`}
        </Badge>
      </div>
    </button>
  );
};

export default SlotButton;

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EventSchedule } from '@/data/eventsTypes';
import { serviceLabels } from '@/data/eventsMockData';
import SlotButton from './SlotButton';

interface SchedulePickerProps {
  schedules: EventSchedule[];
  onSelect: (schedule: EventSchedule) => void;
  selectedId?: string;
}

const SchedulePicker = ({ schedules, onSelect, selectedId }: SchedulePickerProps) => {
  const dates = [...new Set(schedules.map(s => s.scheduleDate))].sort();
  const [activeDate, setActiveDate] = useState(dates[0] || '');

  const filtered = schedules.filter(s => s.scheduleDate === activeDate);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('ar-YE', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {dates.map(date => (
          <button
            key={date}
            onClick={() => setActiveDate(date)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-cairo font-medium whitespace-nowrap transition-colors',
              activeDate === date
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            )}
          >
            {formatDate(date)}
          </button>
        ))}
      </div>

      {/* Time slots */}
      <div className="grid gap-3">
        {filtered.map(schedule => (
          <SlotButton
            key={schedule.id}
            schedule={schedule}
            isSelected={selectedId === schedule.id}
            onSelect={() => onSelect(schedule)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground font-cairo text-sm py-6">
            لا توجد مواعيد في هذا اليوم
          </p>
        )}
      </div>
    </div>
  );
};

export default SchedulePicker;

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { STATUS_LABELS, type BookingStatus } from '@/modules/bookings';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  timeFilter: string;
  onTimeChange: (v: string) => void;
  dateFilter: string;
  onDateChange: (v: string) => void;
}

export function BookingsFilters({
  search, onSearchChange, statusFilter, onStatusChange,
  timeFilter, onTimeChange, dateFilter, onDateChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث باسم المريض أو الطبيب..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="font-cairo pr-9 h-9 text-sm"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[150px] font-cairo h-9 text-sm"><SelectValue placeholder="الحالة" /></SelectTrigger>
        <SelectContent className="font-cairo">
          <SelectItem value="all">كل الحالات</SelectItem>
          {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((k) => (
            <SelectItem key={k} value={k}>{STATUS_LABELS[k]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={timeFilter} onValueChange={onTimeChange}>
        <SelectTrigger className="w-[130px] font-cairo h-9 text-sm"><SelectValue placeholder="الوقت" /></SelectTrigger>
        <SelectContent className="font-cairo">
          <SelectItem value="all">كل الأوقات</SelectItem>
          <SelectItem value="upcoming">قادم</SelectItem>
          <SelectItem value="today">اليوم</SelectItem>
          <SelectItem value="past">منتهٍ</SelectItem>
        </SelectContent>
      </Select>
      <input
        type="date"
        value={dateFilter}
        onChange={(e) => onDateChange(e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm font-cairo"
        dir="ltr"
      />
    </div>
  );
}
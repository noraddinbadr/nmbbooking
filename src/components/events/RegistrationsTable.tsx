import { useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Search } from 'lucide-react';
import type { Registration, RegistrationStatus } from '@/data/eventsTypes';
import { statusLabels } from '@/data/constants';
import CSVExport from './CSVExport';

interface RegistrationsTableProps {
  registrations: Registration[];
  onCheckin?: (id: string) => void;
}

const statusColor: Record<string, string> = {
  held: 'bg-amber-50 text-amber-500',
  confirmed: 'bg-primary/10 text-primary',
  checked_in: 'bg-emerald-50 text-emerald-500',
  completed: 'bg-secondary text-secondary-foreground',
  expired: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
};

const mask = (v: string) => v ? v.slice(0, 3) + '***' : '***';

const RegistrationsTable = ({ registrations, onCheckin }: RegistrationsTableProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = registrations.filter(r => {
    const matchSearch = !search ||
      r.caseCode.toLowerCase().includes(search.toLowerCase()) ||
      r.patientInfo?.name?.includes(search) ||
      r.patientInfo?.phone?.includes(search);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4" dir="rtl">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالكود أو الاسم..."
              className="pr-9 font-cairo"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] font-cairo">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent className="font-cairo">
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="held">محجوز مؤقتاً</SelectItem>
              <SelectItem value="confirmed">مؤكد</SelectItem>
              <SelectItem value="checked_in">تم التسجيل</SelectItem>
              <SelectItem value="expired">منتهي</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CSVExport registrations={filtered} />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-cairo text-right">كود الحالة</TableHead>
              <TableHead className="font-cairo text-right">المريض</TableHead>
              <TableHead className="font-cairo text-right">الهاتف</TableHead>
              <TableHead className="font-cairo text-right">الحالة</TableHead>
              <TableHead className="font-cairo text-right">التاريخ</TableHead>
              <TableHead className="font-cairo text-right">إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(reg => (
              <TableRow key={reg.id}>
                <TableCell className="font-mono text-xs">{reg.caseCode}</TableCell>
                <TableCell className="font-cairo text-sm">{mask(reg.patientInfo?.name || '')}</TableCell>
                <TableCell className="font-cairo text-sm">{mask(reg.patientInfo?.phone || '')}</TableCell>
                <TableCell>
                  <Badge className={statusColor[reg.status] || 'bg-muted'} variant="secondary">
                    {statusLabels[reg.status] || reg.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(reg.createdAt).toLocaleDateString('ar-YE')}
                </TableCell>
                <TableCell>
                  {reg.status === 'confirmed' && onCheckin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-cairo gap-1 text-xs"
                      onClick={() => onCheckin(reg.id)}
                    >
                      <CheckCircle className="h-3 w-3" /> تسجيل حضور
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground font-cairo py-8">
                  لا توجد تسجيلات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground font-cairo">
        إجمالي: {filtered.length} تسجيل
      </p>
    </div>
  );
};

export default RegistrationsTable;

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DynamicCrud, { type FieldConfig } from '@/components/admin/DynamicCrud';
import { supabase } from '@/integrations/supabase/client';

const profileFields: FieldConfig[] = [
  { key: 'full_name', label: 'الاسم بالإنجليزي', type: 'text', showInTable: true },
  { key: 'full_name_ar', label: 'الاسم بالعربي', type: 'text', showInTable: true },
  { key: 'phone', label: 'الهاتف', type: 'text', showInTable: true, dir: 'ltr' },
  { key: 'gender', label: 'الجنس', type: 'select', showInTable: true, options: [
    { value: 'male', label: 'ذكر' },
    { value: 'female', label: 'أنثى' },
  ]},
  { key: 'date_of_birth', label: 'تاريخ الميلاد', type: 'date', showInTable: true },
  { key: 'avatar_url', label: 'رابط الصورة', type: 'text', showInTable: false, dir: 'ltr' },
];

const DashboardPatients = () => {
  const [patientIds, setPatientIds] = useState<string[] | null>(null);

  useEffect(() => {
    // Fetch only users with 'patient' role
    supabase.from('user_roles' as any).select('user_id').eq('role', 'patient')
      .then(({ data }) => {
        setPatientIds((data || []).map((r: any) => r.user_id));
      });
  }, []);

  if (patientIds === null) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="font-cairo text-xl font-bold text-foreground">إدارة المرضى</h1>
          <p className="font-cairo text-sm text-muted-foreground">عرض وتعديل بيانات المرضى فقط ({patientIds.length} مريض)</p>
        </div>
        <PatientCrud patientIds={patientIds} />
      </div>
    </DashboardLayout>
  );
};

// Separate component so key changes force re-render
const PatientCrud = ({ patientIds }: { patientIds: string[] }) => {
  // We use a custom query approach - filter client-side since DynamicCrud fetches all
  // For better approach, we pass filter prop but profiles uses 'id' not a simple eq
  // So we'll use a wrapper that filters
  return (
    <DynamicCrudFilteredByIds
      tableName="profiles"
      title="مريض"
      fields={profileFields}
      nameField="full_name_ar"
      allowedIds={patientIds}
    />
  );
};

// A variant that filters by allowed IDs
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Search, CalendarIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const DynamicCrudFilteredByIds = ({ tableName, title, fields, nameField, allowedIds }: {
  tableName: string; title: string; fields: FieldConfig[]; nameField: string; allowedIds: string[];
}) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const tableFields = fields.filter(f => f.showInTable !== false);

  const fetchRows = async () => {
    setLoading(true);
    if (allowedIds.length === 0) { setRows([]); setLoading(false); return; }
    const { data, error } = await supabase.from(tableName as any).select('*').in('id', allowedIds).order('created_at', { ascending: false });
    if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    else setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, [allowedIds]);

  const openAdd = () => {
    setEditingRow(null);
    const defaults: Record<string, any> = {};
    fields.forEach(f => {
      if (f.type === 'boolean') defaults[f.key] = true;
      else if (f.type === 'number') defaults[f.key] = 0;
      else defaults[f.key] = '';
    });
    setFormData(defaults);
    setModalOpen(true);
  };

  const openEdit = (row: any) => {
    setEditingRow(row);
    const data: Record<string, any> = {};
    fields.forEach(f => { data[f.key] = row[f.key] ?? ''; });
    setFormData(data);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload: Record<string, any> = {};
    fields.forEach(f => {
      let val = formData[f.key];
      if (f.type === 'number') val = Number(val) || 0;
      if (!f.required && val === '' && f.type !== 'boolean') val = null;
      payload[f.key] = val;
    });

    if (editingRow) {
      const { error } = await supabase.from(tableName as any).update(payload).eq('id', editingRow.id);
      if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'تم', description: 'تم التحديث بنجاح' });
    } else {
      const { error } = await supabase.from(tableName as any).insert(payload);
      if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'تم', description: 'تمت الإضافة بنجاح' });
    }
    setModalOpen(false);
    fetchRows();
  };

  const filtered = rows.filter(r => {
    if (!search) return true;
    return fields.some(f => (f.type === 'text' || f.type === 'date') && String(r[f.key] || '').toLowerCase().includes(search.toLowerCase()));
  });

  const renderCellValue = (row: any, field: FieldConfig) => {
    const val = row[field.key];
    if (field.type === 'boolean') return val ? <Badge variant="default" className="font-cairo text-[10px]">فعّال</Badge> : <Badge variant="secondary" className="font-cairo text-[10px]">معطّل</Badge>;
    if (field.type === 'select' && field.options) {
      const opt = field.options.find(o => o.value === val);
      return opt ? <Badge variant="outline" className="font-cairo text-[10px]">{opt.label}</Badge> : val || '—';
    }
    return val || '—';
  };

  const DateFieldInline = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const [open, setOpen] = useState(false);
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-cairo mt-1 h-10", !value && "text-muted-foreground")} dir="ltr">
            <CalendarIcon className="mr-2 h-4 w-4" />{value || 'اختر تاريخ'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 pointer-events-auto z-[60]" align="start">
          <Calendar mode="single" selected={value ? new Date(value) : undefined}
            onSelect={(d) => { if (d) { onChange(format(d, 'yyyy-MM-dd')); setOpen(false); } }}
            initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="font-cairo pr-9 h-9 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground font-cairo text-sm">لا توجد بيانات</div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-cairo text-right w-10">#</TableHead>
                {tableFields.map(f => <TableHead key={f.key} className="font-cairo text-right">{f.label}</TableHead>)}
                <TableHead className="font-cairo text-right w-20">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                  {tableFields.map(f => <TableCell key={f.key} className="font-cairo text-sm" dir={f.dir}>{renderCellValue(row, f)}</TableCell>)}
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)}><Edit className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="text-xs text-muted-foreground font-cairo">إجمالي: {filtered.length}</div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="font-cairo max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="font-cairo">{editingRow ? `تعديل ${title}` : `إضافة ${title}`}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.key}>
                <Label className="font-cairo text-sm">{f.label}</Label>
                {f.type === 'date' ? (
                  <DateFieldInline value={formData[f.key] || ''} onChange={v => setFormData(prev => ({ ...prev, [f.key]: v }))} />
                ) : f.type === 'boolean' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Switch checked={!!formData[f.key]} onCheckedChange={v => setFormData(prev => ({ ...prev, [f.key]: v }))} />
                  </div>
                ) : f.type === 'select' && f.options ? (
                  <Select value={formData[f.key] || ''} onValueChange={v => setFormData(prev => ({ ...prev, [f.key]: v }))}>
                    <SelectTrigger className="w-full font-cairo mt-1 h-10"><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>{f.options.map(o => <SelectItem key={o.value} value={o.value} className="font-cairo">{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input value={formData[f.key] ?? ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} className="font-cairo mt-1" dir={f.dir} />
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="font-cairo flex-1">{editingRow ? 'حفظ التعديلات' : 'إضافة'}</Button>
              <Button variant="outline" onClick={() => setModalOpen(false)} className="font-cairo">إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPatients;

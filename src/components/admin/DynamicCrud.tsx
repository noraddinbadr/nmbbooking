import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, Edit, Trash2, Search, CalendarIcon, ChevronsUpDown, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'relation';
  required?: boolean;
  options?: { value: string; label: string }[];
  showInTable?: boolean;
  dir?: 'ltr' | 'rtl';
  // relation config
  relationTable?: string;
  relationLabelField?: string;
  relationValueField?: string;
}

interface DynamicCrudProps {
  tableName: string;
  title: string;
  fields: FieldConfig[];
  nameField: string;
}

// Searchable relation combobox
const RelationField = ({ field, value, onChange }: { field: FieldConfig; value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!field.relationTable) return;
    setLoading(true);
    const labelField = field.relationLabelField || 'name_ar';
    const valueField = field.relationValueField || 'id';
    supabase.from(field.relationTable as any).select(`${valueField},${labelField}`).limit(200)
      .then(({ data }) => {
        setItems((data || []).map((r: any) => ({ value: r[valueField], label: r[labelField] || r[valueField] })));
        setLoading(false);
      });
  }, [field.relationTable, field.relationLabelField, field.relationValueField]);

  const selectedLabel = items.find(i => i.value === value)?.label || '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-cairo mt-1 h-10" dir="rtl">
          {selectedLabel || <span className="text-muted-foreground">اختر...</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 pointer-events-auto" align="start">
        <Command>
          <CommandInput placeholder="بحث..." className="font-cairo" />
          <CommandList>
            <CommandEmpty className="font-cairo p-2 text-sm text-center">{loading ? 'جاري التحميل...' : 'لا توجد نتائج'}</CommandEmpty>
            <CommandGroup>
              {items.map(item => (
                <CommandItem key={item.value} value={item.label} onSelect={() => { onChange(item.value); setOpen(false); }} className="font-cairo">
                  <Check className={cn("mr-2 h-4 w-4", value === item.value ? "opacity-100" : "opacity-0")} />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Date picker field
const DateField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const dateValue = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-cairo mt-1 h-10", !value && "text-muted-foreground")} dir="ltr">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value || 'اختر تاريخ'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(d) => { if (d) { onChange(format(d, 'yyyy-MM-dd')); setOpen(false); } }}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};

const DynamicCrud = ({ tableName, title, fields, nameField }: DynamicCrudProps) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  // Cache for relation labels in table display
  const [relationLabels, setRelationLabels] = useState<Record<string, Record<string, string>>>({});

  const tableFields = fields.filter(f => f.showInTable !== false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from(tableName as any).select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }, [tableName]);

  // Fetch relation labels for table display
  useEffect(() => {
    const relationFields = fields.filter(f => f.type === 'relation' && f.relationTable && f.showInTable);
    relationFields.forEach(f => {
      const labelField = f.relationLabelField || 'name_ar';
      const valueField = f.relationValueField || 'id';
      supabase.from(f.relationTable as any).select(`${valueField},${labelField}`).limit(500)
        .then(({ data }) => {
          const map: Record<string, string> = {};
          (data || []).forEach((r: any) => { map[r[valueField]] = r[labelField] || r[valueField]; });
          setRelationLabels(prev => ({ ...prev, [f.key]: map }));
        });
    });
  }, [fields]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

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
    const requiredMissing = fields.filter(f => f.required && !formData[f.key]);
    if (requiredMissing.length > 0) {
      toast({ title: 'خطأ', description: `يرجى ملء: ${requiredMissing.map(f => f.label).join(', ')}`, variant: 'destructive' });
      return;
    }

    const payload: Record<string, any> = {};
    fields.forEach(f => {
      let val = formData[f.key];
      if (f.type === 'number') val = Number(val) || 0;
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

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from(tableName as any).delete().eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم', description: 'تم الحذف بنجاح' });
    fetchRows();
  };

  const filtered = rows.filter(r => {
    if (!search) return true;
    return fields.some(f => (f.type === 'text' || f.type === 'date' || f.type === 'relation') && String(r[f.key] || '').includes(search));
  });

  const renderCellValue = (row: any, field: FieldConfig) => {
    const val = row[field.key];
    if (field.type === 'boolean') return val ? <Badge variant="default" className="font-cairo text-[10px]">فعّال</Badge> : <Badge variant="secondary" className="font-cairo text-[10px]">معطّل</Badge>;
    if (field.type === 'number') return <span dir="ltr">{val}</span>;
    if (field.type === 'relation' && relationLabels[field.key]) return relationLabels[field.key][val] || val || '—';
    if (field.type === 'select' && field.options) {
      const opt = field.options.find(o => o.value === val);
      return opt ? opt.label : val || '—';
    }
    return val || '—';
  };

  const renderFormField = (f: FieldConfig) => {
    if (f.type === 'boolean') {
      return (
        <div className="flex items-center gap-2 mt-1">
          <Switch checked={!!formData[f.key]} onCheckedChange={v => setFormData(prev => ({ ...prev, [f.key]: v }))} />
          <span className="font-cairo text-sm text-muted-foreground">{formData[f.key] ? 'فعّال' : 'معطّل'}</span>
        </div>
      );
    }
    if (f.type === 'date') {
      return <DateField value={formData[f.key] || ''} onChange={v => setFormData(prev => ({ ...prev, [f.key]: v }))} />;
    }
    if (f.type === 'relation') {
      return <RelationField field={f} value={formData[f.key] || ''} onChange={v => setFormData(prev => ({ ...prev, [f.key]: v }))} />;
    }
    if (f.type === 'select' && f.options) {
      return (
        <select
          value={formData[f.key] || ''}
          onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-cairo mt-1"
        >
          <option value="">اختر</option>
          {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    return (
      <Input
        type={f.type === 'number' ? 'number' : 'text'}
        value={formData[f.key] || ''}
        onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
        className="font-cairo mt-1"
        dir={f.dir}
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="font-cairo pr-9 h-9 text-sm" />
        </div>
        <Button size="sm" onClick={openAdd} className="font-cairo gap-1 h-9">
          <Plus className="h-4 w-4" /> إضافة
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground font-cairo text-sm">لا توجد بيانات</div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-cairo text-right w-10">#</TableHead>
                {tableFields.map(f => (
                  <TableHead key={f.key} className="font-cairo text-right">{f.label}</TableHead>
                ))}
                <TableHead className="font-cairo text-right w-20">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                  {tableFields.map(f => (
                    <TableCell key={f.key} className="font-cairo text-sm" dir={f.dir}>{renderCellValue(row, f)}</TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(row.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
          <DialogHeader>
            <DialogTitle className="font-cairo">{editingRow ? `تعديل ${title}` : `إضافة ${title}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.key}>
                <Label className="font-cairo text-sm">{f.label} {f.required && '*'}</Label>
                {renderFormField(f)}
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

export default DynamicCrud;

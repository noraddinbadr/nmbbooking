import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  required?: boolean;
  options?: { value: string; label: string }[];
  showInTable?: boolean;
  dir?: 'ltr' | 'rtl';
}

interface DynamicCrudProps {
  tableName: string;
  title: string;
  fields: FieldConfig[];
  nameField: string; // field used for display name
}

const DynamicCrud = ({ tableName, title, fields, nameField }: DynamicCrudProps) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

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
    return fields.some(f => f.type === 'text' && String(r[f.key] || '').includes(search));
  });

  const renderCellValue = (row: any, field: FieldConfig) => {
    const val = row[field.key];
    if (field.type === 'boolean') return val ? <Badge variant="default" className="font-cairo text-[10px]">فعّال</Badge> : <Badge variant="secondary" className="font-cairo text-[10px]">معطّل</Badge>;
    if (field.type === 'number') return <span dir="ltr">{val}</span>;
    return val || '—';
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
        <DialogContent className="font-cairo max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-cairo">{editingRow ? `تعديل ${title}` : `إضافة ${title}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.key}>
                <Label className="font-cairo text-sm">{f.label} {f.required && '*'}</Label>
                {f.type === 'boolean' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Switch checked={!!formData[f.key]} onCheckedChange={v => setFormData(prev => ({ ...prev, [f.key]: v }))} />
                    <span className="font-cairo text-sm text-muted-foreground">{formData[f.key] ? 'فعّال' : 'معطّل'}</span>
                  </div>
                ) : f.type === 'select' && f.options ? (
                  <select
                    value={formData[f.key] || ''}
                    onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-cairo mt-1"
                  >
                    <option value="">اختر</option>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <Input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={formData[f.key] || ''}
                    onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="font-cairo mt-1"
                    dir={f.dir}
                  />
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

export default DynamicCrud;

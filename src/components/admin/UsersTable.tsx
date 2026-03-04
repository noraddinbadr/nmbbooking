import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, Edit, MoreVertical, Search, UserPlus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface UserRow {
  id: string;
  full_name: string | null;
  full_name_ar: string | null;
  phone: string | null;
  gender: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  created_at: string;
  roles: AppRole[];
}

const roleLabels: Record<AppRole, string> = {
  admin: 'مدير النظام',
  doctor: 'طبيب',
  clinic_admin: 'مدير عيادة',
  staff: 'موظف',
  patient: 'مريض',
  donor: 'متبرع',
  provider: 'مزود خدمة',
};

const roleBadgeVariant = (role: AppRole) => {
  if (role === 'admin') return 'destructive' as const;
  if (role === 'doctor') return 'default' as const;
  return 'secondary' as const;
};

interface Props {
  users: UserRow[];
  loading: boolean;
  onView: (user: UserRow) => void;
  onEdit: (user: UserRow) => void;
  onAdd: () => void;
  onRefresh: () => void;
  filterRole?: AppRole;
}

const UsersTable = ({ users, loading, onView, onEdit, onAdd, onRefresh, filterRole }: Props) => {
  const [search, setSearch] = useState('');

  const filtered = users.filter(u => {
    const matchesRole = !filterRole || u.roles.includes(filterRole);
    const matchesSearch = !search || 
      (u.full_name || '').includes(search) || 
      (u.full_name_ar || '').includes(search) || 
      (u.phone || '').includes(search);
    return matchesRole && matchesSearch;
  });

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم', description: `تم إزالة دور ${roleLabels[role]}` });
      onRefresh();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الهاتف..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="font-cairo pr-9 h-9 text-sm"
          />
        </div>
        <Button size="sm" onClick={onAdd} className="font-cairo gap-1 h-9">
          <UserPlus className="h-4 w-4" />
          إضافة
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-cairo">لا يوجد مستخدمون</div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-cairo text-right w-10">#</TableHead>
                <TableHead className="font-cairo text-right">الاسم</TableHead>
                <TableHead className="font-cairo text-right">الهاتف</TableHead>
                <TableHead className="font-cairo text-right">الأدوار</TableHead>
                <TableHead className="font-cairo text-right">التسجيل</TableHead>
                <TableHead className="font-cairo text-right w-16">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u, idx) => (
                <TableRow key={u.id}>
                  <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {(u.full_name || u.full_name_ar || '?').charAt(0)}
                      </div>
                      <span className="font-cairo text-sm font-medium">{u.full_name || u.full_name_ar || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-cairo text-sm" dir="ltr">{u.phone || '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map(r => (
                        <Badge key={r} variant={roleBadgeVariant(r)} className="font-cairo text-[10px]">
                          {roleLabels[r]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-cairo text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="font-cairo">
                        <DropdownMenuItem onClick={() => onView(u)} className="gap-2 cursor-pointer">
                          <Eye className="h-4 w-4" /> عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(u)} className="gap-2 cursor-pointer">
                          <Edit className="h-4 w-4" /> تعديل
                        </DropdownMenuItem>
                        {filterRole && u.roles.includes(filterRole) && (
                          <DropdownMenuItem
                            onClick={() => removeRole(u.id, filterRole)}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" /> إزالة من {roleLabels[filterRole]}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="text-xs text-muted-foreground font-cairo">
        إجمالي: {filtered.length} مستخدم
      </div>
    </div>
  );
};

export default UsersTable;

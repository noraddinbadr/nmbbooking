import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Constants } from '@/integrations/supabase/types';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRoles {
  id: string;
  full_name: string | null;
  phone: string | null;
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

const DashboardUsers = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingRole, setAddingRole] = useState<{ userId: string; role: AppRole } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, phone');
    const { data: allRoles } = await supabase.from('user_roles').select('user_id, role');

    if (profiles) {
      const rolesMap = new Map<string, AppRole[]>();
      allRoles?.forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      setUsers(profiles.map(p => ({
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        roles: rolesMap.get(p.id) || [],
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const addRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم', description: `تمت إضافة دور ${roleLabels[role]}` });
      fetchUsers();
    }
    setAddingRole(null);
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم', description: `تم إزالة دور ${roleLabels[role]}` });
      fetchUsers();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="font-cairo text-xl font-bold text-foreground">إدارة المستخدمين والأدوار</h1>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-cairo text-right">الاسم</TableHead>
                  <TableHead className="font-cairo text-right">الهاتف</TableHead>
                  <TableHead className="font-cairo text-right">الأدوار</TableHead>
                  <TableHead className="font-cairo text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-cairo text-sm">{u.full_name || '—'}</TableCell>
                    <TableCell className="font-cairo text-sm" dir="ltr">{u.phone || '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map(r => (
                          <Badge key={r} variant={roleBadgeVariant(r)} className="font-cairo text-xs cursor-pointer" onClick={() => removeRole(u.id, r)} title="اضغط للإزالة">
                            {roleLabels[r]} ×
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {addingRole?.userId === u.id ? (
                        <div className="flex items-center gap-2">
                          <Select onValueChange={(v) => addRole(u.id, v as AppRole)}>
                            <SelectTrigger className="w-32 h-8 font-cairo text-xs">
                              <SelectValue placeholder="اختر دور" />
                            </SelectTrigger>
                            <SelectContent>
                              {Constants.public.Enums.app_role
                                .filter(r => !u.roles.includes(r))
                                .map(r => (
                                  <SelectItem key={r} value={r} className="font-cairo text-xs">{roleLabels[r]}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="sm" onClick={() => setAddingRole(null)} className="font-cairo text-xs h-8">إلغاء</Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setAddingRole({ userId: u.id, role: 'patient' })} className="font-cairo text-xs h-8">
                          + إضافة دور
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardUsers;

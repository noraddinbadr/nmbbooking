import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Stethoscope, UserCog, Heart, ShieldCheck } from 'lucide-react';
import UsersTable, { type UserRow } from '@/components/admin/UsersTable';
import UserFormModal from '@/components/admin/UserFormModal';
import UserDetailModal from '@/components/admin/UserDetailModal';
import EditUserRolesModal from '@/components/admin/EditUserRolesModal';
import RolesPermissionsTab from '@/components/admin/RolesPermissionsTab';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const DashboardUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [viewUser, setViewUser] = useState<UserRow | null>(null);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [addDefaultRole, setAddDefaultRole] = useState<AppRole | undefined>();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: allRoles }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('user_id, role'),
    ]);

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
        full_name_ar: p.full_name_ar,
        phone: p.phone,
        gender: p.gender,
        avatar_url: p.avatar_url,
        date_of_birth: p.date_of_birth,
        created_at: p.created_at,
        roles: rolesMap.get(p.id) || [],
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const roleCounts = users.reduce((acc, u) => {
    u.roles.forEach(r => { acc[r] = (acc[r] || 0) + 1; });
    return acc;
  }, {} as Record<AppRole, number>);

  const handleAdd = (defaultRole?: AppRole) => {
    setAddDefaultRole(defaultRole);
    setAddOpen(true);
  };

  const tabs = [
    { value: 'all', label: 'الكل', icon: Users, count: users.length },
    { value: 'doctor', label: 'الأطباء', icon: Stethoscope, count: roleCounts.doctor || 0 },
    { value: 'patient', label: 'المرضى', icon: Heart, count: roleCounts.patient || 0 },
    { value: 'staff', label: 'الموظفون', icon: UserCog, count: roleCounts.staff || 0 },
    { value: 'roles', label: 'الأدوار والصلاحيات', icon: ShieldCheck, count: null },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="font-cairo text-xl font-bold text-foreground">إدارة المستخدمين</h1>
          <p className="font-cairo text-sm text-muted-foreground">إدارة جميع حسابات المستخدمين والأدوار والصلاحيات</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي المستخدمين', value: users.length, color: 'bg-primary/10 text-primary' },
            { label: 'الأطباء', value: roleCounts.doctor || 0, color: 'bg-blue-500/10 text-blue-600' },
            { label: 'المرضى', value: roleCounts.patient || 0, color: 'bg-green-500/10 text-green-600' },
            { label: 'الموظفون', value: roleCounts.staff || 0, color: 'bg-orange-500/10 text-orange-600' },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-3">
              <p className="font-cairo text-xs text-muted-foreground">{stat.label}</p>
              <p className={`font-cairo text-2xl font-bold mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted/50 p-1">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="font-cairo text-xs gap-1.5 data-[state=active]:bg-background">
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.count !== null && (
                  <span className="bg-muted-foreground/20 text-[10px] px-1.5 py-0.5 rounded-full">{tab.count}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <UsersTable
              users={users} loading={loading}
              onView={setViewUser} onEdit={setEditUser}
              onAdd={() => handleAdd()} onRefresh={fetchUsers}
            />
          </TabsContent>
          <TabsContent value="doctor">
            <UsersTable
              users={users} loading={loading} filterRole="doctor"
              onView={setViewUser} onEdit={setEditUser}
              onAdd={() => handleAdd('doctor')} onRefresh={fetchUsers}
            />
          </TabsContent>
          <TabsContent value="patient">
            <UsersTable
              users={users} loading={loading} filterRole="patient"
              onView={setViewUser} onEdit={setEditUser}
              onAdd={() => handleAdd('patient')} onRefresh={fetchUsers}
            />
          </TabsContent>
          <TabsContent value="staff">
            <UsersTable
              users={users} loading={loading} filterRole="staff"
              onView={setViewUser} onEdit={setEditUser}
              onAdd={() => handleAdd('staff')} onRefresh={fetchUsers}
            />
          </TabsContent>
          <TabsContent value="roles">
            <RolesPermissionsTab roleCounts={roleCounts} />
          </TabsContent>
        </Tabs>
      </div>

      <UserFormModal open={addOpen} onOpenChange={setAddOpen} onSuccess={fetchUsers} defaultRole={addDefaultRole} />
      <UserDetailModal open={!!viewUser} onOpenChange={() => setViewUser(null)} user={viewUser} />
      <EditUserRolesModal open={!!editUser} onOpenChange={() => setEditUser(null)} user={editUser} onSuccess={fetchUsers} />
    </DashboardLayout>
  );
};

export default DashboardUsers;

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Stethoscope, UserCog, Heart, Package, Building2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleInfo {
  role: AppRole;
  label: string;
  description: string;
  icon: React.ElementType;
  permissions: string[];
  count: number;
}

interface Props {
  roleCounts: Record<AppRole, number>;
}

const RolesPermissionsTab = ({ roleCounts }: Props) => {
  const roleInfos: RoleInfo[] = [
    {
      role: 'admin',
      label: 'مدير النظام',
      description: 'صلاحيات كاملة لإدارة المنصة',
      icon: Shield,
      permissions: ['إدارة المستخدمين', 'إدارة الأدوار', 'إدارة العيادات', 'إدارة الأحداث', 'عرض التقارير', 'إدارة مزودي الخدمات', 'جميع الصلاحيات'],
      count: roleCounts.admin || 0,
    },
    {
      role: 'doctor',
      label: 'طبيب',
      description: 'إدارة العيادة والمرضى والحجوزات',
      icon: Stethoscope,
      permissions: ['عرض وتعديل المرضى', 'إدارة الحجوزات', 'كتابة الوصفات', 'طلب التحاليل', 'إدارة الجدول', 'عرض التقارير'],
      count: roleCounts.doctor || 0,
    },
    {
      role: 'clinic_admin',
      label: 'مدير عيادة',
      description: 'إدارة عيادة محددة وطاقمها',
      icon: Building2,
      permissions: ['إدارة موظفي العيادة', 'إدارة الخدمات', 'عرض الحجوزات', 'عرض التقارير', 'إدارة الإعدادات'],
      count: roleCounts.clinic_admin || 0,
    },
    {
      role: 'staff',
      label: 'موظف',
      description: 'صلاحيات محددة بحسب الإعدادات',
      icon: UserCog,
      permissions: ['عرض المرضى', 'تسجيل الحضور', 'إدارة الحجوزات (حسب الإعداد)', 'طلب التحاليل (حسب الإعداد)'],
      count: roleCounts.staff || 0,
    },
    {
      role: 'patient',
      label: 'مريض',
      description: 'حجز المواعيد ومتابعة الملف الطبي',
      icon: Users,
      permissions: ['حجز المواعيد', 'عرض الحجوزات', 'تعديل الملف الشخصي', 'التسجيل في الأحداث'],
      count: roleCounts.patient || 0,
    },
    {
      role: 'donor',
      label: 'متبرع',
      description: 'التبرع لدعم الحالات الطبية',
      icon: Heart,
      permissions: ['عرض الحالات الطبية', 'التبرع للحالات', 'عرض سجل التبرعات'],
      count: roleCounts.donor || 0,
    },
    {
      role: 'provider',
      label: 'مزود خدمة',
      description: 'تقديم خدمات التحاليل والأشعة',
      icon: Package,
      permissions: ['استلام الطلبات', 'رفع النتائج', 'إدارة الخدمات المقدمة'],
      count: roleCounts.provider || 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {roleInfos.map(info => (
        <Card key={info.role} className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <info.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-cairo text-sm">{info.label}</CardTitle>
                  <p className="font-cairo text-xs text-muted-foreground">{info.description}</p>
                </div>
              </div>
              <Badge variant="outline" className="font-cairo text-xs">{info.count} مستخدم</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {info.permissions.map(p => (
                <Badge key={p} variant="secondary" className="font-cairo text-[10px] font-normal">{p}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RolesPermissionsTab;

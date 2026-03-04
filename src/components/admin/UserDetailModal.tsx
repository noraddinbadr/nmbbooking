import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserDetail {
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserDetail | null;
}

const UserDetailModal = ({ open, onOpenChange, user }: Props) => {
  if (!user) return null;

  const infoRows = [
    { label: 'الاسم', value: user.full_name || user.full_name_ar || '—' },
    { label: 'الهاتف', value: user.phone || '—', dir: 'ltr' as const },
    { label: 'الجنس', value: user.gender === 'male' ? 'ذكر' : user.gender === 'female' ? 'أنثى' : '—' },
    { label: 'تاريخ الميلاد', value: user.date_of_birth || '—' },
    { label: 'تاريخ التسجيل', value: new Date(user.created_at).toLocaleDateString('ar-SA') },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-cairo max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo">تفاصيل المستخدم</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {(user.full_name || user.full_name_ar || '?').charAt(0)}
            </div>
            <div>
              <p className="font-bold text-foreground">{user.full_name || user.full_name_ar || 'بدون اسم'}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {user.roles.map(r => (
                  <Badge key={r} variant={roleBadgeVariant(r)} className="font-cairo text-xs">{roleLabels[r]}</Badge>
                ))}
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            {infoRows.map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="text-foreground font-medium" dir={row.dir}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;

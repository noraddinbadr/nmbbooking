import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, ClipboardList, Users,
  Stethoscope, BarChart3, Bell, LogOut, Menu, X, ChevronLeft,
  UserCog, Settings, Heart, Package, UserCheck, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  roles?: AppRole[];
}

const allNavItems: NavItem[] = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم', roles: ['doctor', 'admin', 'clinic_admin', 'staff'] },
  { path: '/dashboard/calendar', icon: Calendar, label: 'التقويم', roles: ['doctor', 'admin', 'clinic_admin', 'staff'] },
  { path: '/dashboard/bookings', icon: ClipboardList, label: 'الحجوزات', roles: ['doctor', 'admin', 'clinic_admin', 'staff'] },
  { path: '/dashboard/patients', icon: Users, label: 'المرضى', roles: ['doctor', 'admin', 'clinic_admin', 'staff'] },
  { path: '/dashboard/services', icon: Stethoscope, label: 'الخدمات', roles: ['doctor', 'admin', 'clinic_admin'] },
  { path: '/dashboard/events', icon: Heart, label: 'الأحداث الطبية', roles: ['doctor', 'admin', 'clinic_admin'] },
  { path: '/dashboard/providers', icon: Package, label: 'مزودو الخدمات', roles: ['admin'] },
  { path: '/dashboard/kiosk', icon: UserCheck, label: 'تسجيل الحضور', roles: ['doctor', 'admin', 'clinic_admin', 'staff'] },
  { path: '/dashboard/reports', icon: BarChart3, label: 'التقارير', roles: ['doctor', 'admin', 'clinic_admin'] },
  { path: '/dashboard/users', icon: ShieldCheck, label: 'إدارة المستخدمين', roles: ['admin'] },
  { path: '/dashboard/settings', icon: Settings, label: 'الإعدادات' },
  // Patient-specific
  { path: '/my-bookings', icon: ClipboardList, label: 'حجوزاتي', roles: ['patient'] },
  { path: '/dashboard/profile', icon: UserCog, label: 'ملفي الشخصي', roles: ['patient'] },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, hasRole, signOut } = useAuth();

  const navItems = allNavItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(r => roles.includes(r));
  });

  const displayName = profile?.full_name || profile?.full_name_ar || 'المستخدم';
  const initials = displayName.charAt(0);
  const roleLabelMap: Partial<Record<AppRole, string>> = {
    admin: 'مدير النظام',
    doctor: 'طبيب',
    clinic_admin: 'مدير عيادة',
    staff: 'موظف',
    patient: 'مريض',
  };
  const primaryRole = (['admin', 'doctor', 'clinic_admin', 'staff', 'patient'] as AppRole[]).find(r => roles.includes(r));
  const roleLabel = primaryRole ? roleLabelMap[primaryRole] || '' : '';

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-56 bg-card border-l border-border transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center">
                  <Stethoscope className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-cairo font-bold text-foreground text-sm">صحتك</span>
              </Link>
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg font-cairo text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-2 border-t border-border">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 px-3 py-2 rounded-lg font-cairo text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>العودة للموقع</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="font-cairo font-bold text-foreground text-sm">{displayName}</h2>
                <p className="text-[11px] text-muted-foreground font-cairo">{roleLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 font-cairo">
                  <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-sm text-muted-foreground">لا توجد إشعارات جديدة</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors">
                    <div className="w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center">
                      <span className="text-xs font-cairo font-bold text-primary-foreground">{initials}</span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 font-cairo">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-bold">{displayName}</p>
                      <p className="text-xs text-muted-foreground font-normal">{roleLabel}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard/profile')} className="gap-2 cursor-pointer">
                    <UserCog className="h-4 w-4" /> الملف الشخصي
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" /> الإعدادات
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" /> تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;

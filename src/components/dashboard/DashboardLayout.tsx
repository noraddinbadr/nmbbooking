import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, ClipboardList, Users, UserCog,
  Stethoscope, FileText, BarChart3, Bell, LogOut, Menu, X, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { path: '/dashboard/calendar', icon: Calendar, label: 'التقويم الذكي' },
  { path: '/dashboard/bookings', icon: ClipboardList, label: 'الحجوزات الواردة' },
  { path: '/dashboard/patients', icon: Users, label: 'إدارة المرضى' },
  { path: '/dashboard/profile', icon: UserCog, label: 'الملف الشخصي' },
  { path: '/dashboard/services', icon: Stethoscope, label: 'الخدمات الطبية' },
  { path: '/dashboard/treatment', icon: FileText, label: 'ملفات العلاج' },
  { path: '/dashboard/reports', icon: BarChart3, label: 'التقارير والتحليلات' },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-64 bg-card border-l border-border transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-cairo font-bold text-foreground">لوحة الطبيب</span>
              </Link>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg font-cairo text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-border space-y-1">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-cairo text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>العودة للموقع</span>
            </button>
            <button
              onClick={() => navigate('/sign-in')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-cairo text-sm text-destructive hover:bg-destructive/10 w-full transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="font-cairo font-bold text-foreground">د. أحمد محمد العليمي</h2>
                <p className="text-xs text-muted-foreground font-cairo">قلب وأوعية دموية</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">5</Badge>
              </Button>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-cairo font-bold text-primary">أ</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;

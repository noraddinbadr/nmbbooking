import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, ClipboardList, Users,
  Stethoscope, BarChart3, Bell, LogOut, Menu, X, ChevronLeft,
  UserCog, Settings, Moon, Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { path: '/dashboard/calendar', icon: Calendar, label: 'التقويم' },
  { path: '/dashboard/bookings', icon: ClipboardList, label: 'الحجوزات' },
  { path: '/dashboard/patients', icon: Users, label: 'المرضى' },
  { path: '/dashboard/services', icon: Stethoscope, label: 'الخدمات' },
  { path: '/dashboard/reports', icon: BarChart3, label: 'التقارير' },
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

      {/* Sidebar — slim, no profile/settings */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-56 bg-card border-l border-border transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center">
                  <Stethoscope className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-cairo font-bold text-foreground text-sm">صحتك — طبيب</span>
              </Link>
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Nav */}
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

          {/* Back to site */}
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

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Top bar with profile dropdown */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="font-cairo font-bold text-foreground text-sm">د. أحمد محمد العليمي</h2>
                <p className="text-[11px] text-muted-foreground font-cairo">قلب وأوعية دموية</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    <Badge className="absolute -top-0.5 -left-0.5 h-4 w-4 flex items-center justify-center p-0 text-[9px]">5</Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 font-cairo">
                  <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex-col items-start gap-0.5">
                    <span className="font-medium text-sm">حجز جديد</span>
                    <span className="text-xs text-muted-foreground">حجز من أحمد محمد — 2:30 م</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex-col items-start gap-0.5">
                    <span className="font-medium text-sm">تقييم جديد</span>
                    <span className="text-xs text-muted-foreground">5 نجوم من فاطمة عبدالله</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex-col items-start gap-0.5">
                    <span className="font-medium text-sm">نتائج مخبرية</span>
                    <span className="text-xs text-muted-foreground">نتائج أحمد محمد جاهزة</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors">
                    <div className="w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center">
                      <span className="text-xs font-cairo font-bold text-primary-foreground">أ</span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 font-cairo">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-bold">د. أحمد محمد العليمي</p>
                      <p className="text-xs text-muted-foreground font-normal">قلب وأوعية دموية</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard/profile')} className="gap-2 cursor-pointer">
                    <UserCog className="h-4 w-4" /> الملف الشخصي
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/profile')} className="gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" /> الإعدادات
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/sign-in')} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
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

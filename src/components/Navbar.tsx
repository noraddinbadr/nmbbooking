import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Menu, X, Heart, HandHeart, LogOut, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, roles, hasRole, signOut } = useAuth();

  const getDashboardPath = () => {
    if (hasRole('admin') || hasRole('doctor') || hasRole('clinic_admin') || hasRole('staff')) return '/dashboard';
    return '/dashboard/patient';
  };

  const navLinks = [
    { to: '/', label: 'الرئيسية' },
    { to: '/doctors', label: 'الأطباء' },
    { to: '/events', label: 'الأحداث الطبية', icon: Heart },
    { to: '/cases', label: 'حالات التبرع', icon: HandHeart },
    { to: '/my-bookings', label: 'حجوزاتي' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hero-gradient text-lg font-bold text-primary-foreground">ص</div>
          <span className="font-cairo text-xl font-bold text-foreground">صحتك</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className={`rounded-lg px-4 py-2 font-cairo text-sm font-medium transition-colors flex items-center gap-1.5 ${location.pathname === link.to ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              {link.icon && <link.icon className="h-3.5 w-3.5" />}
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to={getDashboardPath()}>
                <Button variant="outline" size="sm" className="font-cairo gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  لوحة التحكم
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="font-cairo gap-2" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            </>
          ) : (
            <>
              <Link to="/sign-in">
                <Button variant="outline" size="sm" className="font-cairo gap-2">
                  <User className="h-4 w-4" />
                  دخول
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button size="sm" className="font-cairo gap-2 bg-hero-gradient text-primary-foreground hover:opacity-90">انضم الآن</Button>
              </Link>
            </>
          )}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={`rounded-lg px-4 py-3 font-cairo text-sm font-medium flex items-center gap-2 ${location.pathname === link.to ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-2">
              {user ? (
                <Button variant="outline" size="sm" className="w-full font-cairo gap-2" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                  <LogOut className="h-4 w-4" />
                  خروج
                </Button>
              ) : (
                <>
                  <Link to="/sign-in" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full font-cairo">دخول</Button>
                  </Link>
                  <Link to="/sign-up" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full font-cairo bg-hero-gradient text-primary-foreground">انضم الآن</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

import { Link, useLocation } from 'react-router-dom';
import { Search, User, Calendar, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'الرئيسية' },
    { to: '/doctors', label: 'الأطباء' },
    { to: '/my-bookings', label: 'حجوزاتي' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hero-gradient text-lg font-bold text-primary-foreground">
            ص
          </div>
          <span className="font-cairo text-xl font-bold text-foreground">صحتك</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-lg px-4 py-2 font-cairo text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/sign-in">
            <Button variant="outline" size="sm" className="font-cairo gap-2">
              <User className="h-4 w-4" />
              دخول
            </Button>
          </Link>
          <Link to="/sign-up">
            <Button size="sm" className="font-cairo gap-2 bg-hero-gradient text-primary-foreground hover:opacity-90">
              انضم الآن
            </Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-4 py-3 font-cairo text-sm font-medium ${
                  location.pathname === link.to
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Button size="sm" className="mt-2 font-cairo bg-hero-gradient text-primary-foreground">
              احجز الآن
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

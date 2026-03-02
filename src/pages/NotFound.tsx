import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
      <div className="text-center space-y-4">
        <h1 className="font-cairo text-6xl font-bold text-primary">404</h1>
        <p className="font-cairo text-xl text-muted-foreground">الصفحة غير موجودة</p>
        <p className="font-cairo text-sm text-muted-foreground">الصفحة التي تبحث عنها غير متوفرة</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/">
            <Button className="font-cairo bg-hero-gradient text-primary-foreground hover:opacity-90">
              العودة للرئيسية
            </Button>
          </Link>
          <Link to="/doctors">
            <Button variant="outline" className="font-cairo">
              تصفح الأطباء
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

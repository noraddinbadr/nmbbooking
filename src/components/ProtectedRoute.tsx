import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Props {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
}

const ProtectedRoute = ({ children, requiredRoles }: Props) => {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <div className="text-center font-cairo">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasAccess = requiredRoles.some(r => roles.includes(r));
    if (!hasAccess) {
      return (
        <div className="flex h-screen items-center justify-center" dir="rtl">
          <div className="text-center font-cairo space-y-3">
            <h1 className="text-2xl font-bold text-foreground">غير مصرح</h1>
            <p className="text-muted-foreground">ليس لديك صلاحية للوصول لهذه الصفحة</p>
            <a href="/dashboard" className="text-primary hover:underline text-sm">العودة للوحة التحكم</a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { authRepo } from '../api/auth.repo';
import { profileRepo } from '../api/profile.repo';
import { authService } from '../services/auth.service';
import type { Profile } from '../schemas/auth.schema';
import type { Database } from '@/shared/supabase';

type AppRole = Database['public']['Enums']['app_role'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, profile: null, roles: [], loading: true,
  hasRole: () => false, signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    const [prof, r] = await Promise.all([
      profileRepo.getProfile(userId),
      profileRepo.getRoles(userId),
    ]);
    if (prof.ok && prof.value) setProfile(prof.value);
    if (r.ok) setRoles(r.value);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = authRepo.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => fetchUserData(s.user.id), 0);
      } else {
        setProfile(null); setRoles([]);
      }
      setLoading(false);
    });

    authRepo.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchUserData(s.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  const signOut = async () => {
    await authService.signOut();
    setProfile(null); setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, roles, loading, hasRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
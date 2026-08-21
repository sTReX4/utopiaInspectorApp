'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

type Role = 'superadmin' | 'admin' | null;

interface AuthContextType {
  user: any;
  role: Role;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Fetch current session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          setUser(session.user);
          await fetchUserRole(session.user.id);
        } else {
          setUser(null);
          setRole(null);
          setIsLoading(false);
          if (pathname !== '/login') router.push('/login');
        }
      } catch (error) {
        console.error("Auth initialization error (Corrupted Session):", error);
        // If the session is corrupted on load, flush it immediately
        localStorage.clear();
        sessionStorage.clear();
        setIsLoading(false);
        if (pathname !== '/login') router.push('/login');
      }
    };

    initializeAuth();

    // 2. Listen for login/logout events
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        router.push('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  // 3. Fetch the custom role from our new profiles table
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (data) setRole(data.role as Role);
    } catch (error) {
      console.error('Error fetching role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. AGGRESSIVE SIGNOUT ENGINE
  const signOut = async () => {
    try {
      // Attempt polite server-side sign out
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Supabase polite signout failed:", error);
    } finally {
      // Nuclear Option: Always physically wipe browser storage regardless of server response
      localStorage.clear();
      sessionStorage.clear();
      // Use window.location instead of router.push to force a hard React memory reset
      window.location.href = '/login'; 
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
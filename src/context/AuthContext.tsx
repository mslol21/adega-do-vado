import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isOfflineMode } from '../lib/supabase';
import type { Profile } from '../types';
import type { Session, User } from '@supabase/supabase-js';

interface OpEmployee {
  role: string;
  name: string;
  authenticated: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  activeRole: string;
  setActiveRole: (role: string) => void;
  opEmployee: OpEmployee | null;
  loginOpEmployee: (role: string, pin: string, name?: string) => boolean;
  logoutOpEmployee: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; storeId: string }> = ({ children, storeId }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState<string>(() => {
    return localStorage.getItem(`op_sector_role_${storeId}`) || 'ADMIN';
  });

  const [opEmployee, setOpEmployee] = useState<OpEmployee | null>(() => {
    const saved = localStorage.getItem(`op_auth_employee_${storeId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const setActiveRole = (role: string) => {
    setActiveRoleState(role);
    localStorage.setItem(`op_sector_role_${storeId}`, role);
  };

  const loginOpEmployee = (role: string, pin: string, name?: string): boolean => {
    const cleanPin = pin.trim();
    const customPin = localStorage.getItem(`op_pin_${role}_${storeId}`) || localStorage.getItem(`op_pin_${role}`);

    let isValid = false;

    if (customPin) {
      isValid = cleanPin === customPin;
    } else if (role === 'ADMIN') {
      isValid = cleanPin === 'vado2025' || cleanPin === '2025' || cleanPin === 'admin';
    } else {
      isValid = cleanPin === '1234' || cleanPin.length >= 4;
    }

    if (isValid) {
      const empData: OpEmployee = {
        role,
        name: name || `Operador ${role}`,
        authenticated: true
      };
      setOpEmployee(empData);
      setActiveRoleState(role);
      localStorage.setItem(`op_auth_employee_${storeId}`, JSON.stringify(empData));
      localStorage.setItem(`op_sector_role_${storeId}`, role);
      return true;
    }

    return false;
  };

  const logoutOpEmployee = () => {
    setOpEmployee(null);
    localStorage.removeItem(`op_auth_employee_${storeId}`);
  };

  useEffect(() => {
    if (isOfflineMode) {
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('store_id', storeId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      
      if (data) {
        setProfile(data as Profile);
        if (data.role) {
          setActiveRoleState(data.role);
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, activeRole, setActiveRole, opEmployee, loginOpEmployee, logoutOpEmployee, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import { AuthContext } from './useAuth';
import type { OpEmployee } from './useAuth';
import React, { useEffect, useState } from 'react';
import { supabase, isOfflineMode } from '../lib/supabase';
import type { Profile } from '../types';
import type { Session, User } from '@supabase/supabase-js';

export const AuthProvider: React.FC<{ children: React.ReactNode; storeId: string }> = ({ children, storeId }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(!isOfflineMode);
  const [activeRole, setActiveRoleState] = useState<string>(() => {
    return localStorage.getItem(`op_sector_role_${storeId}`) || 'ADMIN';
  });

  const [opEmployee, setOpEmployee] = useState<OpEmployee | null>(() => {
    const saved = localStorage.getItem(`op_auth_employee_${storeId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const setActiveRole = (role: string) => {
    setActiveRoleState(role);
    localStorage.setItem(`op_sector_role_${storeId}`, role);
  };

  // Legacy PINs are disabled: operational access requires an authenticated Neon profile.
  const loginOpEmployee = (_role: string, _pin: string, _name?: string): boolean => false;

  const logoutOpEmployee = () => {
    setOpEmployee(null);
    localStorage.removeItem(`op_auth_employee_${storeId}`);
  };

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
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOfflineMode) return;

    const fetchSession = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Falha ao verificar sessão:', err);
        setSession(null);
        setUser(null);
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

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setOpEmployee(null);
    localStorage.removeItem(`op_auth_employee_${storeId}`);
    sessionStorage.removeItem('admin_auth');
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, activeRole, setActiveRole, opEmployee, loginOpEmployee, logoutOpEmployee, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

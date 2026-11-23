import { createContext, useContext } from 'react';
import type { Profile, Session, User } from '../types';

export interface OpEmployee {
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


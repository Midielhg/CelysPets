import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupabaseAuthService, type UserProfile } from '../services/supabaseAuthService';
import type { ReactNode } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'admin' | 'groomer';
  businessSettings?: {
    businessName: string;
    serviceArea: string[];
    timeSlots: string[];
  };
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, role?: 'client' | 'admin' | 'groomer') => Promise<void>;
  updateProfile: (name: string, role?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert UserProfile to User interface for backward compatibility
  const convertToUser = (supabaseUser: SupabaseUser, profile: UserProfile): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: profile.name,
    role: profile.role,
    businessSettings: profile.business_settings
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { user: currentUser, profile } = await SupabaseAuthService.getCurrentUser();
        
        if (currentUser && profile) {
          setSupabaseUser(currentUser);
          setUser(convertToUser(currentUser, profile));
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = SupabaseAuthService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setSession(session);
      setSupabaseUser(session?.user || null);

      if (session?.user) {
        try {
          const profile = await SupabaseAuthService.getUserProfile(session.user.id);
          if (profile) {
            setUser(convertToUser(session.user, profile));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔄 Starting login process...');
      setIsLoading(true);
      
      const result = await SupabaseAuthService.signIn(email, password);
      console.log('📡 Auth service result:', { 
        hasUser: !!result.user, 
        hasProfile: !!result.profile, 
        error: result.error 
      });
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.user && result.profile) {
        setSupabaseUser(result.user);
        setUser(convertToUser(result.user, result.profile));
        setSession(result.session);
        console.log('✅ Login successful, user state updated');
      } else if (result.user && !result.profile) {
        console.log('⚠️ User authenticated but no profile found. Database tables may not exist.');
        throw new Error('User profile not found. Please run the database migration first.');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      console.log('🏁 Login process complete, resetting loading state');
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: 'client' | 'admin' | 'groomer' = 'client') => {
    try {
      setIsLoading(true);
      
      const result = await SupabaseAuthService.signUp(email, password, name, role);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Note: After signup, user might need to confirm email
      // The auth state change listener will handle setting the user when confirmed
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await SupabaseAuthService.signOut();
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
      
      // Clean up any legacy tokens
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  };

  const updateProfile = async (name: string, role?: string) => {
    try {
      const result = await SupabaseAuthService.updateProfile(name, role);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh user data
      if (supabaseUser) {
        const profile = await SupabaseAuthService.getUserProfile(supabaseUser.id);
        if (profile) {
          setUser(convertToUser(supabaseUser, profile));
        }
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error(error instanceof Error ? error.message : 'Profile update failed');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await SupabaseAuthService.resetPassword(email);
      
      if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw new Error(error instanceof Error ? error.message : 'Password reset failed');
    }
  };

  const value = {
    user,
    supabaseUser,
    session,
    login,
    logout,
    register,
    updateProfile,
    resetPassword,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

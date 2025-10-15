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
  
  // Debounce auth state processing to prevent rapid successive calls
  const [authProcessingTimeout, setAuthProcessingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Convert UserProfile to User interface for backward compatibility
  const convertToUser = (supabaseUser: SupabaseUser, profile: UserProfile): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: profile.name,
    role: profile.role,
    businessSettings: profile.business_settings
  });

  useEffect(() => {
    // Get initial session with better persistence
    const getInitialSession = async () => {
      try {
        console.log('🔄 Initializing session...');
        setIsLoading(true);
        
        // First try to get the current session from Supabase
        const session = await SupabaseAuthService.getSession();
        
        if (session?.user) {
          console.log('✅ Found existing session for:', session.user.email);
          setSession(session);
          setSupabaseUser(session.user);
          
          // Get the user profile
          const profile = await SupabaseAuthService.getUserProfile(session.user.id);
          if (profile) {
            setUser(convertToUser(session.user, profile));
            console.log('✅ User session restored successfully');
          }
        } else {
          console.log('ℹ️ No existing session found');
        }
      } catch (error) {
        console.error('❌ Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = SupabaseAuthService.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      
      // Prevent redundant processing for TOKEN_REFRESHED events
      if (event === 'TOKEN_REFRESHED' && user && session?.user?.id === user.id) {
        console.log('🔄 Token refreshed for existing user, skipping profile reload');
        setSession(session);
        return;
      }

      // Skip profile loading if this is from a direct login call
      if (event === 'SIGNED_IN' && user && session?.user?.id === user.id) {
        console.log('⚡ Skipping redundant profile fetch - user already set from login');
        setSession(session);
        setSupabaseUser(session.user);
        setIsLoading(false);
        return;
      }
      
      setSession(session);
      setSupabaseUser(session?.user || null);

      if (session?.user) {
        try {
          console.log('👤 Loading user profile...');
          const profile = await SupabaseAuthService.getUserProfile(session.user.id);
          if (profile) {
            const userData = convertToUser(session.user, profile);
            setUser(userData);
            console.log('✅ User authenticated:', userData.email, userData.role);
          }
        } catch (error) {
          console.error('❌ Error fetching user profile:', error);
        }
      } else {
        console.log('👋 User logged out or session expired');
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
        // Direct login success with profile - set state immediately
        setSupabaseUser(result.user);
        setSession(result.session);
        setUser(convertToUser(result.user, result.profile));
        console.log('✅ Login successful with profile');
        return; // Exit early to avoid auth state change processing
      } else if (result.user) {
        // User authenticated but no profile - this usually means RLS policy issues
        console.log('⚠️ User authenticated but no profile - this may indicate RLS policy problems');
        console.log('🔍 User metadata:', result.user.user_metadata);
          
        // Try to determine role from user metadata or email
        let role: 'client' | 'admin' | 'groomer' = 'client';
        if (result.user.email === 'admin@celyspets.com' || 
            result.user.user_metadata?.role === 'admin') {
          role = 'admin';
        } else if (result.user.user_metadata?.role === 'groomer') {
          role = 'groomer';
        }
        
        const tempUser: User = {
          id: result.user.id,
          email: result.user.email || '',
          name: result.user.user_metadata?.name || result.user.email?.split('@')[0] || 'User',
          role: role
        };
        setUser(tempUser);
        console.log('✅ Login successful with temporary profile, role:', role);
      } else {
        throw new Error('Authentication failed - no user returned');
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
      console.log('🚪 Logging out user...');
      await SupabaseAuthService.signOut();
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
      
      // Clean up any legacy tokens and session data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  };

  const updateProfile = async (name: string, role?: string) => {
    try {
      // TODO: Implement updateProfile method in SupabaseAuthService
      console.log('Update profile called with:', name, role);
      const result = { error: null };
      
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

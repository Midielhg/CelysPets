import { supabase } from '../config/supabase'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: 'client' | 'admin' | 'groomer'
  business_settings?: any
  google_tokens?: any
  created_at: string
  updated_at: string
}

export class SupabaseAuthService {
  private static profileCache = new Map<string, { profile: UserProfile; timestamp: number }>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Simple sign in with timeout handling
  static async signIn(email: string, password: string) {
    try {
      console.log('🔐 Signing in:', email);
      
      // Step 1: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error('❌ Auth error:', error);
        return { user: null, profile: null, session: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, profile: null, session: null, error: 'No user returned' };
      }

      console.log('✅ User authenticated:', data.user.email);

      // Step 2: Try to get profile with timeout
      let profile: UserProfile | null = null;
      
      try {
        // Add timeout to profile fetch (increased to 10 seconds)
        const profileTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
        });
        
        const profileFetch = supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();
          
        const { data: profileData, error: profileError } = await Promise.race([
          profileFetch,
          profileTimeout
        ]);
        
        if (profileError && !profileError.message.includes('timeout')) {
          console.warn('⚠️ Profile fetch error (non-timeout):', profileError);
        }
        
        profile = profileData;
        
      } catch (fetchError: any) {
        console.warn('⚠️ Profile fetch failed:', fetchError.message);
      }

      // Step 3: If no profile, create a basic one (with timeout)
      if (!profile) {
        try {
          console.log('🔧 Creating basic profile...');
          
          const basicProfile = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            role: 'client' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const createTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Profile creation timeout')), 2000);
          });
          
          const createProfile = supabase
            .from('user_profiles')
            .upsert([basicProfile])
            .select()
            .single();
            
          const { data: newProfile, error: createError } = await Promise.race([
            createProfile,
            createTimeout
          ]);
          
          if (!createError && newProfile) {
            profile = newProfile as UserProfile;
            console.log('✅ Created profile:', profile.email);
          }
          
        } catch (createErr: any) {
          console.warn('⚠️ Profile creation failed:', createErr.message);
        }
      }

      return { 
        user: data.user, 
        profile: profile, 
        session: data.session,
        error: null 
      };
      
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      return { user: null, profile: null, session: null, error: error.message };
    }
  }

  // Sign up new user with better error handling and validation
  static async signUp(email: string, password: string, name: string, role: 'client' | 'admin' | 'groomer' = 'client') {
    try {
      console.log('🔐 Creating new user:', email, 'Role:', role);
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Invalid email format. Please enter a valid email address.');
      }
      
      // Supabase Auth signup
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            role: role
          }
        }
      });

      if (error) {
        console.error('❌ Supabase Auth signup error:', error);
        
        // Handle specific error types
        if (error.message.includes('email') && error.message.includes('invalid')) {
          throw new Error('Email format is not accepted by the authentication system. Please try a different email address.');
        } else if (error.message.includes('User already registered')) {
          throw new Error('A user with this email address already exists.');
        } else if (error.message.includes('Password')) {
          throw new Error('Password does not meet requirements. Please use a stronger password.');
        }
        
        throw new Error(`Account creation failed: ${error.message}`);
      }

      if (!data.user) {
        throw new Error('Account creation failed - no user returned from authentication service');
      }

      console.log('✅ User created in Supabase Auth:', data.user.id);
      
      // Try to create user profile with timeout
      let profile: UserProfile | null = null;
      
      try {
        console.log('🔧 Creating user profile...');
        
        const profileData = {
          id: data.user.id,
          email: data.user.email || email.trim().toLowerCase(),
          name: name.trim(),
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const createTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Profile creation timeout')), 3000);
        });
        
        const createProfile = supabase
          .from('user_profiles')
          .upsert([profileData])
          .select()
          .single();
          
        const { data: newProfile, error: createError } = await Promise.race([
          createProfile,
          createTimeout
        ]);
        
        if (createError) {
          console.warn('⚠️ Profile creation error:', createError);
        } else if (newProfile) {
          profile = newProfile as UserProfile;
          console.log('✅ Created user profile:', profile.email);
        }
        
      } catch (profileErr: any) {
        console.warn('⚠️ Profile creation failed:', profileErr.message);
        // Continue anyway - user is created in auth, profile can be created later
      }

      return { 
        user: data.user, 
        profile: profile,
        error: null 
      };
      
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      return { user: null, profile: null, error: error.message };
    }
  }

  // Sign out user
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      console.error('Sign out error:', error)
      return { error: error.message }
    }
  }

  // Get current session
  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error: any) {
      console.error('Get session error:', error)
      return null
    }
  }

  // Get current user
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { user, error: null }
    } catch (error: any) {
      console.error('Get current user error:', error)
      return { user: null, error: error.message }
    }
  }

  // Get user profile with timeout and caching
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Check cache first
      const cached = this.profileCache.get(userId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('📋 Using cached profile for user:', userId);
        return cached.profile;
      }

      console.log('🔍 Fetching profile for user:', userId);
      
      // Increase timeout and add better error handling
      const profileTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 30000); // Increased to 30 seconds
      });
      
      const profileFetch = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      const { data, error } = await Promise.race([profileFetch, profileTimeout]);

      if (error) {
        console.error('❌ Profile fetch error:', error);
        return null;
      }
      
      if (data) {
        // Cache the profile
        this.profileCache.set(userId, {
          profile: data as UserProfile,
          timestamp: Date.now()
        });
        console.log('✅ Profile found and cached:', data.email);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Get user profile error:', error);
      return null;
    }
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      console.error('Reset password error:', error)
      return { error: error.message }
    }
  }

  // Update user password
  static async updatePassword(password: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      console.error('Update password error:', error)
      return { error: error.message }
    }
  }

  // Listen to auth changes
  static onAuthStateChange(callback: (event: any, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Create user with proper auth flow
  static async createUserWithAuth(email: string, password: string, name: string, role: 'client' | 'admin' | 'groomer') {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      })

      if (error) throw error
      return { user: data.user, error: null }
    } catch (error: any) {
      console.error('Create user error:', error)
      return { user: null, error: error.message }
    }
  }
}
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
  // Sign up new user
  static async signUp(email: string, password: string, name: string, role: 'client' | 'admin' | 'groomer' = 'client') {
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
      console.error('Sign up error:', error)
      return { user: null, error: error.message }
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      console.log('🔐 Attempting to sign in with:', email);
      console.log('🌐 Attempting Supabase authentication...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      })

      console.log('📨 Supabase signIn response:', { data, error });

      if (error) {
        console.error('❌ Supabase signIn error:', error);
        throw error;
      }

      if (!data.user) {
        console.error('❌ No user returned from signIn');
        throw new Error('No user returned from authentication');
      }

      console.log('✅ User authenticated:', data.user.email);
      console.log('👤 User ID:', data.user.id);

      // Get user profile
      const profile = await this.getUserProfile(data.user.id);
      
      // If no profile exists, create a basic one
      if (!profile) {
        console.log('⚠️  No profile found, creating basic profile for user:', data.user.email);
        const basicProfile = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          role: 'client' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Try to create the profile
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([basicProfile])
            .select()
            .single();
            
          if (createError) {
            console.error('❌ Failed to create profile:', createError);
            // Continue without profile for now
          } else {
            console.log('✅ Created basic profile');
            return { 
              user: data.user, 
              profile: newProfile as UserProfile, 
              session: data.session,
              error: null 
            };
          }
        } catch (createErr) {
          console.error('❌ Profile creation error:', createErr);
        }
      }

      return { 
        user: data.user, 
        profile, 
        session: data.session,
        error: null 
      };
    } catch (error: any) {
      console.error('🚫 Sign in error:', error);
      return { user: null, profile: null, session: null, error: error.message };
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

  // Refresh the current session
  static async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      return { session: data.session, user: data.user, error: null }
    } catch (error: any) {
      console.error('Refresh session error:', error)
      return { session: null, user: null, error: error.message }
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
      if (!user) return { user: null, profile: null }

      const profile = await this.getUserProfile(user.id)
      return { user, profile }
    } catch (error: any) {
      console.error('Get current user error:', error)
      return { user: null, profile: null }
    }
  }

  // Get user profile
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('🔍 Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('📋 Profile fetch error:', error);
        
        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "user_profiles" does not exist')) {
          throw new Error('Database tables not created. Please run the migration SQL first.');
        }
        
        throw error;
      }
      
      console.log('✅ Profile found:', { 
        email: data?.email, 
        name: data?.name, 
        role: data?.role 
      });
      
      return data;
    } catch (error) {
      console.error('❌ Get user profile error:', error);
      
      // Return null for profile not found, but re-throw other errors
      if (error instanceof Error && error.message.includes('Database tables not created')) {
        throw error;
      }
      
      return null;
    }
  }

  // Update user profile
  static async updateProfile(name: string, role?: string) {
    try {
      const { data, error } = await supabase.rpc('update_user_profile', {
        user_name: name,
        user_role: role
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Update profile error:', error)
      return { data: null, error: error.message }
    }
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
      return { error: null }
    } catch (error: any) {
      console.error('Reset password error:', error)
      return { error: error.message }
    }
  }

  // Update password
  static async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      return { error: null }
    } catch (error: any) {
      console.error('Update password error:', error)
      return { error: error.message }
    }
  }

  // Get all user profiles (admin only)
  static async getAllProfiles(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get all profiles error:', error)
      return []
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Migrate existing user (simplified approach - users must sign up normally)
  static async createNewUser(email: string, password: string, name: string, role: string) {
    try {
      // Use regular signUp instead of admin functions
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

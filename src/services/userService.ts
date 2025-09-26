import { supabase } from '../config/supabase';
import { adminSupabase, isAdminClientAvailable } from './adminSupabaseClient';

export interface User {
  id: string; // UUID from Supabase user_profiles table
  name: string;
  email: string;
  role: 'client' | 'admin' | 'groomer';
  created_at?: string;
  updated_at?: string;
}

export interface UserStats {
  overview: {
    admins: number;
    clients: number;
    groomers: number;
    users: number;
  };
  recentUsers: User[];
  totalUsers: number;
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UserListResponse {
  users: User[];
  pagination: UserPagination;
}

export class UserService {
  /**
   * Fetch users with pagination, search, and role filtering
   */
  static async getUsers(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    roleFilter: string = 'all'
  ): Promise<UserListResponse> {
    try {
      console.log('👥 UserService: Fetching users...', { page, limit, search, roleFilter });

            // Build query for user_profiles table
      let query = supabase
        .from('user_profiles')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Apply role filter
      if (roleFilter && roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      // Apply sorting and pagination
      query = query.order('created_at', { ascending: false });

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: users, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      console.log('👥 Users fetched:', users?.length || 0, 'of', total);

      return {
        users: users || [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages
        }
      };
    } catch (error) {
      console.error('❌ UserService.getUsers error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics overview
   */
  static async getUserStats(): Promise<UserStats> {
    try {
      console.log('📊 UserService: Fetching user statistics...');

            // Get user counts by role from user_profiles table
      const { data: roleCounts, error: roleError } = await supabase
        .from('user_profiles')
        .select('role')
        .not('role', 'is', null);

      if (roleError) {
        console.error('❌ Error fetching role counts:', roleError);
        throw roleError;
      }

      // Count users by role
      const overview = {
        admins: 0,
        clients: 0,
        groomers: 0,
        users: roleCounts?.length || 0
      };

      console.log('🔍 Debug: Role data from database:', roleCounts);

      roleCounts?.forEach((user: any) => {
        // Handle both lowercase and capitalized versions
        const roleToMatch = user.role?.toLowerCase();
        
        switch (roleToMatch) {
          case 'admin':
            overview.admins++;
            break;
          case 'client':
            overview.clients++;
            break;
          case 'groomer':
            overview.groomers++;
            break;
          default:
            console.log('⚠️ Unknown role found:', user.role);
        }
      });

      // Get recent users (last 10) from user_profiles table
      const { data: recentUsers, error: recentError } = await supabase
        .from('user_profiles')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) {
        console.error('❌ Error fetching recent users:', recentError);
        throw recentError;
      }

      console.log('📊 User stats:', overview);
      console.log('🆕 Recent users:', recentUsers?.length || 0);

      return {
        overview,
        recentUsers: recentUsers || [],
        totalUsers: overview.users
      };
    } catch (error) {
      console.error('❌ UserService.getUserStats error:', error);
      throw error;
    }
  }

    /**
   * Create a new user using SupabaseAuthService for consistent authentication handling
   * The user profile will be created automatically via database trigger
   */
  static async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password: string }): Promise<User> {
    try {
      console.log('➕ UserService: Creating user via SupabaseAuthService...', userData);
      console.log('🔑 Admin client available:', isAdminClientAvailable);

      // Import SupabaseAuthService dynamically to avoid circular dependency
      const { SupabaseAuthService } = await import('./supabaseAuthService');

      // First check if user already exists with this email
      const clientToUse = isAdminClientAvailable ? adminSupabase : supabase;
      const { data: existingUser } = await clientToUse
        .from('user_profiles')
        .select('id, email')
        .eq('email', userData.email.toLowerCase())
        .maybeSingle(); // Use maybeSingle to avoid error when no match

      if (existingUser) {
        throw new Error('A user with this email address already exists');
      }

      // Use SupabaseAuthService for consistent authentication handling
      console.log('🔐 Creating user via SupabaseAuthService...');
      const result = await SupabaseAuthService.signUp(
        userData.email,
        userData.password,
        userData.name,
        userData.role
      );

      if (result.error) {
        console.error('❌ SupabaseAuthService error:', result.error);
        throw new Error(result.error);
      }

      if (!result.user) {
        throw new Error('Failed to create user in authentication system');
      }

      console.log('✅ User created via SupabaseAuthService:', result.user.id);

      // If profile was created by SupabaseAuthService, return it
      if (result.profile) {
        console.log('✅ Profile created by SupabaseAuthService:', result.profile.email);
        return result.profile;
      }

      // Otherwise, wait for database trigger or create manually (fallback)
      console.log('⏳ Waiting for database trigger to create profile...');
      await new Promise(resolve => setTimeout(resolve, 500));

      let { data: profileData, error: profileError } = await clientToUse
        .from('user_profiles')
        .select('*')
        .eq('id', result.user.id)
        .single();

      if (profileError || !profileData) {
        console.error('❌ Error fetching created user profile:', profileError);
        console.warn('⚠️ User created in Auth but profile may not exist. Attempting manual creation...');
        
        // Fallback: manually create the profile
        const userProfile = {
          id: result.user.id,
          email: userData.email.toLowerCase().trim(),
          name: userData.name.trim(),
          role: userData.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: manualProfile, error: manualError } = await clientToUse
          .from('user_profiles')
          .upsert([userProfile])
          .select()
          .single();

        if (manualError) {
          console.error('❌ Manual profile creation failed:', manualError);
          // Try to clean up the auth user if profile creation failed
          try {
            await clientToUse.auth.admin.deleteUser(result.user.id);
          } catch (cleanupError) {
            console.error('❌ Failed to cleanup auth user:', cleanupError);
          }
          throw new Error(`Failed to create user profile: ${manualError.message}`);
        }

        profileData = manualProfile;
      }

      console.log('✅ User created successfully:', {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        role: profileData.role
      });

      return profileData;
    } catch (error: any) {
      console.error('❌ UserService.createUser error:', error);
      
      // Provide more user-friendly error messages
      if (error.message.includes('email') && error.message.includes('invalid')) {
        throw new Error('The email address format is not accepted. Please try a different email address.');
      } else if (error.message.includes('already registered') || error.message.includes('already exists')) {
        throw new Error('A user with this email address already exists.');
      } else if (error.message.includes('Password')) {
        throw new Error('Password does not meet security requirements. Please use at least 6 characters.');
      }
      
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  static async updateUser(id: string, userData: Partial<User> & { password?: string }): Promise<User> {
    try {
      console.log('✏️ UserService: Updating user...', id, userData);

      // If password is being updated, store it as password_hash
      const updateData: any = { ...userData };
      if (updateData.password) {
        console.log('🔐 Updating password for user...');
        updateData.password_hash = updateData.password;
        delete updateData.password;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating user:', error);
        
        // Handle specific database errors
        if (error.code === '23505') {
          throw new Error('A user with this email already exists');
        } else if (error.code === '23502') {
          throw new Error('Please fill in all required fields');
        } else {
          throw new Error(error.message || 'Failed to update user');
        }
      }

      console.log('✅ User updated:', data);
      return data;
    } catch (error) {
      console.error('❌ UserService.updateUser error:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: string): Promise<void> {
    try {
      console.log('🗑️ UserService: Deleting user...', id);

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting user:', error);
        
        // Handle specific database errors
        if (error.code === '23503') {
          throw new Error('Cannot delete user: they have associated records that must be removed first');
        } else {
          throw new Error(error.message || 'Failed to delete user');
        }
      }

      console.log('✅ User deleted:', id);
    } catch (error) {
      console.error('❌ UserService.deleteUser error:', error);
      throw error;
    }
  }

  /**
   * Delete multiple users
   */
  static async deleteMultipleUsers(ids: string[]): Promise<void> {
    try {
      console.log('🗑️ UserService: Deleting multiple users...', ids);

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('❌ Error deleting multiple users:', error);
        throw error;
      }

      console.log('✅ Users deleted:', ids);
    } catch (error) {
      console.error('❌ UserService.deleteMultipleUsers error:', error);
      throw error;
    }
  }

  /**
   * Get a single user by ID
   */
  static async getUserById(id: string): Promise<User | null> {
    try {
      console.log('🔍 UserService: Fetching user by ID...', id);

      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ User not found:', id);
          return null;
        }
        console.error('❌ Error fetching user:', error);
        throw error;
      }

      console.log('✅ User found:', data);
      return data;
    } catch (error) {
      console.error('❌ UserService.getUserById error:', error);
      throw error;
    }
  }

  /**
   * Get all groomers for appointment assignment
   */
  static async getGroomers(): Promise<User[]> {
    try {
      console.log('👷‍♀️ UserService: Fetching all groomers...');

      const { data: groomers, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'groomer')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching groomers:', error);
        throw error;
      }

      console.log('✅ Groomers fetched:', groomers?.length || 0);
      return groomers || [];
    } catch (error) {
      console.error('❌ UserService.getGroomers error:', error);
      throw error;
    }
  }

  /**
   * Get all assignable users (groomers and admins) for appointment assignment
   */
  static async getAssignableUsers(): Promise<User[]> {
    try {
      console.log('👷‍♀️ UserService: Fetching assignable users (groomers and admins)...');

      const { data: assignableUsers, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('role', ['groomer', 'admin'])
        .order('role', { ascending: true }) // Admin first, then groomers
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching assignable users:', error);
        throw error;
      }

      console.log('✅ Assignable users fetched:', assignableUsers?.length || 0);
      return assignableUsers || [];
    } catch (error) {
      console.error('❌ UserService.getAssignableUsers error:', error);
      throw error;
    }
  }
}

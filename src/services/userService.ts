import { createClient } from '@supabase/supabase-js';

// Create a simple untyped client for easier development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: number; // Reverted back to number to match current database schema
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

      // Build query
      let query = supabase
        .from('users')
        .select('id, name, email, role, created_at, updated_at', { count: 'exact' });

      // Apply role filter
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      // Apply search filter
      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Apply pagination
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      query = query.range(start, end).order('created_at', { ascending: false });

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

      // Get user counts by role
      const { data: roleCounts, error: roleError } = await supabase
        .from('users')
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

      // Get recent users (last 10)
      const { data: recentUsers, error: recentError } = await supabase
        .from('users')
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
   * Create a new user (using database auto-generated ID)
   */
  static async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    try {
      console.log('➕ UserService: Creating user with auto-generated ID...', userData);

      // Create user profile in our custom users table (let DB generate ID)
      const userProfile = {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        password: 'temp123456' // Required by our table schema
      };

      console.log('🔄 Creating user profile in database...', userProfile);

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert([userProfile])
        .select()
        .single();

      if (profileError) {
        console.error('❌ Error creating user profile:', profileError);
        throw profileError;
      }

      console.log('✅ User profile created with ID:', profileData.id);

      // Note: For now, this creates users in the profile table only
      // Full Supabase Auth integration requires database schema changes
      console.log('ℹ️ Note: User created in profile table. They can be managed through admin interface.');

      return profileData;
    } catch (error) {
      console.error('❌ UserService.createUser error:', error);
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  static async updateUser(id: number, userData: Partial<User>): Promise<User> {
    try {
      console.log('✏️ UserService: Updating user...', id, userData);

      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating user:', error);
        throw error;
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
  static async deleteUser(id: number): Promise<void> {
    try {
      console.log('🗑️ UserService: Deleting user...', id);

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting user:', error);
        throw error;
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
  static async deleteMultipleUsers(ids: number[]): Promise<void> {
    try {
      console.log('🗑️ UserService: Deleting multiple users...', ids);

      const { error } = await supabase
        .from('users')
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
  static async getUserById(id: number): Promise<User | null> {
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
}

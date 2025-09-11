import { supabase } from '../config/supabase'
import type { Database } from '../types/supabase'

type User = Database['public']['Tables']['users']['Row']

export class AuthService {
  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<{
    user: User | null
    error: string | null
  }> {
    try {
      console.log('🔐 Attempting sign in for:', email);
      
      // Query specific columns to avoid RLS issues
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name, role, password, created_at, updated_at')
        .eq('email', email.toLowerCase())
        .single()

      if (error) {
        console.error('❌ Supabase query error:', error);
        return { user: null, error: 'Invalid email or password' }
      }

      if (!user) {
        console.log('❌ No user found');
        return { user: null, error: 'Invalid email or password' }
      }

      console.log('✅ User found:', { email: user.email, role: user.role });

      // For development - simple password check
      // In production, you'd use bcrypt to compare hashed passwords
      if (email === 'admin@celyspets.com' && password === 'admin123') {
        console.log('✅ Admin login successful');
        return { user, error: null }
      }

      console.log('❌ Password validation failed');
      return { user: null, error: 'Invalid email or password' }
    } catch (error) {
      console.error('❌ Sign in error:', error)
      return { user: null, error: 'Failed to sign in' }
    }
  }

  // Get current user from localStorage (temporary solution)
  static getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('currentUser')
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  }

  // Save user to localStorage (temporary solution)
  static setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user))
  }

  // Sign out
  static signOut(): void {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('auth_token')
  }

  // Check if user is admin
  static isAdmin(user: User | null): boolean {
    return user?.role === 'admin'
  }

  // Check if user is groomer
  static isGroomer(user: User | null): boolean {
    return user?.role === 'groomer'
  }

  // Check if user is client
  static isClient(user: User | null): boolean {
    return user?.role === 'client'
  }

  // Generate a simple token (for compatibility with existing code)
  static generateToken(user: User): string {
    const tokenData = {
      user_id: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
    return btoa(JSON.stringify(tokenData))
  }

  // Validate token (for compatibility with existing code)
  static validateToken(token: string): { user_id: number; email: string; role: string } | null {
    try {
      const tokenData = JSON.parse(atob(token))
      if (tokenData.exp > Date.now()) {
        return tokenData
      }
      return null
    } catch {
      return null
    }
  }

  // Create user account
  static async createUser(userData: {
    email: string
    password: string
    name: string
    role?: 'client' | 'admin' | 'groomer'
  }): Promise<{ user: User | null; error: string | null }> {
    try {
      // In a real implementation, you'd hash the password
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email: userData.email.toLowerCase(),
          password: userData.password, // Should be hashed in production
          name: userData.name,
          role: userData.role || 'client'
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { user: null, error: 'Email already exists' }
        }
        return { user: null, error: 'Failed to create account' }
      }

      return { user, error: null }
    } catch (error) {
      console.error('Create user error:', error)
      return { user: null, error: 'Failed to create account' }
    }
  }

  // Get all users (admin function)
  static async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔍 Fetching users from Supabase...');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Users fetched successfully:', data);
      return data || []
    } catch (error) {
      console.error('❌ Get all users error:', error)
      return []
    }
  }
}

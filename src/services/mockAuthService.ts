// Temporary auth service until Supabase is configured
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'admin' | 'groomer';
  business_settings?: any;
  google_tokens?: any;
  created_at: string;
  updated_at: string;
}

// Mock user data
const mockUsers = [
  {
    id: 'admin-1',
    email: 'admin@celyspets.com',
    name: 'Admin User',
    role: 'admin' as const,
    password: 'admin123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'client-1',
    email: 'client@example.com',
    name: 'Test Client',
    role: 'client' as const,
    password: 'client123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let currentUser: any = null;
let currentSession: any = null;

export class SupabaseAuthService {
  // Mock current user data
  static async getCurrentUser() {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async
    if (currentUser) {
      return {
        user: {
          id: currentUser.id,
          email: currentUser.email,
        },
        profile: currentUser,
      };
    }
    return { user: null, profile: null };
  }

  // Mock auth state change listener
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    // Simulate auth state listener
    setTimeout(() => {
      if (currentUser) {
        callback('SIGNED_IN', currentSession);
      } else {
        callback('SIGNED_OUT', null);
      }
    }, 100);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            console.log('Auth listener unsubscribed');
          },
        },
      },
    };
  }

  // Mock user profile fetch
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const user = mockUsers.find(u => u.id === userId);
    return user || null;
  }

  // Mock sign in
  static async signIn(email: string, password: string) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (!user) {
      return { user: null, session: null, error: 'Invalid credentials' };
    }

    currentUser = user;
    currentSession = {
      access_token: 'mock-token',
      user: {
        id: user.id,
        email: user.email,
      },
    };

    return {
      user: currentSession.user,
      session: currentSession,
      profile: user,
      error: null,
    };
  }

  // Mock sign up
  static async signUp(email: string, password: string, name: string, role: 'client' | 'admin' | 'groomer' = 'client') {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if user already exists
    if (mockUsers.find(u => u.email === email)) {
      return { user: null, session: null, error: 'User already exists' };
    }

    const newUser = {
      id: `${role}-${Date.now()}`,
      email,
      name,
      role,
      password,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockUsers.push(newUser as any);
    currentUser = newUser;
    currentSession = {
      access_token: 'mock-token',
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    };

    return {
      user: currentSession.user,
      session: currentSession,
      profile: newUser,
      error: null,
    };
  }

  // Mock sign out
  static async signOut() {
    await new Promise(resolve => setTimeout(resolve, 200));
    currentUser = null;
    currentSession = null;
    return { error: null };
  }

  // Mock profile update
  static async updateProfile(name: string, role?: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!currentUser) {
      return { user: null, error: 'No user logged in' };
    }

    currentUser.name = name;
    if (role) currentUser.role = role;
    currentUser.updated_at = new Date().toISOString();

    return { user: currentUser, error: null };
  }

  // Mock password reset
  static async resetPassword(email: string) {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Password reset email sent to: ${email}`);
    return { data: {}, error: null };
  }
}

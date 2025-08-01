import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'admin';
  businessSettings?: {
    businessName: string;
    serviceArea: string[];
    timeSlots: string[];
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved token and validate it
    const validateToken = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // For development mode, accept mock tokens
          if (token.startsWith('dev-token-')) {
            const mockUser = {
              id: '1',
              email: 'admin@celyspets.com',
              name: 'Admin User',
              role: 'admin' as const
            };
            setUser(mockUser);
            setIsLoading(false);
            return;
          }
          
          const response = await fetch('http://localhost:5001/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          // Token validation failed, remove it
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };

    validateToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Login attempt:', { email, password: '***' });
      
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`Login failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data.token && data.user) {
        localStorage.setItem('auth_token', data.token);
        setUser(data.user);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
    } catch (error) {
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    register,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

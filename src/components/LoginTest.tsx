import React, { useState } from 'react';
import { AuthService } from '../services/authService';

const LoginTest: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  const testLogin = async () => {
    setStatus('loading');
    setMessage('');
    
    try {
      console.log('🔐 Testing login...');
      
      const result = await AuthService.signIn('admin@celyspets.com', 'admin123');
      
      if (result.user && !result.error) {
        setStatus('success');
        setUser(result.user);
        setMessage('Login successful!');
        
        // Store token for app compatibility
        localStorage.setItem('auth_token', `supabase-user-${result.user.id}`);
        
        console.log('✅ Login successful:', result.user);
      } else {
        setStatus('error');
        setMessage(result.error || 'Login failed');
        console.log('❌ Login failed:', result.error);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('❌ Login error:', error);
    }
  };

  const testAllUsers = async () => {
    try {
      console.log('👥 Fetching all users...');
      const users = await AuthService.getAllUsers();
      console.log('Users in database:', users);
      setMessage(`Found ${users.length} users in database. Check console for details.`);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Error fetching users');
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Login Test</h1>
          
          <div className="space-y-4">
            <button
              onClick={testLogin}
              disabled={status === 'loading'}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {status === 'loading' ? 'Testing Login...' : 'Test Admin Login'}
            </button>
            
            <button
              onClick={testAllUsers}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 ml-4"
            >
              Check All Users
            </button>
            
            {message && (
              <div className={`p-4 rounded ${
                status === 'success' ? 'bg-green-100 text-green-800' :
                status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {message}
              </div>
            )}
            
            {user && (
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-semibold mb-2">Logged in user:</h3>
                <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
                
                <div className="mt-4 space-x-4">
                  <a
                    href="/admin"
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Go to Admin Dashboard
                  </a>
                  <a
                    href="/dashboard"
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                  >
                    Go to User Dashboard
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 bg-blue-50 p-4 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside text-blue-700 space-y-1">
              <li>Click "Test Admin Login" to test the Supabase login</li>
              <li>Check browser console for detailed logs</li>
              <li>If successful, try accessing the admin dashboard</li>
              <li>The admin credentials are: admin@celyspets.com / admin123</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginTest;

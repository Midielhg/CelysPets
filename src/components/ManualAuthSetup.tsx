import { useState } from 'react';
import { SupabaseAuthService } from '../services/supabaseAuthService';

export default function ManualAuthSetup() {
  const [email, setEmail] = useState('admin@celyspets.com');
  const [password, setPassword] = useState('admin123');
  const [name, setName] = useState('Administrator');
  const [role, setRole] = useState<'client' | 'admin' | 'groomer'>('admin');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleSignUp = async () => {
    setStatus('loading');
    setMessage('');

    try {
      const result = await SupabaseAuthService.signUp(email, password, name, role);
      
      if (result.error) {
        setStatus('error');
        setMessage(result.error);
      } else {
        setStatus('success');
        setMessage('Account created successfully! Check your email for confirmation.');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  const handleSignIn = async () => {
    setStatus('loading');
    setMessage('');

    try {
      const result = await SupabaseAuthService.signIn(email, password);
      
      if (result.error) {
        setStatus('error');
        setMessage(result.error);
      } else {
        setStatus('success');
        setCurrentUser(result);
        setMessage(`Signed in as ${result.profile?.name} (${result.profile?.role})`);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await SupabaseAuthService.signOut();
      setCurrentUser(null);
      setMessage('Signed out successfully');
    } catch (error: any) {
      setMessage(`Sign out error: ${error.message}`);
    }
  };

  const checkCurrentUser = async () => {
    try {
      const result = await SupabaseAuthService.getCurrentUser();
      setCurrentUser(result);
      if (result.user) {
        setMessage(`Current user: ${result.profile?.name} (${result.profile?.role})`);
      } else {
        setMessage('No current user');
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manual Auth Setup</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create User Account</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'client' | 'admin' | 'groomer')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="groomer">Groomer</option>
              <option value="client">Client</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSignUp}
            disabled={status === 'loading'}
            className={`px-4 py-2 rounded-lg font-medium ${
              status === 'loading'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {status === 'loading' ? 'Creating...' : 'Sign Up'}
          </button>
          
          <button
            onClick={handleSignIn}
            disabled={status === 'loading'}
            className={`px-4 py-2 rounded-lg font-medium ${
              status === 'loading'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {status === 'loading' ? 'Signing In...' : 'Sign In'}
          </button>
          
          <button
            onClick={checkCurrentUser}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Check User
          </button>
          
          {currentUser?.user && (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Sign Out
            </button>
          )}
        </div>
        
        {message && (
          <div className={`mt-4 p-3 rounded-lg ${
            status === 'success' ? 'bg-green-50 text-green-800' :
            status === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {message}
          </div>
        )}
      </div>

      {currentUser?.user && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Current User</h2>
          <div className="space-y-2">
            <p><strong>ID:</strong> {currentUser.user.id}</p>
            <p><strong>Email:</strong> {currentUser.user.email}</p>
            <p><strong>Email Confirmed:</strong> {currentUser.user.email_confirmed_at ? 'Yes' : 'No'}</p>
            {currentUser.profile && (
              <>
                <p><strong>Name:</strong> {currentUser.profile.name}</p>
                <p><strong>Role:</strong> {currentUser.profile.role}</p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">📋 Instructions</h3>
        <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
          <li>First, run the SQL setup in your Supabase dashboard (supabase-auth-migration.sql)</li>
          <li>Create accounts for each user manually using this form</li>
          <li>Users will receive email confirmations (check if emails are enabled in Supabase)</li>
          <li>Test sign in/out functionality</li>
          <li>Once working, update your app to use SupabaseAuthService</li>
        </ol>
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">👥 Users to Create</h3>
        <div className="text-blue-700 text-sm space-y-1">
          <p>• admin@celyspets.com (admin) - Administrator</p>
          <p>• michel@celyspets.com (groomer) - Michel Henriquez</p>
          <p>• midielhg@icloud.com (admin) - Midiel Henriquez</p>
          <p>• cellismariagarcia@gmail.com (groomer) - Cellis Garcia</p>
          <p>• clarit1999@gmail.com (client) - Claritza Bosque</p>
          <p>• rolyblas@gmail.com (groomer) - Rolando Henriquez</p>
          <p>• midiel@gmail.com (client) - Midiel Clientq</p>
        </div>
      </div>
    </div>
  );
}

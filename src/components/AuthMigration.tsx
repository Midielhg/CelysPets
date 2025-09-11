import { useState } from 'react';
import { SupabaseAuthService } from '../services/supabaseAuthService';

const EXISTING_USERS = [
  { email: 'admin@celyspets.com', name: 'Administrator', role: 'admin' },
  { email: 'michel@celyspets.com', name: 'Michel Henriquez', role: 'groomer' },
  { email: 'midielhg@icloud.com', name: 'Midiel Henriquez', role: 'admin' },
  { email: 'cellismariagarcia@gmail.com', name: 'Cellis Garcia', role: 'groomer' },
  { email: 'clarit1999@gmail.com', name: 'Claritza Bosque', role: 'client' },
  { email: 'rolyblas@gmail.com', name: 'Rolando Henriquez', role: 'groomer' },
  { email: 'midiel@gmail.com', name: 'Midiel Clientq', role: 'client' }
];

export default function AuthMigration() {
  const [status, setStatus] = useState<'ready' | 'migrating' | 'completed' | 'error'>('ready');
  const [logs, setLogs] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const migrateToSupabaseAuth = async () => {
    setStatus('migrating');
    addLog('🔄 Starting migration to Supabase Auth...');
    addLog('⚠️  Note: Users will need to confirm their email addresses');

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const user of EXISTING_USERS) {
        addLog(`👤 Creating auth user for ${user.email} (${user.role})`);

        try {
          const result = await SupabaseAuthService.createNewUser(
            user.email,
            'TempPass123!', // Temporary password - users should reset
            user.name,
            user.role
          );

          if (result.error) {
            if (result.error.includes('already registered')) {
              addLog(`⚠️  User ${user.email} already exists`);
              successCount++; // Count as success since user exists
            } else {
              addLog(`❌ Failed: ${result.error}`);
              errorCount++;
            }
          } else {
            addLog(`✅ Success: ${user.email} (confirmation email sent)`);
            successCount++;
          }
        } catch (error: any) {
          addLog(`❌ Exception: ${error.message}`);
          errorCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      addLog(`📊 Migration completed: ${successCount} success, ${errorCount} errors`);
      addLog(`📧 Users need to check their email to confirm accounts`);
      
      if (successCount > 0) {
        await checkProfiles();
      }
      
      setStatus('completed');
    } catch (error: any) {
      addLog(`❌ Migration failed: ${error.message}`);
      setStatus('error');
    }
  };

  const checkProfiles = async () => {
    try {
      addLog('🔍 Checking user profiles...');
      const profiles = await SupabaseAuthService.getAllProfiles();
      setProfiles(profiles);
      addLog(`✅ Found ${profiles.length} user profiles`);
    } catch (error: any) {
      addLog(`❌ Error checking profiles: ${error.message}`);
    }
  };

  const testLogin = async () => {
    try {
      addLog('🔐 Testing login with admin@celyspets.com...');
      
      const result = await SupabaseAuthService.signIn('admin@celyspets.com', 'TempPass123!');
      
      if (result.error) {
        addLog(`❌ Login failed: ${result.error}`);
      } else {
        addLog(`✅ Login successful! User: ${result.profile?.name}, Role: ${result.profile?.role}`);
        addLog(`🔑 Session token: ${result.session?.access_token ? 'Present' : 'Missing'}`);
      }
    } catch (error: any) {
      addLog(`❌ Login error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Supabase Auth Migration</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Migration Controls</h2>
        
        <div className="flex gap-4 mb-4 flex-wrap">
          <button
            onClick={migrateToSupabaseAuth}
            disabled={status === 'migrating'}
            className={`px-4 py-2 rounded-lg font-medium ${
              status === 'migrating'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {status === 'migrating' ? 'Migrating...' : 'Migrate to Supabase Auth'}
          </button>
          
          <button
            onClick={checkProfiles}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Check Profiles
          </button>

          <button
            onClick={testLogin}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Test Login
          </button>
        </div>

        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            status === 'ready' ? 'bg-gray-100 text-gray-800' :
            status === 'migrating' ? 'bg-yellow-100 text-yellow-800' :
            status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            Status: {status}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Migration Logs</h2>
        <div className="bg-gray-100 rounded-lg p-4 h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {profiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User Profiles ({profiles.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile, index) => (
                  <tr key={profile.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2">{profile.email}</td>
                    <td className="px-4 py-2">{profile.name}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        profile.role === 'admin' ? 'bg-red-100 text-red-800' :
                        profile.role === 'groomer' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {profile.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🔐 Supabase Auth Benefits</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• <strong>Security:</strong> Built-in password hashing, JWT tokens, session management</li>
          <li>• <strong>Features:</strong> Email verification, password reset, social logins</li>
          <li>• <strong>Integration:</strong> Seamless RLS integration, automatic token refresh</li>
          <li>• <strong>Migration:</strong> Users will get temporary password "TempPass123!" - they should reset it</li>
        </ul>
      </div>
    </div>
  );
}

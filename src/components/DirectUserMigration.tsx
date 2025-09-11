import { useState } from 'react';
import { supabase } from '../config/supabase';

// User data from MySQL migration
const USERS_TO_MIGRATE = [
  {
    email: 'admin@celyspets.com',
    password: '$2y$10$QZCIMe1qrTIlYJabh9VdJeYzatSW2OXXBcE2vXivVaOlg8bE09aaK',
    name: 'Administrator',
    role: 'admin',
    created_at: '2025-07-22T02:16:01.000Z',
    updated_at: '2025-08-13T03:04:37.000Z'
  },
  {
    email: 'michel@celyspets.com',
    password: '$2a$12$RRZYa72oumql4XLR4dHRXuX1z7blhCtpbDjsu4WUQ4cq4I37m3RxK',
    name: 'Michel Henriquez',
    role: 'groomer',
    created_at: '2025-07-22T05:36:10.000Z',
    updated_at: '2025-09-04T02:48:48.000Z'
  },
  {
    email: 'midielhg@icloud.com',
    password: '$2a$12$.CXDy1q8iIGjDIDhYi0o0OBeJb3aM.xjq5N1u9G7dK95aSwrh5Shu',
    name: 'Midiel Henriquez',
    role: 'admin',
    created_at: '2025-08-01T05:47:47.000Z',
    updated_at: '2025-08-01T05:47:47.000Z'
  },
  {
    email: 'cellismariagarcia@gmail.com',
    password: '$2a$12$7PZROpYU0KYCFus9CQ2cmuycOYPzT5BiR2ELPODAlF9XSqD4SjZg2',
    name: 'Cellis Garcia',
    role: 'groomer',
    created_at: '2025-09-04T02:48:09.000Z',
    updated_at: '2025-09-04T02:48:09.000Z'
  },
  {
    email: 'clarit1999@gmail.com',
    password: '$2a$12$nCFKTvTetRrv2Taaois7kuoeGjBpdZcXpXn6nK4yjyiDv.TbHRKfS',
    name: 'Claritza Bosque',
    role: 'client',
    created_at: '2025-09-04T02:49:10.000Z',
    updated_at: '2025-09-04T02:49:10.000Z'
  },
  {
    email: 'rolyblas@gmail.com',
    password: '$2y$10$NjSRx2lR82nedeIOhnHF8em26iqdIuWViG7vCGKv81kXOJcVh9fei',
    name: 'Rolando Henriquez',
    role: 'groomer'
  },
  {
    email: 'midiel@gmail.com',
    password: '$2y$10$knOwYmSBlwvYw656oeilUu2ot5jbKVG9gmGrNcVbzqKATMqB05bce',
    name: 'Midiel Clientq',
    role: 'client'
  }
];

export default function DirectUserMigration() {
  const [migrationStatus, setMigrationStatus] = useState<string>('ready');
  const [logs, setLogs] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runMigration = async () => {
    setMigrationStatus('running');
    addLog('🔄 Starting direct user migration...');

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const user of USERS_TO_MIGRATE) {
        addLog(`👤 Migrating user: ${user.email} (${user.role})`);
        
        try {
          const { error } = await supabase
            .from('users')
            .insert({
              email: user.email,
              password: user.password,
              name: user.name,
              role: user.role,
              business_settings: null,
              google_tokens: null,
              created_at: user.created_at || new Date().toISOString(),
              updated_at: user.updated_at || new Date().toISOString()
            });

          if (error) {
            addLog(`❌ Error: ${error.message}`);
            errorCount++;
          } else {
            addLog(`✅ Success: ${user.email}`);
            successCount++;
          }
        } catch (err: any) {
          addLog(`❌ Exception: ${err.message}`);
          errorCount++;
        }
      }

      addLog(`📊 Migration completed: ${successCount} success, ${errorCount} errors`);
      await verifyUsers();
      setMigrationStatus('completed');

    } catch (error: any) {
      addLog(`❌ Migration failed: ${error.message}`);
      setMigrationStatus('error');
    }
  };

  const clearUsers = async () => {
    try {
      addLog('🗑️ Clearing all users from Supabase...');
      const { error } = await supabase
        .from('users')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all users
      
      if (error) {
        addLog(`❌ Error clearing users: ${error.message}`);
      } else {
        addLog('✅ All users cleared');
        setUsers([]);
      }
    } catch (error: any) {
      addLog(`❌ Exception clearing users: ${error.message}`);
    }
  };

  const verifyUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, created_at')
        .order('created_at');

      if (error) {
        addLog(`❌ Error verifying users: ${error.message}`);
        return;
      }

      setUsers(data || []);
      addLog(`✅ Found ${data?.length || 0} users in Supabase`);
      
      if (data && data.length > 0) {
        data.forEach(user => {
          addLog(`   - ${user.email} (${user.role})`);
        });
      }
    } catch (error: any) {
      addLog(`❌ Verification failed: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Direct User Migration</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Migration Controls</h2>
        
        <div className="flex gap-4 mb-4 flex-wrap">
          <button
            onClick={runMigration}
            disabled={migrationStatus === 'running'}
            className={`px-4 py-2 rounded-lg font-medium ${
              migrationStatus === 'running'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {migrationStatus === 'running' ? 'Migrating...' : 'Migrate Users'}
          </button>
          
          <button
            onClick={verifyUsers}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Check Users
          </button>

          <button
            onClick={clearUsers}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Clear All Users
          </button>
        </div>

        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            migrationStatus === 'ready' ? 'bg-gray-100 text-gray-800' :
            migrationStatus === 'running' ? 'bg-yellow-100 text-yellow-800' :
            migrationStatus === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            Status: {migrationStatus}
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

      {users.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Users in Supabase ({users.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'groomer' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Migration Information</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• This will migrate {USERS_TO_MIGRATE.length} users from MySQL to Supabase</li>
          <li>• Original bcrypt password hashes will be preserved</li>
          <li>• Users include: 2 admins, 3 groomers, 2 clients</li>
          <li>• This bypasses RLS by inserting directly via Supabase client</li>
        </ul>
      </div>
    </div>
  );
}

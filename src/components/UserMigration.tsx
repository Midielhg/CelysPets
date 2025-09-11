import { useState } from 'react';
import { supabase } from '../config/supabase';

// SQL Migration script with all users
const USER_MIGRATION_SQL = `
-- Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Insert user 1: admin@celyspets.com
INSERT INTO users (email, password, name, role, business_settings, google_tokens, created_at, updated_at)
VALUES (
  'admin@celyspets.com',
  '$2y$10$QZCIMe1qrTIlYJabh9VdJeYzatSW2OXXBcE2vXivVaOlg8bE09aaK',
  'Administrator',
  'admin',
  NULL,
  NULL,
  '2025-07-22T02:16:01.000Z',
  '2025-08-13T03:04:37.000Z'
);

-- Insert user 2: michel@celyspets.com
INSERT INTO users (email, password, name, role, business_settings, google_tokens, created_at, updated_at)
VALUES (
  'michel@celyspets.com',
  '$2a$12$RRZYa72oumql4XLR4dHRXuX1z7blhCtpbDjsu4WUQ4cq4I37m3RxK',
  'Michel Henriquez',
  'groomer',
  NULL,
  NULL,
  '2025-07-22T05:36:10.000Z',
  '2025-09-04T02:48:48.000Z'
);

-- Insert user 3: midielhg@icloud.com
INSERT INTO users (email, password, name, role, business_settings, google_tokens, created_at, updated_at)
VALUES (
  'midielhg@icloud.com',
  '$2a$12$.CXDy1q8iIGjDIDhYi0o0OBeJb3aM.xjq5N1u9G7dK95aSwrh5Shu',
  'Midiel Henriquez',
  'admin',
  NULL,
  NULL,
  '2025-08-01T05:47:47.000Z',
  '2025-08-01T05:47:47.000Z'
);

-- Insert user 4: cellismariagarcia@gmail.com
INSERT INTO users (email, password, name, role, business_settings, google_tokens, created_at, updated_at)
VALUES (
  'cellismariagarcia@gmail.com',
  '$2a$12$7PZROpYU0KYCFus9CQ2cmuycOYPzT5BiR2ELPODAlF9XSqD4SjZg2',
  'Cellis Garcia',
  'groomer',
  NULL,
  NULL,
  '2025-09-04T02:48:09.000Z',
  '2025-09-04T02:48:09.000Z'
);

-- Insert user 5: clarit1999@gmail.com
INSERT INTO users (email, password, name, role, business_settings, google_tokens, created_at, updated_at)
VALUES (
  'clarit1999@gmail.com',
  '$2a$12$nCFKTvTetRrv2Taaois7kuoeGjBpdZcXpXn6nK4yjyiDv.TbHRKfS',
  'Claritza Bosque',
  'client',
  NULL,
  NULL,
  '2025-09-04T02:49:10.000Z',
  '2025-09-04T02:49:10.000Z'
);

-- Insert user 6: rolyblas@gmail.com
INSERT INTO users (email, password, name, role, business_settings, google_tokens, created_at, updated_at)
VALUES (
  'rolyblas@gmail.com',
  '$2y$10$NjSRx2lR82nedeIOhnHF8em26iqdIuWViG7vCGKv81kXOJcVh9fei',
  'Rolando Henriquez',
  'groomer',
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- Insert user 7: midiel@gmail.com
INSERT INTO users (email, password, name, role, business_settings, google_tokens, created_at, updated_at)
VALUES (
  'midiel@gmail.com',
  '$2y$10$knOwYmSBlwvYw656oeilUu2ot5jbKVG9gmGrNcVbzqKATMqB05bce',
  'Midiel Clientq',
  'client',
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
`;

export default function UserMigration() {
  const [migrationStatus, setMigrationStatus] = useState<string>('ready');
  const [logs, setLogs] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runMigration = async () => {
    setMigrationStatus('running');
    addLog('🔄 Starting user migration...');

    try {
      // Split SQL into individual statements
      const statements = USER_MIGRATION_SQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && s !== '');

      addLog(`📊 Executing ${statements.length} SQL statements...`);

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.toLowerCase().includes('alter table users disable')) {
          addLog('🔓 Disabling RLS...');
        } else if (statement.toLowerCase().includes('insert into users')) {
          const emailMatch = statement.match(/'([^']*@[^']*)'/);
          const email = emailMatch ? emailMatch[1] : 'unknown';
          addLog(`👤 Inserting user: ${email}`);
        } else if (statement.toLowerCase().includes('alter table users enable')) {
          addLog('🔒 Re-enabling RLS...');
        }

        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            addLog(`❌ Error executing statement: ${error.message}`);
          }
        } catch (err: any) {
          addLog(`❌ Exception: ${err.message}`);
        }
      }

      addLog('✅ Migration completed! Verifying users...');
      await verifyUsers();
      setMigrationStatus('completed');

    } catch (error: any) {
      addLog(`❌ Migration failed: ${error.message}`);
      setMigrationStatus('error');
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">User Migration</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Migration Status</h2>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={runMigration}
            disabled={migrationStatus === 'running'}
            className={`px-4 py-2 rounded-lg font-medium ${
              migrationStatus === 'running'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {migrationStatus === 'running' ? 'Running Migration...' : 'Run User Migration'}
          </button>
          
          <button
            onClick={verifyUsers}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Verify Users
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
          <h2 className="text-xl font-semibold mb-4">Migrated Users ({users.length})</h2>
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

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">📋 Migration Information</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• This will migrate 7 users from your MySQL database to Supabase</li>
          <li>• Original bcrypt password hashes will be preserved</li>
          <li>• Row Level Security will be temporarily disabled during migration</li>
          <li>• Users include: 2 admins, 3 groomers, 2 clients</li>
        </ul>
      </div>
    </div>
  );
}

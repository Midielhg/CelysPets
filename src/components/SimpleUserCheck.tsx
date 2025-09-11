import { useState } from 'react';
import { supabase } from '../config/supabase';

export default function SimpleUserCheck() {
  const [status, setStatus] = useState<string>('ready');
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const checkUsers = async () => {
    setStatus('checking');
    addLog('🔍 Checking users in Supabase...');

    try {
      // Try different queries to see what works
      const queries = [
        { name: 'All columns', query: supabase.from('users').select('*') },
        { name: 'Basic columns', query: supabase.from('users').select('id, email, name, role') },
        { name: 'Just count', query: supabase.from('users').select('id', { count: 'exact' }) },
      ];

      for (const { name, query } of queries) {
        try {
          addLog(`📊 Testing query: ${name}`);
          const { data, error, count } = await query;
          
          if (error) {
            addLog(`❌ ${name} failed: ${error.message}`);
          } else {
            addLog(`✅ ${name} success: ${data?.length || count || 0} records`);
            if (data && data.length > 0) {
              setUsers(data);
            }
          }
        } catch (err: any) {
          addLog(`❌ ${name} exception: ${err.message}`);
        }
      }

      setStatus('completed');
    } catch (error: any) {
      addLog(`❌ General error: ${error.message}`);
      setStatus('error');
    }
  };

  const testConnection = async () => {
    try {
      addLog('🔌 Testing Supabase connection...');
      const { data, error } = await supabase.from('promo_codes').select('count', { count: 'exact' });
      
      if (error) {
        addLog(`❌ Connection test failed: ${error.message}`);
      } else {
        addLog(`✅ Connection test successful: ${data?.length || 0} promo codes`);
      }
    } catch (error: any) {
      addLog(`❌ Connection exception: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Simple User Check</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={checkUsers}
            disabled={status === 'checking'}
            className={`px-4 py-2 rounded-lg font-medium ${
              status === 'checking'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {status === 'checking' ? 'Checking...' : 'Check Users'}
          </button>
          
          <button
            onClick={testConnection}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Test Connection
          </button>
        </div>

        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            status === 'ready' ? 'bg-gray-100 text-gray-800' :
            status === 'checking' ? 'bg-yellow-100 text-yellow-800' :
            status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            Status: {status}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
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
          <h2 className="text-xl font-semibold mb-4">Found Users ({users.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2">{user.id}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

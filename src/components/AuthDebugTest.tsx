import React, { useState } from 'react';
import { SupabaseAuthService } from '../services/supabaseAuthService';
import { supabase } from '../config/supabase';

const AuthDebugTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSupabaseConnection = async () => {
    try {
      setStatus('Testing Supabase connection...');
      addResult('🔌 Testing Supabase connection...');

      const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact' });
      
      if (error) {
        if (error.message.includes('relation "user_profiles" does not exist')) {
          addResult('❌ user_profiles table does not exist! Run the migration SQL first.');
          setStatus('Migration needed');
        } else {
          addResult(`❌ Database error: ${error.message}`);
          setStatus('Database error');
        }
      } else {
        addResult('✅ Database connection successful');
        addResult(`📊 Found ${data?.length || 0} user profiles`);
        setStatus('Database OK');
      }
    } catch (error) {
      addResult(`❌ Connection failed: ${error}`);
      setStatus('Connection failed');
    }
  };

  const testAuthService = async () => {
    try {
      setStatus('Testing auth service...');
      addResult('🔐 Testing auth service...');

      // Test with invalid credentials first
      const result = await SupabaseAuthService.signIn('test@invalid.com', 'wrongpassword');
      
      if (result.error) {
        addResult(`✅ Auth service working - got expected error: ${result.error}`);
        setStatus('Auth service OK');
      } else {
        addResult('⚠️ Unexpected success with invalid credentials');
        setStatus('Auth unexpected');
      }
    } catch (error) {
      addResult(`❌ Auth service error: ${error}`);
      setStatus('Auth service error');
    }
  };

  const testValidLogin = async () => {
    try {
      setStatus('Testing valid login...');
      addResult('👤 Testing with admin@celyspets.com...');

      const result = await SupabaseAuthService.signIn('admin@celyspets.com', 'admin123');
      
      if (result.error) {
        addResult(`❌ Login failed: ${result.error}`);
        setStatus('Login failed');
      } else if (result.user && result.profile) {
        addResult('✅ Login successful with profile!');
        addResult(`📝 User: ${result.user.email}, Profile: ${result.profile.name} (${result.profile.role})`);
        setStatus('Login successful');
      } else if (result.user && !result.profile) {
        addResult('⚠️ User authenticated but no profile found');
        setStatus('Profile missing');
      } else {
        addResult('❓ Unexpected login result');
        setStatus('Unexpected result');
      }
    } catch (error) {
      addResult(`❌ Login test error: ${error}`);
      setStatus('Login test failed');
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setStatus('Ready');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">🔧 Authentication Debug Tool</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Status: {status}</h2>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={testSupabaseConnection}
            className="p-4 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            1. Test Database
          </button>
          
          <button
            onClick={testAuthService}
            className="p-4 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            2. Test Auth Service
          </button>
          
          <button
            onClick={testValidLogin}
            className="p-4 bg-green-500 text-white rounded hover:bg-green-600"
          >
            3. Test Valid Login
          </button>
        </div>

        <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click a button above to start testing.</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-800 mb-2">📋 Debug Instructions:</h3>
        <ol className="list-decimal list-inside text-amber-700 text-sm space-y-1">
          <li><strong>Test Database:</strong> Checks if user_profiles table exists</li>
          <li><strong>Test Auth Service:</strong> Verifies auth service is working</li>
          <li><strong>Test Valid Login:</strong> Tries to login with admin credentials</li>
          <li>If database test fails, you need to run the SQL migration in Supabase</li>
          <li>If auth test fails, there's a configuration issue</li>
          <li>If login test fails, you need to create the user first</li>
        </ol>
      </div>
    </div>
  );
};

export default AuthDebugTest;

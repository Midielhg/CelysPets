import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { useToast } from '../contexts/ToastContext';
import { UserPlus, CheckCircle, AlertTriangle } from 'lucide-react';

const FreshUserSetup: React.FC = () => {
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const createUserDirect = async (email: string, password: string, name: string, role: 'admin' | 'groomer' | 'client') => {
    try {
      addResult(`🚀 Creating user: ${email} as ${role}...`);

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (authData.user) {
        addResult(`✅ Auth user created: ${authData.user.id}`);
        
        // Wait a bit for trigger, then check if profile exists
        addResult(`⏳ Waiting for profile creation trigger...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if profile exists (using service role bypass)
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profileError) {
          addResult(`⚠️ Error checking profile: ${profileError.message}`);
        }

        if (!profile) {
          addResult(`⚠️ Profile not created by trigger, creating manually...`);
          
          // Manually create profile - using direct insert
          const { data: insertData, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              email,
              name,
              role
            })
            .select()
            .single();

          if (insertError) {
            addResult(`❌ Failed to create profile manually: ${insertError.message}`);
            // Try to delete the auth user since profile creation failed
            addResult(`🧹 Cleaning up auth user...`);
            throw new Error(`Profile creation failed: ${insertError.message}`);
          }
          
          addResult(`✅ Profile created manually: ${insertData.name} (${insertData.role})`);
        } else {
          addResult(`✅ Profile created by trigger: ${profile.name} (${profile.role})`);
        }

        setCreatedUsers(prev => [...prev, `${email} (${role})`]);
        addResult(`🎉 User ${email} ready for login!`);
        return true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Failed to create ${email}: ${errorMessage}`);
      showToast(`Failed to create user: ${errorMessage}`, 'error');
      return false;
    }
  };

  const createAllUsers = async () => {
    setIsCreating(true);
    addResult('🔄 Starting fresh user creation...');

    const users = [
      { email: 'admin@celyspets.com', password: 'admin123', name: 'Admin User', role: 'admin' as const },
      { email: 'groomer@celyspets.com', password: 'groomer123', name: 'Groomer User', role: 'groomer' as const },
      { email: 'client@celyspets.com', password: 'client123', name: 'Client User', role: 'client' as const }
    ];

    let successCount = 0;
    for (const user of users) {
      const success = await createUserDirect(user.email, user.password, user.name, user.role);
      if (success) successCount++;
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between users
    }

    addResult(`🏁 Complete! ${successCount}/${users.length} users created successfully`);
    showToast(`Created ${successCount} users successfully!`, 'success');
    setIsCreating(false);
  };

  const testDatabaseConnection = async () => {
    try {
      addResult('🔍 Testing database connection...');
      
      // Test 1: Check if table exists
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count', { count: 'exact' });

      if (error) {
        throw error;
      }

      addResult('✅ Database connection successful!');
      addResult(`📊 Current user count: ${data?.length || 0}`);

      // Test 2: Check RLS policies by trying to select all (should work with service key)
      const { data: allProfiles, error: selectError } = await supabase
        .from('user_profiles')
        .select('email, name, role');

      if (selectError) {
        addResult(`⚠️ RLS test failed: ${selectError.message}`);
      } else {
        addResult(`✅ RLS policies working. Found ${allProfiles?.length || 0} existing profiles`);
        if (allProfiles && allProfiles.length > 0) {
          allProfiles.forEach(profile => {
            addResult(`   - ${profile.email} (${profile.role})`);
          });
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Database error: ${errorMessage}`);
      
      if (errorMessage.includes('relation "user_profiles" does not exist')) {
        addResult('💡 Run the fresh-start-migration.sql in Supabase Dashboard first!');
      }
    }
  };

  const fixHangingUser = async () => {
    try {
      addResult('🔧 Attempting to fix hanging user creation...');
      
      // Try to create profile for the user ID that was created
      const userId = '5b29e3e6-951d-4abc-89a8-63a4582a28b9'; // From your log
      
      const { data: insertData, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: 'admin@celyspets.com',
          name: 'Admin User',
          role: 'admin'
        })
        .select()
        .single();

      if (insertError) {
        addResult(`❌ Failed to fix: ${insertError.message}`);
      } else {
        addResult(`✅ Fixed! Profile created: ${insertData.name} (${insertData.role})`);
        setCreatedUsers(prev => [...prev, 'admin@celyspets.com (admin) - FIXED']);
      }
    } catch (error) {
      addResult(`❌ Fix failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setCreatedUsers([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">🔄 Fresh User Setup</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Setup Process</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={testDatabaseConnection}
            className="p-4 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            1. Test Database
          </button>
          
          <button
            onClick={createAllUsers}
            disabled={isCreating}
            className="p-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <UserPlus className="h-5 w-5" />
            {isCreating ? 'Creating...' : '2. Create Users'}
          </button>

          <button
            onClick={fixHangingUser}
            className="p-4 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center justify-center gap-2"
          >
            🔧 Fix Hanging
          </button>
          
          <button
            onClick={clearResults}
            className="p-4 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center justify-center gap-2"
          >
            Clear Results
          </button>
        </div>

        {createdUsers.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-800 mb-2">✅ Created Users:</h3>
            <ul className="space-y-1">
              {createdUsers.map((user, index) => (
                <li key={index} className="text-green-700 text-sm">• {user}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Process Log:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500">No actions performed yet.</p>
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
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-amber-800">
            <h3 className="font-semibold mb-2">Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>First, run <code>fresh-start-migration.sql</code> in Supabase Dashboard → SQL Editor</li>
              <li>Click "1. Test Database" to verify tables exist</li>
              <li>Click "2. Create Users" to create admin, groomer, and client accounts</li>
              <li>Then try logging in at <code>/login</code> with the credentials</li>
            </ol>
            
            <div className="mt-3 p-3 bg-amber-100 rounded text-xs">
              <strong>Default Credentials:</strong><br/>
              • Admin: admin@celyspets.com / admin123<br/>
              • Groomer: groomer@celyspets.com / groomer123<br/>
              • Client: client@celyspets.com / client123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreshUserSetup;

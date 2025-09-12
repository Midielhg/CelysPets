import React from 'react';
import { supabase } from '../config/supabase';

const TestSupabaseConnection = () => {
  const testConnection = async () => {
    try {
      console.log('🧪 Testing Supabase connection...');
      
      // Test basic connection
      const { data, error } = await supabase
        .from('clients')
        .select('count(*)')
        .limit(1);
        
      if (error) {
        console.error('❌ Supabase connection failed:', error);
        return;
      }
      
      console.log('✅ Supabase connection successful:', data);
    } catch (err) {
      console.error('💥 Connection test error:', err);
    }
  };

  React.useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="p-4 bg-blue-50">
      <h2 className="text-lg font-bold">Supabase Connection Test</h2>
      <p>Check the browser console for connection results.</p>
    </div>
  );
};

export default TestSupabaseConnection;

import React, { useState, useEffect } from 'react';
import { supabaseHardcoded } from '../config/supabase-hardcoded';

const HardcodedSupabaseTest: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔄 Testing hardcoded Supabase connection...');
        
        const { data: promoCodes, error } = await supabaseHardcoded
          .from('promo_codes')
          .select('*')
          .limit(5);
        
        if (error) {
          throw error;
        }
        
        console.log('✅ Hardcoded connection successful:', promoCodes);
        setData(promoCodes || []);
        setStatus('success');
      } catch (err) {
        console.error('❌ Hardcoded test failed:', err);
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    };

    testConnection();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Testing hardcoded Supabase connection...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-3">❌ Hardcoded Connection Failed</h2>
            <p className="text-red-600 mb-4">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-green-800 mb-2">🎉 Hardcoded Supabase Working!</h1>
          <p className="text-green-600">The issue is with environment variable loading, not Supabase itself.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Promo Codes (Hardcoded Connection)</h2>
          <p className="text-gray-600 mb-4">Found {data.length} promo codes</p>
          
          <div className="grid gap-4">
            {data.map((promo) => (
              <div key={promo.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{promo.code}</h3>
                    <p className="text-gray-600">{promo.name}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {promo.discount_type === 'percentage' 
                      ? `${promo.discount_value}% off`
                      : `$${promo.discount_value} off`
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardcodedSupabaseTest;

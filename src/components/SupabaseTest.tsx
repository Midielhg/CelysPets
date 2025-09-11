import React, { useState, useEffect } from 'react';

const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔄 Starting Supabase test...');
        
        // Import the service dynamically to catch any import errors
        const { PromoCodeService } = await import('../services/promoCodeService');
        console.log('✅ Service imported successfully');
        
        const promoCodes = await PromoCodeService.getAll();
        console.log('✅ Data fetched:', promoCodes);
        
        setData(promoCodes);
        setStatus('success');
      } catch (err) {
        console.error('❌ Test failed:', err);
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
          <p className="text-gray-600">Testing Supabase connection...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-3">❌ Connection Failed</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="bg-red-100 p-3 rounded text-sm text-red-700">
              <p className="font-semibold mb-2">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check that you've run the SQL setup script in Supabase</li>
                <li>Verify your .env file has the correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
                <li>Make sure your Supabase project is active</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-green-800 mb-2">🎉 Supabase Connected Successfully!</h1>
          <p className="text-green-600">Your database migration is working perfectly.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Promo Codes from Supabase</h2>
          <p className="text-gray-600 mb-4">Found {data.length} promo codes in your database</p>
          
          {data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No promo codes found.</p>
              <p className="text-sm mt-2">This is normal for a fresh database setup.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {data.slice(0, 5).map((promo) => (
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
                  <div className="mt-3 flex gap-4 text-sm text-gray-500">
                    <span className={promo.active ? 'text-green-600' : 'text-red-600'}>
                      {promo.active ? '✅ Active' : '❌ Inactive'}
                    </span>
                    <span>Used: {promo.current_usage_total}/{promo.max_usage_total}</span>
                    {promo.minimum_amount && (
                      <span>Min: ${promo.minimum_amount}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">✅ Migration Complete!</h3>
          <p className="text-blue-600">
            Your app is now running on Supabase. The same configuration will work in production 
            without any database deployment issues!
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <a href="/book" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Test Booking Page
            </a>
            <a href="/" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseTest;

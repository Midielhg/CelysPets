import React from 'react';

const SimpleTest: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <strong>✅ Simple Test Page Loading!</strong>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Simple Test</h1>
        <p className="text-gray-600">
          If you can see this, React routing is working correctly.
        </p>
        
        <div className="mt-4 space-y-2">
          <p><strong>Current time:</strong> {new Date().toLocaleString()}</p>
          <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
          <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleTest;

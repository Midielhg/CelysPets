#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Debug Connection Test');
console.log('URL:', SUPABASE_URL);
console.log('Service Key (first 20 chars):', SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');
console.log('Service Key length:', SUPABASE_SERVICE_ROLE_KEY?.length);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

// Test with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('\n🧪 Testing connection...');

try {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .limit(1);

  if (error) {
    console.error('❌ Query error:', error);
  } else {
    console.log('✅ Connection successful!');
    console.log('Sample data:', data);
  }
} catch (err) {
  console.error('❌ Exception:', err);
}
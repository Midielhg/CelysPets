// Test Supabase authentication directly
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
async function testAuth() {
  try {
    console.log('🔐 Testing authentication with admin credentials...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@celyspets.com',
      password: 'admin123'
    });

    if (error) {
      console.error('❌ Authentication error:', error);
      return;
    }

    console.log('✅ Authentication successful!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    
    // Test user profile fetch
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
    } else {
      console.log('✅ Profile found:', profile);
    }

  } catch (err) {
    console.error('💥 Connection error:', err);
  }
}

testAuth();
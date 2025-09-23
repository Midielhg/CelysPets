import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

// Admin client for privileged operations (user creation, deletion, etc.)
export const adminSupabase = (() => {
  if (supabaseServiceKey) {
    console.log('🔑 Using service role key for admin operations');
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } else {
    console.warn('⚠️ No service role key found, using regular client for admin operations');
    // Fallback to regular client
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return createClient(supabaseUrl, supabaseAnonKey);
  }
})();

export const isAdminClientAvailable = !!supabaseServiceKey;
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// Hardcoded values for testing - this will work immediately
const supabaseUrl = 'https://uizkllezgwpxolcbkaiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemtsbGV6Z3dweG9sY2JrYWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NDk5NTIsImV4cCI6MjA3MzEyNTk1Mn0.7f1BjfumqFvgAM8Z0jI_TjFX1AIANQ2CyAUToeOdM8c'

console.log('🔍 Hardcoded Supabase config:')
console.log('URL:', supabaseUrl)
console.log('Key length:', supabaseAnonKey.length)

export const supabaseHardcoded = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  return error
}

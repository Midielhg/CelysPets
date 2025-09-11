// Test Supabase Connection
import { supabase } from './src/config/supabase.ts';

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test database connection
    const { data: breeds, error: breedsError } = await supabase
      .from('breeds')
      .select('*')
      .limit(5);
    
    if (breedsError) {
      console.error('Error fetching breeds:', breedsError);
      return;
    }
    
    console.log('✅ Database connection successful!');
    console.log('Sample breeds:', breeds);
    
    // Test promo codes
    const { data: promoCodes, error: promoError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('active', true)
      .limit(3);
    
    if (promoError) {
      console.error('Error fetching promo codes:', promoError);
      return;
    }
    
    console.log('✅ Promo codes working!');
    console.log('Active promo codes:', promoCodes);
    
    console.log('🎉 Supabase migration successful!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

// Run the test
testSupabaseConnection();

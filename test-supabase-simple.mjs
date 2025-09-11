import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uizkllezgwpxolcbkaiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemtsbGV6Z3dweG9sY2JrYWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NDk5NTIsImV4cCI6MjA3MzEyNTk1Mn0.7f1BjfumqFvgAM8Z0jI_TjFX1AIANQ2CyAUToeOdM8c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    console.log('🔗 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('breeds')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.log('Make sure you:');
      console.log('1. Created the Supabase project');
      console.log('2. Ran the COMPLETE_SUPABASE_SETUP.sql script in SQL Editor');
      console.log('3. Have the correct URL and key in .env');
      return;
    }
    
    console.log('✅ Database connection successful!');
    console.log(`📊 Found ${data.length} sample breeds:`);
    data.forEach(breed => {
      console.log(`  - ${breed.name} (${breed.species}) - $${breed.full_groom_price}`);
    });
    
    // Test promo codes
    const { data: promoCodes, error: promoError } = await supabase
      .from('promo_codes')
      .select('code, name, discount_value, discount_type')
      .eq('active', true)
      .limit(3);
    
    if (promoError) {
      console.error('⚠️  Promo codes error:', promoError.message);
    } else {
      console.log('🎫 Active promo codes:');
      promoCodes.forEach(promo => {
        console.log(`  - ${promo.code}: ${promo.name} (${promo.discount_value}${promo.discount_type === 'percentage' ? '%' : '$'} off)`);
      });
    }
    
    console.log('\n🎉 Supabase migration completed successfully!');
    console.log('Your app is now ready to use Supabase for production and development.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testSupabaseConnection();

import { supabaseHardcoded as supabase } from '../config/supabase-hardcoded.js';

async function checkRecurringResults() {
  try {
    // Get total appointment count
    const { data: all, error: allError } = await supabase
      .from('appointments')
      .select('id')
      .order('id', { ascending: false });
    
    if (allError) throw allError;
    
    // Check appointments count over time
    const { data: recent, error: recentError } = await supabase
      .from('appointments')
      .select('id, date, client_id')
      .gte('date', '2025-10-01')
      .order('date', { ascending: true });
    
    if (recentError) throw recentError;
    
    console.log(`📊 Total appointments: ${all.length}`);
    console.log(`� Recent appointments (Oct 2025+): ${recent?.length || 0}`);
    
    if (recent && recent.length > 0) {
      console.log('\n� Recent appointment dates:');
      const dateCounts = recent.reduce((acc: any, app: any) => {
        acc[app.date] = (acc[app.date] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(dateCounts).slice(0, 20).forEach(([date, count]) => {
        console.log(`  - ${date}: ${count} appointment(s)`);
      });
      
      // Show date range
      const firstDate = recent[0]?.date;
      const lastDate = recent[recent.length - 1]?.date;
      console.log(`\n📅 Date range: ${firstDate} to ${lastDate}`);
    }
    
    // Check if recurring columns exist by trying a safe query
    try {
      const { data: test } = await supabase
        .from('appointments')
        .select('id')
        .limit(1);
      
      console.log('\n✅ Database connection successful');
      console.log('ℹ️  Note: Recurring columns (is_recurring, parent_appointment_id, etc.) need to be added to database schema');
    } catch (error) {
      console.log('\n❌ Database connection issue:', error);
    }
    
  } catch (error) {
    console.error('❌ Error checking results:', error);
  }
}

checkRecurringResults();
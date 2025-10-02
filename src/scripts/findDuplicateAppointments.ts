import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);



async function findDuplicateAppointments() {
  try {
    console.log('🔍 Searching for duplicate appointments...\n');

    // Get all appointments with client information
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        client_id,
        date,
        time,
        services,
        status,
        total_amount,
        created_at,
        clients!appointments_client_id_fkey (
          id,
          name,
          email,
          phone
        )
      `)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error('❌ Error fetching appointments:', error);
      return;
    }

    console.log(`📊 Total appointments in database: ${appointments.length}`);

    // Group appointments by client_id + date + time to find exact duplicates
    const groupedByExact = new Map<string, any[]>();
    
    // Group appointments by client_id + date to find same-day duplicates
    const groupedByDay = new Map<string, any[]>();

    // Group appointments by client_name to find potential name variations
    const groupedByName = new Map<string, any[]>();

    for (const appointment of appointments) {
      const exactKey = `${appointment.client_id}_${appointment.date}_${appointment.time}`;
      const dayKey = `${appointment.client_id}_${appointment.date}`;
      const clientInfo = Array.isArray(appointment.clients) ? appointment.clients[0] : appointment.clients;
      const nameKey = clientInfo?.name?.toLowerCase().trim() || 'unknown';

      // Group by exact match (client + date + time)
      if (!groupedByExact.has(exactKey)) {
        groupedByExact.set(exactKey, []);
      }
      groupedByExact.get(exactKey)!.push(appointment);

      // Group by same day
      if (!groupedByDay.has(dayKey)) {
        groupedByDay.set(dayKey, []);
      }
      groupedByDay.get(dayKey)!.push(appointment);

      // Group by client name
      if (!groupedByName.has(nameKey)) {
        groupedByName.set(nameKey, []);
      }
      groupedByName.get(nameKey)!.push(appointment);
    }

    // Find exact duplicates (same client, date, and time)
    console.log('🎯 EXACT DUPLICATES (Same Client + Date + Time):');
    console.log('='.repeat(60));
    
    let exactDuplicatesFound = 0;
    for (const [key, apps] of groupedByExact) {
      if (apps.length > 1) {
        exactDuplicatesFound++;
        const [clientId, date, time] = key.split('_');
        const clientInfo0 = Array.isArray(apps[0].clients) ? apps[0].clients[0] : apps[0].clients;
        console.log(`\n📅 Duplicate #${exactDuplicatesFound}: ${clientInfo0?.name} on ${date} at ${time}`);
        console.log(`   Client ID: ${clientId}`);
        
        apps.forEach((app, index) => {
          console.log(`   ${index + 1}. ID: ${app.id} | Services: ${app.services} | Status: ${app.status} | Amount: $${app.total_amount} | Created: ${new Date(app.created_at).toLocaleDateString()}`);
        });
      }
    }

    if (exactDuplicatesFound === 0) {
      console.log('✅ No exact duplicates found!');
    } else {
      console.log(`\n❌ Found ${exactDuplicatesFound} sets of exact duplicates`);
    }

    // Find same-day duplicates (same client, same date, different times)
    console.log('\n\n📅 SAME-DAY APPOINTMENTS (Same Client + Date, Different Times):');
    console.log('='.repeat(60));
    
    let sameDayDuplicatesFound = 0;
    for (const [key, apps] of groupedByDay) {
      if (apps.length > 1) {
        // Check if they have different times (not exact duplicates)
        const times = new Set(apps.map(app => app.time));
        if (times.size > 1) {
          sameDayDuplicatesFound++;
          const [clientId, date] = key.split('_');
          const clientInfo1 = Array.isArray(apps[0].clients) ? apps[0].clients[0] : apps[0].clients;
          console.log(`\n📅 Same-day #${sameDayDuplicatesFound}: ${clientInfo1?.name} on ${date}`);
          console.log(`   Client ID: ${clientId}`);
          
          apps.forEach((app, index) => {
            console.log(`   ${index + 1}. ID: ${app.id} | Time: ${app.time} | Services: ${app.services} | Status: ${app.status} | Amount: $${app.total_amount}`);
          });
        }
      }
    }

    if (sameDayDuplicatesFound === 0) {
      console.log('✅ No same-day duplicates found!');
    } else {
      console.log(`\n⚠️ Found ${sameDayDuplicatesFound} clients with multiple appointments on the same day`);
    }

    // Find potential client name variations
    console.log('\n\n👥 POTENTIAL CLIENT NAME VARIATIONS:');
    console.log('='.repeat(60));
    
    let nameVariationsFound = 0;
    for (const [name, apps] of groupedByName) {
      if (apps.length > 1) {
        // Check if they have different client IDs (potential duplicates with name variations)
        const clientIds = new Set(apps.map(app => app.client_id));
        if (clientIds.size > 1) {
          nameVariationsFound++;
          console.log(`\n👤 Name variation #${nameVariationsFound}: "${name}"`);
          
          // Group by client ID to show variations
          const byClientId = new Map<number, any[]>();
          for (const app of apps) {
            if (!byClientId.has(app.client_id)) {
              byClientId.set(app.client_id, []);
            }
            byClientId.get(app.client_id)!.push(app);
          }

          for (const [clientId, clientApps] of byClientId) {
            const clientInfo2 = Array.isArray(clientApps[0].clients) ? clientApps[0].clients[0] : clientApps[0].clients;
            console.log(`   Client ID: ${clientId} | Name: "${clientInfo2?.name}" | Phone: ${clientInfo2?.phone || 'N/A'} | Appointments: ${clientApps.length}`);
          }
        }
      }
    }

    if (nameVariationsFound === 0) {
      console.log('✅ No client name variations found!');
    } else {
      console.log(`\n⚠️ Found ${nameVariationsFound} potential client name variations`);
    }

    // Summary
    console.log('\n\n📊 DUPLICATE ANALYSIS SUMMARY:');
    console.log('='.repeat(60));
    console.log(`📈 Total appointments: ${appointments.length}`);
    console.log(`🎯 Exact duplicates: ${exactDuplicatesFound} sets`);
    console.log(`📅 Same-day bookings: ${sameDayDuplicatesFound} clients`);
    console.log(`👥 Name variations: ${nameVariationsFound} potential duplicates`);

    // Show recent appointments (last 30 days) for context
    console.log('\n\n📅 RECENT APPOINTMENTS (Last 30 Days):');
    console.log('='.repeat(60));
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAppointments = appointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate >= thirtyDaysAgo;
    });

    console.log(`📊 Recent appointments count: ${recentAppointments.length}`);
    
    if (recentAppointments.length > 0) {
      console.log('\n📋 Sample recent appointments:');
      recentAppointments.slice(0, 10).forEach((app, index) => {
        const clientInfo = Array.isArray(app.clients) ? app.clients[0] : app.clients;
        console.log(`${index + 1}. ${clientInfo?.name} - ${app.date} ${app.time} | ID: ${app.id} | Status: ${app.status}`);
      });
      
      if (recentAppointments.length > 10) {
        console.log(`... and ${recentAppointments.length - 10} more recent appointments`);
      }
    }

    return {
      exactDuplicates: exactDuplicatesFound,
      sameDayBookings: sameDayDuplicatesFound,
      nameVariations: nameVariationsFound,
      totalAppointments: appointments.length,
      recentAppointments: recentAppointments.length
    };

  } catch (error) {
    console.error('❌ Error during duplicate search:', error);
  }
}

// Run the duplicate search
async function main() {
  console.log('🔍 APPOINTMENT DUPLICATE DETECTION');
  console.log('='.repeat(60));
  console.log(`📅 Analysis Date: ${new Date().toLocaleDateString()}`);
  console.log('');

  const results = await findDuplicateAppointments();
  
  if (results) {
    console.log('\n✅ Duplicate analysis completed!');
  }
}

main().catch(console.error);
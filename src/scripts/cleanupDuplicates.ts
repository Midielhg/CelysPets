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

// Exact duplicates found from the analysis
const exactDuplicates = [
  {
    clientName: 'Isairy',
    date: '2020-09-03',
    time: '05:00 PM',
    duplicateIds: [10130, 10129]
  },
  {
    clientName: 'Lisandra', 
    date: '2021-01-26',
    time: '08:00 AM',
    duplicateIds: [10105, 10103]
  },
  {
    clientName: 'Amiga de Glenda',
    date: '2021-03-13',
    time: '08:00 AM',
    duplicateIds: [9307, 9306]
  }
];

async function cleanupExactDuplicates() {
  console.log('🧹 DUPLICATE APPOINTMENT CLEANUP');
  console.log('='.repeat(50));
  console.log(`📅 Cleanup Date: ${new Date().toLocaleDateString()}`);
  console.log(`🎯 Found ${exactDuplicates.length} sets of exact duplicates to clean`);
  console.log('');

  let totalRemoved = 0;
  let errors = 0;

  for (let i = 0; i < exactDuplicates.length; i++) {
    const duplicate = exactDuplicates[i];
    
    console.log(`\n📋 Processing duplicate set ${i + 1}/${exactDuplicates.length}:`);
    console.log(`   Client: ${duplicate.clientName}`);
    console.log(`   Date: ${duplicate.date} at ${duplicate.time}`);
    console.log(`   Duplicate IDs: ${duplicate.duplicateIds.join(', ')}`);

    try {
      // Get detailed information about both appointments before deletion
      const { data: appointmentDetails } = await supabase
        .from('appointments')
        .select(`
          id,
          created_at,
          updated_at,
          status,
          services,
          total_amount,
          notes
        `)
        .in('id', duplicate.duplicateIds)
        .order('created_at', { ascending: true });

      if (appointmentDetails && appointmentDetails.length > 0) {
        console.log('   📊 Appointment details:');
        appointmentDetails.forEach((apt, index) => {
          console.log(`      ${index + 1}. ID: ${apt.id} | Created: ${new Date(apt.created_at).toLocaleString()} | Status: ${apt.status} | Amount: $${apt.total_amount || 0}`);
        });

        // Keep the oldest appointment (first created) and remove the newer ones
        const toKeep = appointmentDetails[0];
        const toRemove = appointmentDetails.slice(1);

        console.log(`   ✅ Keeping appointment ID: ${toKeep.id} (created first)`);
        console.log(`   🗑️  Removing ${toRemove.length} duplicate(s): ${toRemove.map(apt => apt.id).join(', ')}`);

        // Remove the duplicate appointments
        for (const aptToRemove of toRemove) {
          const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', aptToRemove.id);

          if (error) {
            console.error(`   ❌ Error removing appointment ${aptToRemove.id}:`, error);
            errors++;
          } else {
            console.log(`   ✅ Removed appointment ID: ${aptToRemove.id}`);
            totalRemoved++;
          }
        }
      }

    } catch (error) {
      console.error(`❌ Error processing duplicate set ${i + 1}:`, error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 CLEANUP COMPLETED!');
  console.log(`✅ Successfully removed: ${totalRemoved} duplicate appointments`);
  console.log(`❌ Errors encountered: ${errors}`);
  console.log(`📊 Total duplicate sets processed: ${exactDuplicates.length}`);

  // Verify cleanup by running a quick duplicate check
  console.log('\n🔍 Verifying cleanup...');
  await verifyCleanup();
}

async function verifyCleanup() {
  try {
    // Check if any of the removed IDs still exist
    const allDuplicateIds = exactDuplicates.flatMap(dup => dup.duplicateIds);
    
    const { data: remainingAppointments } = await supabase
      .from('appointments')
      .select('id, client_id, date, time')
      .in('id', allDuplicateIds);

    if (remainingAppointments && remainingAppointments.length > 0) {
      console.log(`⚠️ Found ${remainingAppointments.length} appointments that should have been removed:`);
      remainingAppointments.forEach(apt => {
        console.log(`   - ID: ${apt.id} on ${apt.date} at ${apt.time}`);
      });
    } else {
      console.log('✅ Verification passed - no duplicate appointments remaining');
    }

    // Run a quick check for any remaining exact duplicates
    const { data: allAppointments } = await supabase
      .from('appointments')
      .select('id, client_id, date, time')
      .order('date', { ascending: true });

    if (allAppointments) {
      const duplicateGroups = new Map<string, any[]>();
      
      for (const apt of allAppointments) {
        const key = `${apt.client_id}_${apt.date}_${apt.time}`;
        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, []);
        }
        duplicateGroups.get(key)!.push(apt);
      }

      let stillHasDuplicates = 0;
      for (const [, apts] of duplicateGroups) {
        if (apts.length > 1) {
          stillHasDuplicates++;
        }
      }

      if (stillHasDuplicates > 0) {
        console.log(`⚠️ Warning: Still found ${stillHasDuplicates} sets of exact duplicates`);
      } else {
        console.log('✅ No exact duplicates remaining in database');
      }
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Interactive mode - ask user before proceeding
async function main() {
  console.log('⚠️  WARNING: This script will permanently delete duplicate appointments!');
  console.log('📋 Review the duplicates that will be removed:');
  
  exactDuplicates.forEach((dup, index) => {
    console.log(`${index + 1}. ${dup.clientName} - ${dup.date} ${dup.time} (IDs: ${dup.duplicateIds.join(', ')})`);
  });

  console.log('');
  console.log('💡 The script will keep the oldest appointment and remove newer duplicates.');
  console.log('');

  // For safety, let's add a confirmation prompt (commented out for now)
  // Uncomment the following lines to add interactive confirmation:
  /*
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((resolve) => {
    rl.question('Are you sure you want to proceed? Type "yes" to continue: ', (answer) => {
      resolve(answer);
      rl.close();
    });
  });

  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Cleanup cancelled by user');
    return;
  }
  */

  await cleanupExactDuplicates();
}

main().catch(console.error);
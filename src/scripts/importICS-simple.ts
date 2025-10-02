import fs from 'fs';
import path from 'path';
import { ICSImportServiceNode } from '../services/icsImportServiceNode';

// Simple version without external_id dependency
class SimpleICSImport {
  static async importAppointmentsSimple(events: any[]): Promise<{ imported: number; skipped: number; errors: number }> {
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    console.log(`🔄 Starting simple import of ${events.length} events...`);

    for (const event of events) {
      try {
        // Parse event to appointment
        const parsedAppointment = ICSImportServiceNode.parseEventToAppointment(event);
        if (!parsedAppointment) {
          skipped++;
          continue;
        }

        // Find or create client
        const clientId = await ICSImportServiceNode.findOrCreateClient({
          name: parsedAppointment.clientName,
          phone: parsedAppointment.phone,
          address: parsedAppointment.address
        });

        if (!clientId) {
          console.error(`❌ Could not create/find client for: ${parsedAppointment.clientName}`);
          errors++;
          continue;
        }

        // Create appointment WITHOUT external_id and source fields
        const appointmentData = {
          client_id: clientId,
          services: JSON.stringify(parsedAppointment.services),
          date: parsedAppointment.date,
          time: parsedAppointment.time,
          status: 'confirmed' as const,
          notes: parsedAppointment.notes,
          total_amount: parsedAppointment.totalAmount,
          original_amount: parsedAppointment.totalAmount
        };

        const { supabase } = await import('../config/supabase-node');
        const { data, error } = await supabase
          .from('appointments')
          .insert(appointmentData)
          .select()
          .single();

        if (error) {
          console.error(`❌ Error creating appointment:`, error);
          errors++;
          continue;
        }

        console.log(`✅ Imported: ${parsedAppointment.clientName} on ${parsedAppointment.date} at ${parsedAppointment.time} (ID: ${data.id})`);
        imported++;

      } catch (error) {
        console.error(`❌ Error processing event:`, error);
        errors++;
      }
    }

    return { imported, skipped, errors };
  }
}

async function runSimpleICSImport() {
  console.log('🚀 Starting SIMPLE ICS Import Process...');
  console.log('=====================================\n');
  
  try {
    // Path to the ICS file
    const icsFilePath = path.join(process.cwd(), 'Confirmado.ics');
    
    // Check if file exists
    if (!fs.existsSync(icsFilePath)) {
      throw new Error(`ICS file not found at: ${icsFilePath}`);
    }
    
    console.log(`📂 Found ICS file: ${icsFilePath}`);
    
    // Read and parse
    const icsContent = fs.readFileSync(icsFilePath, 'utf-8');
    console.log(`📄 Read file content (${icsContent.length} characters)\n`);
    
    // Parse events
    console.log('🔍 Parsing ICS events...');
    const events = ICSImportServiceNode.parseICSContent(icsContent);
    console.log(`✅ Found ${events.length} calendar events\n`);
    
    // Show sample of first 3 events
    console.log('📋 Sample events to be imported:');
    console.log('==================================');
    events.slice(0, 3).forEach((event: any, index: number) => {
      const parsed = ICSImportServiceNode.parseEventToAppointment(event);
      if (parsed) {
        console.log(`${index + 1}. ${parsed.clientName} - ${parsed.date} at ${parsed.time}`);
        console.log(`   Amount: $${parsed.totalAmount || 'N/A'}`);
        console.log(`   Phone: ${parsed.phone || 'N/A'}`);
        console.log('');
      }
    });
    
    if (events.length > 3) {
      console.log(`... and ${events.length - 3} more events\n`);
    }
    
    // Start the actual import
    console.log('🚀 Starting simple import process (without external_id)...\n');
    const result = await SimpleICSImport.importAppointmentsSimple(events);
    
    // Final summary
    console.log('\n🎉 IMPORT COMPLETED!');
    console.log('===================');
    console.log(`✅ Successfully imported: ${result.imported} appointments`);
    console.log(`⏭️  Skipped (invalid): ${result.skipped} appointments`);
    console.log(`❌ Failed to import: ${result.errors} appointments`);
    console.log(`📊 Total processed: ${result.imported + result.skipped + result.errors} appointments\n`);
    
    if (result.errors > 0) {
      console.log('⚠️  Some appointments could not be imported. Check the logs above for details.');
    } else {
      console.log('🎊 All valid appointments were successfully imported!');
    }
    
  } catch (error) {
    console.error('\n❌ IMPORT FAILED');
    console.error('================');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the import
runSimpleICSImport()
  .then(() => {
    console.log('\n✨ Import process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import process failed:', error);
    process.exit(1);
  });
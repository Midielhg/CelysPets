import fs from 'fs';
import path from 'path';
import { ICSImportServiceNode } from '../services/icsImportServiceNode';

async function runICSImport() {
  console.log('🚀 Starting ICS Import Process...');
  console.log('=====================================\n');
  
  try {
    // Path to the ICS file
    const icsFilePath = path.join(process.cwd(), 'Confirmado.ics');
    
    // Check if file exists
    if (!fs.existsSync(icsFilePath)) {
      throw new Error(`ICS file not found at: ${icsFilePath}`);
    }
    
    console.log(`📂 Found ICS file: ${icsFilePath}`);
    console.log(`📏 File size: ${Math.round(fs.statSync(icsFilePath).size / 1024)} KB\n`);
    
    // Read and import
    const icsContent = fs.readFileSync(icsFilePath, 'utf-8');
    console.log(`📄 Read file content (${icsContent.length} characters)\n`);
    
    // Parse events
    console.log('🔍 Parsing ICS events...');
    const events = ICSImportServiceNode.parseICSContent(icsContent);
    console.log(`✅ Found ${events.length} calendar events\n`);
    
    // Show sample of events for review
    console.log('📋 Sample events to be imported:');
    console.log('==================================');
    events.slice(0, 5).forEach((event: any, index: number) => {
      const parsed = ICSImportServiceNode.parseEventToAppointment(event);
      if (parsed) {
        console.log(`${index + 1}. ${parsed.clientName} - ${parsed.date} at ${parsed.time}`);
        console.log(`   Services: ${parsed.services.join(', ')}`);
        console.log(`   Amount: $${parsed.totalAmount || 'N/A'}`);
        console.log(`   Phone: ${parsed.phone || 'N/A'}`);
        console.log(`   Address: ${parsed.address || 'N/A'}`);
        console.log('');
      }
    });
    
    if (events.length > 5) {
      console.log(`... and ${events.length - 5} more events\n`);
    }
    
    // Confirm import
    console.log(`⚠️  You are about to import ${events.length} appointments.`);
    console.log('   This will create new clients and appointments in your database.');
    console.log('   Existing appointments with the same external ID will be skipped.\n');
    
    // For safety, let's do a dry run first
    console.log('🧪 Running dry run to check for potential issues...');
    let validEvents = 0;
    let invalidEvents = 0;
    
    for (const event of events) {
      const parsed = ICSImportServiceNode.parseEventToAppointment(event);
      if (parsed) {
        validEvents++;
      } else {
        invalidEvents++;
      }
    }
    
    console.log(`✅ Valid events: ${validEvents}`);
    console.log(`⚠️  Invalid events: ${invalidEvents}\n`);
    
    // Start the actual import
    console.log('🚀 Starting import process...\n');
    const result = await ICSImportServiceNode.importAppointments(events);
    
    // Final summary
    console.log('\n🎉 IMPORT COMPLETED!');
    console.log('===================');
    console.log(`✅ Successfully imported: ${result.imported} appointments`);
    console.log(`⏭️  Skipped (already exist): ${result.skipped} appointments`);
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
runICSImport()
  .then(() => {
    console.log('\n✨ Import process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import process failed:', error);
    process.exit(1);
  });

export { runICSImport };
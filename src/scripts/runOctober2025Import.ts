import 'dotenv/config';
import { execSync } from 'child_process';

// First, let's just run the existing import script on the new calendar file
// But replace the original calendar file with our new one temporarily

console.log('🔄 Temporarily replacing calendar file for October 2025+ import...');

// Backup original calendar file
execSync('cp Celys-Pets-Ca-eb24d4b8-47ed-45e8-8892-f264b28d17c4.ics Celys-Pets-backup.ics', { stdio: 'inherit' });

// Replace with new calendar file
execSync('cp new-calendar.ics Celys-Pets-Ca-eb24d4b8-47ed-45e8-8892-f264b28d17c4.ics', { stdio: 'inherit' });

try {
  console.log('🚀 Running import with October 2025+ filtering...');
  
  // Set environment variable to filter from October 2025
  process.env.IMPORT_START_DATE = '2025-10-01';
  
  // Run the existing import script
  execSync('npx tsx src/scripts/importICS-final.ts', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Import failed:', error);
} finally {
  console.log('🔄 Restoring original calendar file...');
  // Restore original calendar file
  execSync('cp Celys-Pets-backup.ics Celys-Pets-Ca-eb24d4b8-47ed-45e8-8892-f264b28d17c4.ics', { stdio: 'inherit' });
  execSync('rm Celys-Pets-backup.ics', { stdio: 'inherit' });
}

console.log('✅ October 2025+ import process completed!');
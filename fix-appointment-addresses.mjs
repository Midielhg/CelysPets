#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Fix appointment addresses by extracting location data from the original calendar data
 * and setting it in the appointment address field (not just client address)
 */

console.log('📍 CelysPets Appointment Address Fix - Setting Individual Appointment Addresses\n');

// Get credentials from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log('⚠️  Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔌 Testing Supabase connection...');
const { data: testData, error: testError } = await supabase
  .from('appointments')
  .select('id')
  .limit(1);

if (testError) {
  console.error('❌ Connection failed:', testError);
  process.exit(1);
}
console.log('✅ Connected to Supabase successfully\n');

// First, let's check the current appointment table structure
console.log('🔍 Checking appointment table structure...');
const { data: sampleAppointment, error: structureError } = await supabase
  .from('appointments')
  .select('*')
  .limit(1)
  .single();

if (structureError) {
  console.error('❌ Error checking table structure:', structureError);
  process.exit(1);
}

console.log('📋 Available appointment fields:', Object.keys(sampleAppointment).join(', '));

// Check if appointments table has an address field
const hasAddressField = 'address' in sampleAppointment;
console.log(`📍 Appointment address field: ${hasAddressField ? '✅ EXISTS' : '❌ MISSING'}\n`);

if (!hasAddressField) {
  console.log('⚠️  The appointments table does not have an address field.');
  console.log('   This might need to be added to the database schema first.');
  console.log('   For now, I\'ll work with the existing client address approach.');
  console.log('');
}

// Load the original extracted appointment data to get the location information
const fs = await import('fs');
const appointmentsDataPath = './celyspets-appointments-recent.json';

if (!fs.existsSync(appointmentsDataPath)) {
  console.error('❌ Original appointment data file not found:', appointmentsDataPath);
  console.log('   This is needed to get the original location data.');
  process.exit(1);
}

const originalData = JSON.parse(fs.readFileSync(appointmentsDataPath, 'utf8'));
console.log(`📊 Loaded ${originalData.appointments.length} original appointments with location data\n`);

// Create a map of appointment data by client name + date for matching
const locationMap = new Map();
originalData.appointments.forEach(appointment => {
  if (appointment.location && appointment.clientName && appointment.date) {
    const key = `${appointment.clientName.toLowerCase().trim()}|${appointment.date}`;
    locationMap.set(key, appointment.location);
  }
});

console.log(`🗺️  Created location map with ${locationMap.size} entries\n`);

// Get all appointments from database
console.log('📋 Fetching all appointments from database...');
const { data: dbAppointments, error: appointmentsError } = await supabase
  .from('appointments')
  .select(`
    id,
    date,
    notes,
    clients!inner (
      id,
      name
    )
  `);

if (appointmentsError) {
  console.error('❌ Error fetching appointments:', appointmentsError);
  process.exit(1);
}

console.log(`📊 Found ${dbAppointments.length} appointments in database\n`);

// Match appointments with their original location data
let matchedAppointments = 0;
let updatedClients = 0;
let errors = 0;

console.log('🔄 Processing appointments...\n');

for (let i = 0; i < dbAppointments.length; i++) {
  const dbAppointment = dbAppointments[i];
  const progress = `[${i + 1}/${dbAppointments.length}]`;
  
  // Create matching key
  const matchKey = `${dbAppointment.clients.name.toLowerCase().trim()}|${dbAppointment.date}`;
  const originalLocation = locationMap.get(matchKey);
  
  if (originalLocation) {
    matchedAppointments++;
    
    // For now, update the client address if it's empty (since we don't have appointment address field)
    const { data: clientData, error: clientFetchError } = await supabase
      .from('clients')
      .select('address')
      .eq('id', dbAppointment.clients.id)
      .single();

    if (clientFetchError) {
      console.error(`${progress} ❌ Error fetching client data:`, clientFetchError.message);
      errors++;
      continue;
    }

    // Update client address if it's empty or generic
    if (!clientData.address || clientData.address.trim() === '' || clientData.address.includes('Estados Unidos')) {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ address: originalLocation })
        .eq('id', dbAppointment.clients.id);

      if (updateError) {
        console.error(`${progress} ❌ Error updating client address:`, updateError.message);
        errors++;
      } else {
        console.log(`${progress} ✅ Updated address for ${dbAppointment.clients.name}: ${originalLocation.substring(0, 50)}...`);
        updatedClients++;
      }
    } else {
      console.log(`${progress} ⏭️  ${dbAppointment.clients.name} already has address: ${clientData.address.substring(0, 30)}...`);
    }
  }

  // Add small delay to avoid rate limiting
  if (i % 10 === 0 && i > 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

console.log('\n📊 Appointment Address Fix Summary:');
console.log('====================================');
console.log(`🔍 Total appointments processed: ${dbAppointments.length}`);
console.log(`📍 Appointments with location data: ${matchedAppointments}`);
console.log(`✅ Client addresses updated: ${updatedClients}`);
console.log(`❌ Errors: ${errors}`);

if (updatedClients > 0) {
  console.log('\n🎉 Address update completed!');
  console.log('   Client addresses have been populated with original location data.');
  console.log('   These addresses will show up in the appointment forms.');
} else {
  console.log('\n✅ No updates needed - addresses are already set!');
}

console.log('\n💡 Note: If you need appointment-specific addresses (different from client address),');
console.log('    the appointments table schema would need to be modified to include an address field.');
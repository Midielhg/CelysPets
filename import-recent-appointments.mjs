#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';

// Load environment variables from .env file
dotenv.config();

/**
 * Import filtered appointments (2024-2025) into Supabase database
 * This script bypasses RLS policies using the service role key
 */

console.log('🚀 CelysPets Appointment Import - Last 2 Years (2024-2025)\n');

// Get credentials from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log('⚠️  Missing Supabase credentials in .env file:');
  console.log(`   SUPABASE_URL: ${SUPABASE_URL ? '✅ Found' : '❌ Missing'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ Found' : '❌ Missing'}`);
  console.log('');
  console.log('   Please add SUPABASE_SERVICE_ROLE_KEY to your .env file.');
  console.log('   Get it from: Settings > API > Service Role in your Supabase dashboard.');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
console.log('🔌 Testing Supabase connection...');

try {
  const { data: testData, error: testError } = await supabase
    .from('clients')
    .select('id, name')
    .limit(1);

  if (testError) {
    console.error('❌ Connection failed:', testError);
    process.exit(1);
  }
  
  console.log('✅ Connected to Supabase successfully');
  console.log(`   Found clients table with sample data`);
} catch (err) {
  console.error('❌ Connection exception:', err);
  process.exit(1);
}
console.log('✅ Connected to Supabase successfully\n');

// Read filtered appointments
const appointmentsPath = './celyspets-appointments-recent.json';
if (!fs.existsSync(appointmentsPath)) {
  console.error('❌ Filtered appointments file not found:', appointmentsPath);
  console.log('   Please run filter-recent-appointments.mjs first');
  process.exit(1);
}

const appointmentsData = JSON.parse(fs.readFileSync(appointmentsPath, 'utf8'));
console.log(`📅 Found ${appointmentsData.appointments.length} appointments to import`);
console.log(`💰 Total revenue: $${appointmentsData.statistics.totalRevenue.toLocaleString()}\n`);

// Helper function to create or get client ID
async function getOrCreateClient(clientName, appointment) {
  if (!clientName || clientName.trim() === '') {
    return null; // Skip appointments without client names
  }

  const cleanName = clientName.trim();
  
  // First, try to find existing client by name (case-insensitive)
  const { data: existingClients, error: findError } = await supabase
    .from('clients')
    .select('id, name')
    .ilike('name', cleanName);

  if (findError) {
    console.error(`❌ Error finding client "${cleanName}":`, findError.message);
    return null;
  }

  if (existingClients && existingClients.length > 0) {
    return existingClients[0].id;
  }

  // Create new client
  const newClient = {
    name: cleanName,
    email: '', // We don't have emails from calendar data
    phone: '', // We don't have phone numbers from calendar data  
    address: appointment.location || '', // Use appointment location as address
    pets: [], // Empty array for now
  };

  const { data: createdClient, error: createError } = await supabase
    .from('clients')
    .insert(newClient)
    .select('id')
    .single();

  if (createError) {
    console.error(`❌ Error creating client "${cleanName}":`, createError.message);
    return null;
  }

  console.log(`  ✅ Created new client: ${cleanName} (ID: ${createdClient.id})`);
  return createdClient.id;
}

// Helper function to format services
function formatServices(appointment) {
  if (appointment.services && Array.isArray(appointment.services)) {
    return appointment.services;
  }
  
  // Default to grooming service if no services specified
  return ['Grooming Service'];
}

// Helper function to parse time or set default
function parseTime(timeStr) {
  if (!timeStr) return '09:00'; // Default to 9 AM
  
  // If it's already in HH:MM format, use it
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return timeStr.length === 4 ? `0${timeStr}` : timeStr;
  }
  
  return '09:00'; // Default fallback
}

// Main import function
async function importAppointments() {
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const clientCache = new Map(); // Cache client IDs to avoid duplicate queries

  console.log('🔄 Starting import process...\n');

  for (let i = 0; i < appointmentsData.appointments.length; i++) {
    const appointment = appointmentsData.appointments[i];
    const progress = `[${i + 1}/${appointmentsData.appointments.length}]`;
    
    // Skip appointments without dates or client names
    if (!appointment.date || !appointment.clientName) {
      console.log(`${progress} ⏭️  Skipping - missing date or client name`);
      skipCount++;
      continue;
    }

    const clientKey = appointment.clientName.trim().toLowerCase();
    let clientId;

    // Check cache first
    if (clientCache.has(clientKey)) {
      clientId = clientCache.get(clientKey);
    } else {
      clientId = await getOrCreateClient(appointment.clientName, appointment);
      if (clientId) {
        clientCache.set(clientKey, clientId);
      }
    }

    if (!clientId) {
      console.log(`${progress} ⏭️  Skipping - could not create/find client for "${appointment.clientName}"`);
      skipCount++;
      continue;
    }

    // Prepare appointment data for insertion
    const appointmentData = {
      client_id: clientId,  // Use snake_case for database column
      services: formatServices(appointment),
      date: appointment.date,
      time: parseTime(appointment.time),
      status: appointment.status === 'confirmed' ? 'confirmed' : 'pending',
      notes: [
        appointment.notes || '',
        appointment.petInfo || '',
        appointment.location ? `Location: ${appointment.location}` : '',
        appointment.uid ? `Calendar UID: ${appointment.uid}` : ''
      ].filter(note => note.trim() !== '').join(' | ') || null,
      total_amount: appointment.amount || null,  // Use snake_case for database column
      original_amount: appointment.amount || null,  // Use snake_case for database column
    };

    // Insert appointment
    const { data: createdAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select('id')
      .single();

    if (insertError) {
      console.error(`${progress} ❌ Error creating appointment:`, insertError.message);
      errorCount++;
      continue;
    }

    const amount = appointment.amount ? `$${appointment.amount}` : 'No amount';
    console.log(`${progress} ✅ ${appointment.clientName} - ${appointment.date} - ${amount}`);
    successCount++;

    // Add small delay to avoid rate limiting
    if (i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('\n📊 Import Summary:');
  console.log('==================');
  console.log(`✅ Successfully imported: ${successCount} appointments`);
  console.log(`⏭️  Skipped: ${skipCount} appointments`);
  console.log(`❌ Errors: ${errorCount} appointments`);
  console.log(`👥 Total clients processed: ${clientCache.size} unique clients`);

  if (successCount > 0) {
    console.log('\n🎉 Import completed successfully!');
    console.log(`   Check your Supabase dashboard to verify the ${successCount} new appointments.`);
  }
}

// Ask for confirmation before proceeding
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(`⚠️  This will import ${appointmentsData.appointments.length} appointments from 2024-2025.\nContinue? (y/N): `, (answer) => {
  rl.close();
  
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    importAppointments().catch(console.error);
  } else {
    console.log('❌ Import cancelled');
    process.exit(0);
  }
});

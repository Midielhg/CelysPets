#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Fix appointment locations by moving address data from notes to client addresses
 * This script extracts location information from appointment notes and updates client addresses
 */

console.log('🏠 CelysPets Address Fix - Moving Locations from Notes to Client Addresses\n');

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
  .from('clients')
  .select('id')
  .limit(1);

if (testError) {
  console.error('❌ Connection failed:', testError);
  process.exit(1);
}
console.log('✅ Connected to Supabase successfully\n');

// Function to extract location from notes
function extractLocationFromNotes(notes) {
  if (!notes) return null;
  
  // Look for "Location: ..." pattern
  const locationMatch = notes.match(/Location:\s*([^|]+)/i);
  if (locationMatch) {
    return locationMatch[1].trim();
  }
  
  return null;
}

// Function to clean notes by removing location information
function cleanNotes(notes) {
  if (!notes) return null;
  
  // Remove "Location: ..." part and clean up separators
  let cleanedNotes = notes
    .replace(/Location:\s*[^|]+/i, '')
    .replace(/^\s*\|\s*/, '') // Remove leading separator
    .replace(/\s*\|\s*$/, '') // Remove trailing separator
    .replace(/\s*\|\s*\|\s*/g, ' | ') // Clean up double separators
    .trim();
  
  return cleanedNotes || null;
}

// Main function to fix addresses
async function fixAddresses() {
  console.log('📋 Fetching appointments with location data in notes...\n');
  
  // Get all appointments that have "Location:" in their notes
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select(`
      id, 
      notes, 
      client_id,
      clients!inner (
        id,
        name,
        address
      )
    `)
    .like('notes', '%Location:%');

  if (appointmentsError) {
    console.error('❌ Error fetching appointments:', appointmentsError);
    process.exit(1);
  }

  console.log(`📊 Found ${appointments.length} appointments with location data\n`);
  
  if (appointments.length === 0) {
    console.log('✅ No appointments found with location data in notes. Nothing to fix!');
    return;
  }

  let updatedClients = 0;
  let updatedAppointments = 0;
  let errors = 0;
  const processedClients = new Set(); // Track clients we've already updated

  for (let i = 0; i < appointments.length; i++) {
    const appointment = appointments[i];
    const progress = `[${i + 1}/${appointments.length}]`;
    
    // Extract location from notes
    const location = extractLocationFromNotes(appointment.notes);
    
    if (!location) {
      console.log(`${progress} ⏭️  No extractable location found in appointment ${appointment.id}`);
      continue;
    }

    // Update client address if we haven't processed this client yet and they don't have an address
    const clientId = appointment.client_id;
    const client = appointment.clients;
    
    if (!processedClients.has(clientId) && (!client.address || client.address.trim() === '')) {
      const { error: clientUpdateError } = await supabase
        .from('clients')
        .update({ address: location })
        .eq('id', clientId);

      if (clientUpdateError) {
        console.error(`${progress} ❌ Error updating client ${client.name}:`, clientUpdateError.message);
        errors++;
      } else {
        console.log(`${progress} ✅ Updated client address: ${client.name} → ${location}`);
        updatedClients++;
        processedClients.add(clientId);
      }
    }

    // Clean the appointment notes
    const cleanedNotes = cleanNotes(appointment.notes);
    
    const { error: appointmentUpdateError } = await supabase
      .from('appointments')
      .update({ notes: cleanedNotes })
      .eq('id', appointment.id);

    if (appointmentUpdateError) {
      console.error(`${progress} ❌ Error updating appointment notes:`, appointmentUpdateError.message);
      errors++;
    } else {
      console.log(`${progress} ✅ Cleaned appointment notes for ${client.name}`);
      updatedAppointments++;
    }

    // Add small delay to avoid rate limiting
    if (i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('\n📊 Address Fix Summary:');
  console.log('=======================');
  console.log(`✅ Client addresses updated: ${updatedClients}`);
  console.log(`✅ Appointment notes cleaned: ${updatedAppointments}`);
  console.log(`❌ Errors: ${errors}`);
  
  if (updatedClients > 0 || updatedAppointments > 0) {
    console.log('\n🎉 Address fix completed successfully!');
    console.log('   Location data has been moved from appointment notes to client addresses.');
  }
}

// Run the fix
fixAddresses().catch(console.error);
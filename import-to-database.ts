import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fzlwuxnlhxmrjwlkahht.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bHd1eG5saHhtcmp3bGthaGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzOTIyNjQsImV4cCI6MjA1MTk2ODI2NH0.VeTQY1ZY0DT-pErlR2yGQtSFzSd6x6HuKAmLAiWKZsM';

console.log('🔍 Supabase Connection:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `Present (${supabaseKey.length} chars)` : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);
interface ParsedData {
  appointments: Array<{
    date: string;
    time: string;
    summary: string;
    location: string;
    attendees: string[];
    clientEmails: string[];
  }>;
  clients: Array<{
    email: string;
    name: string;
  }>;
}

// Database Types
interface ClientInsert {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  pets: Array<{
    name: string;
    breed: string;
    age?: number;
    weight?: number;
    notes?: string;
  }>;
}

interface AppointmentInsert {
  clientId: number;
  groomerId?: number;
  date: string;
  time: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  services: string[];
  notes?: string;
  totalAmount?: number;
}

function extractPetNameFromSummary(summary: string): string {
  // Extract pet name from appointment summary
  // "Tratamiento anti pulgas para Zeus" -> "Zeus"
  const match = summary.match(/para\s+([A-Za-z]+)/i);
  return match ? match[1] : 'Unknown Pet';
}

function parseServices(summary: string): string[] {
  const summaryLower = summary.toLowerCase();
  const services = [];
  
  // Map Spanish terms to services
  if (summaryLower.includes('pulgas') || summaryLower.includes('flea')) {
    services.push('Flea Treatment');
  }
  if (summaryLower.includes('baño') || summaryLower.includes('bath')) {
    services.push('Bath');
  }
  if (summaryLower.includes('corte') || summaryLower.includes('cut')) {
    services.push('Haircut');
  }
  if (summaryLower.includes('uñas') || summaryLower.includes('nail')) {
    services.push('Nail Trim');
  }
  
  // If no specific service identified, use the whole summary
  if (services.length === 0) {
    services.push(summary);
  }
  
  return services;
}

async function importData() {
  try {
    console.log('Starting data import...');
    
    // Authenticate as admin first
    console.log('🔑 Authenticating as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@celyspets.com',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('Authentication failed:', authError);
      return;
    }
    
    if (authData.user) {
      console.log('✅ Authenticated as:', authData.user.email);
    }
    
    // Read parsed data
    const dataPath = path.join(process.cwd(), 'parsed-appointments.json');
    const parsedData: ParsedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    console.log(`Found ${parsedData.clients.length} clients and ${parsedData.appointments.length} appointments`);
    
    // 1. Import clients first
    const clientMap = new Map<string, number>(); // email -> client_id
    
    for (const clientData of parsedData.clients) {
      console.log(`Processing client: ${clientData.name} (${clientData.email})`);
      
      // Check if client already exists
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('id, email')
        .eq('email', clientData.email)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking existing client:', checkError);
        continue;
      }
      
      if (existingClient) {
        console.log(`Client already exists with ID: ${existingClient.id}`);
        clientMap.set(clientData.email, existingClient.id);
        continue;
      }
      
      // Extract pet names from appointments for this client
      const clientAppointments = parsedData.appointments.filter(apt => 
        apt.clientEmails.includes(clientData.email)
      );
      
      const pets: Array<{
        name: string;
        breed: string;
        age?: number;
        weight?: number;
        notes?: string;
      }> = [];
      for (const apt of clientAppointments) {
        const petName = extractPetNameFromSummary(apt.summary);
        if (petName !== 'Unknown Pet') {
          // Check if we already have this pet
          if (!pets.find(p => p.name === petName)) {
            pets.push({
              name: petName,
              breed: 'Unknown', // We'll need to ask the owner to update this
              notes: `Imported from appointment: ${apt.summary}`
            });
          }
        }
      }
      
      // If no pets found, add a placeholder
      if (pets.length === 0) {
        pets.push({
          name: 'Pet', // Generic name
          breed: 'Unknown',
          notes: 'Pet details need to be updated'
        });
      }
      
      // Insert client
      const clientInsert: ClientInsert = {
        name: clientData.name,
        email: clientData.email,
        phone: '', // Required field - will need to be updated later
        address: '', // Required field - will need to be updated later
        pets: pets
      };
      
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert(clientInsert)
        .select('id')
        .single();
        
      if (insertError) {
        console.error('Error inserting client:', insertError);
        continue;
      }
      
      console.log(`Created client with ID: ${newClient.id}, pets: ${pets.map(p => p.name).join(', ')}`);
      clientMap.set(clientData.email, newClient.id);
    }
    
    // 2. Import appointments
    for (const aptData of parsedData.appointments) {
      console.log(`Processing appointment: ${aptData.summary} on ${aptData.date}`);
      
      // Get client ID
      const clientEmail = aptData.clientEmails[0]; // Take first client if multiple
      const clientId = clientMap.get(clientEmail);
      
      if (!clientId) {
        console.error(`Client not found for email: ${clientEmail}`);
        continue;
      }
      
      // Parse services from summary
      const services = parseServices(aptData.summary);
      
      // Create appointment
      const appointmentInsert = {
        client_id: clientId,
        date: aptData.date,
        time: aptData.time === '00:00' ? '09:00' : aptData.time, // Default to 9 AM if all-day
        status: 'completed', // Historical appointments are completed
        services: services,
        notes: `Imported from calendar: ${aptData.summary}. Location: ${aptData.location.replace(/\\r/g, '').trim()}`
      };
      
      const { data: newAppointment, error: aptError } = await supabase
        .from('appointments')
        .insert(appointmentInsert)
        .select('id')
        .single();
        
      if (aptError) {
        console.error('Error inserting appointment:', aptError);
        continue;
      }
      
      console.log(`Created appointment with ID: ${newAppointment.id}`);
    }
    
    console.log('\\nData import completed successfully!');
    console.log(`Imported ${parsedData.clients.length} clients and ${parsedData.appointments.length} appointments`);
    
  } catch (error) {
    console.error('Error during import:', error);
  }
}

// Run the import
importData();
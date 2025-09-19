// ICS Calendar Parser for CelysPets Appointments
import { readFileSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uizkllezgwpxolcbkaiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemtsbGV6Z3dweG9sY2JrYWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NDk5NTIsImV4cCI6MjA3MzEyNTk1Mn0.7f1BjfumqFvgAM8Z0jI_TjFX1AIANQ2CyAUToeOdM8c';

const supabase = createClient(supabaseUrl, supabaseKey);

function parseICSFile(filePath) {
  console.log('📅 Parsing ICS file...');
  
  const content = readFileSync(filePath, 'utf-8');
  const events = [];
  
  // Split into individual VEVENT blocks
  const veventBlocks = content.split('BEGIN:VEVENT').slice(1);
  
  for (const block of veventBlocks) {
    const eventEnd = block.indexOf('END:VEVENT');
    if (eventEnd === -1) continue;
    
    const eventContent = block.substring(0, eventEnd);
    const lines = eventContent.split('\n').map(line => line.trim()).filter(line => line);
    
    const event = {};
    let currentProperty = '';
    let currentValue = '';
    
    for (const line of lines) {
      // Handle multi-line properties (lines starting with space)
      if (line.startsWith(' ')) {
        currentValue += line.substring(1);
        continue;
      }
      
      // Process previous property
      if (currentProperty && currentValue) {
        processProperty(event, currentProperty, currentValue);
      }
      
      // Start new property
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        currentProperty = line.substring(0, colonIndex);
        currentValue = line.substring(colonIndex + 1);
      }
    }
    
    // Process last property
    if (currentProperty && currentValue) {
      processProperty(event, currentProperty, currentValue);
    }
    
    // Only include CelysPets appointments
    if (event.organizer && event.organizer.includes('celyspets.com')) {
      events.push(event);
    }
  }
  
  console.log(`✅ Found ${events.length} CelysPets appointments`);
  return events;
}

function processProperty(event, property, value) {
  // Handle property parameters (e.g., DTSTART;VALUE=DATE)
  const [propName] = property.split(';');
  
  switch (propName) {
    case 'UID':
      event.uid = value;
      break;
    case 'SUMMARY':
      event.summary = value;
      break;
    case 'DESCRIPTION':
      event.description = value;
      break;
    case 'DTSTART':
      event.dtstart = value;
      break;
    case 'DTEND':
      event.dtend = value;
      break;
    case 'LOCATION':
      event.location = value;
      break;
    case 'ORGANIZER':
      event.organizer = value;
      break;
    case 'ATTENDEE':
      event.attendee = value;
      break;
    case 'STATUS':
      event.status = value;
      break;
    case 'CREATED':
      event.created = value;
      break;
    case 'LAST-MODIFIED':
      event.lastModified = value;
      break;
  }
}

function parseDateTime(dtString) {
  // Handle different datetime formats
  if (!dtString) return { date: '', time: '' };
  
  // Remove timezone info for parsing
  const cleanDt = dtString.split('T')[0] + 'T' + (dtString.split('T')[1] || '').split('Z')[0];
  
  if (dtString.includes('VALUE=DATE')) {
    // All-day event
    const dateMatch = dtString.match(/\d{8}/);
    if (dateMatch) {
      const dateStr = dateMatch[0];
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return { date: `${year}-${month}-${day}`, time: '09:00' }; // Default time for all-day
    }
  } else {
    // Timed event
    const dtMatch = dtString.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
    if (dtMatch) {
      const [, year, month, day, hour, minute] = dtMatch;
      return { 
        date: `${year}-${month}-${day}`,
        time: `${hour}:${minute}`
      };
    }
  }
  
  return { date: '', time: '' };
}

function extractClientInfo(summary, description) {
  // Parse appointment summary for client and pet info
  let clientName = 'Unknown Client';
  let petName;
  let services = [];
  
  // Try to extract client name from summary
  const clientMatch = summary.match(/^(.*?)(?:\s*-\s*|\s*for\s*|\s*:\s*)/i);
  if (clientMatch) {
    clientName = clientMatch[1].trim();
  }
  
  // Try to extract pet name
  const petMatch = summary.match(/for\s+(\w+)/i);
  if (petMatch) {
    petName = petMatch[1];
  }
  
  // Extract services (this might need adjustment based on your appointment naming convention)
  if (summary.toLowerCase().includes('groom')) {
    services.push('Full Grooming');
  }
  if (summary.toLowerCase().includes('bath')) {
    services.push('Bath Only');
  }
  if (summary.toLowerCase().includes('nail')) {
    services.push('Nail Trim');
  }
  
  // Default service if none detected
  if (services.length === 0) {
    services.push('Grooming Service');
  }
  
  return { clientName, petName, services };
}

async function findOrCreateClient(clientName, eventData) {
  console.log(`🔍 Finding/creating client: ${clientName}`);
  
  // First try to find existing client
  const { data: existingClients, error: findError } = await supabase
    .from('clients')
    .select('*')
    .ilike('name', clientName)
    .limit(1);
  
  if (findError) {
    console.error('Error finding client:', findError);
  }
  
  if (existingClients && existingClients.length > 0) {
    console.log(`✅ Found existing client: ${existingClients[0].name}`);
    return existingClients[0].id;
  }
  
  // Create new client
  console.log(`➕ Creating new client: ${clientName}`);
  
  const clientData = {
    name: clientName,
    email: extractEmailFromEvent(eventData) || `${clientName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    phone: extractPhoneFromEvent(eventData) || 'Not provided',
    address: eventData.location || 'Not provided',
    pets: [] // Will be updated when we have pet info
  };
  
  const { data: newClient, error: createError } = await supabase
    .from('clients')
    .insert([clientData])
    .select()
    .single();
  
  if (createError) {
    console.error('Error creating client:', createError);
    throw createError;
  }
  
  console.log(`✅ Created new client with ID: ${newClient.id}`);
  return newClient.id;
}

function extractEmailFromEvent(event) {
  if (event.attendee) {
    const emailMatch = event.attendee.match(/mailto:([^\s;]+)/);
    if (emailMatch) return emailMatch[1];
  }
  return null;
}

function extractPhoneFromEvent(event) {
  if (event.description) {
    const phoneMatch = event.description.match(/\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/);
    if (phoneMatch) return phoneMatch[0];
  }
  return null;
}

async function importAppointments() {
  try {
    console.log('🚀 Starting CelysPets appointment import...');
    
    // Parse ICS file
    const appointments = parseICSFile('./calendar-data.ics');
    
    if (appointments.length === 0) {
      console.log('❌ No CelysPets appointments found in calendar file');
      return;
    }
    
    console.log(`📋 Processing ${appointments.length} appointments...`);
    
    const importedAppointments = [];
    const errors = [];
    
    for (const appointment of appointments) {
      try {
        console.log(`\n📅 Processing: ${appointment.summary}`);
        
        // Parse date and time
        const { date, time } = parseDateTime(appointment.dtstart);
        if (!date || !time) {
          console.log(`⚠️  Skipping - invalid date/time: ${appointment.dtstart}`);
          continue;
        }
        
        // Extract client and service info
        const { clientName, petName, services } = extractClientInfo(appointment.summary, appointment.description);
        
        // Find or create client
        const clientId = await findOrCreateClient(clientName, appointment);
        
        // Create appointment record
        const appointmentData = {
          clientId: clientId,
          groomerId: null, // Will be assigned later
          services: services,
          date: date,
          time: time,
          status: 'confirmed',
          notes: appointment.description || `Imported from calendar - ${appointment.summary}`,
          totalAmount: null, // Will be calculated later
          promoCodeId: null,
          promoCodeDiscount: null,
          originalAmount: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const { data: newAppointment, error: appointmentError } = await supabase
          .from('appointments')
          .insert([appointmentData])
          .select()
          .single();
        
        if (appointmentError) {
          console.error(`❌ Error creating appointment: ${appointmentError.message}`);
          errors.push({ appointment: appointment.summary, error: appointmentError.message });
          continue;
        }
        
        console.log(`✅ Created appointment ID: ${newAppointment.id}`);
        importedAppointments.push(newAppointment);
        
      } catch (error) {
        console.error(`❌ Error processing appointment "${appointment.summary}":`, error);
        errors.push({ appointment: appointment.summary, error: error.message });
      }
    }
    
    // Summary
    console.log(`\n🎉 Import Summary:`);
    console.log(`✅ Successfully imported: ${importedAppointments.length} appointments`);
    console.log(`❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Import Errors:');
      errors.forEach(err => {
        console.log(`- ${err.appointment}: ${err.error}`);
      });
    }
    
    // Save detailed results
    const results = {
      timestamp: new Date().toISOString(),
      imported: importedAppointments,
      errors: errors,
      summary: {
        total: appointments.length,
        imported: importedAppointments.length,
        errors: errors.length
      }
    };
    
    writeFileSync('appointment-import-results.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Detailed results saved to appointment-import-results.json');
    
  } catch (error) {
    console.error('💥 Fatal error during import:', error);
  }
}

// Run the import
importAppointments().catch(console.error);
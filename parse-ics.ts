import fs from 'fs';
import path from 'path';

interface ICSEvent {
  dtstart?: string;
  dtend?: string;
  summary?: string;
  location?: string;
  attendees?: string[];
  organizer?: string;
  uid?: string;
  status?: string;
  description?: string;
}

interface ParsedAppointment {
  date: string;
  time: string;
  summary: string;
  location: string;
  attendees: string[];
  clientEmails: string[];
}

function parseICSFile(filePath: string): ICSEvent[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const events: ICSEvent[] = [];
  
  // Split by VEVENT blocks
  const eventBlocks = content.split('BEGIN:VEVENT');
  
  for (let i = 1; i < eventBlocks.length; i++) { // Skip first empty block
    const eventBlock = eventBlocks[i];
    const endIndex = eventBlock.indexOf('END:VEVENT');
    
    if (endIndex === -1) continue;
    
    const eventContent = eventBlock.substring(0, endIndex);
    
    // Check if this is a CelysPets event
    if (!eventContent.includes('CelysPets Mobile Grooming')) {
      continue;
    }
    
    console.log(`Processing CelysPets event ${events.length + 1}...`);
    
    const event: ICSEvent = {};
    
    // Parse lines properly - split by actual newlines, not escaped ones
    const rawLines = eventContent.split('\n');
    const lines: string[] = [];
    
    // Unfold lines (handle line continuation)
    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i].trim();
      if (!line) continue;
      
      // Check if next line is a continuation (starts with space or tab)
      while (i + 1 < rawLines.length && (rawLines[i + 1].startsWith(' ') || rawLines[i + 1].startsWith('\t'))) {
        i++;
        line += rawLines[i].substring(1); // Remove the leading space/tab
      }
      
      lines.push(line);
    }
    
    // Process each complete line
    for (const line of lines) {
      if (line.trim()) {
        parsePropertyLine(line, event);
      }
    }
    
    console.log('Parsed event:', {
      summary: event.summary,
      dtstart: event.dtstart,
      attendees: event.attendees
    });
    
    events.push(event);
  }
  
  return events;
}

function parsePropertyLine(line: string, event: ICSEvent) {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return;
  
  const propertyPart = line.substring(0, colonIndex);
  const value = line.substring(colonIndex + 1);
  
  // Get the property name (before any parameters)
  const propName = propertyPart.split(';')[0];
  
  // Debug logging for attendees
  if (propName === 'ATTENDEE') {
    // console.log('ATTENDEE line:', line);
  }
  
  switch (propName) {
    case 'DTSTART':
      event.dtstart = value;
      break;
    case 'DTEND':
      event.dtend = value;
      break;
    case 'SUMMARY':
      event.summary = value;
      break;
    case 'LOCATION':
      event.location = value.replace(/\\n/g, ' ').replace(/\\,/g, ',');
      break;
    case 'ATTENDEE':
      if (!event.attendees) event.attendees = [];
      const emailMatch = value.match(/mailto:([^\s]+)/);
      if (emailMatch) {
        event.attendees.push(emailMatch[1]);
        // console.log('Found attendee email:', emailMatch[1]);
      }
      break;
    case 'ORGANIZER':
      event.organizer = value;
      break;
    case 'UID':
      event.uid = value;
      break;
    case 'STATUS':
      event.status = value;
      break;
    case 'DESCRIPTION':
      event.description = value.replace(/\\n/g, '\n');
      break;
  }
}

function parseDateTime(dtstart: string): { date: string; time: string } {
  // Handle different date formats
  if (dtstart.includes('VALUE=DATE:')) {
    // All-day event: VALUE=DATE:20200509
    const dateStr = dtstart.split('VALUE=DATE:')[1];
    return {
      date: `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`,
      time: '00:00'
    };
  } else {
    // Timed event: 20230121T190000Z
    const dateStr = dtstart.replace('Z', '');
    if (dateStr.includes('T')) {
      const [datePart, timePart] = dateStr.split('T');
      return {
        date: `${datePart.substring(0,4)}-${datePart.substring(4,6)}-${datePart.substring(6,8)}`,
        time: `${timePart.substring(0,2)}:${timePart.substring(2,4)}`
      };
    } else {
      return {
        date: `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`,
        time: '00:00'
      };
    }
  }
}

function isPetGroomingAppointment(event: ICSEvent): boolean {
  const summary = event.summary?.toLowerCase() || '';
  const location = event.location?.toLowerCase() || '';
  
  // Keywords that indicate pet grooming/care appointments
  const petKeywords = [
    'groom', 'grooming', 'bath', 'baño', 'pet', 'dog', 'cat', 'perro', 'gato',
    'nail', 'trim', 'cut', 'brush', 'flea', 'pulgas', 'treatment', 'tratamiento',
    'veterinary', 'vet', 'animal', 'zeus', 'mascota', 'pets'
  ];
  
  // Check if summary or location contains pet-related keywords
  const hasPetKeywords = petKeywords.some(keyword => 
    summary.includes(keyword) || location.includes(keyword)
  );
  
  // Exclude obviously non-pet appointments
  const nonPetKeywords = [
    'hotel', 'restaurant', 'airport', 'flight', 'meeting', 'reservation',
    'earnings', 'robinhood', 'efficiency', 'inspection', 'gift'
  ];
  
  const hasNonPetKeywords = nonPetKeywords.some(keyword => 
    summary.includes(keyword) || location.includes(keyword)
  );
  
  return hasPetKeywords && !hasNonPetKeywords;
}

function extractClientInfo(attendees: string[] = []): { email: string; name: string }[] {
  return attendees
    .filter(email => email !== 'service@celyspets.com') // Remove service email
    .map(email => {
      // Try to extract name from email
      const localPart = email.split('@')[0];
      const nameGuess = localPart
        .replace(/[0-9]/g, '') // Remove numbers
        .replace(/[._-]/g, ' ') // Replace separators with spaces
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();
      
      return {
        email,
        name: nameGuess || 'Unknown Client'
      };
    });
}

// Main execution
async function main() {
  try {
    console.log('Parsing CelysPets appointments from .ics file...');
    
    const icsFilePath = path.join(process.cwd(), 'service-celyspets.ics');
    const events = parseICSFile(icsFilePath);
    
    console.log(`Found ${events.length} CelysPets appointments`);
    
    const appointments: ParsedAppointment[] = [];
    const allClients = new Map<string, { email: string; name: string }>();
    
    for (const event of events) {
      if (!event.dtstart || !event.summary) continue;
      
      // Filter to only include pet grooming appointments
      if (!isPetGroomingAppointment(event)) continue;
      
      const dateTime = parseDateTime(event.dtstart);
      const clients = extractClientInfo(event.attendees);
      
      // Add clients to our unique collection
      clients.forEach(client => {
        allClients.set(client.email, client);
      });
      
      appointments.push({
        date: dateTime.date,
        time: dateTime.time,
        summary: event.summary,
        location: event.location || '',
        attendees: event.attendees || [],
        clientEmails: clients.map(c => c.email)
      });
    }
    
    console.log('\\n=== APPOINTMENTS FOUND ===');
    appointments.forEach((apt, index) => {
      console.log(`${index + 1}. ${apt.date} ${apt.time} - ${apt.summary}`);
      console.log(`   Location: ${apt.location}`);
      console.log(`   Clients: ${apt.clientEmails.join(', ')}`);
      console.log('');
    });
    
    console.log(`\\n=== UNIQUE CLIENTS (${allClients.size}) ===`);
    Array.from(allClients.values()).forEach((client, index) => {
      console.log(`${index + 1}. ${client.name} (${client.email})`);
    });
    
    // Save results to JSON files for database import
    const appointmentsData = {
      appointments,
      clients: Array.from(allClients.values())
    };
    
    fs.writeFileSync('parsed-appointments.json', JSON.stringify(appointmentsData, null, 2));
    console.log('\\nSaved parsed data to parsed-appointments.json');
    
  } catch (error) {
    console.error('Error parsing ICS file:', error);
  }
}

main();
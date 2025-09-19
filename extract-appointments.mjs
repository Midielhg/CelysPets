// CelysPets Appointment Parser - Extract data for manual import
import { readFileSync, writeFileSync } from 'fs';

function parseICSFile(filePath) {
  console.log('📅 Parsing ICS file for CelysPets appointments...');
  
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
    
    // Include ALL grooming-related appointments with multiple patterns:
    // 1. Entries with "Cely pets" or "Cely Pets" 
    // 2. Entries with dollar amounts ($XX)
    // 3. Entries with pricing patterns (XXxXX)
    // 4. Entries with pet/animal-related terms
    // 5. Entries with just "Cely" (might be incomplete)
    
    const isPetGroomingAppointment = event.summary && (
      // Direct CelysPets references
      event.summary.toLowerCase().includes('cely pets') || 
      event.summary.toLowerCase().includes('celyspets') ||
      event.summary.toLowerCase().match(/^cely\s*$/i) ||
      
      // Dollar amount patterns (likely grooming appointments)
      event.summary.match(/\$\d+/) ||
      
      // Quantity x price patterns (like "2x80")
      event.summary.match(/\d+x\d+/) ||
      
      // Pet-related terms in Spanish and English
      event.summary.toLowerCase().includes('perrit') ||
      event.summary.toLowerCase().includes('esnauser') ||
      event.summary.toLowerCase().includes('bichon') ||
      event.summary.toLowerCase().includes('yorki') ||
      event.summary.toLowerCase().includes('cocker') ||
      event.summary.toLowerCase().includes('gran danés') ||
      event.summary.toLowerCase().includes('chizu') ||
      
      // Common grooming client patterns
      (event.summary.match(/\(\w+\)/) && event.summary.match(/\$\d+/)) || // Pattern like "(Bichon) $45"
      (event.summary.includes('vecin') && event.summary.match(/\$\d+/)) // Neighbor references with price
    );
    
    if (isPetGroomingAppointment) {
      events.push(event);
    }
  }
  
  console.log(`✅ Found ${events.length} CelysPets appointments`);
  return events;
}

function processProperty(event, property, value) {
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
  if (!dtString) return { date: '', time: '' };
  
  // Parse YYYYMMDDTHHMMSSZ format
  const dtMatch = dtString.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (dtMatch) {
    const [, year, month, day, hour, minute] = dtMatch;
    return { 
      date: `${year}-${month}-${day}`,
      time: `${hour}:${minute}`,
      datetime: `${year}-${month}-${day} ${hour}:${minute}`
    };
  }
  
  return { date: '', time: '', datetime: '' };
}

function parseAppointmentInfo(summary) {
  // Parse various appointment summary formats:
  // "Cely pets Carla $50"
  // "Gilberto Y Monica (*5488) Koker$45" 
  // "Lily 2 Perritos($75)"
  // "Patricia (Bichon) 92ave $45 Combo#9"
  // "Ana 2• $80"
  
  let clientName = 'Unknown Client';
  let petInfo = '';
  let amount = null;
  let services = ['Grooming Service'];
  
  // Clean up the summary
  let cleanSummary = summary.trim();
  
  // Remove "Cely pets" or "Cely Pets" from the beginning if present
  cleanSummary = cleanSummary.replace(/^Cely\s+[Pp]ets\s+/i, '');
  
  // Extract price in various formats
  const pricePatterns = [
    /\$(\d+(?:\.\d{2})?)/,  // $45 or $45.00
    /(\d+(?:\.\d{2})?)\$/,  // 45$ 
    /\((\$\d+(?:\.\d{2})?)\)/, // ($75)
    /\(\$(\d+(?:\.\d{2})?)\)/ // ($75) alternative
  ];
  
  for (const pattern of pricePatterns) {
    const priceMatch = cleanSummary.match(pattern);
    if (priceMatch) {
      amount = parseFloat(priceMatch[1].replace('$', ''));
      cleanSummary = cleanSummary.replace(pattern, '').trim();
      break;
    }
  }
  
  // Extract pricing info like "2x80" (quantity x price)
  const quantityPriceMatch = cleanSummary.match(/(\d+)x(\d+)/);
  if (quantityPriceMatch) {
    const quantity = parseInt(quantityPriceMatch[1]);
    const unitPrice = parseInt(quantityPriceMatch[2]);
    amount = quantity * unitPrice;
    cleanSummary = cleanSummary.replace(/\d+x\d+/, '').trim();
  }
  
  // Extract client name - usually the first word or words before parentheses/special characters
  const clientPatterns = [
    /^([A-Za-z]+(?:\s+[A-Za-z]+)*)/,  // First name(s) at start
    /^([^(]+?)(?:\s*\(|$)/,           // Text before parentheses
    /^(.+?)(?:\s+\*|\s+\d+)/          // Text before * or numbers
  ];
  
  for (const pattern of clientPatterns) {
    const clientMatch = cleanSummary.match(pattern);
    if (clientMatch && clientMatch[1].trim()) {
      clientName = clientMatch[1].trim();
      // Remove client name from summary to get pet info
      cleanSummary = cleanSummary.replace(clientMatch[1], '').trim();
      break;
    }
  }
  
  // Extract pet information from remaining text
  const petKeywords = [
    'esnauser', 'schnauzer', 'bichon', 'yorki', 'yorkshire', 'cocker', 
    'gran danés', 'great dane', 'chizu', 'chihuahua', 'perrit', 'dog', 'cat',
    'golden', 'labrador', 'poodle', 'maltese'
  ];
  
  const petInfoCandidates = [];
  
  // Look for pet breed/type information
  for (const keyword of petKeywords) {
    if (cleanSummary.toLowerCase().includes(keyword)) {
      petInfoCandidates.push(keyword);
    }
  }
  
  // Extract content in parentheses as pet info
  const parenMatch = cleanSummary.match(/\(([^)]+)\)/);
  if (parenMatch) {
    petInfoCandidates.push(parenMatch[1]);
    cleanSummary = cleanSummary.replace(/\([^)]+\)/, '').trim();
  }
  
  // Use remaining clean summary as additional pet info
  if (cleanSummary && cleanSummary.length > 0) {
    // Clean up common artifacts
    cleanSummary = cleanSummary.replace(/[*•]+/, '').replace(/\s+/g, ' ').trim();
    if (cleanSummary.length > 1) {
      petInfoCandidates.push(cleanSummary);
    }
  }
  
  petInfo = petInfoCandidates.join(' ').trim();
  
  // If no specific client name found, try to extract from the original summary
  if (clientName === 'Unknown Client') {
    const firstWord = summary.split(/\s+/)[0];
    if (firstWord && firstWord.length > 2 && !firstWord.includes('$')) {
      clientName = firstWord;
    }
  }
  
  return {
    clientName,
    petInfo,
    amount,
    services,
    originalSummary: summary
  };
}

function formatAppointmentForImport(appointment) {
  const { date, time, datetime } = parseDateTime(appointment.dtstart);
  const appointmentInfo = parseAppointmentInfo(appointment.summary);
  
  return {
    // Original calendar data
    uid: appointment.uid,
    originalSummary: appointment.summary,
    
    // Parsed appointment info
    clientName: appointmentInfo.clientName,
    petInfo: appointmentInfo.petInfo,
    amount: appointmentInfo.amount,
    services: appointmentInfo.services,
    
    // Date and time
    date: date,
    time: time,
    datetime: datetime,
    
    // Additional info
    location: appointment.location || '',
    notes: appointment.description || `Imported from calendar: ${appointment.summary}`,
    status: 'confirmed'
  };
}

function exportAppointments() {
  try {
    console.log('🚀 Starting CelysPets appointment extraction...');
    
    // Parse ICS file
    const rawAppointments = parseICSFile('./calendar-data.ics');
    
    if (rawAppointments.length === 0) {
      console.log('❌ No CelysPets appointments found in calendar file');
      return;
    }
    
    // Format appointments for import
    const formattedAppointments = rawAppointments.map(formatAppointmentForImport);
    
    // Sort by date
    formattedAppointments.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    
    console.log('\n📋 Extracted CelysPets Appointments:');
    console.log('=====================================');
    
    formattedAppointments.forEach((apt, index) => {
      console.log(`${index + 1}. ${apt.datetime} - ${apt.clientName}`);
      console.log(`   Summary: ${apt.originalSummary}`);
      console.log(`   Pet Info: ${apt.petInfo || 'Not specified'}`);
      console.log(`   Amount: $${apt.amount || 'Not specified'}`);
      console.log(`   Location: ${apt.location || 'Not specified'}`);
      console.log('');
    });
    
    // Save detailed results
    const results = {
      timestamp: new Date().toISOString(),
      total: formattedAppointments.length,
      appointments: formattedAppointments,
      summary: {
        dateRange: {
          earliest: formattedAppointments[0]?.datetime,
          latest: formattedAppointments[formattedAppointments.length - 1]?.datetime
        },
        clients: [...new Set(formattedAppointments.map(apt => apt.clientName))],
        totalAmount: formattedAppointments.reduce((sum, apt) => sum + (apt.amount || 0), 0)
      }
    };
    
    writeFileSync('celyspets-appointments-extracted.json', JSON.stringify(results, null, 2));
    console.log(`📄 Extracted data saved to celyspets-appointments-extracted.json`);
    
    // Create simple CSV for easy viewing
    const csvHeaders = 'Date,Time,Client,Pet Info,Amount,Location,Summary';
    const csvRows = formattedAppointments.map(apt => {
      return [
        apt.date,
        apt.time,
        apt.clientName,
        apt.petInfo || '',
        apt.amount || '',
        apt.location || '',
        `"${apt.originalSummary}"`
      ].join(',');
    });
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    writeFileSync('celyspets-appointments.csv', csvContent);
    console.log(`📊 CSV export saved to celyspets-appointments.csv`);
    
    console.log(`\n🎉 Extraction Summary:`);
    console.log(`✅ Total appointments found: ${results.total}`);
    console.log(`📅 Date range: ${results.summary.dateRange.earliest} to ${results.summary.dateRange.latest}`);
    console.log(`👥 Unique clients: ${results.summary.clients.length}`);
    console.log(`💰 Total revenue: $${results.summary.totalAmount}`);
    console.log(`\n📝 Client list: ${results.summary.clients.join(', ')}`);
    
  } catch (error) {
    console.error('💥 Fatal error during extraction:', error);
  }
}

// Run the extraction
exportAppointments();
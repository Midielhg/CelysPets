import { supabase } from '../config/supabase';

interface ICSEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart?: string;
  dtend?: string;
  created?: string;
}

interface ParsedAppointment {
  clientName: string;
  services: string[];
  date: string;
  time: string;
  phone?: string;
  address?: string;
  notes?: string;
  totalAmount?: number;
  externalId: string;
}

interface ParsedClient {
  name: string;
  email: string; // Will generate if not available
  phone: string;
  address: string;
  pets: any[]; // Will be empty initially
}

export class ICSImportService {
  
  /**
   * Parse ICS file content and extract events
   */
  static parseICSContent(icsContent: string): ICSEvent[] {
    const events: ICSEvent[] = [];
    const lines = icsContent.split('\n');
    
    let currentEvent: Partial<ICSEvent> = {};
    let inEvent = false;
    let currentProperty = '';
    let currentValue = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
        continue;
      }
      
      if (line === 'END:VEVENT') {
        if (currentEvent.uid && currentEvent.summary) {
          events.push(currentEvent as ICSEvent);
        }
        inEvent = false;
        currentEvent = {};
        continue;
      }
      
      if (!inEvent) continue;

      // Handle line continuation (lines starting with space or tab)
      if (line.startsWith(' ') || line.startsWith('\t')) {
        currentValue += line.substring(1);
        continue;
      }

      // Process completed property if we have one
      if (currentProperty && currentValue) {
        this.setEventProperty(currentEvent, currentProperty, currentValue);
      }

      // Parse new property
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const propertyPart = line.substring(0, colonIndex);
        currentValue = line.substring(colonIndex + 1);
        
        // Handle properties with parameters (e.g., DTSTART;TZID=...)
        const semicolonIndex = propertyPart.indexOf(';');
        currentProperty = semicolonIndex > 0 ? propertyPart.substring(0, semicolonIndex) : propertyPart;
      }
    }

    // Process last property if exists
    if (currentProperty && currentValue) {
      this.setEventProperty(currentEvent, currentProperty, currentValue);
    }

    console.log(`📅 Parsed ${events.length} events from ICS file`);
    return events;
  }

  /**
   * Set property on event object
   */
  private static setEventProperty(event: Partial<ICSEvent>, property: string, value: string) {
    switch (property.toLowerCase()) {
      case 'uid':
        event.uid = value;
        break;
      case 'summary':
        event.summary = value;
        break;
      case 'description':
        event.description = value;
        break;
      case 'location':
        event.location = value;
        break;
      case 'dtstart':
        event.dtstart = value;
        break;
      case 'dtend':
        event.dtend = value;
        break;
      case 'created':
        event.created = value;
        break;
    }
  }

  /**
   * Parse a single ICS event into appointment data
   */
  static parseEventToAppointment(event: ICSEvent): ParsedAppointment | null {
    try {
      // Parse date and time from DTSTART
      const { date, time } = this.parseDatetime(event.dtstart);
      if (!date || !time) {
        console.warn(`⚠️ Could not parse datetime for event: ${event.summary}`);
        return null;
      }

      // Extract client name, services, and price from summary
      const { clientName, services, totalAmount } = this.parseSummary(event.summary);
      if (!clientName) {
        console.warn(`⚠️ Could not extract client name from: ${event.summary}`);
        return null;
      }

      // Extract phone from description
      const phone = this.extractPhone(event.description);

      // Clean up location
      const address = this.cleanLocation(event.location);

      return {
        clientName,
        services,
        date,
        time,
        phone,
        address,
        notes: `Imported from calendar: ${event.summary}`,
        totalAmount,
        externalId: event.uid
      };
    } catch (error) {
      console.error(`❌ Error parsing event:`, error, event);
      return null;
    }
  }

  /**
   * Parse datetime string to date and time
   */
  private static parseDatetime(dtstart?: string): { date: string; time: string } {
    if (!dtstart) return { date: '', time: '' };

    try {
      // Handle YYYYMMDDTHHMMSS format
      const match = dtstart.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
      if (match) {
        const [, year, month, day, hour, minute] = match;
        const date = `${year}-${month}-${day}`;
        
        // Convert to 12-hour format
        let hourNum = parseInt(hour);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        hourNum = hourNum % 12;
        if (hourNum === 0) hourNum = 12;
        
        const time = `${hourNum.toString().padStart(2, '0')}:${minute} ${ampm}`;
        
        return { date, time };
      }
    } catch (error) {
      console.error('Error parsing datetime:', error);
    }

    return { date: '', time: '' };
  }

  /**
   * Parse summary to extract client name, services, and price
   */
  private static parseSummary(summary: string): { clientName: string; services: string[]; totalAmount?: number } {
    let clientName = '';
    let services = ['Grooming Service']; // Default service
    let totalAmount: number | undefined;

    // Extract price using regex
    const priceMatch = summary.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      totalAmount = parseFloat(priceMatch[1]);
    }

    // Extract client name - usually the first part before parentheses or price
    let nameMatch = summary.match(/^([^($]+)/);
    if (nameMatch) {
      clientName = nameMatch[1].trim();
    } else {
      clientName = summary.split(' ')[0]; // Fallback to first word
    }

    // Clean up client name
    clientName = clientName.replace(/^\d+\s*/, ''); // Remove leading numbers
    clientName = clientName.trim();

    return { clientName, services, totalAmount };
  }

  /**
   * Extract phone number from description
   */
  private static extractPhone(description?: string): string {
    if (!description) return '';

    // Look for phone patterns
    const phonePatterns = [
      /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
      /\d{3}-\d{3}-\d{4}/,
      /\(\d{3}\)\s?\d{3}-\d{4}/
    ];

    for (const pattern of phonePatterns) {
      const match = description.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return description.trim();
  }

  /**
   * Clean and format location/address
   */
  private static cleanLocation(location?: string): string {
    if (!location) return '';
    
    return location
      .replace(/\\n/g, ', ')
      .replace(/\n/g, ', ')
      .replace('Estados Unidos', 'USA')
      .trim();
  }

  /**
   * Find or create client in database
   */
  static async findOrCreateClient(parsedClient: Partial<ParsedClient>): Promise<number | null> {
    try {
      if (!parsedClient.name) return null;

      // First, try to find existing client by phone or name
      let existingClient = null;
      
      if (parsedClient.phone) {
        const { data: phoneMatch } = await supabase
          .from('clients')
          .select('*')
          .eq('phone', parsedClient.phone)
          .single();
        
        if (phoneMatch) {
          existingClient = phoneMatch;
        }
      }

      // If not found by phone, try by name
      if (!existingClient) {
        const { data: nameMatches } = await supabase
          .from('clients')
          .select('*')
          .ilike('name', `%${parsedClient.name}%`);

        if (nameMatches && nameMatches.length > 0) {
          existingClient = nameMatches[0];
        }
      }

      if (existingClient) {
        console.log(`✅ Found existing client: ${existingClient.name} (ID: ${existingClient.id})`);
        return existingClient.id;
      }

      // Create new client
      const clientData = {
        name: parsedClient.name,
        email: parsedClient.email || `${parsedClient.name.toLowerCase().replace(/\s+/g, '.')}@imported.local`,
        phone: parsedClient.phone || '',
        address: parsedClient.address || '',
        pets: [] // Empty pets array initially
      };

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating client:', error);
        return null;
      }

      console.log(`🆕 Created new client: ${newClient.name} (ID: ${newClient.id})`);
      return newClient.id;

    } catch (error) {
      console.error('❌ Error in findOrCreateClient:', error);
      return null;
    }
  }

  /**
   * Import appointments from parsed ICS events
   */
  static async importAppointments(events: ICSEvent[]): Promise<{ imported: number; skipped: number; errors: number }> {
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    console.log(`🔄 Starting import of ${events.length} events...`);

    for (const event of events) {
      try {
        // Parse event to appointment
        const parsedAppointment = this.parseEventToAppointment(event);
        if (!parsedAppointment) {
          skipped++;
          continue;
        }

        // Check if appointment already exists
        const { data: existingAppointment } = await supabase
          .from('appointments')
          .select('id')
          .eq('external_id', parsedAppointment.externalId)
          .single();

        if (existingAppointment) {
          console.log(`⏭️ Skipping existing appointment: ${parsedAppointment.clientName} on ${parsedAppointment.date}`);
          skipped++;
          continue;
        }

        // Find or create client
        const clientId = await this.findOrCreateClient({
          name: parsedAppointment.clientName,
          phone: parsedAppointment.phone,
          address: parsedAppointment.address
        });

        if (!clientId) {
          console.error(`❌ Could not create/find client for: ${parsedAppointment.clientName}`);
          errors++;
          continue;
        }

        // Create appointment
        const appointmentData = {
          client_id: clientId,
          services: JSON.stringify(parsedAppointment.services),
          date: parsedAppointment.date,
          time: parsedAppointment.time,
          status: 'confirmed' as const,
          notes: parsedAppointment.notes,
          total_amount: parsedAppointment.totalAmount,
          original_amount: parsedAppointment.totalAmount,
          external_id: parsedAppointment.externalId,
          source: 'apple_calendar' as const
        };

        const { error } = await supabase
          .from('appointments')
          .insert(appointmentData);

        if (error) {
          console.error(`❌ Error creating appointment:`, error);
          errors++;
          continue;
        }

        console.log(`✅ Imported: ${parsedAppointment.clientName} on ${parsedAppointment.date} at ${parsedAppointment.time}`);
        imported++;

      } catch (error) {
        console.error(`❌ Error processing event:`, error);
        errors++;
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Main import function
   */
  static async importFromICSFile(filePath: string): Promise<{ imported: number; skipped: number; errors: number }> {
    try {
      console.log(`📂 Reading ICS file: ${filePath}`);
      
      // Read file content
      const response = await fetch(filePath);
      const icsContent = await response.text();
      
      // Parse events
      const events = this.parseICSContent(icsContent);
      
      // Import appointments
      const result = await this.importAppointments(events);
      
      console.log(`🎉 Import completed!`);
      console.log(`✅ Imported: ${result.imported}`);
      console.log(`⏭️ Skipped: ${result.skipped}`);
      console.log(`❌ Errors: ${result.errors}`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error importing ICS file:`, error);
      throw error;
    }
  }
}
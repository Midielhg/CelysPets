import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ICSEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend?: string;
  rrule?: string; // Recurrence rule
  exdate?: string[]; // Exception dates
  location?: string;
  description?: string;
}

interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  count?: number;
  until?: string;
  byWeekday?: string[];
  byMonthDay?: number[];
}

class RecurringICSImporter {
  /**
   * Parse ICS content and extract events with recurrence rules
   */
  static parseICSContent(content: string): ICSEvent[] {
    const lines = content.split('\n').map(line => line.trim());
    const events: ICSEvent[] = [];
    let currentEvent: any = {};
    let inEvent = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
        continue;
      }

      if (line === 'END:VEVENT' && inEvent) {
        if (currentEvent.uid && currentEvent.summary && currentEvent.dtstart) {
          events.push(currentEvent as ICSEvent);
        }
        inEvent = false;
        currentEvent = {};
        continue;
      }

      if (!inEvent) continue;

      // Handle line continuation
      if (line.startsWith(' ') || line.startsWith('\t')) {
        continue; // Skip for now, could implement proper continuation handling
      }

      // Parse property
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        let key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);

        // Remove parameters (e.g., DTSTART;TZID=... becomes DTSTART)
        if (key.includes(';')) {
          key = key.split(';')[0];
        }

        key = key.toLowerCase();

        if (key === 'exdate') {
          // Handle multiple exception dates
          if (!currentEvent.exdate) currentEvent.exdate = [];
          currentEvent.exdate.push(value);
        } else {
          currentEvent[key] = value;
        }
      }
    }

    return events;
  }

  /**
   * Parse RRULE from ICS format
   */
  static parseRRule(rrule: string): RecurrencePattern | null {
    try {
      const rules = rrule.split(';').reduce((acc, rule) => {
        const [key, value] = rule.split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      const pattern: RecurrencePattern = {
        frequency: 'weekly',
        interval: 1
      };

      // Parse frequency
      if (rules.FREQ) {
        switch (rules.FREQ) {
          case 'DAILY': pattern.frequency = 'daily'; break;
          case 'WEEKLY': pattern.frequency = 'weekly'; break;
          case 'MONTHLY': pattern.frequency = 'monthly'; break;
        }
      }

      // Parse interval
      if (rules.INTERVAL) {
        pattern.interval = parseInt(rules.INTERVAL);
      }

      // Parse count
      if (rules.COUNT) {
        pattern.count = parseInt(rules.COUNT);
      }

      // Parse until date
      if (rules.UNTIL) {
        const untilDate = rules.UNTIL;
        if (untilDate.length >= 8) {
          const year = untilDate.substring(0, 4);
          const month = untilDate.substring(4, 6);
          const day = untilDate.substring(6, 8);
          pattern.until = `${year}-${month}-${day}`;
        }
      }

      return pattern;

    } catch (error) {
      console.error('Error parsing RRULE:', error);
      return null;
    }
  }

  /**
   * Parse datetime from ICS format
   */
  static parseDatetime(dtstart: string): { date: string; time: string } {
    try {
      // Remove timezone info
      let dateStr = dtstart.split(';')[0];
      if (dateStr.includes(':')) {
        dateStr = dateStr.split(':')[1];
      }

      if (dateStr.length >= 8) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const date = `${year}-${month}-${day}`;

        let time = '09:00 AM'; // Default time
        if (dateStr.length >= 15) {
          const hour = parseInt(dateStr.substring(9, 11));
          const minute = dateStr.substring(11, 13);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
          time = `${hour12.toString().padStart(2, '0')}:${minute} ${ampm}`;
        }

        return { date, time };
      }
    } catch (error) {
      console.error('Error parsing datetime:', error);
    }

    return { date: '', time: '' };
  }

  /**
   * Generate recurring dates from pattern
   */
  static generateRecurringDates(
    startDate: Date,
    pattern: RecurrencePattern,
    targetDateFrom: Date
  ): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    const maxOccurrences = pattern.count || 100; // Reasonable limit
    const endDate = pattern.until ? new Date(pattern.until) : new Date('2026-12-31');
    let occurrenceCount = 0;

    while (occurrenceCount < maxOccurrences && currentDate <= endDate) {
      // Only include dates from our target date forward (October 2025+)
      if (currentDate >= targetDateFrom) {
        dates.push(new Date(currentDate));
      }

      // Calculate next occurrence
      switch (pattern.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + pattern.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (pattern.interval * 7));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + pattern.interval);
          break;
      }

      occurrenceCount++;
    }

    return dates;
  }

  /**
   * Extract client info from summary
   */
  static extractClientInfo(summary: string) {
    let clientName = summary.trim();
    
    // Remove price info from name
    clientName = clientName.replace(/\$\d+/g, '').trim();
    
    return {
      name: clientName,
      email: `${clientName.toLowerCase().replace(/\s+/g, '.')}@recurring.local`,
      phone: '',
      address: ''
    };
  }

  /**
   * Find or create client
   */
  static async findOrCreateClient(clientInfo: any): Promise<number | null> {
    try {
      // Try to find existing client by name
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('name', clientInfo.name)
        .single();

      if (existingClient) {
        return existingClient.id;
      }

      // Create new client
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          name: clientInfo.name,
          email: clientInfo.email,
          phone: clientInfo.phone || '',
          address: clientInfo.address || '',
          pets: []
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating client:', error);
        return null;
      }

      console.log(`✅ Created new client: ${clientInfo.name}`);
      return newClient.id;

    } catch (error) {
      console.error('Error in findOrCreateClient:', error);
      return null;
    }
  }

  /**
   * Import recurring appointments
   */
  static async importRecurringAppointments(events: ICSEvent[]): Promise<void> {
    console.log(`🔄 Processing ${events.length} events for recurring patterns...`);

    const targetDate = new Date('2025-10-01');
    let processedCount = 0;
    let recurringCount = 0;
    let appointmentsCreated = 0;

    for (const event of events) {
      try {
        // Parse the base appointment datetime
        const { date, time } = this.parseDatetime(event.dtstart);
        if (!date || !time) continue;

        const baseDate = new Date(date);
        
        // Extract client information
        const clientInfo = this.extractClientInfo(event.summary);
        const clientId = await this.findOrCreateClient(clientInfo);
        
        if (!clientId) {
          console.log(`⚠️ Could not create client for: ${event.summary}`);
          continue;
        }

        // Check if this event has a recurrence rule
        if (event.rrule) {
          recurringCount++;
          console.log(`\n🔁 Processing recurring event: ${event.summary}`);
          console.log(`   Original date: ${date}`);
          console.log(`   RRULE: ${event.rrule}`);

          const pattern = this.parseRRule(event.rrule);
          if (!pattern) {
            console.log(`   ⚠️ Could not parse RRULE, skipping...`);
            continue;
          }

          console.log(`   Pattern: Every ${pattern.interval} ${pattern.frequency}(s)`);
          if (pattern.count) console.log(`   Count: ${pattern.count} occurrences`);
          if (pattern.until) console.log(`   Until: ${pattern.until}`);

          // Generate recurring dates from October 2025 forward
          const recurringDates = this.generateRecurringDates(baseDate, pattern, targetDate);
          
          console.log(`   📅 Generated ${recurringDates.length} future occurrences`);

          // Create appointments for each date
          for (const appointmentDate of recurringDates) {
            const appointmentData = {
              client_id: clientId,
              date: appointmentDate.toISOString().split('T')[0],
              time: time,
              services: ['Grooming Service'],
              status: 'confirmed' as const,
              notes: `Recurring: ${event.summary}${event.rrule ? ` | Pattern: Every ${pattern.interval} ${pattern.frequency}` : ''}`,
              total_amount: 0,
              payment_status: 'pending' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            // Check if appointment already exists
            const { data: existing } = await supabase
              .from('appointments')
              .select('id')
              .eq('client_id', clientId)
              .eq('date', appointmentData.date)
              .eq('time', appointmentData.time)
              .single();

            if (!existing) {
              const { error } = await supabase
                .from('appointments')
                .insert(appointmentData);

              if (error) {
                console.error(`   ❌ Error creating appointment for ${appointmentData.date}:`, error);
              } else {
                appointmentsCreated++;
                console.log(`   ✅ Created appointment for ${appointmentData.date}`);
              }
            } else {
              console.log(`   📋 Appointment already exists for ${appointmentData.date}`);
            }
          }

        } else {
          // Handle single (non-recurring) appointment
          if (baseDate >= targetDate) {
            const appointmentData = {
              client_id: clientId,
              date: date,
              time: time,
              services: ['Grooming Service'],
              status: 'confirmed' as const,
              notes: event.summary,
              total_amount: 0,
              payment_status: 'pending' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            // Check if appointment already exists
            const { data: existing } = await supabase
              .from('appointments')
              .select('id')
              .eq('client_id', clientId)
              .eq('date', appointmentData.date)
              .eq('time', appointmentData.time)
              .single();

            if (!existing) {
              const { error } = await supabase
                .from('appointments')
                .insert(appointmentData);

              if (!error) {
                appointmentsCreated++;
                console.log(`✅ Created single appointment: ${event.summary} on ${date}`);
              }
            }
          }
        }

        processedCount++;

      } catch (error) {
        console.error(`❌ Error processing event ${event.summary}:`, error);
      }
    }

    console.log('\n🎉 RECURRING IMPORT COMPLETED!');
    console.log('='.repeat(50));
    console.log(`📊 Total events processed: ${processedCount}`);
    console.log(`🔁 Recurring events found: ${recurringCount}`);
    console.log(`✅ Total appointments created: ${appointmentsCreated}`);
  }
}

// Main execution
async function main() {
  try {
    console.log('🔁 RECURRING APPOINTMENTS IMPORT');
    console.log('='.repeat(50));

    // Read the ICS file
    console.log('📂 Reading ICS file...');
    const icsContent = readFileSync('new-calendar.ics', 'utf-8');

    // Parse events
    console.log('🔍 Parsing ICS events...');
    const events = RecurringICSImporter.parseICSContent(icsContent);
    console.log(`📋 Found ${events.length} total events`);

    // Filter for events with recurrence rules
    const recurringEvents = events.filter(event => event.rrule);
    console.log(`🔁 Found ${recurringEvents.length} recurring events`);

    if (recurringEvents.length > 0) {
      console.log('\n📋 Recurring events preview:');
      recurringEvents.slice(0, 5).forEach((event, index) => {
        const { date } = RecurringICSImporter.parseDatetime(event.dtstart);
        console.log(`${index + 1}. ${event.summary} - ${date} | RRULE: ${event.rrule}`);
      });
      
      if (recurringEvents.length > 5) {
        console.log(`... and ${recurringEvents.length - 5} more recurring events`);
      }
    }

    // Import all events (recurring and single)
    await RecurringICSImporter.importRecurringAppointments(events);

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

main();
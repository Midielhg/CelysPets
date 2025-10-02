import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

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
  rrule?: string;
  location?: string;
  description?: string;
}

interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  count?: number;
  until?: string;
}

class SimpleRecurringImporter {
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
      } else if (line === 'END:VEVENT' && inEvent) {
        if (currentEvent.uid && currentEvent.summary && currentEvent.dtstart) {
          events.push(currentEvent as ICSEvent);
        }
        inEvent = false;
        currentEvent = {};
      } else if (inEvent && line.includes(':')) {
        const colonIndex = line.indexOf(':');
        let key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);

        // Remove parameters
        if (key.includes(';')) {
          key = key.split(';')[0];
        }

        currentEvent[key.toLowerCase()] = value;
      }
    }

    return events;
  }

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

      if (rules.FREQ) {
        switch (rules.FREQ) {
          case 'DAILY': pattern.frequency = 'daily'; break;
          case 'WEEKLY': pattern.frequency = 'weekly'; break;
          case 'MONTHLY': pattern.frequency = 'monthly'; break;
        }
      }

      if (rules.INTERVAL) {
        pattern.interval = parseInt(rules.INTERVAL);
      }

      if (rules.COUNT) {
        pattern.count = parseInt(rules.COUNT);
      }

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

  static parseDatetime(dtstart: string): { date: string; time: string } {
    try {
      let dateStr = dtstart.split(';')[0];
      if (dateStr.includes(':')) {
        dateStr = dateStr.split(':')[1];
      }

      if (dateStr.length >= 8) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const date = `${year}-${month}-${day}`;

        let time = '09:00 AM';
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

  static generateRecurringDates(
    startDate: Date,
    pattern: RecurrencePattern,
    targetDateFrom: Date,
    maxOccurrences: number = 52 // Default to 1 year
  ): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    const endDate = pattern.until ? new Date(pattern.until) : new Date('2026-12-31');
    let count = 0;
    const maxCount = pattern.count || maxOccurrences;

    while (count < maxCount && currentDate <= endDate) {
      if (currentDate >= targetDateFrom) {
        dates.push(new Date(currentDate));
      }

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

      count++;
    }

    return dates;
  }

  static extractClientInfo(summary: string) {
    let clientName = summary.trim();
    clientName = clientName.replace(/\$\d+/g, '').replace(/\([^)]*\)/g, '').trim();
    
    return {
      name: clientName,
      email: `${clientName.toLowerCase().replace(/\s+/g, '.')}@recurring.local`,
      phone: '',
      address: ''
    };
  }

  static async findOrCreateClient(clientInfo: any): Promise<number | null> {
    try {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('name', clientInfo.name)
        .single();

      if (existingClient) {
        return existingClient.id;
      }

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

  static async importRecurringAppointments(events: ICSEvent[]): Promise<void> {
    console.log(`🔄 Processing ${events.length} events for recurring patterns...`);

    const targetDate = new Date('2025-10-01');
    let recurringEventsFound = 0;
    let appointmentsCreated = 0;
    let eventsProcessed = 0;

    // Filter for events with RRULE and after target date
    const recurringEvents = events.filter(event => event.rrule);
    
    console.log(`🔁 Found ${recurringEvents.length} events with recurrence rules`);

    if (recurringEvents.length === 0) {
      console.log('ℹ️  No recurring events found in the ICS file');
      return;
    }

    // Show preview of recurring events
    console.log('\n📋 Recurring events preview:');
    recurringEvents.slice(0, 10).forEach((event, index) => {
      const { date } = this.parseDatetime(event.dtstart);
      console.log(`${index + 1}. ${event.summary} - Original: ${date} | RRULE: ${event.rrule?.substring(0, 50)}...`);
    });

    if (recurringEvents.length > 10) {
      console.log(`... and ${recurringEvents.length - 10} more recurring events`);
    }

    console.log('\n🚀 Starting to generate recurring appointments...');

    for (const event of recurringEvents) {
      try {
        eventsProcessed++;
        console.log(`\n📅 Processing ${eventsProcessed}/${recurringEvents.length}: ${event.summary}`);

        const { date, time } = this.parseDatetime(event.dtstart);
        if (!date || !time) {
          console.log('   ⚠️ Could not parse date/time, skipping');
          continue;
        }

        const baseDate = new Date(date);
        const clientInfo = this.extractClientInfo(event.summary);
        const clientId = await this.findOrCreateClient(clientInfo);

        if (!clientId) {
          console.log('   ⚠️ Could not create client, skipping');
          continue;
        }

        const pattern = this.parseRRule(event.rrule!);
        if (!pattern) {
          console.log('   ⚠️ Could not parse recurrence pattern, skipping');
          continue;
        }

        console.log(`   📊 Pattern: Every ${pattern.interval} ${pattern.frequency}(s)`);
        if (pattern.count) console.log(`   📈 Count: ${pattern.count} occurrences`);
        if (pattern.until) console.log(`   📅 Until: ${pattern.until}`);

        // Generate future recurring dates
        const recurringDates = this.generateRecurringDates(baseDate, pattern, targetDate);
        console.log(`   🔮 Generated ${recurringDates.length} future dates`);

        if (recurringDates.length === 0) {
          console.log('   ℹ️  No future dates in target range');
          continue;
        }

        recurringEventsFound++;

        // Create appointments for each recurring date
        for (const appointmentDate of recurringDates) {
          const appointmentDateStr = appointmentDate.toISOString().split('T')[0];

          // Check if appointment already exists
          const { data: existing } = await supabase
            .from('appointments')
            .select('id')
            .eq('client_id', clientId)
            .eq('date', appointmentDateStr)
            .eq('time', time)
            .single();

          if (existing) {
            console.log(`   📋 Already exists: ${appointmentDateStr}`);
            continue;
          }

          // Create the recurring appointment
          const appointmentData = {
            client_id: clientId,
            date: appointmentDateStr,
            time: time,
            services: ['Recurring Grooming'],
            status: 'confirmed' as const,
            notes: `🔁 Recurring: ${event.summary} | Pattern: Every ${pattern.interval} ${pattern.frequency}(s)${pattern.count ? ` | ${pattern.count} total` : ''}`,
            total_amount: 0,
            payment_status: 'pending' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase
            .from('appointments')
            .insert(appointmentData);

          if (error) {
            console.error(`   ❌ Error creating appointment for ${appointmentDateStr}:`, error.message);
          } else {
            appointmentsCreated++;
            console.log(`   ✅ Created: ${appointmentDateStr}`);
          }
        }

      } catch (error) {
        console.error(`❌ Error processing event:`, error);
      }
    }

    console.log('\n🎉 RECURRING APPOINTMENTS IMPORT COMPLETED!');
    console.log('='.repeat(60));
    console.log(`📊 Recurring events found: ${recurringEventsFound}`);
    console.log(`✅ Total appointments created: ${appointmentsCreated}`);
    console.log(`📅 Date range: October 2025 forward`);
    console.log('\n💡 Note: After adding recurring columns to the database, these appointments can be better managed with parent/child relationships.');
  }
}

async function main() {
  try {
    console.log('🔁 RECURRING APPOINTMENTS IMPORT (Simplified)');
    console.log('='.repeat(60));
    console.log(`📅 Import Date: ${new Date().toLocaleDateString()}`);

    console.log('\n📂 Reading ICS file...');
    const icsContent = readFileSync('new-calendar.ics', 'utf-8');

    console.log('🔍 Parsing ICS events...');
    const events = SimpleRecurringImporter.parseICSContent(icsContent);
    console.log(`📋 Total events found: ${events.length}`);

    await SimpleRecurringImporter.importRecurringAppointments(events);

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

main();
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

class RecurringAppointmentManager {
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

  /**
   * Generate recurring dates with controlled limits
   */
  static generateRecurringDates(
    startDate: Date,
    pattern: RecurrencePattern,
    targetDateFrom: Date,
    maxMonths: number = 6 // Limit to 6 months ahead to avoid creating too many appointments
  ): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    const maxEndDate = new Date();
    maxEndDate.setMonth(maxEndDate.getMonth() + maxMonths);
    
    const endDate = pattern.until ? 
      new Date(Math.min(new Date(pattern.until).getTime(), maxEndDate.getTime())) : 
      maxEndDate;
      
    const maxCount = Math.min(pattern.count || 26, 26); // Limit to 26 occurrences max
    let count = 0;

    console.log(`   🎯 Generating dates from ${targetDateFrom.toDateString()} to ${endDate.toDateString()}`);
    console.log(`   📊 Max occurrences: ${maxCount}, Pattern: Every ${pattern.interval} ${pattern.frequency}(s)`);

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

  /**
   * Import recurring appointments with smart limits
   */
  static async importRecurringAppointments(events: ICSEvent[]): Promise<void> {
    console.log(`🔄 Processing ${events.length} events for recurring patterns...`);

    const targetDate = new Date('2025-10-01');
    let recurringEventsFound = 0;
    let appointmentsCreated = 0;
    let eventsProcessed = 0;

    const recurringEvents = events.filter(event => event.rrule);
    
    console.log(`🔁 Found ${recurringEvents.length} events with recurrence rules`);

    if (recurringEvents.length === 0) {
      console.log('ℹ️  No recurring events found in the ICS file');
      return;
    }

    // Show preview
    console.log('\n📋 Recurring events preview (showing first 5):');
    recurringEvents.slice(0, 5).forEach((event, index) => {
      const { date } = this.parseDatetime(event.dtstart);
      console.log(`${index + 1}. ${event.summary} - Original: ${date}`);
      console.log(`   RRULE: ${event.rrule}`);
    });

    if (recurringEvents.length > 5) {
      console.log(`... and ${recurringEvents.length - 5} more recurring events`);
    }

    console.log(`\n🎯 Will create appointments from October 1, 2025 forward (max 6 months per series)`);
    console.log('🚀 Starting to generate recurring appointments...\n');

    for (const event of recurringEvents) {
      try {
        eventsProcessed++;
        console.log(`📅 [${eventsProcessed}/${recurringEvents.length}] ${event.summary}`);

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

        // Generate future recurring dates (limited to 6 months)
        const recurringDates = this.generateRecurringDates(baseDate, pattern, targetDate, 6);
        
        if (recurringDates.length === 0) {
          console.log('   ℹ️  No future dates in target range');
          continue;
        }

        console.log(`   📊 Will create ${recurringDates.length} appointments`);
        recurringEventsFound++;

        let createdForThisEvent = 0;
        
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
            continue; // Skip existing appointments
          }

          // Create the recurring appointment with correct enum values
          const appointmentData = {
            client_id: clientId,
            date: appointmentDateStr,
            time: time,
            services: ['Recurring Grooming'],
            status: 'confirmed' as const, // Use valid enum value
            notes: `🔁 RECURRING: ${event.summary} | Every ${pattern.interval} ${pattern.frequency}(s) | Original: ${date}`,
            total_amount: 0,
            payment_status: 'unpaid' as const, // Use valid enum value instead of 'pending'
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase
            .from('appointments')
            .insert(appointmentData);

          if (error) {
            console.error(`   ❌ Error for ${appointmentDateStr}:`, error.message);
          } else {
            appointmentsCreated++;
            createdForThisEvent++;
          }
        }

        console.log(`   ✅ Created ${createdForThisEvent} appointments\n`);

      } catch (error) {
        console.error(`❌ Error processing event:`, error);
      }
    }

    console.log('🎉 RECURRING APPOINTMENTS IMPORT COMPLETED!');
    console.log('='.repeat(60));
    console.log(`📊 Recurring events processed: ${recurringEventsFound}/${recurringEvents.length}`);
    console.log(`✅ Total appointments created: ${appointmentsCreated}`);
    console.log(`📅 Date range: October 2025 - April 2026 (6 months)`);
    console.log(`🔄 Average per series: ${recurringEventsFound ? Math.round(appointmentsCreated / recurringEventsFound) : 0} appointments`);
  }

  /**
   * Delete all recurring appointments for a client (when user wants to cancel the series)
   */
  static async deleteRecurringSeries(clientId: number, originalDate: string, time: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting recurring series for client ${clientId}, pattern: ${originalDate} ${time}`);

      // Find all appointments with recurring notes containing this client and pattern
      const { data: recurringAppointments, error: fetchError } = await supabase
        .from('appointments')
        .select('id, date, notes')
        .eq('client_id', clientId)
        .eq('time', time)
        .ilike('notes', '%RECURRING%')
        .gte('date', new Date().toISOString().split('T')[0]); // Only future appointments

      if (fetchError) throw fetchError;

      if (recurringAppointments && recurringAppointments.length > 0) {
        const appointmentIds = recurringAppointments.map(apt => apt.id);
        
        const { error: deleteError } = await supabase
          .from('appointments')
          .delete()
          .in('id', appointmentIds);

        if (deleteError) throw deleteError;

        console.log(`✅ Deleted ${recurringAppointments.length} future recurring appointments`);
        return;
      }

      console.log('ℹ️ No recurring appointments found to delete');

    } catch (error) {
      console.error('❌ Error deleting recurring series:', error);
      throw error;
    }
  }

  /**
   * Skip a single occurrence (mark as cancelled but keep the series)
   */
  static async skipRecurringOccurrence(appointmentId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          notes: 'SKIPPED: User requested to skip this occurrence',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      console.log(`✅ Skipped recurring appointment ${appointmentId}`);

    } catch (error) {
      console.error('❌ Error skipping appointment:', error);
      throw error;
    }
  }
}

async function main() {
  try {
    console.log('🔁 SMART RECURRING APPOINTMENTS IMPORT');
    console.log('='.repeat(60));
    console.log(`📅 Import Date: ${new Date().toLocaleDateString()}`);

    console.log('\n📂 Reading ICS file...');
    const icsContent = readFileSync('new-calendar.ics', 'utf-8');

    console.log('🔍 Parsing ICS events...');
    const events = RecurringAppointmentManager.parseICSContent(icsContent);
    console.log(`📋 Total events found: ${events.length}`);

    await RecurringAppointmentManager.importRecurringAppointments(events);

    console.log('\n💡 RECURRING APPOINTMENT MANAGEMENT:');
    console.log('- To delete an entire recurring series: Use deleteRecurringSeries()');
    console.log('- To skip just one occurrence: Use skipRecurringOccurrence()');
    console.log('- Recurring appointments are limited to 6 months to avoid database overload');
    console.log('- Each series is limited to max 26 occurrences');

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

main();
import { supabase } from '../config/supabase';
import type { Database } from '../types/supabase';

type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];

interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: string;
  dtend: string;
  location?: string;
  status: string;
  created?: string;
  lastModified?: string;
}

interface CalendarConnection {
  id: string;
  user_id: string;
  calendar_type: 'apple' | 'google' | 'outlook';
  calendar_url: string;
  calendar_name: string;
  sync_enabled: boolean;
  last_sync: string;
}

export class CalendarImportService {
  /**
   * Parse iCalendar (.ics) content and extract events
   */
  static parseICalendar(icsContent: string): ICalEvent[] {
    const events: ICalEvent[] = [];
    const lines = icsContent.split(/\r?\n/);
    let currentEvent: Partial<ICalEvent> = {};
    let inEvent = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
      } else if (line === 'END:VEVENT' && inEvent) {
        if (currentEvent.uid && currentEvent.summary && currentEvent.dtstart) {
          events.push(currentEvent as ICalEvent);
        }
        inEvent = false;
      } else if (inEvent) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;
        
        const key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);
        
        // Handle properties with parameters (e.g., DTSTART;TZID=America/New_York:20241001T090000)
        const [propertyName] = key.split(';');
        
        switch (propertyName) {
          case 'UID':
            currentEvent.uid = value;
            break;
          case 'SUMMARY':
            currentEvent.summary = this.unescapeICSText(value);
            break;
          case 'DESCRIPTION':
            currentEvent.description = this.unescapeICSText(value);
            break;
          case 'DTSTART':
            currentEvent.dtstart = value;
            break;
          case 'DTEND':
            currentEvent.dtend = value;
            break;
          case 'LOCATION':
            currentEvent.location = this.unescapeICSText(value);
            break;
          case 'STATUS':
            currentEvent.status = value;
            break;
          case 'CREATED':
            currentEvent.created = value;
            break;
          case 'LAST-MODIFIED':
            currentEvent.lastModified = value;
            break;
        }
      }
    }

    return events;
  }

  /**
   * Convert iCalendar events to appointment format
   */
  static convertEventsToAppointments(events: ICalEvent[], source = 'apple_calendar'): Partial<AppointmentInsert>[] {
    return events.map(event => {
      const startDate = this.parseICSDateTime(event.dtstart);
      const endDate = this.parseICSDateTime(event.dtend);
      
      // Extract client info from summary/description
      const clientInfo = this.extractClientInfo(event.summary, event.description);
      
      return {
        external_id: event.uid,
        date: startDate.toISOString().split('T')[0],
        time: startDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }),
        services: JSON.stringify(this.extractServices(event.summary, event.description)),
        status: this.mapStatus(event.status),
        notes: event.description || '',
        client_name: clientInfo.name,
        client_phone: clientInfo.phone,
        client_address: event.location || '',
        duration: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)), // minutes
        source: source,
        created_at: event.created ? this.parseICSDateTime(event.created).toISOString() : new Date().toISOString(),
        updated_at: event.lastModified ? this.parseICSDateTime(event.lastModified).toISOString() : new Date().toISOString()
      };
    });
  }

  /**
   * Setup calendar connection for user
   */
  static async setupCalendarConnection(
    userId: string, 
    calendarUrl: string, 
    calendarName: string,
    calendarType: 'apple' | 'google' | 'outlook' = 'apple'
  ): Promise<CalendarConnection> {
    // Validate calendar URL by trying to fetch it
    try {
      const testResponse = await fetch(calendarUrl.replace('webcal:', 'https:'));
      if (!testResponse.ok) {
        throw new Error('Unable to access calendar URL');
      }
    } catch (error) {
      throw new Error(`Calendar URL validation failed: ${error}`);
    }

    // Store calendar connection
    const { data, error } = await supabase
      .from('calendar_connections')
      .insert({
        user_id: userId,
        calendar_type: calendarType,
        calendar_url: calendarUrl,
        calendar_name: calendarName,
        sync_enabled: true,
        last_sync: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save calendar connection: ${error.message}`);
    }

    return data;
  }

  /**
   * Sync appointments from connected calendar
   */
  static async syncFromConnectedCalendar(connectionId: string): Promise<{
    imported: number;
    updated: number;
    errors: string[];
  }> {
    // Get calendar connection
    const { data: connection, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error || !connection) {
      throw new Error('Calendar connection not found');
    }

    try {
      // Fetch calendar data
      const calendarUrl = connection.calendar_url.replace('webcal:', 'https:');
      const response = await fetch(calendarUrl);
      const icsContent = await response.text();

      // Parse and import events
      const events = this.parseICalendar(icsContent);
      const appointments = this.convertEventsToAppointments(events, connection.calendar_type);
      
      let imported = 0;
      let updated = 0;
      const errors: string[] = [];

      for (const appointment of appointments) {
        try {
          // Check if appointment already exists
          const { data: existing } = await supabase
            .from('appointments')
            .select('id, updated_at')
            .eq('external_id', appointment.external_id)
            .single();

          if (existing) {
            // Update if the external event is newer
            if (new Date(appointment.updated_at!) > new Date(existing.updated_at)) {
              await supabase
                .from('appointments')
                .update(appointment)
                .eq('id', existing.id);
              updated++;
            }
          } else {
            // Create new appointment
            await supabase
              .from('appointments')
              .insert(appointment);
            imported++;
          }
        } catch (error) {
          errors.push(`Failed to import appointment: ${appointment.client_name || 'Unknown'} - ${error}`);
        }
      }

      // Update last sync time
      await supabase
        .from('calendar_connections')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', connectionId);

      return { imported, updated, errors };
    } catch (error) {
      throw new Error(`Calendar sync failed: ${error}`);
    }
  }

  /**
   * Get all appointments from connected calendars and Supabase
   */
  static async getAllAppointments(userId: string) {
    // Get appointments from Supabase
    const { data: supabaseAppointments } = await supabase
      .from('appointments')
      .select(`
        *,
        clients(*),
        groomers(*)
      `)
      .eq('groomer_id', userId);

    // Get live appointments from connected calendars
    const { data: connections } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('sync_enabled', true);

    let externalAppointments: any[] = [];
    
    if (connections) {
      for (const connection of connections) {
        try {
          const calendarUrl = connection.calendar_url.replace('webcal:', 'https:');
          const response = await fetch(calendarUrl);
          const icsContent = await response.text();
          const events = this.parseICalendar(icsContent);
          
          // Convert to display format
          const displayAppointments = events.map(event => ({
            id: `external-${event.uid}`,
            external_id: event.uid,
            client_name: this.extractClientInfo(event.summary).name,
            date: this.parseICSDateTime(event.dtstart).toISOString().split('T')[0],
            time: this.parseICSDateTime(event.dtstart).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true 
            }),
            services: JSON.stringify(this.extractServices(event.summary, event.description)),
            status: this.mapStatus(event.status),
            notes: event.description || '',
            client_address: event.location || '',
            duration: Math.round((this.parseICSDateTime(event.dtend).getTime() - this.parseICSDateTime(event.dtstart).getTime()) / (1000 * 60)),
            source: connection.calendar_type,
            is_external: true
          }));

          externalAppointments = [...externalAppointments, ...displayAppointments];
        } catch (error) {
          console.error(`Failed to fetch from ${connection.calendar_name}:`, error);
        }
      }
    }

    // Merge and deduplicate
    const allAppointments = [...(supabaseAppointments || []), ...externalAppointments];
    
    // Remove duplicates based on external_id
    const uniqueAppointments = allAppointments.reduce((acc, current) => {
      const existing = acc.find(item => item.external_id === current.external_id);
      if (!existing) {
        acc.push(current);
      } else if (!existing.is_external && current.is_external) {
        // Prefer Supabase version over external version if both exist
        // (this means it was imported and potentially modified)
      } else if (existing.is_external && !current.is_external) {
        // Replace external with Supabase version
        const index = acc.indexOf(existing);
        acc[index] = current;
      }
      return acc;
    }, [] as any[]);

    return uniqueAppointments;
  }

  // Helper methods
  private static parseICSDateTime(icsDateTime: string): Date {
    // Remove timezone info and parse
    const cleanDateTime = icsDateTime.replace(/[TZ]/g, '').split(';')[0];
    
    if (cleanDateTime.length === 8) {
      // YYYYMMDD (all day event)
      const year = parseInt(cleanDateTime.substr(0, 4));
      const month = parseInt(cleanDateTime.substr(4, 2)) - 1;
      const day = parseInt(cleanDateTime.substr(6, 2));
      return new Date(year, month, day, 9, 0, 0); // Default to 9 AM
    } else if (cleanDateTime.length >= 14) {
      // YYYYMMDDTHHMMSS
      const year = parseInt(cleanDateTime.substr(0, 4));
      const month = parseInt(cleanDateTime.substr(4, 2)) - 1;
      const day = parseInt(cleanDateTime.substr(6, 2));
      const hour = parseInt(cleanDateTime.substr(8, 2));
      const minute = parseInt(cleanDateTime.substr(10, 2));
      const second = parseInt(cleanDateTime.substr(12, 2)) || 0;
      
      return new Date(year, month, day, hour, minute, second);
    }
    
    return new Date();
  }

  private static unescapeICSText(text: string): string {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  private static extractClientInfo(summary: string, description?: string): {
    name: string;
    phone?: string;
  } {
    // Try to extract client name from summary (before first dash or hyphen)
    const summaryMatch = summary.match(/^([^-–]+)/);
    let name = summaryMatch ? summaryMatch[1].trim() : 'Unknown Client';
    
    // Remove common service words from name
    name = name.replace(/\b(grooming|appointment|appt|service)\b/gi, '').trim();
    
    // Try to extract phone from description
    const phoneMatch = description?.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
    
    return {
      name: name || 'Unknown Client',
      phone: phoneMatch ? phoneMatch[1] : undefined
    };
  }

  private static extractServices(summary: string, description?: string): string[] {
    const text = `${summary} ${description || ''}`.toLowerCase();
    const services: string[] = [];
    
    // Common grooming services
    if (text.includes('full service') || text.includes('full groom')) {
      services.push('Full Service Grooming');
    }
    if (text.includes('bath') && text.includes('brush')) {
      services.push('Bath & Brush');
    } else if (text.includes('bath')) {
      services.push('Bath Only');
    }
    if (text.includes('nail') && (text.includes('trim') || text.includes('clip'))) {
      services.push('Nail Trim');
    }
    if (text.includes('ear') && text.includes('clean')) {
      services.push('Ear Cleaning');
    }
    if (text.includes('haircut') || text.includes('cut') || text.includes('trim')) {
      services.push('Haircut');
    }
    
    return services.length > 0 ? services : ['Grooming'];
  }

  private static mapStatus(icsStatus?: string): string {
    switch (icsStatus?.toUpperCase()) {
      case 'CONFIRMED': return 'confirmed';
      case 'TENTATIVE': return 'pending';
      case 'CANCELLED': return 'cancelled';
      default: return 'pending';
    }
  }
}
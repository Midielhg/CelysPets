import { supabase } from '../config/supabase';

export class CalendarService {
  /**
   * Generate iCalendar (ICS) format for appointments
   * This creates a calendar feed that can be subscribed to in Apple Calendar
   */
  static async generateICSFeed(groomerId?: string): Promise<string> {
    try {
      // Get appointments (filtered by groomer if specified)
      let query = supabase
        .from('appointments')
        .select(`
          *,
          clients!appointments_client_id_fkey (
            name,
            phone,
            address
          ),
          user_profiles!groomer_id (
            name
          )
        `)
        .gte('date', new Date().toISOString().split('T')[0]) // Only future appointments
        .order('date', { ascending: true });

      if (groomerId) {
        query = query.eq('groomer_id', groomerId);
      }

      const { data: appointments, error } = await query;

      if (error) {
        throw error;
      }

      if (!appointments) {
        return this.createEmptyICS();
      }

      return this.createICSContent(appointments);
    } catch (error) {
      console.error('❌ Failed to generate ICS feed:', error);
      return this.createEmptyICS();
    }
  }

  /**
   * Generate ICS content for appointments
   */
  private static createICSContent(appointments: any[]): string {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CelysPets//Grooming Appointments//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:CelysPets Appointments',
      'X-WR-CALDESC:Grooming appointments from CelysPets booking system',
      'X-WR-TIMEZONE:America/New_York',
      'REFRESH-INTERVAL;VALUE=DURATION:PT1H', // Refresh every hour
    ].join('\r\n');

    appointments.forEach(appointment => {
      const event = this.createICSEvent(appointment);
      icsContent += '\r\n' + event;
    });

    icsContent += '\r\nEND:VCALENDAR';
    return icsContent;
  }

  /**
   * Create individual ICS event for an appointment
   */
  private static createICSEvent(appointment: any): string {
    const appointmentDate = new Date(appointment.date + 'T' + appointment.time);
    const endDate = new Date(appointmentDate.getTime() + (this.getServiceDuration(appointment.services) * 60000));
    
    // Format dates for ICS (YYYYMMDDTHHMMSSZ)
    const startDateStr = appointmentDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const endDateStr = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const createdDateStr = new Date(appointment.created_at).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    
    // Generate unique ID
    const uid = `appointment-${appointment.id}@celyspets.com`;
    
    // Parse services
    const services = typeof appointment.services === 'string' 
      ? JSON.parse(appointment.services) 
      : appointment.services;
    const serviceNames = Array.isArray(services) 
      ? services.map((s: any) => s.name || s).join(', ')
      : String(services);

    const clientName = appointment.clients?.name || 'Unknown Client';
    const groomerName = appointment.user_profiles?.name || 'Assigned Groomer';
    const clientPhone = appointment.clients?.phone || '';
    const clientAddress = appointment.clients?.address || '';

    // Create event summary and description
    const summary = `${serviceNames} - ${clientName}`;
    const description = this.escapeICSText([
      `Grooming Appointment`,
      `Client: ${clientName}`,
      clientPhone ? `Phone: ${clientPhone}` : '',
      `Services: ${serviceNames}`,
      `Groomer: ${groomerName}`,
      `Status: ${this.formatStatus(appointment.status)}`,
      `Payment: ${this.formatPaymentStatus(appointment.payment_status)}`,
      appointment.notes ? `Notes: ${appointment.notes}` : '',
      clientAddress ? `Address: ${clientAddress}` : '',
    ].filter(Boolean).join('\\n'));

    const location = this.escapeICSText(clientAddress || 'CelysPets Grooming');

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${startDateStr}`,
      `DTEND:${endDateStr}`,
      `DTSTAMP:${createdDateStr}`,
      `CREATED:${createdDateStr}`,
      `LAST-MODIFIED:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `SUMMARY:${this.escapeICSText(summary)}`,
      `DESCRIPTION:${description}`,
      clientAddress ? `LOCATION:${location}` : '',
      `STATUS:${appointment.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
      `CATEGORIES:Grooming,${this.formatStatus(appointment.status)}`,
      'TRANSP:OPAQUE',
      'END:VEVENT'
    ].filter(Boolean).join('\r\n');
  }

  /**
   * Escape text for ICS format
   */
  private static escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  /**
   * Get estimated service duration in minutes
   */
  private static getServiceDuration(services: any): number {
    const defaultDurations: { [key: string]: number } = {
      'full-groom': 120,
      'bath-brush': 60,
      'nail-trim': 30,
      'ear-cleaning': 15,
      'teeth-cleaning': 20,
      'flea-treatment': 45,
      'de-shedding': 90,
      'puppy-intro': 60
    };

    try {
      const serviceList = typeof services === 'string' ? JSON.parse(services) : services;
      
      if (Array.isArray(serviceList)) {
        return serviceList.reduce((total, service) => {
          const serviceName = typeof service === 'object' ? service.name : service;
          const duration = defaultDurations[serviceName] || 60; // Default 60 minutes
          return total + duration;
        }, 0);
      }
      
      return defaultDurations[String(serviceList)] || 60;
    } catch {
      return 60; // Default fallback
    }
  }

  /**
   * Format appointment status for display
   */
  private static formatStatus(status: string): string {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Format payment status for display
   */
  private static formatPaymentStatus(paymentStatus: string | null): string {
    if (!paymentStatus) return 'Unpaid';
    return paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1);
  }

  /**
   * Create empty ICS calendar
   */
  private static createEmptyICS(): string {
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CelysPets//Grooming Appointments//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:CelysPets Appointments',
      'X-WR-CALDESC:No upcoming appointments',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  /**
   * Generate calendar subscription URL
   */
  static generateSubscriptionUrl(baseUrl: string, groomerId?: string): string {
    const params = groomerId ? `?groomer=${groomerId}` : '';
    return `${baseUrl}/api/calendar/feed.ics${params}`;
  }
}
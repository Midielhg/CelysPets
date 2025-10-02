import { supabase } from '../config/supabase';

export interface RecurringAppointmentOptions {
  clientId: number;
  originalDate: string;
  time: string;
  action: 'delete-series' | 'skip-occurrence' | 'modify-series';
  appointmentId?: number;
  newPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
}

export class RecurringAppointmentService {
  /**
   * Create a new recurring appointment series
   */
  static async createRecurringSeries(
    appointmentData: any,
    recurringPattern: {
      frequency: 'weekly' | 'biweekly' | 'monthly';
      interval: number;
      numberOfOccurrences?: number;
      endDate?: string;
    }
  ): Promise<{ created: number; appointments: any[] }> {
    try {
      console.log('🔄 Creating recurring appointment series:', appointmentData, recurringPattern);
      
      const startDate = new Date(appointmentData.date);
      const appointments: any[] = [];
      
      // Generate series ID for tracking
      const seriesId = `recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate end date if not provided
      let endDate: Date;
      if (recurringPattern.endDate) {
        endDate = new Date(recurringPattern.endDate);
      } else if (recurringPattern.numberOfOccurrences) {
        endDate = new Date(startDate);
        const totalDays = this.calculateTotalDays(recurringPattern.frequency, recurringPattern.numberOfOccurrences);
        endDate.setDate(endDate.getDate() + totalDays);
      } else {
        // Default to 6 months if nothing specified
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 6);
      }
      
      // Generate appointment dates
      const dates: Date[] = [];
      let currentDate = new Date(startDate);
      let count = 0;
      
      while (currentDate <= endDate && count < (recurringPattern.numberOfOccurrences || 26)) {
        dates.push(new Date(currentDate));
        count++;
        
        // Calculate next date based on frequency
        switch (recurringPattern.frequency) {
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }
      
      // Create appointments in database
      let created = 0;
      for (const appointmentDate of dates) {
        const dateStr = appointmentDate.toISOString().split('T')[0];
        
        // Create notes with recurring information
        const recurringNotes = `RECURRING: ${recurringPattern.frequency} | Series: ${seriesId}`;
        const finalNotes = appointmentData.notes 
          ? `${appointmentData.notes} | ${recurringNotes}`
          : recurringNotes;
        
        const newAppointmentData = {
          ...appointmentData,
          date: dateStr,
          notes: finalNotes,
          recurring_series_id: seriesId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: insertedAppointment, error } = await supabase
          .from('appointments')
          .insert(newAppointmentData)
          .select()
          .single();
        
        if (!error && insertedAppointment) {
          created++;
          appointments.push(insertedAppointment);
        } else if (error) {
          console.error(`Error creating appointment for ${dateStr}:`, error);
        }
      }
      
      console.log(`✅ Created ${created} recurring appointments`);
      return { created, appointments };
      
    } catch (error) {
      console.error('❌ Error creating recurring series:', error);
      throw error;
    }
  }
  
  /**
   * Calculate total days for a recurring pattern
   */
  private static calculateTotalDays(frequency: string, occurrences: number): number {
    switch (frequency) {
      case 'weekly':
        return occurrences * 7;
      case 'biweekly':
        return occurrences * 14;
      case 'monthly':
        return occurrences * 30; // Approximate
      default:
        return occurrences * 7;
    }
  }

  /**
   * Delete an entire recurring series (all future appointments)
   */
  static async deleteRecurringSeries(
    clientId: number, 
    time: string, 
    recurringPattern: string
  ): Promise<{ deleted: number }> {
    try {
      console.log(`🗑️ Deleting recurring series for client ${clientId}`);

      // Find all future recurring appointments for this client with matching pattern
      const today = new Date().toISOString().split('T')[0];
      
      const { data: recurringAppointments, error: fetchError } = await supabase
        .from('appointments')
        .select('id, date, notes')
        .eq('client_id', clientId)
        .eq('time', time)
        .ilike('notes', `%${recurringPattern}%`)
        .gte('date', today); // Only future appointments

      if (fetchError) throw fetchError;

      if (!recurringAppointments || recurringAppointments.length === 0) {
        console.log('ℹ️ No future recurring appointments found to delete');
        return { deleted: 0 };
      }

      const appointmentIds = recurringAppointments.map(apt => apt.id);
      
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .in('id', appointmentIds);

      if (deleteError) throw deleteError;

      console.log(`✅ Deleted ${recurringAppointments.length} future recurring appointments`);
      return { deleted: recurringAppointments.length };

    } catch (error) {
      console.error('❌ Error deleting recurring series:', error);
      throw error;
    }
  }

  /**
   * Skip a single occurrence (mark as cancelled but keep the rest of the series)
   */
  static async skipSingleOccurrence(appointmentId: number): Promise<void> {
    try {
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('id, date, notes, client_id')
        .eq('id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          notes: `${appointment.notes} | SKIPPED: User requested to skip this occurrence on ${new Date().toLocaleDateString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      console.log(`✅ Skipped recurring appointment ${appointmentId} on ${appointment.date}`);

    } catch (error) {
      console.error('❌ Error skipping appointment:', error);
      throw error;
    }
  }

  /**
   * Get all appointments in a recurring series
   */
  static async getRecurringSeries(
    clientId: number, 
    time: string, 
    recurringPattern: string
  ): Promise<any[]> {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          notes,
          total_amount,
          payment_status,
          clients!appointments_client_id_fkey (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('client_id', clientId)
        .eq('time', time)
        .ilike('notes', `%${recurringPattern}%`)
        .order('date', { ascending: true });

      if (error) throw error;

      return appointments || [];

    } catch (error) {
      console.error('❌ Error fetching recurring series:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive statistics for a recurring series
   */
  static async getRecurringSeriesStats(
    clientId: number,
    time: string,
    recurringPattern: string
  ): Promise<{
    total: number;
    completed: number;
    upcoming: number;
    cancelled: number;
    totalRevenue: number;
    nextAppointment?: any;
    lastAppointment?: any;
  }> {
    try {
      const appointments = await this.getRecurringSeries(clientId, time, recurringPattern);
      const today = new Date().toISOString().split('T')[0];

      const stats = {
        total: appointments.length,
        completed: appointments.filter(apt => apt.status === 'completed').length,
        upcoming: appointments.filter(apt => apt.date >= today && apt.status !== 'cancelled').length,
        cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
        totalRevenue: appointments
          .filter(apt => apt.status === 'completed' || apt.payment_status === 'paid')
          .reduce((sum, apt) => sum + (apt.total_amount || 0), 0),
        nextAppointment: appointments.find(apt => apt.date >= today && apt.status !== 'cancelled'),
        lastAppointment: appointments.filter(apt => apt.date < today).pop()
      };

      return stats;

    } catch (error) {
      console.error('❌ Error getting series statistics:', error);
      throw error;
    }
  }

  /**
   * Modify future appointments in a recurring series
   */
  static async modifyFutureOccurrences(
    clientId: number,
    time: string,
    recurringPattern: string,
    updates: {
      newTime?: string;
      newNotes?: string;
      newAmount?: number;
    }
  ): Promise<{ modified: number }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get future appointments in the series
      const { data: futureAppointments, error: fetchError } = await supabase
        .from('appointments')
        .select('id')
        .eq('client_id', clientId)
        .eq('time', time)
        .ilike('notes', `%${recurringPattern}%`)
        .gte('date', today);

      if (fetchError) throw fetchError;

      if (!futureAppointments || futureAppointments.length === 0) {
        return { modified: 0 };
      }

      const appointmentIds = futureAppointments.map(apt => apt.id);
      
      // Prepare updates
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.newTime) updateData.time = updates.newTime;
      if (updates.newAmount !== undefined) updateData.total_amount = updates.newAmount;
      if (updates.newNotes) {
        updateData.notes = updates.newNotes;
      }

      const { error: updateError } = await supabase
        .from('appointments')
        .update(updateData)
        .in('id', appointmentIds);

      if (updateError) throw updateError;

      console.log(`✅ Modified ${futureAppointments.length} future appointments in recurring series`);
      return { modified: futureAppointments.length };

    } catch (error) {
      console.error('❌ Error modifying recurring series:', error);
      throw error;
    }
  }

  /**
   * Check if an appointment is part of a recurring series
   */
  static async isRecurringAppointment(appointmentId: number): Promise<boolean> {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select('notes')
        .eq('id', appointmentId)
        .single();

      if (error) throw error;

      return appointment?.notes?.includes('RECURRING') || false;

    } catch (error) {
      console.error('❌ Error checking if appointment is recurring:', error);
      return false;
    }
  }

  /**
   * Generate additional future appointments for a recurring series
   */
  static async extendRecurringSeries(
    clientId: number,
    time: string,
    recurringPattern: string,
    additionalMonths: number = 3
  ): Promise<{ created: number }> {
    try {
      // Get the last appointment in the series to determine next date
      const { data: lastAppointment, error: fetchError } = await supabase
        .from('appointments')
        .select('date, notes, services, status')
        .eq('client_id', clientId)
        .eq('time', time)
        .ilike('notes', `%${recurringPattern}%`)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      if (!lastAppointment) {
        throw new Error('No existing appointments found in series');
      }

      // Parse pattern from notes to determine frequency
      const notes = lastAppointment.notes;
      let interval = 1;
      let frequency: 'weekly' | 'monthly' | 'daily' = 'weekly';

      if (notes.includes('Every')) {
        const match = notes.match(/Every (\d+) (\w+)/);
        if (match) {
          interval = parseInt(match[1]);
          if (match[2].includes('week')) frequency = 'weekly';
          else if (match[2].includes('month')) frequency = 'monthly';
          else if (match[2].includes('day')) frequency = 'daily';
        }
      }

      // Generate future dates
      const startDate = new Date(lastAppointment.date);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + additionalMonths);

      const futureDates: Date[] = [];
      let currentDate = new Date(startDate);

      // Move to next occurrence
      switch (frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (interval * 7));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
      }

      while (currentDate <= endDate && futureDates.length < 26) {
        futureDates.push(new Date(currentDate));

        switch (frequency) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + interval);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + (interval * 7));
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + interval);
            break;
        }
      }

      // Create new appointments
      let created = 0;
      for (const appointmentDate of futureDates) {
        const dateStr = appointmentDate.toISOString().split('T')[0];

        // Check if appointment already exists
        const { data: existing } = await supabase
          .from('appointments')
          .select('id')
          .eq('client_id', clientId)
          .eq('date', dateStr)
          .eq('time', time)
          .single();

        if (!existing) {
          const appointmentData = {
            client_id: clientId,
            date: dateStr,
            time: time,
            services: lastAppointment.services,
            status: 'confirmed' as const,
            notes: `${lastAppointment.notes} | EXTENDED: ${new Date().toLocaleDateString()}`,
            total_amount: 0,
            payment_status: 'unpaid' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase
            .from('appointments')
            .insert(appointmentData);

          if (!error) {
            created++;
          }
        }
      }

      console.log(`✅ Extended recurring series with ${created} additional appointments`);
      return { created };

    } catch (error) {
      console.error('❌ Error extending recurring series:', error);
      throw error;
    }
  }
}
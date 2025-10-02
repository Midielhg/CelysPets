import { supabase } from '../config/supabase';
import type { Database } from '../types/supabase';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every X weeks/months/days
  byWeekday?: string[]; // ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  byMonthDay?: number[]; // [1, 15, 31] for monthly patterns
  count?: number; // Number of occurrences to generate
  until?: string; // End date (YYYY-MM-DD)
}

export class RecurringAppointmentsService {
  /**
   * Create a recurring appointment series
   */
  static async createRecurringSeries(
    baseAppointment: AppointmentInsert,
    recurrencePattern: RecurrencePattern
  ): Promise<{ parent: Appointment; occurrences: Appointment[] }> {
    try {
      // Create the parent appointment with recurrence info
      const parentAppointmentData = {
        ...baseAppointment,
        is_recurring: true,
        parent_appointment_id: null,
        recurrence_pattern: recurrencePattern,
        recurrence_end_date: recurrencePattern.until || null
      };

      const { data: parentAppointment, error: parentError } = await supabase
        .from('appointments')
        .insert(parentAppointmentData)
        .select()
        .single();

      if (parentError) throw parentError;

      // Generate recurring occurrences
      const occurrences = await this.generateRecurringOccurrences(
        parentAppointment,
        recurrencePattern
      );

      return { parent: parentAppointment, occurrences };

    } catch (error) {
      console.error('Error creating recurring series:', error);
      throw error;
    }
  }

  /**
   * Generate recurring appointment occurrences
   */
  static async generateRecurringOccurrences(
    parentAppointment: Appointment,
    recurrencePattern: RecurrencePattern
  ): Promise<Appointment[]> {
    const occurrences: AppointmentInsert[] = [];
    const startDate = new Date(parentAppointment.date);
    const maxOccurrences = recurrencePattern.count || 52; // Default to 1 year
    const endDate = recurrencePattern.until ? new Date(recurrencePattern.until) : null;

    let currentDate = new Date(startDate);
    let occurrenceCount = 0;

    // Skip the first occurrence (parent appointment)
    currentDate = this.getNextOccurrenceDate(currentDate, recurrencePattern);

    while (occurrenceCount < maxOccurrences) {
      // Check if we've reached the end date
      if (endDate && currentDate > endDate) break;

      // Create occurrence appointment
      const occurrenceData: AppointmentInsert = {
        ...parentAppointment,
        id: undefined, // Let database generate new ID
        date: currentDate.toISOString().split('T')[0],
        is_recurring: true,
        parent_appointment_id: parentAppointment.id,
        recurrence_pattern: null, // Only parent has the pattern
        recurrence_end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      occurrences.push(occurrenceData);

      // Move to next occurrence
      currentDate = this.getNextOccurrenceDate(currentDate, recurrencePattern);
      occurrenceCount++;
    }

    // Insert all occurrences
    if (occurrences.length > 0) {
      const { data: insertedOccurrences, error } = await supabase
        .from('appointments')
        .insert(occurrences)
        .select();

      if (error) throw error;
      return insertedOccurrences || [];
    }

    return [];
  }

  /**
   * Calculate the next occurrence date based on recurrence pattern
   */
  static getNextOccurrenceDate(currentDate: Date, pattern: RecurrencePattern): Date {
    const nextDate = new Date(currentDate);

    switch (pattern.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + pattern.interval);
        break;

      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (pattern.interval * 7));
        break;

      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        break;
    }

    return nextDate;
  }

  /**
   * Parse RRULE from ICS format to RecurrencePattern
   */
  static parseICSRecurrenceRule(rrule: string): RecurrencePattern | null {
    try {
      const rules = rrule.split(';').reduce((acc, rule) => {
        const [key, value] = rule.split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      const pattern: RecurrencePattern = {
        frequency: 'weekly', // Default
        interval: 1
      };

      // Parse frequency
      if (rules.FREQ) {
        switch (rules.FREQ) {
          case 'DAILY':
            pattern.frequency = 'daily';
            break;
          case 'WEEKLY':
            pattern.frequency = 'weekly';
            break;
          case 'MONTHLY':
            pattern.frequency = 'monthly';
            break;
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

      // Parse by weekday
      if (rules.BYDAY) {
        pattern.byWeekday = rules.BYDAY.split(',');
      }

      // Parse by month day
      if (rules.BYMONTHDAY) {
        pattern.byMonthDay = rules.BYMONTHDAY.split(',').map(d => parseInt(d));
      }

      return pattern;

    } catch (error) {
      console.error('Error parsing RRULE:', error);
      return null;
    }
  }

  /**
   * Update an existing appointment to be recurring
   */
  static async makeAppointmentRecurring(
    appointmentId: number,
    recurrencePattern: RecurrencePattern
  ): Promise<{ parent: Appointment; occurrences: Appointment[] }> {
    try {
      // Get the existing appointment
      const { error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      // Update it to be recurring
      const { data: updatedAppointment, error: updateError } = await supabase
        .from('appointments')
        .update({
          is_recurring: true,
          recurrence_pattern: recurrencePattern,
          recurrence_end_date: recurrencePattern.until || null
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Generate recurring occurrences
      const occurrences = await this.generateRecurringOccurrences(
        updatedAppointment,
        recurrencePattern
      );

      return { parent: updatedAppointment, occurrences };

    } catch (error) {
      console.error('Error making appointment recurring:', error);
      throw error;
    }
  }

  /**
   * Get all appointments in a recurring series
   */
  static async getRecurringSeries(parentAppointmentId: number): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .or(`id.eq.${parentAppointmentId},parent_appointment_id.eq.${parentAppointmentId}`)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete an entire recurring series
   */
  static async deleteRecurringSeries(parentAppointmentId: number): Promise<void> {
    // First delete all child appointments
    const { error: childError } = await supabase
      .from('appointments')
      .delete()
      .eq('parent_appointment_id', parentAppointmentId);

    if (childError) throw childError;

    // Then delete the parent appointment
    const { error: parentError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', parentAppointmentId);

    if (parentError) throw parentError;
  }

  /**
   * Update recurring series (regenerate future occurrences)
   */
  static async updateRecurringSeries(
    parentAppointmentId: number,
    updatedData: Partial<AppointmentInsert>,
    newRecurrencePattern?: RecurrencePattern
  ): Promise<Appointment[]> {
    try {
      // Get current date to avoid updating past appointments
      const today = new Date().toISOString().split('T')[0];

      // Delete future occurrences (keep past ones)
      await supabase
        .from('appointments')
        .delete()
        .eq('parent_appointment_id', parentAppointmentId)
        .gte('date', today);

      // Update parent appointment
      const updateParentData = {
        ...updatedData,
        ...(newRecurrencePattern && {
          recurrence_pattern: newRecurrencePattern,
          recurrence_end_date: newRecurrencePattern.until || null
        })
      };

      const { data: updatedParent, error: updateError } = await supabase
        .from('appointments')
        .update(updateParentData)
        .eq('id', parentAppointmentId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Generate new future occurrences if recurrence pattern is provided
      if (newRecurrencePattern) {
        const newOccurrences = await this.generateRecurringOccurrences(
          updatedParent,
          newRecurrencePattern
        );
        return [updatedParent, ...newOccurrences];
      }

      return [updatedParent];

    } catch (error) {
      console.error('Error updating recurring series:', error);
      throw error;
    }
  }
}
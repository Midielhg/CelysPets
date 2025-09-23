import { supabase } from '../config/supabase';

// Extended appointment type with client and pet details
export interface GroomerAppointment {
  id: number;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded' | 'disputed';
  notes: string | null;
  totalAmount: number | null;
  originalAmount: number | null;
  services: any; // JSON field containing service details
  client: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address?: string;
    pets?: any;
  };
  promoCode?: {
    code: string;
    name: string;
    discount_type: string;
    discount_value: number;
  };
}

export interface GroomerStats {
  todayEarnings: number;
  weeklyEarnings: number;
  completedToday: number;
  totalClients: number;
  thisMonthEarnings: number;
  totalAppointments: number;
}

export class GroomerService {
  /**
   * Get all appointments for a specific groomer
   */
  static async getGroomerAppointments(groomerId: string): Promise<GroomerAppointment[]> {
    try {
      console.log('🔍 Fetching appointments for groomer:', groomerId);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients:client_id (
            id,
            name,
            email,
            phone,
            address,
            pets
          ),
          promo_codes:promo_code_id (
            code,
            name,
            discount_type,
            discount_value
          )
        `)
        .eq('groomer_id', groomerId)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('❌ Supabase query error:', error);
        throw error;
      }

      console.log('✅ Raw appointment data:', data);
      
      return (data || []).map(appointment => ({
        id: appointment.id,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        paymentStatus: appointment.payment_status || 'unpaid',
        notes: appointment.notes,
        totalAmount: appointment.total_amount,
        originalAmount: appointment.original_amount,
        services: appointment.services,
        client: {
          id: appointment.clients?.id || 0,
          name: appointment.clients?.name || '',
          email: appointment.clients?.email || '',
          phone: appointment.clients?.phone || '',
          address: appointment.clients?.address || '',
          pets: appointment.clients?.pets || {}
        },
        promoCode: appointment.promo_codes ? {
          code: appointment.promo_codes.code,
          name: appointment.promo_codes.name,
          discount_type: appointment.promo_codes.discount_type,
          discount_value: appointment.promo_codes.discount_value
        } : undefined
      })) as GroomerAppointment[];
    } catch (error) {
      console.error('❌ Failed to fetch groomer appointments:', error);
      throw error;
    }
  }

  /**
   * Get today's appointments for a groomer
   */
  static async getTodaysAppointments(groomerId: string): Promise<GroomerAppointment[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const appointments = await this.getGroomerAppointments(groomerId);
      
      return appointments.filter(appointment => appointment.date === today);
    } catch (error) {
      console.error('Failed to fetch today\'s appointments:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointments for a groomer (next 7 days excluding today)
   */
  static async getUpcomingAppointments(groomerId: string, days: number = 7): Promise<GroomerAppointment[]> {
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() + 1); // Tomorrow
      
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + days);
      
      const appointments = await this.getGroomerAppointments(groomerId);
      
      return appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= startDate && appointmentDate <= endDate;
      });
    } catch (error) {
      console.error('Failed to fetch upcoming appointments:', error);
      throw error;
    }
  }

  /**
   * Update appointment status
   */
  static async updateAppointmentStatus(
    appointmentId: number, 
    newStatus: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('❌ Error updating appointment status:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Failed to update appointment status:', error);
      throw error;
    }
  }

  /**
   * Update appointment payment status
   */
  static async updatePaymentStatus(
    appointmentId: number, 
    newPaymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded' | 'disputed'
  ): Promise<void> {
    try {
      console.log('💰 GroomerService: Updating payment status', appointmentId, 'to', newPaymentStatus);
      
      const { error } = await supabase
        .from('appointments')
        .update({ 
          payment_status: newPaymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('❌ Error updating payment status:', error);
        throw error;
      }
      
      console.log('✅ Payment status updated successfully');
    } catch (error) {
      console.error('❌ Failed to update payment status:', error);
      throw error;
    }
  }

  /**
   * Get groomer statistics
   */
  static async getGroomerStats(groomerId: string): Promise<GroomerStats> {
    try {
      const appointments = await this.getGroomerAppointments(groomerId);
      const today = new Date().toISOString().split('T')[0];
      
      // Today's appointments
      const todayAppointments = appointments.filter(apt => apt.date === today);
      const completedTodayAppointments = todayAppointments.filter(apt => apt.status === 'completed');
      
      // This week's appointments
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // Saturday
      
      const weeklyAppointments = appointments.filter(apt => {
        const appointmentDate = new Date(apt.date);
        return appointmentDate >= weekStart && 
               appointmentDate <= weekEnd && 
               apt.status === 'completed';
      });

      // This month's appointments
      const monthStart = new Date();
      monthStart.setDate(1); // First day of month
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Last day of month
      
      const monthlyAppointments = appointments.filter(apt => {
        const appointmentDate = new Date(apt.date);
        return appointmentDate >= monthStart && 
               appointmentDate <= monthEnd && 
               apt.status === 'completed';
      });
      
      // Calculate earnings
      const todayEarnings = completedTodayAppointments
        .reduce((sum, apt) => sum + (apt.totalAmount || 0), 0);
      
      const weeklyEarnings = weeklyAppointments
        .reduce((sum, apt) => sum + (apt.totalAmount || 0), 0);
        
      const thisMonthEarnings = monthlyAppointments
        .reduce((sum, apt) => sum + (apt.totalAmount || 0), 0);
      
      // Get unique clients
      const uniqueClients = new Set(appointments.map(apt => apt.client.email));
      
      return {
        todayEarnings,
        weeklyEarnings,
        thisMonthEarnings,
        completedToday: completedTodayAppointments.length,
        totalClients: uniqueClients.size,
        totalAppointments: appointments.length
      };
    } catch (error) {
      console.error('Failed to calculate groomer stats:', error);
      throw error;
    }
  }

  /**
   * Get next upcoming appointment for a groomer
   */
  static async getNextAppointment(groomerId: string): Promise<GroomerAppointment | null> {
    try {
      const now = new Date();
      const appointments = await this.getGroomerAppointments(groomerId);
      
      const futureAppointments = appointments
        .filter(apt => {
          const appointmentDateTime = new Date(`${apt.date} ${apt.time}`);
          return appointmentDateTime > now && apt.status !== 'cancelled';
        })
        .sort((a, b) => {
          const aDateTime = new Date(`${a.date} ${a.time}`);
          const bDateTime = new Date(`${b.date} ${b.time}`);
          return aDateTime.getTime() - bDateTime.getTime();
        });
      
      return futureAppointments[0] || null;
    } catch (error) {
      console.error('Failed to get next appointment:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time appointment changes for a groomer
   */
  static subscribeToGroomerAppointments(groomerId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`groomer-appointments-${groomerId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments',
          filter: `groomer_id=eq.${groomerId}`
        },
        callback
      )
      .subscribe();
  }

  /**
   * Add notes to an appointment
   */
  static async addAppointmentNotes(appointmentId: number, notes: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('❌ Error adding appointment notes:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Failed to add appointment notes:', error);
      throw error;
    }
  }
}
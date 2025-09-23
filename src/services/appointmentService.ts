import { supabase } from '../config/supabase'
import type { Database } from '../types/supabase'

type Appointment = Database['public']['Tables']['appointments']['Row']
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']

export class AppointmentService {
  // Get all appointments (admin/groomer view)
  static async getAll(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone,
          pets
        ),
        promo_codes:promo_code_id (
          code,
          name,
          discount_type,
          discount_value
        )
      `)
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Get appointments for a specific client
  static async getByClientEmail(email: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients!inner (
          id,
          name,
          email,
          phone,
          pets
        )
      `)
      .eq('clients.email', email)
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Create new appointment
  static async create(appointment: AppointmentInsert): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update appointment
  static async update(id: number, updates: AppointmentUpdate): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete appointment
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Get appointments by date range
  static async getByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone,
          pets
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Get today's appointments
  static async getToday(): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.getByDateRange(today, today)
  }

  // Get upcoming appointments
  static async getUpcoming(days: number = 7): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    const endDate = futureDate.toISOString().split('T')[0]
    
    return this.getByDateRange(today, endDate)
  }

  // Update appointment status
  static async updateStatus(id: number, status: Appointment['status']): Promise<Appointment> {
    return this.update(id, { status })
  }

  // Assign appointment to groomer
  static async assignToGroomer(appointmentId: number, groomerId: string): Promise<Appointment> {
    console.log('🎯 AppointmentService: Assigning appointment', appointmentId, 'to groomer', groomerId);
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          groomer_id: groomerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select(`
          *,
          clients:client_id (
            id,
            name,
            email,
            phone,
            pets
          ),
          groomers:groomer_id (
            id,
            name,
            email
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error assigning groomer:', error);
        throw error;
      }

      console.log('✅ Groomer assigned successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to assign groomer:', error);
      throw error;
    }
  }

  // Unassign groomer from appointment
  static async unassignGroomer(appointmentId: number): Promise<Appointment> {
    console.log('🎯 AppointmentService: Unassigning groomer from appointment', appointmentId);
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          groomer_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select(`
          *,
          clients:client_id (
            id,
            name,
            email,
            phone,
            pets
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error unassigning groomer:', error);
        throw error;
      }

      console.log('✅ Groomer unassigned successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to unassign groomer:', error);
      throw error;
    }
  }

  // Get appointments assigned to a specific groomer
  static async getByGroomer(groomerId: string): Promise<Appointment[]> {
    console.log('👷‍♀️ AppointmentService: Fetching appointments for groomer', groomerId);
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients:client_id (
            id,
            name,
            email,
            phone,
            pets
          ),
          groomers:groomer_id (
            id,
            name,
            email
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
        console.error('❌ Error fetching groomer appointments:', error);
        throw error;
      }

      console.log('✅ Groomer appointments fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch groomer appointments:', error);
      throw error;
    }
  }

  // Real-time subscription to appointments
  static subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        callback
      )
      .subscribe()
  }
}

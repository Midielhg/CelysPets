import { supabase } from '../config/supabase'

export interface DashboardStats {
  totalRevenue: number
  appointmentsThisMonth: number
  totalClients: number
  averageRating: number | null
}

export class DashboardService {
  /**
   * Get dashboard statistics including revenue, appointments, clients, and ratings
   */
  static async getStats(): Promise<DashboardStats> {
    try {
      console.log('📊 DashboardService: Fetching stats from Supabase...')

      // Get the start of current month for filtering
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      const startOfMonthISO = startOfMonth.toISOString()

      console.log('📅 Start of month:', startOfMonthISO)

      // Get appointments this month
      const { data: appointmentsThisMonth, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, total_amount')
        .gte('created_at', startOfMonthISO)
        .eq('status', 'completed') // Only count completed appointments

      if (appointmentsError) {
        console.error('❌ Error fetching appointments:', appointmentsError)
        throw appointmentsError
      }

      console.log('📋 Appointments this month:', appointmentsThisMonth?.length || 0)

      // Calculate total revenue from completed appointments this month
      const totalRevenue = appointmentsThisMonth?.reduce((sum, apt: any) => {
        return sum + (apt.total_amount || 0)
      }, 0) || 0

      console.log('💰 Total revenue this month:', totalRevenue)

      // Count total clients
      const { count: totalClientsCount, error: clientsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

      if (clientsError) {
        console.error('❌ Error fetching clients count:', clientsError)
        throw clientsError
      }

      console.log('👥 Total clients:', totalClientsCount || 0)

      // For average rating, we would need a reviews/ratings table
      // For now, let's return null since it's not implemented yet
      const averageRating = null

      const stats: DashboardStats = {
        totalRevenue,
        appointmentsThisMonth: appointmentsThisMonth?.length || 0,
        totalClients: totalClientsCount || 0,
        averageRating
      }

      console.log('✅ Dashboard stats compiled:', stats)
      return stats

    } catch (error) {
      console.error('❌ DashboardService.getStats error:', error)
      throw error
    }
  }

  /**
   * Get recent activity for the dashboard
   */
  static async getRecentActivity() {
    try {
      console.log('📈 DashboardService: Fetching recent activity...')

      // Get recent appointments with client info
      const { data: recentAppointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          total_amount,
          created_at,
          clients (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('❌ Error fetching recent activity:', error)
        throw error
      }

      console.log('📊 Recent appointments:', recentAppointments?.length || 0)
      return recentAppointments || []

    } catch (error) {
      console.error('❌ DashboardService.getRecentActivity error:', error)
      throw error
    }
  }

  /**
   * Get today's appointments
   */
  static async getTodaySchedule() {
    try {
      console.log('📅 DashboardService: Fetching today\'s schedule...')

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]
      console.log('📅 Today\'s date:', today)

      const { data: todayAppointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          total_amount,
          services,
          groomer_id,
          clients (
            name,
            email,
            phone
          )
        `)
        .eq('date', today)
        .order('time', { ascending: true })

      if (error) {
        console.error('❌ Error fetching today\'s schedule:', error)
        throw error
      }

      console.log('📋 Today\'s appointments:', todayAppointments?.length || 0)
      return todayAppointments || []

    } catch (error) {
      console.error('❌ DashboardService.getTodaySchedule error:', error)
      throw error
    }
  }
}

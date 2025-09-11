import { supabase } from '../config/supabase'
import type { Database } from '../types/supabase'

type PromoCode = Database['public']['Tables']['promo_codes']['Row']
type PromoCodeInsert = Database['public']['Tables']['promo_codes']['Insert']
type PromoCodeUpdate = Database['public']['Tables']['promo_codes']['Update']

export class PromoCodeService {
  // Get all promo codes (admin only)
  static async getAll(): Promise<PromoCode[]> {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Get active promo codes (public)
  static async getActive(): Promise<PromoCode[]> {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Get promo code by code
  static async getByCode(code: string): Promise<PromoCode | null> {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  }

  // Create promo code
  static async create(promoCode: PromoCodeInsert): Promise<PromoCode> {
    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        ...promoCode,
        code: promoCode.code?.toUpperCase(),
        current_usage_total: 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update promo code
  static async update(id: number, updates: PromoCodeUpdate): Promise<PromoCode> {
    const { data, error } = await supabase
      .from('promo_codes')
      .update({
        ...updates,
        code: updates.code?.toUpperCase()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete promo code
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Validate promo code for use
  static async validateCode(code: string, customerEmail: string, orderAmount: number): Promise<{
    valid: boolean
    promoCode?: PromoCode
    error?: string
    discountAmount?: number
  }> {
    try {
      const promoCode = await this.getByCode(code)
      
      if (!promoCode) {
        return { valid: false, error: 'Promo code not found or inactive' }
      }

      // Check if expired
      if (promoCode.valid_until && new Date(promoCode.valid_until) < new Date()) {
        return { valid: false, error: 'Promo code has expired' }
      }

      // Check if not yet valid
      if (promoCode.valid_from && new Date(promoCode.valid_from) > new Date()) {
        return { valid: false, error: 'Promo code is not yet valid' }
      }

      // Check minimum amount
      if (promoCode.minimum_amount && orderAmount < promoCode.minimum_amount) {
        return { 
          valid: false, 
          error: `Minimum order amount of $${promoCode.minimum_amount} required` 
        }
      }

      // Check total usage limit
      if (promoCode.current_usage_total >= promoCode.max_usage_total) {
        return { valid: false, error: 'Promo code usage limit reached' }
      }

      // Check customer usage limit
      const { data: customerUsage, error: usageError } = await supabase
        .from('promo_code_usage')
        .select('id')
        .eq('promo_code_id', promoCode.id)
        .eq('customer_email', customerEmail.toLowerCase())

      if (usageError) throw usageError

      if (customerUsage && customerUsage.length >= promoCode.max_usage_per_customer) {
        return { 
          valid: false, 
          error: 'You have reached the usage limit for this promo code' 
        }
      }

      // Calculate discount amount
      let discountAmount = 0
      if (promoCode.discount_type === 'percentage') {
        discountAmount = orderAmount * (promoCode.discount_value / 100)
      } else {
        discountAmount = promoCode.discount_value
      }

      // Don't let discount exceed order amount
      discountAmount = Math.min(discountAmount, orderAmount)

      return {
        valid: true,
        promoCode,
        discountAmount
      }
    } catch (error) {
      console.error('Error validating promo code:', error)
      return { valid: false, error: 'Failed to validate promo code' }
    }
  }

  // Record promo code usage
  static async recordUsage(
    promoCodeId: number,
    customerEmail: string,
    discountAmount: number,
    appointmentId?: number
  ): Promise<void> {
    try {
      // Start a transaction
      const { error: usageError } = await supabase
        .from('promo_code_usage')
        .insert({
          promo_code_id: promoCodeId,
          customer_email: customerEmail.toLowerCase(),
          appointment_id: appointmentId,
          discount_amount: discountAmount
        })

      if (usageError) throw usageError

      // Update current usage count
      const { error: updateError } = await supabase
        .rpc('increment_promo_usage', { promo_id: promoCodeId })

      if (updateError) throw updateError
    } catch (error) {
      console.error('Error recording promo code usage:', error)
      throw error
    }
  }
}

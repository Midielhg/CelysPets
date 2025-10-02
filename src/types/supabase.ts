export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'client' | 'admin' | 'groomer'
          business_settings: Json | null
          google_tokens: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'client' | 'admin' | 'groomer'
          business_settings?: Json | null
          google_tokens?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'client' | 'admin' | 'groomer'
          business_settings?: Json | null
          google_tokens?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: number
          name: string
          email: string
          phone: string
          address: string
          pets: Json
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          name: string
          email: string
          phone: string
          address: string
          pets: Json
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string
          phone?: string
          address?: string
          pets?: Json
          createdAt?: string
          updatedAt?: string
        }
      }
      appointments: {
        Row: {
          id: number
          client_id: number
          groomer_id: number | null
          services: Json
          date: string
          time: string
          status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
          payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded' | 'disputed'
          notes: string | null
          total_amount: number | null
          promo_code_id: number | null
          promo_code_discount: number | null
          original_amount: number | null
          is_recurring: boolean | null
          parent_appointment_id: number | null
          recurrence_pattern: Json | null
          recurrence_end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          client_id: number
          groomer_id?: number | null
          services: Json
          date: string
          time: string
          status?: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
          payment_status?: 'unpaid' | 'partial' | 'paid' | 'refunded' | 'disputed'
          notes?: string | null
          total_amount?: number | null
          promo_code_id?: number | null
          promo_code_discount?: number | null
          original_amount?: number | null
          is_recurring?: boolean | null
          parent_appointment_id?: number | null
          recurrence_pattern?: Json | null
          recurrence_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          client_id?: number
          groomer_id?: number | null
          services?: Json
          date?: string
          time?: string
          status?: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
          payment_status?: 'unpaid' | 'partial' | 'paid' | 'refunded' | 'disputed'
          notes?: string | null
          total_amount?: number | null
          promo_code_id?: number | null
          promo_code_discount?: number | null
          original_amount?: number | null
          is_recurring?: boolean | null
          parent_appointment_id?: number | null
          recurrence_pattern?: Json | null
          recurrence_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pets: {
        Row: {
          id: number
          ownerId: number
          name: string
          species: 'dog' | 'cat'
          breed: string
          age: number
          weight: number
          notes: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          ownerId: number
          name: string
          species: 'dog' | 'cat'
          breed: string
          age: number
          weight: number
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          ownerId?: number
          name?: string
          species?: 'dog' | 'cat'
          breed?: string
          age?: number
          weight?: number
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      breeds: {
        Row: {
          id: number
          name: string
          species: 'dog' | 'cat'
          sizeCategory: 'small' | 'medium' | 'large' | 'extra-large'
          bathOnlyPrice: number
          fullGroomPrice: number
          active: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          name: string
          species: 'dog' | 'cat'
          sizeCategory: 'small' | 'medium' | 'large' | 'extra-large'
          bathOnlyPrice: number
          fullGroomPrice: number
          active?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          name?: string
          species?: 'dog' | 'cat'
          sizeCategory?: 'small' | 'medium' | 'large' | 'extra-large'
          bathOnlyPrice?: number
          fullGroomPrice?: number
          active?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      additional_services: {
        Row: {
          id: number
          code: string
          name: string
          price: number
          description: string | null
          active: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          price?: number
          description?: string | null
          active?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          price?: number
          description?: string | null
          active?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      promo_codes: {
        Row: {
          id: number
          code: string
          name: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          minimum_amount: number | null
          max_usage_total: number
          max_usage_per_customer: number
          current_usage_total: number
          valid_from: string | null
          valid_until: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          minimum_amount?: number | null
          max_usage_total?: number
          max_usage_per_customer?: number
          current_usage_total?: number
          valid_from?: string | null
          valid_until?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          minimum_amount?: number | null
          max_usage_total?: number
          max_usage_per_customer?: number
          current_usage_total?: number
          valid_from?: string | null
          valid_until?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      promo_code_usage: {
        Row: {
          id: number
          promo_code_id: number
          customer_email: string
          appointment_id: number | null
          used_at: string
          discount_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          promo_code_id: number
          customer_email: string
          appointment_id?: number | null
          used_at?: string
          discount_amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          promo_code_id?: number
          customer_email?: string
          appointment_id?: number | null
          used_at?: string
          discount_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

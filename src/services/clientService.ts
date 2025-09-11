import { supabase } from '../config/supabase'
import type { Database } from '../types/supabase'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']

export class ClientService {
  // Get all clients
  static async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Get client by ID
  static async getById(id: number): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  }

  // Get client by email
  static async getByEmail(email: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  }

  // Create new client
  static async create(client: ClientInsert): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...client,
        email: client.email.toLowerCase()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update client
  static async update(id: number, updates: ClientUpdate): Promise<Client> {
    const updateData = { ...updates }
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase()
    }

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete client
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Search clients by name or email
  static async search(query: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Get clients with their appointment count
  static async getWithAppointmentCount(): Promise<(Client & { appointment_count: number })[]> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        appointments(count)
      `)
      .order('name', { ascending: true })

    if (error) throw error
    
    // Transform the data to include appointment count
    return (data || []).map(client => ({
      ...client,
      appointment_count: client.appointments?.[0]?.count || 0
    }))
  }

  // Add pet to client
  static async addPet(clientId: number, pet: any): Promise<Client> {
    const client = await this.getById(clientId)
    if (!client) throw new Error('Client not found')

    const pets = Array.isArray(client.pets) ? client.pets : []
    const updatedPets = [...pets, pet]

    return this.update(clientId, { pets: updatedPets })
  }

  // Update pet for client
  static async updatePet(clientId: number, petIndex: number, pet: any): Promise<Client> {
    const client = await this.getById(clientId)
    if (!client) throw new Error('Client not found')

    const pets = Array.isArray(client.pets) ? [...client.pets] : []
    if (petIndex < 0 || petIndex >= pets.length) {
      throw new Error('Pet not found')
    }

    pets[petIndex] = pet
    return this.update(clientId, { pets })
  }

  // Remove pet from client
  static async removePet(clientId: number, petIndex: number): Promise<Client> {
    const client = await this.getById(clientId)
    if (!client) throw new Error('Client not found')

    const pets = Array.isArray(client.pets) ? [...client.pets] : []
    if (petIndex < 0 || petIndex >= pets.length) {
      throw new Error('Pet not found')
    }

    pets.splice(petIndex, 1)
    return this.update(clientId, { pets })
  }
}

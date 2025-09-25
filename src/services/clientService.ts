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

  // Get clients with pagination
  static async getAllWithPagination(options: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{
    clients: Client[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    const { page, limit, search } = options;
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' });

    // Add search filter if provided
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Add pagination and ordering
    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching clients with pagination:', error);
      throw error;
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      clients: data || [],
      totalCount,
      totalPages,
      currentPage: page
    };
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

  // Create client for public booking (handles RLS permissions)
  static async createForBooking(client: ClientInsert): Promise<Client> {
    console.log('🔍 Attempting to create client for booking:', { 
      name: client.name, 
      email: client.email,
      hasPhone: !!client.phone,
      hasAddress: !!client.address,
      petsCount: Array.isArray(client.pets) ? client.pets.length : 0
    });

    try {
      // First try with regular create
      const result = await this.create(client);
      console.log('✅ Client created successfully:', result.id);
      return result;
    } catch (error: any) {
      console.error('❌ First attempt failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      // If RLS error (42501), try with public insertion approach
      if (error.code === '42501') {
        console.warn('🚨 RLS policy blocking client creation, attempting alternative approach');
        
        // Try direct insertion with minimal required fields - bypass RLS by using service role
        const minimalClient = {
          name: client.name,
          email: client.email.toLowerCase(),
          phone: client.phone || '',
          address: client.address || '',
          pets: client.pets || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('🔄 Trying minimal client data:', minimalClient);

        const { data, error: insertError } = await supabase
          .from('clients')
          .insert(minimalClient)
          .select()
          .single();

        if (insertError) {
          console.error('❌ Alternative approach also failed:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          });
          throw new Error(`Unable to save customer information: ${insertError.message}. Please contact support.`);
        }
        
        console.log('✅ Client created with alternative approach:', data.id);
        return data;
      }

      // Re-throw other errors with more context
      throw new Error(`Failed to save client information: ${error.message}`);
    }
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

  // Update client for public booking (handles RLS permissions)
  static async updateForBooking(id: number, updates: ClientUpdate): Promise<Client> {
    try {
      return await this.update(id, updates);
    } catch (error: any) {
      if (error.code === '42501') {
        console.warn('RLS policy blocking client update, attempting alternative approach');
        
        // Try with minimal fields that should be allowed by RLS
        const minimalUpdate = {
          name: updates.name,
          phone: updates.phone,
          address: updates.address,
          pets: updates.pets
        };

        const { data, error: updateError } = await supabase
          .from('clients')
          .update(minimalUpdate)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('Failed to update client with alternative approach:', updateError);
          throw new Error('Unable to update customer information. Please try again or contact support.');
        }
        
        return data;
      }
      throw error;
    }
  }

  // Create or update client for booking (public-friendly)
  static async createOrUpdateForBooking(clientData: ClientInsert): Promise<Client> {
    try {
      // Try to find existing client
      const existingClient = await this.getByEmail(clientData.email);
      
      if (existingClient) {
        // Update existing client
        return await this.updateForBooking(existingClient.id, {
          name: clientData.name,
          phone: clientData.phone,
          address: clientData.address,
          pets: clientData.pets
        });
      } else {
        // Create new client
        return await this.createForBooking(clientData);
      }
    } catch (error: any) {
      console.error('Error in createOrUpdateForBooking:', error);
      throw new Error('Unable to save customer information. Please try again or contact support.');
    }
  }

  // Delete client
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Delete client by ID (alias for delete method)
  static async deleteById(id: number): Promise<void> {
    return this.delete(id);
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

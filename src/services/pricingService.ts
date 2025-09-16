import { supabase } from '../config/supabase';

// Database interfaces (snake_case to match Supabase tables)
export interface Breed {
  id: number;
  name: string;
  species: 'dog' | 'cat';
  size_category: 'small' | 'medium' | 'large' | 'extra-large';
  bath_only_price: number;
  full_groom_price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BreedInsert {
  name: string;
  species: 'dog' | 'cat';
  size_category: 'small' | 'medium' | 'large' | 'extra-large';
  bath_only_price: number;
  full_groom_price: number;
  active?: boolean;
}

export interface BreedUpdate {
  name?: string;
  species?: 'dog' | 'cat';
  size_category?: 'small' | 'medium' | 'large' | 'extra-large';
  bath_only_price?: number;
  full_groom_price?: number;
  active?: boolean;
}

export interface AdditionalService {
  id: number;
  code: string;
  name: string;
  price: number;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdditionalServiceInsert {
  code: string;
  name: string;
  price: number;
  description?: string;
  active?: boolean;
}

export interface AdditionalServiceUpdate {
  code?: string;
  name?: string;
  price?: number;
  description?: string;
  active?: boolean;
}

export class PricingService {
  // Get all breeds
  static async getAllBreeds(): Promise<Breed[]> {
    console.log('PricingService: Getting all breeds from Supabase');
    
    const { data, error } = await supabase
      .from('breeds')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Error fetching breeds:', error);
      throw new Error(`Failed to fetch breeds: ${error.message}`);
    }

    console.log('PricingService: Found breeds:', data);
    return data || [];
  }

  // Get breeds by species
  static async getBreedsBySpecies(species: 'dog' | 'cat'): Promise<Breed[]> {
    console.log('PricingService: Getting breeds by species:', species);
    
    const { data, error } = await supabase
      .from('breeds')
      .select('*')
      .eq('species', species)
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Error fetching breeds by species:', error);
      throw new Error(`Failed to fetch breeds: ${error.message}`);
    }

    return data || [];
  }

  // Get all additional services
  static async getAllAdditionalServices(): Promise<AdditionalService[]> {
    console.log('PricingService: Getting all additional services from Supabase');
    
    const { data, error } = await supabase
      .from('additional_services')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Error fetching additional services:', error);
      throw new Error(`Failed to fetch additional services: ${error.message}`);
    }

    console.log('PricingService: Found additional services:', data);
    return data || [];
  }

  // Create breed
  static async createBreed(breed: BreedInsert): Promise<Breed> {
    console.log('PricingService: Creating breed:', breed);
    
    const { data, error } = await supabase
      .from('breeds')
      .insert([breed])
      .select()
      .single();

    if (error) {
      console.error('Error creating breed:', error);
      throw new Error(`Failed to create breed: ${error.message}`);
    }

    console.log('PricingService: Created breed:', data);
    return data;
  }

  // Update breed
  static async updateBreed(id: number, updates: BreedUpdate): Promise<Breed> {
    console.log('PricingService: Updating breed:', id, updates);
    
    const { data, error } = await supabase
      .from('breeds')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating breed:', error);
      throw new Error(`Failed to update breed: ${error.message}`);
    }

    console.log('PricingService: Updated breed:', data);
    return data;
  }

  // Delete breed
  static async deleteBreed(id: number): Promise<void> {
    console.log('PricingService: Deleting breed:', id);
    
    const { error } = await supabase
      .from('breeds')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting breed:', error);
      throw new Error(`Failed to delete breed: ${error.message}`);
    }

    console.log('PricingService: Deleted breed:', id);
  }

  // Create additional service
  static async createAdditionalService(service: AdditionalServiceInsert): Promise<AdditionalService> {
    console.log('PricingService: Creating additional service:', service);
    
    const { data, error } = await supabase
      .from('additional_services')
      .insert([service])
      .select()
      .single();

    if (error) {
      console.error('Error creating additional service:', error);
      throw new Error(`Failed to create additional service: ${error.message}`);
    }

    console.log('PricingService: Created additional service:', data);
    return data;
  }

  // Update additional service
  static async updateAdditionalService(id: number, updates: AdditionalServiceUpdate): Promise<AdditionalService> {
    console.log('PricingService: Updating additional service:', id, updates);
    
    const { data, error } = await supabase
      .from('additional_services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating additional service:', error);
      throw new Error(`Failed to update additional service: ${error.message}`);
    }

    console.log('PricingService: Updated additional service:', data);
    return data;
  }

  // Delete additional service
  static async deleteAdditionalService(id: number): Promise<void> {
    console.log('PricingService: Deleting additional service:', id);
    
    const { error } = await supabase
      .from('additional_services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting additional service:', error);
      throw new Error(`Failed to delete additional service: ${error.message}`);
    }

    console.log('PricingService: Deleted additional service:', id);
  }
}

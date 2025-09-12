import { supabase } from '../config/supabase';
import { apiUrl } from '../config/api';
import { isFeatureEnabled } from '../config/features';
import type { Breed, AdditionalService, Species, SizeCategory } from '../types/pricing';

// Supabase types (with snake_case fields)
export interface SupabaseBreed {
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

export interface SupabaseAdditionalService {
  id: number;
  code: string;
  name: string;
  price: number;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Helper functions to convert between API format and Supabase format
const convertSupabaseToApiBreed = (supabaseBreed: SupabaseBreed): Breed => ({
  id: supabaseBreed.id,
  name: supabaseBreed.name,
  species: supabaseBreed.species,
  sizeCategory: supabaseBreed.size_category as SizeCategory,
  fullGroomPrice: supabaseBreed.full_groom_price,
  fullGroomDuration: 90, // Default value since Supabase doesn't have this field yet
  active: supabaseBreed.active,
});

const convertApiToSupabaseBreed = (apiBreed: Partial<Breed>): Partial<SupabaseBreed> => ({
  name: apiBreed.name,
  species: apiBreed.species,
  size_category: apiBreed.sizeCategory as any,
  bath_only_price: 0, // Default value
  full_groom_price: apiBreed.fullGroomPrice,
  active: apiBreed.active,
});

const convertSupabaseToApiService = (supabaseService: SupabaseAdditionalService): AdditionalService => ({
  id: supabaseService.id,
  code: supabaseService.code,
  name: supabaseService.name,
  price: supabaseService.price,
  duration: 30, // Default value since Supabase doesn't have this field yet
  description: supabaseService.description || '',
  active: supabaseService.active,
});

const convertApiToSupabaseService = (apiService: Partial<AdditionalService>): Partial<SupabaseAdditionalService> => ({
  code: apiService.code,
  name: apiService.name,
  price: apiService.price,
  description: apiService.description,
  active: apiService.active,
});

export class HybridPricingService {
  // Get all breeds - uses either API or Supabase based on feature flag
  static async getAllBreeds(): Promise<Breed[]> {
    if (isFeatureEnabled('USE_SUPABASE_PRICING')) {
      return this.getAllBreedsFromSupabase();
    } else {
      return this.getAllBreedsFromAPI();
    }
  }

  // API implementation (original)
  private static async getAllBreedsFromAPI(): Promise<Breed[]> {
    console.log('🔄 Using API for breeds');
    const response = await fetch(apiUrl('/pricing/breeds'));
    if (!response.ok) {
      throw new Error('Failed to fetch breeds from API');
    }
    return await response.json();
  }

  // Supabase implementation
  private static async getAllBreedsFromSupabase(): Promise<Breed[]> {
    console.log('🔄 Using Supabase for breeds');
    try {
      const { data, error } = await supabase
        .from('breeds')
        .select('*')
        .eq('active', true)
        .order('species')
        .order('name');

      if (error) throw error;
      
      // Convert Supabase format to API format
      return (data || []).map(convertSupabaseToApiBreed);
    } catch (error) {
      console.error('Error fetching breeds from Supabase:', error);
      throw error;
    }
  }

  // Get all additional services - uses either API or Supabase based on feature flag
  static async getAllAdditionalServices(): Promise<AdditionalService[]> {
    if (isFeatureEnabled('USE_SUPABASE_PRICING')) {
      return this.getAllAdditionalServicesFromSupabase();
    } else {
      return this.getAllAdditionalServicesFromAPI();
    }
  }

  // API implementation (original)
  private static async getAllAdditionalServicesFromAPI(): Promise<AdditionalService[]> {
    console.log('🔄 Using API for additional services');
    const response = await fetch(apiUrl('/pricing/additional-services'));
    if (!response.ok) {
      throw new Error('Failed to fetch additional services from API');
    }
    return await response.json();
  }

  // Supabase implementation
  private static async getAllAdditionalServicesFromSupabase(): Promise<AdditionalService[]> {
    console.log('🔄 Using Supabase for additional services');
    try {
      const { data, error } = await supabase
        .from('additional_services')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      
      // Convert Supabase format to API format
      return (data || []).map(convertSupabaseToApiService);
    } catch (error) {
      console.error('Error fetching additional services from Supabase:', error);
      throw error;
    }
  }

  // Create breed - uses either API or Supabase
  static async createBreed(breed: Partial<Breed>): Promise<Breed> {
    if (isFeatureEnabled('USE_SUPABASE_PRICING')) {
      return this.createBreedInSupabase(breed);
    } else {
      return this.createBreedInAPI(breed);
    }
  }

  private static async createBreedInAPI(breed: Partial<Breed>): Promise<Breed> {
    console.log('🔄 Creating breed in API');
    const token = localStorage.getItem('auth_token');
    const response = await fetch(apiUrl('/pricing/breeds'), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(breed),
    });

    if (!response.ok) {
      throw new Error('Failed to create breed in API');
    }
    
    return await response.json();
  }

  private static async createBreedInSupabase(breed: Partial<Breed>): Promise<Breed> {
    console.log('🔄 Creating breed in Supabase');
    const supabaseBreed = convertApiToSupabaseBreed(breed);
    
    const { data, error } = await (supabase as any)
      .from('breeds')
      .insert([supabaseBreed])
      .select()
      .single();

    if (error) throw error;
    return convertSupabaseToApiBreed(data);
  }

  // Similar pattern for update and delete operations...
  
  // Update breed
  static async updateBreed(id: number, updates: Partial<Breed>): Promise<Breed> {
    if (isFeatureEnabled('USE_SUPABASE_PRICING')) {
      return this.updateBreedInSupabase(id, updates);
    } else {
      return this.updateBreedInAPI(id, updates);
    }
  }

  private static async updateBreedInAPI(id: number, updates: Partial<Breed>): Promise<Breed> {
    console.log('🔄 Updating breed in API');
    const token = localStorage.getItem('auth_token');
    const response = await fetch(apiUrl(`/pricing/breeds/${id}`), {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update breed in API');
    }
    
    return await response.json();
  }

  private static async updateBreedInSupabase(id: number, updates: Partial<Breed>): Promise<Breed> {
    console.log('🔄 Updating breed in Supabase');
    const supabaseUpdates = convertApiToSupabaseBreed(updates);
    
    const { data, error } = await (supabase as any)
      .from('breeds')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return convertSupabaseToApiBreed(data);
  }

  // Delete breed
  static async deleteBreed(id: number): Promise<void> {
    if (isFeatureEnabled('USE_SUPABASE_PRICING')) {
      return this.deleteBreedInSupabase(id);
    } else {
      return this.deleteBreedInAPI(id);
    }
  }

  private static async deleteBreedInAPI(id: number): Promise<void> {
    console.log('🔄 Deleting breed in API');
    const token = localStorage.getItem('auth_token');
    const response = await fetch(apiUrl(`/pricing/breeds/${id}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to delete breed in API');
    }
  }

  private static async deleteBreedInSupabase(id: number): Promise<void> {
    console.log('🔄 Deleting breed in Supabase');
    const { error } = await supabase
      .from('breeds')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

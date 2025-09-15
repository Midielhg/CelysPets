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

export interface AdditionalService {
  id: number;
  code: string;
  name: string;
  price: number;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Temporary mock data until Supabase is configured
let mockBreeds: Breed[] = [
  {
    id: 1,
    name: "Golden Retriever",
    species: "dog",
    size_category: "large",
    bath_only_price: 45,
    full_groom_price: 75,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Chihuahua", 
    species: "dog",
    size_category: "small",
    bath_only_price: 25,
    full_groom_price: 45,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "Persian Cat",
    species: "cat",
    size_category: "medium",
    bath_only_price: 35,
    full_groom_price: 55,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let mockServices: AdditionalService[] = [
  {
    id: 1,
    code: "NAILS",
    name: "Nail Trimming",
    price: 15,
    description: "Professional nail trimming",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    code: "EARS",
    name: "Ear Cleaning",
    price: 10,
    description: "Thorough ear cleaning",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let nextBreedId = 4;
let nextServiceId = 3;

export class PricingService {
  // Get all breeds
  static async getAllBreeds(): Promise<Breed[]> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockBreeds.filter(breed => breed.active);
  }

  // Get breeds by species
  static async getBreedsBySpecies(species: 'dog' | 'cat'): Promise<Breed[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockBreeds.filter(breed => breed.species === species && breed.active);
  }

  // Get all additional services
  static async getAllAdditionalServices(): Promise<AdditionalService[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockServices.filter(service => service.active);
  }

  // Create breed
  static async createBreed(breed: Omit<Breed, 'id' | 'created_at' | 'updated_at'>): Promise<Breed> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const newBreed: Breed = {
      ...breed,
      id: nextBreedId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockBreeds.push(newBreed);
    return newBreed;
  }

  // Update breed
  static async updateBreed(id: number, updates: Partial<Breed>): Promise<Breed> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockBreeds.findIndex(breed => breed.id === id);
    if (index === -1) {
      throw new Error(`Breed with id ${id} not found`);
    }
    mockBreeds[index] = {
      ...mockBreeds[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return mockBreeds[index];
  }

  // Delete breed
  static async deleteBreed(id: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockBreeds.findIndex(breed => breed.id === id);
    if (index === -1) {
      throw new Error(`Breed with id ${id} not found`);
    }
    mockBreeds.splice(index, 1);
  }

  // Create additional service
  static async createAdditionalService(service: Omit<AdditionalService, 'id' | 'created_at' | 'updated_at'>): Promise<AdditionalService> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const newService: AdditionalService = {
      ...service,
      id: nextServiceId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockServices.push(newService);
    return newService;
  }

  // Update additional service
  static async updateAdditionalService(id: number, updates: Partial<AdditionalService>): Promise<AdditionalService> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockServices.findIndex(service => service.id === id);
    if (index === -1) {
      throw new Error(`Additional service with id ${id} not found`);
    }
    mockServices[index] = {
      ...mockServices[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return mockServices[index];
  }

  // Delete additional service
  static async deleteAdditionalService(id: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockServices.findIndex(service => service.id === id);
    if (index === -1) {
      throw new Error(`Additional service with id ${id} not found`);
    }
    mockServices.splice(index, 1);
  }
}

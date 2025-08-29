export type Species = 'dog' | 'cat';
export type SizeCategory = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'all';

export interface Breed {
  id: number;
  species: Species;
  name: string;
  sizeCategory: SizeCategory;
  fullGroomPrice: number;
  fullGroomDuration?: number; // Duration in minutes
  active: boolean;
}

export interface AdditionalService {
  id: number;
  code: string;
  name: string;
  price: number;
  duration?: number; // Duration in minutes
  description?: string;
  active: boolean;
}

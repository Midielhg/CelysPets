export type Species = 'dog' | 'cat';
export type SizeCategory = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'all';

export interface Breed {
  id: number;
  species: Species;
  name: string;
  sizeCategory: SizeCategory;
  fullGroomPrice: number;
  active: boolean;
}

export interface AdditionalService {
  id: number;
  code: string;
  name: string;
  price: number;
  description?: string;
  active: boolean;
}

import { apiUrl } from '../config/api';
import type { Breed, AdditionalService } from '../types/pricing';

export async function listBreeds(): Promise<Breed[]> {
  const res = await fetch(apiUrl('/pricing/breeds'));
  return res.json();
}

export async function listAddons(): Promise<AdditionalService[]> {
  const res = await fetch(apiUrl('/pricing/additional-services'));
  return res.json();
}

// Shared interfaces for the application

export interface Pet {
  name: string;
  breed: string;
  breedId?: number | null;
  age?: number;
  type?: 'dog' | 'cat';
  weight?: string;
  specialInstructions?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  pets: Pet[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  appointment_count?: number;
  last_appointment_date?: string;
  first_appointment_date?: string;
}

export interface Appointment {
  id: string;
  client: Client;
  services: string[];
  date: string;
  time: string;
  endTime?: string;
  duration?: number; // in minutes
  assignedGroomer?: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
}

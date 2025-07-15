import mongoose, { Document, Schema } from 'mongoose';

export interface IPet {
  name: string;
  type: 'dog' | 'cat';
  breed: string;
  weight?: string;
  specialInstructions?: string;
}

export interface IClient extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  pets: IPet[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const petSchema = new Schema<IPet>({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['dog', 'cat'],
    required: true
  },
  breed: {
    type: String,
    required: true
  },
  weight: {
    type: String
  },
  specialInstructions: {
    type: String
  }
});

const clientSchema = new Schema<IClient>({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  pets: [petSchema],
  notes: {
    type: String
  }
}, {
  timestamps: true
});

export const Client = mongoose.model<IClient>('Client', clientSchema);
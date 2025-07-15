import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessSettings {
  businessName: string;
  serviceArea: string[];
  timeSlots: string[];
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'client' | 'admin';
  businessSettings?: IBusinessSettings;
  googleTokens?: {
    accessToken?: string;
    refreshToken?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const businessSettingsSchema = new Schema<IBusinessSettings>({
  businessName: {
    type: String,
    required: true
  },
  serviceArea: [{
    type: String
  }],
  timeSlots: [{
    type: String
  }]
});

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['client', 'admin'],
    default: 'client'
  },
  businessSettings: businessSettingsSchema,
  googleTokens: {
    accessToken: String,
    refreshToken: String
  }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema);
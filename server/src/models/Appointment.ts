import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  client: mongoose.Types.ObjectId;
  services: string[];
  date: Date;
  time: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  totalAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  services: [{
    type: String,
    required: true
  }],
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String
  },
  totalAmount: {
    type: Number
  }
}, {
  timestamps: true
});

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
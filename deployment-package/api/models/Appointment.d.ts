import mongoose, { Document } from 'mongoose';
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
export declare const Appointment: mongoose.Model<IAppointment, {}, {}, {}, mongoose.Document<unknown, {}, IAppointment, {}> & IAppointment & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Appointment.d.ts.map
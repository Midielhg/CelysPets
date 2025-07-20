import { Model, Optional } from 'sequelize';
interface AppointmentAttributes {
    id: number;
    clientId: number;
    services: string[];
    date: Date;
    time: string;
    status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
    notes?: string;
    totalAmount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
interface AppointmentCreationAttributes extends Optional<AppointmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class Appointment extends Model<AppointmentAttributes, AppointmentCreationAttributes> implements AppointmentAttributes {
    id: number;
    clientId: number;
    services: string[];
    date: Date;
    time: string;
    status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
    notes?: string;
    totalAmount?: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { Appointment };
export interface IAppointment extends AppointmentAttributes {
}
//# sourceMappingURL=AppointmentMySQL.d.ts.map
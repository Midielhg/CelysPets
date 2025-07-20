import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Appointment attributes interface
interface AppointmentAttributes {
  id: number;
  clientId: number; // Foreign key to Client
  services: string[];
  date: Date;
  time: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  totalAmount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Appointment creation attributes (id is auto-generated)
interface AppointmentCreationAttributes extends Optional<AppointmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Appointment model class
class Appointment extends Model<AppointmentAttributes, AppointmentCreationAttributes> implements AppointmentAttributes {
  public id!: number;
  public clientId!: number;
  public services!: string[];
  public date!: Date;
  public time!: string;
  public status!: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  public notes?: string;
  public totalAmount?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Appointment model
Appointment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id',
      },
    },
    services: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'in-progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Appointment',
    tableName: 'appointments',
    timestamps: true,
  }
);

export { Appointment };

// For compatibility with existing code
export interface IAppointment extends AppointmentAttributes {}

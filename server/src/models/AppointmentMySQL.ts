import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Appointment attributes interface
interface AppointmentAttributes {
  id: number;
  clientId: number; // Foreign key to Client
  groomerId?: number; // Foreign key to User (groomer)
  services: string[];
  date: Date;
  time: string;
  endTime?: string; // Calculated end time based on duration
  duration?: number; // Total duration in minutes
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  totalAmount?: number;
  promoCodeId?: number; // Foreign key to PromoCode
  promoCodeDiscount?: number; // Discount amount applied
  originalAmount?: number; // Original amount before discount
  createdAt?: Date;
  updatedAt?: Date;
}

// Appointment creation attributes (id is auto-generated)
interface AppointmentCreationAttributes extends Optional<AppointmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Appointment model class
class Appointment extends Model<AppointmentAttributes, AppointmentCreationAttributes> implements AppointmentAttributes {
  public id!: number;
  public clientId!: number;
  public groomerId?: number;
  public services!: string[];
  public date!: Date;
  public time!: string;
  public endTime?: string;
  public duration?: number;
  public status!: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  public notes?: string;
  public totalAmount?: number;
  public promoCodeId?: number;
  public promoCodeDiscount?: number;
  public originalAmount?: number;
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
    groomerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
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
    endTime: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Calculated end time based on service duration'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Total appointment duration in minutes'
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
    promoCodeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'promo_codes',
        key: 'id',
      },
      comment: 'Reference to applied promo code'
    },
    promoCodeDiscount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Discount amount applied from promo code'
    },
    originalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Original amount before promo code discount'
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

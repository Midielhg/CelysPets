import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

// Business Settings interface
interface BusinessSettings {
  businessName: string;
  serviceArea: string[];
  timeSlots: string[];
}

// User attributes interface
interface UserAttributes {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'client' | 'admin';
  businessSettings?: BusinessSettings;
  googleTokens?: {
    accessToken?: string;
    refreshToken?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// User creation attributes (id is auto-generated)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public name!: string;
  public role!: 'client' | 'admin';
  public businessSettings?: BusinessSettings;
  public googleTokens?: {
    accessToken?: string;
    refreshToken?: string;
  };
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize User model
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('client', 'admin'),
      allowNull: false,
      defaultValue: 'client',
    },
    businessSettings: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    googleTokens: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  }
);

export { User };

// For compatibility with existing code
export interface IUser extends UserAttributes {}
export interface IBusinessSettings extends BusinessSettings {}

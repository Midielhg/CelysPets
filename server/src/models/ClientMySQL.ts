import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Pet interface
interface IPet {
  name: string;
  type: 'dog' | 'cat';
  breed: string;
  weight?: string;
  specialInstructions?: string;
}

// Client attributes interface
interface ClientAttributes {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  pets: IPet[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Client creation attributes (id is auto-generated)
interface ClientCreationAttributes extends Optional<ClientAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Client model class
class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public phone!: string;
  public address!: string;
  public pets!: IPet[];
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Client model
Client.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    pets: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Client',
    tableName: 'clients',
    timestamps: true,
  }
);

export { Client };

// For compatibility with existing code
export interface IClient extends ClientAttributes {}
export type { IPet };

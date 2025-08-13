import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AdditionalServiceAttributes {
  id: number;
  code: string; // e.g., teeth-cleaning
  name: string;
  price: number; // base price per pet
  description?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AdditionalServiceCreationAttributes extends Optional<AdditionalServiceAttributes, 'id' | 'description' | 'active' | 'createdAt' | 'updatedAt'> {}

class AdditionalService extends Model<AdditionalServiceAttributes, AdditionalServiceCreationAttributes> implements AdditionalServiceAttributes {
  public id!: number;
  public code!: string;
  public name!: string;
  public price!: number;
  public description?: string | undefined;
  public active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AdditionalService.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'AdditionalService',
    tableName: 'additional_services',
    timestamps: true,
    indexes: [
      { fields: ['code'] },
      { fields: ['name'] },
    ],
  }
);

export { AdditionalService };

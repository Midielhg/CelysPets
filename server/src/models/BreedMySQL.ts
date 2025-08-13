import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type Species = 'dog' | 'cat';
export type SizeCategory = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'all';

interface BreedAttributes {
  id: number;
  species: Species;
  name: string; // e.g., Chihuahua
  sizeCategory: SizeCategory; // For cats use 'all'
  fullGroomPrice: number; // price in USD for full grooming
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BreedCreationAttributes extends Optional<BreedAttributes, 'id' | 'active' | 'createdAt' | 'updatedAt'> {}

class Breed extends Model<BreedAttributes, BreedCreationAttributes> implements BreedAttributes {
  public id!: number;
  public species!: Species;
  public name!: string;
  public sizeCategory!: SizeCategory;
  public fullGroomPrice!: number;
  public active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Breed.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    species: {
      type: DataTypes.ENUM('dog', 'cat'),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sizeCategory: {
      type: DataTypes.ENUM('small', 'medium', 'large', 'xlarge', 'xxlarge', 'all'),
      allowNull: false,
      defaultValue: 'all',
    },
    fullGroomPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Breed',
    tableName: 'breeds',
    timestamps: true,
    indexes: [
      { fields: ['species'] },
      { fields: ['name'] },
      { fields: ['sizeCategory'] },
    ],
  }
);

export { Breed };

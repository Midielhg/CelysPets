import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Pet attributes interface
interface PetAttributes {
  id: number;
  ownerId: number; // References User.id
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  age: number;
  weight: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Pet creation attributes (id is auto-generated)
interface PetCreationAttributes extends Optional<PetAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Pet model class
class Pet extends Model<PetAttributes, PetCreationAttributes> implements PetAttributes {
  public id!: number;
  public ownerId!: number;
  public name!: string;
  public species!: 'dog' | 'cat';
  public breed!: string;
  public age!: number;
  public weight!: number;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Pet model
Pet.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    species: {
      type: DataTypes.ENUM('dog', 'cat'),
      allowNull: false,
    },
    breed: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    weight: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Pet',
    tableName: 'pets',
    timestamps: true,
  }
);

export default Pet;
export { PetAttributes, PetCreationAttributes };

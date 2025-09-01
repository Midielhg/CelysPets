import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PromoCodeAttributes {
  id: number;
  code: string; // e.g., SAVE20, FIRST10
  name: string; // Human readable name
  discountType: 'percentage' | 'fixed'; // percentage off or fixed amount off
  discountValue: number; // 20 for 20% or 10 for $10 off
  minimumAmount?: number; // minimum order amount to use this code
  maxUsageTotal: number; // total usage limit across all customers
  maxUsagePerCustomer: number; // usage limit per customer
  currentUsageTotal: number; // current usage count
  validFrom?: Date; // start date (optional)
  validUntil?: Date; // end date (optional)
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PromoCodeCreationAttributes extends Optional<PromoCodeAttributes, 'id' | 'minimumAmount' | 'validFrom' | 'validUntil' | 'currentUsageTotal' | 'active' | 'createdAt' | 'updatedAt'> {}

class PromoCode extends Model<PromoCodeAttributes, PromoCodeCreationAttributes> implements PromoCodeAttributes {
  public id!: number;
  public code!: string;
  public name!: string;
  public discountType!: 'percentage' | 'fixed';
  public discountValue!: number;
  public minimumAmount?: number;
  public maxUsageTotal!: number;
  public maxUsagePerCustomer!: number;
  public currentUsageTotal!: number;
  public validFrom?: Date;
  public validUntil?: Date;
  public active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PromoCode.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Unique promo code (e.g., SAVE20)',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Human readable name for the promo code',
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
      comment: 'Type of discount: percentage off or fixed amount off',
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Discount value (20 for 20% or 10 for $10 off)',
    },
    minimumAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Minimum order amount required to use this code',
    },
    maxUsageTotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
      comment: 'Maximum total usage across all customers',
    },
    maxUsagePerCustomer: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Maximum usage per customer',
    },
    currentUsageTotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Current total usage count',
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Start date for promo code validity',
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'End date for promo code validity',
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'PromoCode',
    tableName: 'promo_codes',
    timestamps: true,
    indexes: [
      { fields: ['code'] },
      { fields: ['active'] },
      { fields: ['validFrom', 'validUntil'] },
    ],
  }
);

export { PromoCode };

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PromoCodeUsageAttributes {
  id: number;
  promoCodeId: number;
  customerEmail: string; // Email to track customer usage
  appointmentId?: number; // Reference to the appointment where it was used
  usedAt: Date;
  discountAmount: number; // Actual discount amount applied
  createdAt?: Date;
  updatedAt?: Date;
}

interface PromoCodeUsageCreationAttributes extends Optional<PromoCodeUsageAttributes, 'id' | 'appointmentId' | 'usedAt' | 'createdAt' | 'updatedAt'> {}

class PromoCodeUsage extends Model<PromoCodeUsageAttributes, PromoCodeUsageCreationAttributes> implements PromoCodeUsageAttributes {
  public id!: number;
  public promoCodeId!: number;
  public customerEmail!: string;
  public appointmentId?: number;
  public usedAt!: Date;
  public discountAmount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PromoCodeUsage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    promoCodeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'promo_codes',
        key: 'id',
      },
    },
    customerEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Email address of the customer who used the code',
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'appointments',
        key: 'id',
      },
      comment: 'Reference to the appointment where the code was used',
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Actual discount amount that was applied',
    },
  },
  {
    sequelize,
    modelName: 'PromoCodeUsage',
    tableName: 'promo_code_usage',
    timestamps: true,
    indexes: [
      { fields: ['promoCodeId'] },
      { fields: ['customerEmail'] },
      { fields: ['appointmentId'] },
      { fields: ['promoCodeId', 'customerEmail'] }, // Composite index for checking customer usage
    ],
  }
);

export { PromoCodeUsage };

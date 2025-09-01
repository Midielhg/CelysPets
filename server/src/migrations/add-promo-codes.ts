import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  // Create promo_codes table
  await queryInterface.createTable('promo_codes', {
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Create promo_code_usage table
  await queryInterface.createTable('promo_code_usage', {
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
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Add promo code fields to appointments table
  await queryInterface.addColumn('appointments', 'promoCodeId', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'promo_codes',
      key: 'id',
    },
    comment: 'Reference to applied promo code',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addColumn('appointments', 'promoCodeDiscount', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Discount amount applied from promo code',
  });

  await queryInterface.addColumn('appointments', 'originalAmount', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Original amount before promo code discount',
  });

  // Add indexes
  await queryInterface.addIndex('promo_codes', ['code']);
  await queryInterface.addIndex('promo_codes', ['active']);
  await queryInterface.addIndex('promo_codes', ['validFrom', 'validUntil']);
  
  await queryInterface.addIndex('promo_code_usage', ['promoCodeId']);
  await queryInterface.addIndex('promo_code_usage', ['customerEmail']);
  await queryInterface.addIndex('promo_code_usage', ['appointmentId']);
  await queryInterface.addIndex('promo_code_usage', ['promoCodeId', 'customerEmail']);
};

export const down = async (queryInterface: QueryInterface) => {
  // Remove columns from appointments table
  await queryInterface.removeColumn('appointments', 'originalAmount');
  await queryInterface.removeColumn('appointments', 'promoCodeDiscount');
  await queryInterface.removeColumn('appointments', 'promoCodeId');
  
  // Drop tables
  await queryInterface.dropTable('promo_code_usage');
  await queryInterface.dropTable('promo_codes');
};

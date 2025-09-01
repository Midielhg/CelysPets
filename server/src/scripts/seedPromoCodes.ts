import { Sequelize } from 'sequelize';
import { PromoCode } from '../models/PromoCodeMySQL';

const seedPromoCodes = async () => {
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'celyspets_dev',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'mysql',
      logging: console.log,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Define the models
    PromoCode.init(PromoCode.getAttributes(), { sequelize, modelName: 'PromoCode', tableName: 'promo_codes' });

    // Create sample promo codes
    const promoCodes = [
      {
        code: 'WELCOME20',
        name: 'Welcome 20% Off',
        discountType: 'percentage' as const,
        discountValue: 20.00,
        minimumAmount: 50.00,
        maxUsageTotal: 100,
        maxUsagePerCustomer: 1,
        currentUsageTotal: 0,
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        active: true,
      },
      {
        code: 'SAVE15',
        name: 'Save $15 on Any Service',
        discountType: 'fixed' as const,
        discountValue: 15.00,
        minimumAmount: 75.00,
        maxUsageTotal: 50,
        maxUsagePerCustomer: 2,
        currentUsageTotal: 0,
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-06-30'),
        active: true,
      },
      {
        code: 'FIRSTTIME',
        name: 'First Time Customer 25% Off',
        discountType: 'percentage' as const,
        discountValue: 25.00,
        minimumAmount: 40.00,
        maxUsageTotal: 1000,
        maxUsagePerCustomer: 1,
        currentUsageTotal: 0,
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        active: true,
      },
      {
        code: 'BULK30',
        name: 'Bulk Service 30% Off',
        discountType: 'percentage' as const,
        discountValue: 30.00,
        minimumAmount: 150.00,
        maxUsageTotal: 25,
        maxUsagePerCustomer: 1,
        currentUsageTotal: 0,
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        active: true,
      },
      {
        code: 'VIP10',
        name: 'VIP $10 Off',
        discountType: 'fixed' as const,
        discountValue: 10.00,
        minimumAmount: 30.00,
        maxUsageTotal: 500,
        maxUsagePerCustomer: 5,
        currentUsageTotal: 0,
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        active: true,
      }
    ];

    console.log('Creating sample promo codes...');
    
    for (const promoData of promoCodes) {
      try {
        const existingPromo = await PromoCode.findOne({ where: { code: promoData.code } });
        if (!existingPromo) {
          await PromoCode.create(promoData);
          console.log(`✅ Created promo code: ${promoData.code}`);
        } else {
          console.log(`⚠️  Promo code ${promoData.code} already exists`);
        }
      } catch (error) {
        console.error(`❌ Error creating promo code ${promoData.code}:`, error);
      }
    }

    console.log('Sample promo codes seeding completed!');

  } catch (error) {
    console.error('Error seeding promo codes:', error);
  } finally {
    await sequelize.close();
  }
};

seedPromoCodes();

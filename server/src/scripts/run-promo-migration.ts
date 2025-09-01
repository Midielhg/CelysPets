import { Sequelize, QueryInterface } from 'sequelize';
import { up, down } from '../migrations/add-promo-codes';

const runMigration = async () => {
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

    const queryInterface = sequelize.getQueryInterface();

    // Run the migration
    console.log('Running promo codes migration...');
    await up(queryInterface);
    console.log('Promo codes migration completed successfully!');

  } catch (error) {
    console.error('Error running migration:', error);
    
    // If we need to rollback
    if (process.argv.includes('--rollback')) {
      try {
        console.log('Rolling back migration...');
        const queryInterface = sequelize.getQueryInterface();
        await down(queryInterface);
        console.log('Migration rolled back successfully.');
      } catch (rollbackError) {
        console.error('Error rolling back migration:', rollbackError);
      }
    }
  } finally {
    await sequelize.close();
  }
};

runMigration();

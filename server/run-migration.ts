import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { up as addPromoCodes } from './src/migrations/add-promo-codes';

dotenv.config();

const sequelize = new Sequelize({
  host: process.env.MYSQL_HOST || 'localhost',
  database: process.env.MYSQL_DATABASE || 'celyspets_dev',
  username: process.env.MYSQL_USERNAME || 'root',
  password: process.env.MYSQL_PASSWORD,
  dialect: 'mysql',
  logging: console.log,
});

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('🔄 Running promo codes migration...');
    await addPromoCodes(sequelize.getQueryInterface());
    console.log('✅ Migration completed successfully');

    console.log('🔄 Closing database connection...');
    await sequelize.close();
    console.log('✅ Migration process completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

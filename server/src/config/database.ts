import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Smart Database Configuration - Auto-switches between SQLite (dev) and MySQL (prod)
const isDevelopment = process.env.NODE_ENV === 'development';
const useLocalDB = process.env.USE_LOCAL_DB === 'true' || isDevelopment;

let sequelize: Sequelize;

if (useLocalDB) {
  // SQLite Configuration for Local Development
  console.log('🔧 Using SQLite database for local development');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database/celyspets_local.db',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  // MySQL Configuration for Production
  console.log('🚀 Using MySQL database for production');
  sequelize = new Sequelize({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DATABASE || 'celyspets_celypets',
    username: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      charset: 'utf8mb4',
      connectTimeout: 60000,
      multipleStatements: false,
      supportBigNumbers: true,
      bigNumberStrings: true,
    },
    timezone: '+00:00',
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ENOTFOUND/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
      ],
      max: 3,
    },
  });
}

// Test database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    
    if (useLocalDB) {
      console.log('✅ SQLite database connected successfully (Local Development)');
    } else {
      console.log('✅ MySQL database connected successfully (Production)');
    }
    
    // Sync database models (create tables if they don't exist)
    await sequelize.sync({ force: true }); // Force recreate tables to avoid conflicts
    console.log('✅ Database models synchronized');
  } catch (error) {
    const dbType = useLocalDB ? 'SQLite (Local)' : 'MySQL (Production)';
    console.error(`❌ Unable to connect to ${dbType} database:`, error);
    
    // In development, warn but don't exit - allow frontend-only development
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Development mode: Continuing without database connection');
      console.warn('⚠️ API endpoints will not work until database is connected');
      return;
    }
    
    // In production, exit on database connection failure
    process.exit(1);
  }
};

export default sequelize;

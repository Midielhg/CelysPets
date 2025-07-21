"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Smart Database Configuration - Auto-switches between SQLite (dev) and MySQL (prod)
const isDevelopment = process.env.NODE_ENV === 'development';
const useLocalDB = process.env.USE_LOCAL_DB === 'true' || isDevelopment;
let sequelize;
if (useLocalDB) {
    // SQLite Configuration for Local Development
    console.log('🔧 Using SQLite database for local development');
    sequelize = new sequelize_1.Sequelize({
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
}
else {
    // MySQL Configuration for Production
    console.log('🚀 Using MySQL database for production');
    sequelize = new sequelize_1.Sequelize({
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
const connectDatabase = async () => {
    try {
        await sequelize.authenticate();
        if (useLocalDB) {
            console.log('✅ SQLite database connected successfully (Local Development)');
        }
        else {
            console.log('✅ MySQL database connected successfully (Production)');
        }
        // Sync database models (create tables if they don't exist)
        await sequelize.sync({ alter: true });
        console.log('✅ Database models synchronized');
    }
    catch (error) {
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
exports.connectDatabase = connectDatabase;
exports.default = sequelize;
//# sourceMappingURL=database.js.map
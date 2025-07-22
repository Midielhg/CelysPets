const { Sequelize, DataTypes } = require('sequelize');

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'celyspets_celypets',
  process.env.DB_USER || 'celyspets_root',
  process.env.DB_PASSWORD || 'ZMx43BfDFn3dF4',
  {
    host: process.env.DB_HOST || 'mysql-celyspets.alwaysdata.net',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: console.log,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

async function makeUserAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Update the user with email admin@celypets.com to be an admin
    const [affectedRows] = await sequelize.query(
      "UPDATE users SET role = 'admin' WHERE email = 'admin@celypets.com'",
      { type: sequelize.QueryTypes.UPDATE }
    );

    console.log(`✅ Updated ${affectedRows} user(s) to admin role`);

    // Verify the update
    const [results] = await sequelize.query(
      "SELECT id, name, email, role FROM users WHERE email = 'admin@celypets.com'",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('✅ User details:', results);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    console.log('✅ Database connection closed');
  }
}

makeUserAdmin();

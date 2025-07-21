const { Sequelize } = require('sequelize');
require('dotenv').config();

// Test MySQL connection
async function testConnection() {
  try {
    console.log('Testing MySQL connection...');
    
    const sequelize = new Sequelize({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      database: process.env.MYSQL_DATABASE,
      username: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_PASSWORD,
      dialect: 'mysql',
      logging: false
    });
    
    await sequelize.authenticate();
    console.log('✅ Successfully connected to MySQL!');
    
    // Test creating a simple table and record
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id INT AUTO_INCREMENT PRIMARY KEY,
        test_message VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await sequelize.query(`
      INSERT INTO connection_test (test_message) VALUES ('Connection successful!')
    `);
    console.log('✅ Test record created successfully!');
    
    // Clean up test table
    await sequelize.query('DROP TABLE IF EXISTS connection_test');
    console.log('✅ Test table cleaned up!');
    
    await sequelize.close();
    console.log('✅ Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    
    if (error.message.includes('authentication failed') || error.message.includes('Access denied')) {
      console.log('\n💡 Possible fixes:');
      console.log('1. Check your username and password in the .env file');
      console.log('2. Make sure the database user exists and has proper permissions');
      console.log('3. Verify the database name is correct');
      console.log('4. Check if the MySQL server is running');
    }
    
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Possible fixes:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the MySQL host and port are correct');
      console.log('3. Make sure the MySQL server is running');
    }
    
    process.exit(1);
  }
}

testConnection();

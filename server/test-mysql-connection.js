const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.development' });

async function testConnection() {
  try {
    console.log('🔄 Testing MySQL connection...');
    console.log(`Host: ${process.env.MYSQL_HOST}`);
    console.log(`Database: ${process.env.MYSQL_DATABASE}`);
    console.log(`Username: ${process.env.MYSQL_USERNAME}`);
    
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      connectTimeout: 20000,
      acquireTimeout: 20000,
    });

    console.log('✅ MySQL connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', rows);
    
    await connection.end();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testConnection();

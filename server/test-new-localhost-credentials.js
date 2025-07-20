// Test the updated localhost database credentials
const mysql = require('mysql2/promise');

async function testLocalhostConnection() {
  console.log('🔧 Testing Updated Localhost Database Credentials...\n');

  const config = {
    host: 'localhost',
    user: 'celyspets_celypets',
    password: 'hY9cq6KT3$',
    database: 'celyspets_celypets',
    port: 3306
  };

  console.log('📋 Connection Details:');
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   Username: ${config.user}`);
  console.log(`   Password: ${config.password}`);
  console.log('');

  try {
    console.log('🔌 Attempting connection...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Connection successful!');
    
    // Test basic query
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database query works!');
    
    await connection.end();
    console.log('✅ All tests passed! Credentials are correct for localhost.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔍 Common issues:');
    console.log('   • Database "celyspets_celypets" not created yet');
    console.log('   • User "celyspets_celypets" not created yet');
    console.log('   • Password "hY9cq6KT3$" is incorrect');
    console.log('   • MySQL service not running');
    console.log('   • User lacks privileges on the database');
  }
}

testLocalhostConnection();

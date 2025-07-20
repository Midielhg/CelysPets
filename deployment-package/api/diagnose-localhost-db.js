// Test script to diagnose database connection issues on your hosting server
const mysql = require('mysql2/promise');

// Test different configurations
const configs = [
  {
    name: 'localhost',
    host: 'localhost',
    user: 'celyspets_celypets',
    password: 'hY9cq6KT3$',
    database: 'celyspets_celypets',
    port: 3306
  },
  {
    name: '127.0.0.1',
    host: '127.0.0.1',
    user: 'celyspets_celypets',
    password: 'hY9cq6KT3$',
    database: 'celyspets_celypets',
    port: 3306
  },
  {
    name: 'localhost:3307',
    host: 'localhost',
    user: 'celyspets_celypets',
    password: 'hY9cq6KT3$',
    database: 'celyspets_celypets',
    port: 3307
  }
];

async function testAllConfigs() {
  console.log('🔧 Testing Database Configurations on Hosting Server...\n');

  for (const config of configs) {
    console.log(`\n📡 Testing: ${config.name}`);
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    
    try {
      const connection = await mysql.createConnection(config);
      console.log(`✅ ${config.name} - CONNECTION SUCCESSFUL!`);
      
      // Test if tables exist
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`📋 Tables found: ${tables.length}`);
      
      // Test if admin user exists
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE email = ?', ['admin@celyspets.com']);
      console.log(`👤 Admin user exists: ${users[0].count > 0 ? 'YES' : 'NO'}`);
      
      await connection.end();
      console.log(`🎉 ${config.name} - FULLY WORKING!`);
      break; // Stop testing once we find a working config
      
    } catch (error) {
      console.log(`❌ ${config.name} - FAILED: ${error.message}`);
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`   → MySQL service might not be running on ${config.host}:${config.port}`);
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log(`   → Access denied - check username/password/database name`);
      } else if (error.code === 'ER_BAD_DB_ERROR') {
        console.log(`   → Database '${config.database}' doesn't exist`);
      }
    }
  }
  
  console.log('\n🔍 Additional Checks:');
  console.log('1. Make sure MySQL is running: systemctl status mysql');
  console.log('2. Check your hosting control panel for exact database credentials');
  console.log('3. Verify you\'ve imported setup-localhost-database.sql');
  console.log('4. Try different host values based on your hosting provider');
}

testAllConfigs();

// Database Connection Test Script
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function testDatabaseConnection() {
  console.log('🔧 Testing Database Connection...\n');

  // Database configuration for localhost
  const dbConfig = {
    host: 'localhost',
    user: 'celyspets_celypets',
    password: '3r5t1jQLE@',
    database: 'celyspets_celypets',
    port: 3306
  };

  let connection;

  try {
    // Test 1: Basic Connection
    console.log('1️⃣ Testing basic connection...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection successful!\n');

    // Test 2: Check tables exist
    console.log('2️⃣ Checking if tables exist...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tables found:', tables.map(t => Object.values(t)[0]));
    console.log('');

    // Test 3: Check admin user exists
    console.log('3️⃣ Checking admin user...');
    const [users] = await connection.execute('SELECT email, name, role FROM users WHERE email = ?', ['admin@celyspets.com']);
    
    if (users.length > 0) {
      console.log('✅ Admin user found:', users[0]);
    } else {
      console.log('❌ Admin user NOT found');
    }
    console.log('');

    // Test 4: Test password hash
    console.log('4️⃣ Testing password verification...');
    const [userWithPassword] = await connection.execute('SELECT password FROM users WHERE email = ?', ['admin@celyspets.com']);
    
    if (userWithPassword.length > 0) {
      const isPasswordValid = await bcrypt.compare('admin123', userWithPassword[0].password);
      console.log('🔐 Password hash test:', isPasswordValid ? '✅ VALID' : '❌ INVALID');
      console.log('Stored hash:', userWithPassword[0].password);
    }
    console.log('');

    // Test 5: Check sample data
    console.log('5️⃣ Checking sample data...');
    const [clients] = await connection.execute('SELECT COUNT(*) as count FROM clients');
    const [appointments] = await connection.execute('SELECT COUNT(*) as count FROM appointments');
    
    console.log(`📊 Clients: ${clients[0].count}`);
    console.log(`📅 Appointments: ${appointments[0].count}`);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@celyspets.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔍 Troubleshooting tips:');
      console.log('   1. Make sure MySQL is running');
      console.log('   2. Check if database "celyspets_celypets" exists');
      console.log('   3. Verify user "celyspets_celypets" has correct permissions');
      console.log('   4. Check if password "3r5t1jQLE@" is correct');
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🔍 Access denied - check:');
      console.log('   1. Username: celyspets_celypets');
      console.log('   2. Password: 3r5t1jQLE@');
      console.log('   3. Database permissions');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testDatabaseConnection();

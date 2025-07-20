// Test Remote Database Connection (mysql.us.cloudlogin.co)
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function testRemoteDatabaseConnection() {
  console.log('🔧 Testing REMOTE Database Connection...\n');

  // Remote database configuration
  const dbConfig = {
    host: 'mysql.us.cloudlogin.co',
    user: 'celyspets_celypets',
    password: '3r5t1jQLE@',
    database: 'celyspets_celypets',
    port: 3306
  };

  let connection;

  try {
    console.log('1️⃣ Testing remote connection...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Remote database connection successful!\n');

    // Test admin login
    console.log('2️⃣ Testing admin login...');
    const [users] = await connection.execute('SELECT email, password, name, role FROM users WHERE email = ?', ['admin@celyspets.com']);
    
    if (users.length > 0) {
      console.log('✅ Admin user found:', {
        email: users[0].email,
        name: users[0].name,
        role: users[0].role
      });
      
      // Test password
      const isPasswordValid = await bcrypt.compare('admin123', users[0].password);
      console.log('🔐 Password test:', isPasswordValid ? '✅ VALID' : '❌ INVALID');
      
      if (!isPasswordValid) {
        console.log('⚠️ Password hash needs to be updated!');
        console.log('Current hash:', users[0].password);
        
        // Generate correct hash
        const correctHash = await bcrypt.hash('admin123', 10);
        console.log('Correct hash should be:', correctHash);
      }
    } else {
      console.log('❌ Admin user NOT found in remote database');
    }

    console.log('\n🎉 Remote database test completed!');

  } catch (error) {
    console.error('❌ Remote database connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔍 This might be an IP whitelisting issue');
      console.log('   Your IP might not be whitelisted for the remote database');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testRemoteDatabaseConnection();

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

// MySQL connection config (from server/.env)
const mysqlConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
};

async function generateUserMigrationSQL() {
  try {
    console.log('🔄 Generating user migration SQL...');
    
    // Connect to MySQL
    const connection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Connected to MySQL');
    
    // Get all users from MySQL
    const [users] = await connection.execute('SELECT * FROM users');
    console.log(`📊 Found ${users.length} users in MySQL`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found in MySQL database');
      await connection.end();
      return;
    }
    
    // Generate SQL statements
    let sqlStatements = [
      '-- User Migration SQL Script',
      '-- Run this in your Supabase SQL Editor',
      '',
      '-- Temporarily disable RLS',
      'ALTER TABLE users DISABLE ROW LEVEL SECURITY;',
      ''
    ];
    
    users.forEach((user, index) => {
      console.log(`🔄 Processing user: ${user.email} (Role: ${user.role})`);
      
      const businessSettings = user.businessSettings ? `'${JSON.stringify(user.businessSettings).replace(/'/g, "''")}'::jsonb` : 'NULL';
      const googleTokens = user.googleTokens ? `'${JSON.stringify(user.googleTokens).replace(/'/g, "''")}'::jsonb` : 'NULL';
      
      // Handle dates safely
      let createdAt = 'NOW()';
      let updatedAt = 'NOW()';
      
      if (user.createdAt && user.createdAt instanceof Date && !isNaN(user.createdAt)) {
        createdAt = `'${user.createdAt.toISOString()}'`;
      } else if (user.createdAt && typeof user.createdAt === 'string') {
        createdAt = `'${user.createdAt}'`;
      }
      
      if (user.updatedAt && user.updatedAt instanceof Date && !isNaN(user.updatedAt)) {
        updatedAt = `'${user.updatedAt.toISOString()}'`;
      } else if (user.updatedAt && typeof user.updatedAt === 'string') {
        updatedAt = `'${user.updatedAt}'`;
      }
      
      const insertSQL = `
-- Insert user ${index + 1}: ${user.email}
INSERT INTO users (email, password, name, role, business_settings, google_tokens, created_at, updated_at)
VALUES (
  '${user.email.replace(/'/g, "''")}',
  '${user.password.replace(/'/g, "''")}',
  '${user.name.replace(/'/g, "''")}',
  '${user.role}',
  ${businessSettings},
  ${googleTokens},
  ${createdAt},
  ${updatedAt}
);`;
      
      sqlStatements.push(insertSQL);
    });
    
    sqlStatements.push('');
    sqlStatements.push('-- Re-enable RLS');
    sqlStatements.push('ALTER TABLE users ENABLE ROW LEVEL SECURITY;');
    sqlStatements.push('');
    sqlStatements.push('-- Verify migration');
    sqlStatements.push('SELECT id, email, name, role, created_at FROM users ORDER BY created_at;');
    
    // Write SQL to file
    const sqlContent = sqlStatements.join('\n');
    const sqlFilePath = path.join(__dirname, 'user-migration.sql');
    fs.writeFileSync(sqlFilePath, sqlContent);
    
    await connection.end();
    
    console.log('🎉 SQL migration script generated successfully!');
    console.log(`📄 File saved to: ${sqlFilePath}`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Copy the contents of user-migration.sql');
    console.log('2. Go to your Supabase dashboard > SQL Editor');
    console.log('3. Paste and run the SQL script');
    console.log('4. Verify users were created successfully');
    
    // Also print the SQL for immediate use
    console.log('\n📄 SQL Script Contents:');
    console.log('=====================================');
    console.log(sqlContent);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
generateUserMigrationSQL();

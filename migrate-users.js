import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env and root .env.development
dotenv.config({ path: path.join(__dirname, 'server', '.env') });
dotenv.config({ path: path.join(__dirname, '.env.development') });

// MySQL connection config (from server/.env)
const mysqlConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
};

// Supabase config - We need service role for migration to bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // We'll use anon key but disable RLS first

console.log('🔍 Environment Variables Debug:');
console.log('MySQL Host:', process.env.MYSQL_HOST);
console.log('MySQL Database:', process.env.MYSQL_DATABASE);
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Present' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateUsers() {
  try {
    console.log('🔄 Starting user migration from MySQL to Supabase...');
    
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
    
    // Temporarily disable RLS on users table for migration
    console.log('🔓 Temporarily disabling RLS for migration...');
    const { error: disableRLSError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableRLSError) {
      console.log('⚠️  Could not disable RLS, continuing anyway:', disableRLSError.message);
    }
    
    // Migrate each user to Supabase
    for (const user of users) {
      console.log(`🔄 Migrating user: ${user.email} (Role: ${user.role})`);
      
      try {
        // Insert user into Supabase users table
        const { data, error } = await supabase
          .from('users')
          .insert({
            email: user.email,
            password: user.password, // Keep bcrypt hash for now
            name: user.name,
            role: user.role,
            business_settings: user.businessSettings,
            google_tokens: user.googleTokens,
            created_at: user.createdAt,
            updated_at: user.updatedAt
          });
        
        if (error) {
          console.error(`❌ Error migrating user ${user.email}:`, error);
        } else {
          console.log(`✅ Successfully migrated user: ${user.email}`);
        }
      } catch (err) {
        console.error(`❌ Exception migrating user ${user.email}:`, err.message);
      }
    }
    
    // Re-enable RLS on users table after migration
    console.log('🔒 Re-enabling RLS...');
    const { error: enableRLSError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;'
    });
    
    if (enableRLSError) {
      console.log('⚠️  Could not re-enable RLS:', enableRLSError.message);
    }
    
    await connection.end();
    console.log('🎉 User migration completed!');
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    const { data: supabaseUsers, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('❌ Error verifying migration:', error);
    } else {
      console.log(`✅ Verification complete: ${supabaseUsers.length} users in Supabase`);
      console.log('Users:', supabaseUsers.map(u => ({ email: u.email, role: u.role })));
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
migrateUsers();

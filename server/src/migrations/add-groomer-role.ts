import sequelize from '../config/database';

async function migrateGroomerRole() {
  try {
    console.log('🔄 Starting migration: Add groomer role');
    
    // Update the ENUM type to include 'groomer'
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('client', 'admin', 'groomer') 
      NOT NULL DEFAULT 'client'
    `);
    
    // Update user with id 2 to be a groomer
    await sequelize.query(`
      UPDATE users 
      SET role = 'groomer' 
      WHERE id = 2 AND email = 'carlos@celyspets.com'
    `);
    
    console.log('✅ Migration completed: Groomer role added');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateGroomerRole()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { migrateGroomerRole };

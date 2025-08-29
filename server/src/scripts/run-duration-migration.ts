import sequelize from '../config/database';

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    // Check if fullGroomDuration column exists in breeds table
    try {
      await sequelize.query(`
        ALTER TABLE breeds ADD COLUMN fullGroomDuration INT COMMENT 'Duration in minutes for full grooming service'
      `);
      console.log('✅ Added fullGroomDuration column to breeds table');
    } catch (error: any) {
      if (error.original?.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ fullGroomDuration column already exists in breeds table');
      } else {
        throw error;
      }
    }
    
    // Check if duration column exists in additional_services table
    try {
      await sequelize.query(`
        ALTER TABLE additional_services ADD COLUMN duration INT COMMENT 'Duration in minutes for this additional service'
      `);
      console.log('✅ Added duration column to additional_services table');
    } catch (error: any) {
      if (error.original?.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ duration column already exists in additional_services table');
      } else {
        throw error;
      }
    }
    
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

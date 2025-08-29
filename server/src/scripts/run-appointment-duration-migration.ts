import sequelize from '../config/database';

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    // Check if endTime column exists in appointments table
    try {
      await sequelize.query(`
        ALTER TABLE appointments ADD COLUMN endTime VARCHAR(10) COMMENT 'Calculated end time based on service duration'
      `);
      console.log('✅ Added endTime column to appointments table');
    } catch (error: any) {
      if (error.original?.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ endTime column already exists in appointments table');
      } else {
        throw error;
      }
    }
    
    // Check if duration column exists in appointments table
    try {
      await sequelize.query(`
        ALTER TABLE appointments ADD COLUMN duration INT COMMENT 'Total appointment duration in minutes'
      `);
      console.log('✅ Added duration column to appointments table');
    } catch (error: any) {
      if (error.original?.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ duration column already exists in appointments table');
      } else {
        throw error;
      }
    }
    
    console.log('🎉 Appointment migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

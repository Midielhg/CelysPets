import sequelize from '../config/database';

async function migrateAppointmentGroomerColumn() {
  try {
    console.log('🔄 Starting migration: Rename driverId to groomerId in appointments');
    
    // First, check if the column exists
    const checkColumnQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'appointments' 
      AND TABLE_SCHEMA = DATABASE() 
      AND COLUMN_NAME IN ('driverId', 'groomerId')
    `;
    
    const [columns] = await sequelize.query(checkColumnQuery);
    console.log('Existing columns:', columns);
    
    // If driverId exists and groomerId doesn't, rename it
    const hasDriverId = columns.some((col: any) => col.COLUMN_NAME === 'driverId');
    const hasGroomerId = columns.some((col: any) => col.COLUMN_NAME === 'groomerId');
    
    if (hasDriverId && !hasGroomerId) {
      console.log('Renaming driverId to groomerId...');
      await sequelize.query(`
        ALTER TABLE appointments 
        CHANGE COLUMN driverId groomerId INT NULL
      `);
    } else if (!hasDriverId && !hasGroomerId) {
      console.log('Adding groomerId column...');
      await sequelize.query(`
        ALTER TABLE appointments 
        ADD COLUMN groomerId INT NULL,
        ADD FOREIGN KEY (groomerId) REFERENCES users(id)
      `);
    } else if (hasGroomerId) {
      console.log('groomerId column already exists');
    }
    
    console.log('✅ Migration completed: Appointment groomer column updated');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateAppointmentGroomerColumn()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { migrateAppointmentGroomerColumn };

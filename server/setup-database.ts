import { connectDatabase } from './src/config/database';
import sequelize from './src/config/database';

// Import all models to ensure they're registered
import './src/models/UserMySQL';
import './src/models/ClientMySQL';
import './src/models/AppointmentMySQL';

console.log('🔄 Setting up database tables...');

const setupDatabase = async () => {
  try {
    // Connect to database
    console.log('📡 Connecting to MySQL database...');
    await connectDatabase();
    
    // Force sync all models (this will create tables)
    console.log('🏗️  Creating database tables...');
    await sequelize.sync({ force: true, alter: false });
    
    console.log('✅ Database tables created successfully!');
    console.log('📋 Tables created:');
    console.log('   - Users');
    console.log('   - Clients'); 
    console.log('   - Appointments');
    
    // Create default admin user
    console.log('👤 Creating default admin user...');
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await sequelize.query(`
      INSERT INTO users (email, password, name, role, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, {
      replacements: [
        'admin@celyspets.com', 
        hashedPassword, 
        'Cely Admin', 
        'admin'
      ]
    });
    
    console.log('✅ Default admin user created');
    console.log('📧 Email: admin@celyspets.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change this password after first login!');
    
    // Close connection
    await sequelize.close();
    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();

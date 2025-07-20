import { connectDatabase } from './src/config/database';
import sequelize from './src/config/database';

const showDatabaseInfo = async () => {
  try {
    console.log('🔍 Checking database contents...');
    
    // Connect to database
    await connectDatabase();
    
    // Show tables
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log('\n📋 Database Tables:');
    tables.forEach((table: any) => {
      const tableName = Object.values(table)[0];
      console.log(`   ✅ ${tableName}`);
    });
    
    // Show users count
    const [userCount] = await sequelize.query("SELECT COUNT(*) as count FROM users");
    console.log(`\n👥 Users: ${(userCount as any)[0].count} records`);
    
    // Show all users
    const [users] = await sequelize.query("SELECT id, email, name, role, createdAt FROM users");
    if ((users as any[]).length > 0) {
      console.log('\n👤 User Details:');
      (users as any[]).forEach(user => {
        console.log(`   ID: ${user.id} | Email: ${user.email} | Name: ${user.name} | Role: ${user.role}`);
      });
    }
    
    // Show clients count
    const [clientCount] = await sequelize.query("SELECT COUNT(*) as count FROM clients");
    console.log(`\n👨‍👩‍👧‍👦 Clients: ${(clientCount as any)[0].count} records`);
    
    // Show appointments count
    const [appointmentCount] = await sequelize.query("SELECT COUNT(*) as count FROM appointments");
    console.log(`📅 Appointments: ${(appointmentCount as any)[0].count} records`);
    
    console.log('\n🎉 Database is ready for your mobile grooming business!');
    
    // Close connection
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  }
};

showDatabaseInfo();

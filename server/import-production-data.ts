import { connectDatabase } from './src/config/database';
import sequelize from './src/config/database';
import bcrypt from 'bcrypt';

// Import all models
import './src/models/UserMySQL';
import './src/models/ClientMySQL';
import './src/models/AppointmentMySQL';

console.log('🔄 Importing production data to local SQLite database...');

const importData = async () => {
  try {
    // Connect to database
    console.log('📡 Connecting to local SQLite database...');
    await connectDatabase();
    
    // Clear existing data and recreate tables
    console.log('🗑️  Clearing existing data...');
    await sequelize.sync({ force: true });
    
    // Import Users
    console.log('👤 Importing users...');
    await sequelize.query(`
      INSERT INTO users (id, email, password, name, role, businessSettings, googleTokens, createdAt, updatedAt) VALUES
      (1, 'admin@celyspets.com', '$2b$10$Hgfackqu5dKnuADxeUxpB.qSHYZK5yaLMzVTDUlsoGkeak1OoKMBW', 'Cely Admin', 'admin', NULL, NULL, '2025-07-20 00:38:18', '2025-07-20 00:38:18'),
      (2, 'michelz0165@gmail.com', '$2a$12$VD2DrlmHlXCjkI1WsFcZm.MSacCyav1.G/nqbumkYIBTXZnGIo1O6', 'Michel Heniquez', 'client', NULL, NULL, '2025-07-20 02:11:23', '2025-07-20 02:11:23'),
      (3, 'midielhg@icloud.com', '$2y$10$hNU2Gdk0q0n588pvpSrUTuSiSSi73jS8ehX9ut7jLHzOU00SiBkGO', 'Midiel Henriquez', 'client', NULL, NULL, datetime('now'), datetime('now'))
    `);
    
    // Import Clients
    console.log('🐕 Importing clients...');
    const clients = [
      [1, 'Test Client', 'test@example.com', '555-0123', '123 Test St, Miami, FL', JSON.stringify([{"age": 3, "name": "Buddy", "breed": "Golden Retriever"}])],
      [2, 'John Doe', 'john@example.com', '555-1234', '456 Oak Ave, Miami, FL', JSON.stringify([{"age": 2, "name": "Max", "breed": "Labrador"}])],
      [3, 'Maria Rodriguez', 'maria.rodriguez@gmail.com', '305-555-1234', '1250 Biscayne Blvd, Miami, FL 33132', JSON.stringify([{"age": 3, "name": "Luna", "breed": "Golden Retriever"}])],
      [4, 'Carlos Mendez Updated', 'carlos.mendez@hotmail.com', '786-555-9999', '900 Brickell Key Dr, Updated Address, Miami, FL 33131', JSON.stringify([{"age": 5, "name": "Rocky", "breed": "German Shepherd"}])],
      [5, 'Jennifer Smith - Updated', 'jennifer.smith.updated@yahoo.com', '305-555-9999', '2100 Park Ave, Updated Suite 123, Miami Beach, FL 33139', JSON.stringify([{"age": 2, "name": "Bella", "breed": "Poodle"}, {"age": 4, "name": "Max", "breed": "Yorkie"}])],
      [6, 'David Williams', 'david.williams@gmail.com', '786-555-4567', '3400 SW 27th Ave, Coconut Grove, FL 33133', JSON.stringify([{"age": 6, "name": "Charlie", "breed": "Beagle"}])],
      [7, 'Ana Gutierrez', 'ana.gutierrez@outlook.com', '305-555-5678', '1500 Bay Rd, Miami Beach, FL 33139', JSON.stringify([{"age": 3, "name": "Coco", "breed": "Shih Tzu"}])],
      [8, 'Roberto Silva', 'roberto.silva@gmail.com', '786-555-6789', '4000 Meridian Ave, Miami Beach, FL 33140', JSON.stringify([{"age": 4, "name": "Zeus", "breed": "Rottweiler"}])],
      [9, 'Isabella Martinez', 'isabella.martinez@icloud.com', '305-555-7890', '1040 10th St, Miami Beach, FL 33139', JSON.stringify([{"age": 5, "name": "Mimi", "breed": "Maltese"}])],
      [10, 'Michael Johnson', 'michael.johnson@gmail.com', '786-555-8901', '501 NE 31st St, Miami, FL 33137', JSON.stringify([{"age": 7, "name": "Buddy", "breed": "Labrador Mix"}, {"age": 3, "name": "Sadie", "breed": "Border Collie"}])],
      [11, 'Sofia Ramirez', 'sofia.ramirez@hotmail.com', '305-555-9012', '800 West Ave, Miami Beach, FL 33139', JSON.stringify([{"age": 2, "name": "Princess", "breed": "Chihuahua"}])],
      [12, 'Patricia Lopez', 'patricia.lopez@gmail.com', '786-555-0123', '1717 N Bayshore Dr, Miami, FL 33132', JSON.stringify([{"age": 4, "name": "Oscar", "breed": "French Bulldog"}])],
      [13, 'Alexander Torres alexandre', 'alex.torres@yahoo.com', '305-555-1357', '2020 Prairie Ave, Miami Beach, FL 33139', JSON.stringify([{"age": 5, "name": "Duke", "breed": "Pitbull"}])],
      [14, 'Carmen Fernandez', 'carmen.fernandez@outlook.com', '786-555-2468', '3900 Biscayne Blvd, Miami, FL 33137', JSON.stringify([{"age": 3, "name": "Lola", "breed": "Pomeranian"}])],
      [15, 'Eduardo Morales', 'eduardo.morales@gmail.com', '305-555-3691', '1200 West Ave, Miami Beach, FL 33139', JSON.stringify([{"age": 6, "name": "Simba", "breed": "Husky"}])],
      [16, 'Valentina Castro', 'valentina.castro@hotmail.com', '786-555-4815', '1500 Lincoln Rd, Miami Beach, FL 33139', JSON.stringify([{"age": 4, "name": "Gigi", "breed": "Cavalier King Charles"}, {"age": 2, "name": "Pepe", "breed": "Boston Terrier"}])],
      [17, 'Ricardo Perez', 'ricardo.perez@icloud.com', '305-555-5926', '2600 Douglas Rd, Coral Gables, FL 33134', JSON.stringify([{"age": 3, "name": "Thor", "breed": "Great Dane"}])],
      [18, 'Gabriela Vega', 'gabriela.vega@gmail.com', '786-555-6037', '888 Brickell Key Dr, Miami, FL 33131', JSON.stringify([{"age": 5, "name": "Nala", "breed": "Australian Shepherd"}])],
      [19, 'Fernando Diaz', 'fernando.diaz@outlook.com', '305-555-7148', '1901 Brickell Ave, Miami, FL 33129', JSON.stringify([{"age": 4, "name": "Rex", "breed": "Boxer"}, {"age": 6, "name": "Maya", "breed": "Cocker Spaniel"}])],
      [20, 'Lucia Herrera', 'lucia.herrera@yahoo.com', '786-555-8259', '755 Crandon Blvd, Key Biscayne, FL 33149', JSON.stringify([{"age": 7, "name": "Cookie", "breed": "Dachshund"}])],
      [21, 'test', 'test@test.com', 'test', 'test', 'null'],
      [22, 'test', 'test@gmail.com', '30459359404', '13413413', JSON.stringify([])],
      [23, 'test', 'test', '(305) 549-0653', '14511 Jefferson St ', JSON.stringify([])],
      [24, 'new client', 'newclietn@gmail.com', '3045490653', 'tweet', 'null']
    ];
    
    for (const client of clients) {
      await sequelize.query(`
        INSERT INTO clients (id, name, email, phone, address, pets, notes, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, '', datetime('now'), datetime('now'))
      `, { replacements: client });
    }
    
    // Import Appointments
    console.log('📅 Importing appointments...');
    const appointments = [
      [3, 3, JSON.stringify(["full-groom", "bath-brush"]), '2025-07-22 00:00:00', '8:00 AM', 'pending', 'First time client, Luna is very friendly', 0.00],
      [5, 5, JSON.stringify(["full-groom", "nail-trim", "flea-treatment"]), '2025-07-21 00:00:00', '2:30 PM', 'confirmed', 'Updated appointment - now includes flea treatment', 130.00],
      [6, 6, JSON.stringify(["bath-brush", "flea-treatment"]), '2025-07-23 00:00:00', '9:00 AM', 'confirmed', 'Charlie has been scratching a lot lately', 85.00],
      [7, 7, JSON.stringify(["full-groom", "nail-trim"]), '2025-07-21 00:00:00', '11:00 AM', 'confirmed', 'Coco loves the blow dryer', 90.00],
      [8, 8, JSON.stringify(["bath-brush", "nail-trim", "teeth-cleaning"]), '2025-07-22 00:00:00', '1:15 PM', 'in-progress', 'Zeus is a big boy but very gentle', 105.00],
      [9, 9, JSON.stringify(["full-groom"]), '2025-07-22 00:00:00', '9:30 AM', 'confirmed', 'Mimi gets car sick, please have everything ready', 65.00],
      [10, 10, JSON.stringify(["bath-brush", "nail-trim"]), '2025-07-23 00:00:00', '12:00 PM', 'confirmed', 'Two active dogs, Buddy has arthritis so gentle handling', 70.00],
      [11, 11, JSON.stringify(["bath-brush", "teeth-cleaning"]), '2025-07-23 00:00:00', '3:30 PM', 'pending', 'Princess is very small and delicate', 80.00],
      [13, 13, JSON.stringify(["bath-brush", "nail-trim", "teeth-cleaning"]), '2025-07-24 00:00:00', '11:00 AM', 'pending', 'Duke is very muscular and strong but loves people', 0.00],
      [14, 14, JSON.stringify(["full-groom", "nail-trim"]), '2025-07-24 00:00:00', '2:15 PM', 'pending', 'Lola is very fluffy and requires special brushing', 90.00],
      [15, 15, JSON.stringify(["full-groom", "teeth-cleaning"]), '2025-07-25 00:00:00', '9:00 AM', 'pending', 'Simba sheds a lot and needs thorough brushing', 100.00],
      [16, 16, JSON.stringify(["bath-brush", "nail-trim"]), '2025-07-25 00:00:00', '11:30 AM', 'pending', 'Two sweet dogs, Gigi and Pepe are best friends', 70.00],
      [17, 17, JSON.stringify(["bath-brush", "nail-trim", "flea-treatment"]), '2025-07-25 00:00:00', '1:45 PM', 'pending', 'Thor is a gentle giant, will need extra large equipment', 110.00],
      [18, 18, JSON.stringify(["full-groom", "teeth-cleaning"]), '2025-07-26 00:00:00', '10:00 AM', 'pending', 'Nala has beautiful long coat that needs special attention', 100.00],
      [19, 19, JSON.stringify(["bath-brush", "nail-trim"]), '2025-07-26 00:00:00', '12:30 PM', 'pending', 'Rex and Maya are rescue dogs, very loving but can be nervous', 70.00],
      [20, 20, JSON.stringify(["full-groom", "nail-trim"]), '2025-07-26 00:00:00', '3:00 PM', 'pending', 'Cookie has a long back, please be careful when lifting', 90.00],
      [21, 21, JSON.stringify(["full-groom"]), '2025-07-23 00:00:00', '8:00 AM', 'pending', '', 0.00],
      [22, 24, JSON.stringify(["bath-brush", "full-groom"]), '2025-07-22 00:00:00', '07:00', 'pending', '', 0.00]
    ];
    
    for (const appointment of appointments) {
      await sequelize.query(`
        INSERT INTO appointments (id, clientId, services, date, time, status, notes, totalAmount, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, { replacements: appointment });
    }
    
    console.log('✅ Data import completed successfully!');
    console.log('📊 Imported:');
    console.log('   - 3 Users (including admin)');
    console.log('   - 24 Clients with pet information');
    console.log('   - 18 Appointments with various statuses');
    
    console.log('\n🔑 Login credentials available:');
    console.log('   📧 admin@celyspets.com / admin123');
    console.log('   📧 michelz0165@gmail.com / (existing password)');
    console.log('   📧 midielhg@icloud.com / (existing password)');
    
    // Close connection
    await sequelize.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Data import failed:', error);
    process.exit(1);
  }
};

// Run the import
importData();

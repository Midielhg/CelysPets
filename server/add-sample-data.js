const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

// Create database connection
const sequelize = new Sequelize({
  host: process.env.MYSQL_HOST || 'mysql.us.cloudlogin.co',
  database: process.env.MYSQL_DATABASE || 'celyspets_celypets',
  username: process.env.MYSQL_USERNAME || 'celyspets_midielhg',
  password: process.env.MYSQL_PASSWORD || 'nCvCE42v6_',
  dialect: 'mysql',
  logging: console.log,
  port: process.env.MYSQL_PORT || 3306,
  dialectOptions: {
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
  },
});

// Define models
const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  role: {
    type: Sequelize.ENUM('admin', 'user'),
    defaultValue: 'user',
  },
  businessSettings: {
    type: Sequelize.JSON,
    allowNull: true,
  },
  googleTokens: {
    type: Sequelize.JSON,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

const Client = sequelize.define('Client', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  address: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  pets: {
    type: Sequelize.JSON,
    allowNull: true,
  },
  notes: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'clients',
  timestamps: true,
});

const Appointment = sequelize.define('Appointment', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  clientId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id',
    },
  },
  services: {
    type: Sequelize.JSON,
    allowNull: false,
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  time: {
    type: Sequelize.TIME,
    allowNull: false,
  },
  status: {
    type: Sequelize.ENUM('pending', 'confirmed', 'in-progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  notes: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  totalAmount: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: true,
  },
}, {
  tableName: 'appointments',
  timestamps: true,
});

// Set up associations
Client.hasMany(Appointment, { foreignKey: 'clientId', as: 'appointments' });
Appointment.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

async function addSampleData() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    console.log('🔄 Synchronizing models...');
    await sequelize.sync({ force: false });
    console.log('✅ Models synchronized');

    // Add sample clients
    console.log('🔄 Adding sample clients...');
    const clients = await Client.bulkCreate([
      {
        name: 'Maria Rodriguez',
        email: 'maria@email.com',
        phone: '305-123-4567',
        address: '1234 Biscayne Blvd, Miami, FL 33132',
        pets: [
          { name: 'Max', breed: 'Golden Retriever', size: 'Large', age: 3 },
          { name: 'Luna', breed: 'Poodle', size: 'Medium', age: 2 }
        ],
        notes: 'Max is very friendly, Luna is a bit shy'
      },
      {
        name: 'Carlos Mendez',
        email: 'carlos@email.com',
        phone: '305-234-5678',
        address: '5678 Ocean Drive, Miami Beach, FL 33139',
        pets: [
          { name: 'Buddy', breed: 'Labrador', size: 'Large', age: 5 }
        ],
        notes: 'Buddy loves water, please be careful around ears'
      },
      {
        name: 'Ana Sofia Martinez',
        email: 'ana@email.com',
        phone: '305-345-6789',
        address: '9012 Coral Way, Miami, FL 33155',
        pets: [
          { name: 'Coco', breed: 'Chihuahua', size: 'Small', age: 1 }
        ],
        notes: 'First time grooming, very nervous'
      },
      {
        name: 'Roberto Silva',
        email: 'roberto@email.com',
        phone: '305-456-7890',
        address: '3456 SW 8th St, Miami, FL 33135',
        pets: [
          { name: 'Princess', breed: 'Yorkshire Terrier', size: 'Small', age: 4 },
          { name: 'Duke', breed: 'German Shepherd', size: 'Large', age: 6 }
        ],
        notes: 'Princess needs special shampoo, Duke is very calm'
      }
    ], { returning: true });

    console.log(`✅ Added ${clients.length} sample clients`);

    // Add sample appointments
    console.log('🔄 Adding sample appointments...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const appointments = await Appointment.bulkCreate([
      {
        clientId: clients[0].id,
        services: [
          { name: 'Full Grooming', price: 65 },
          { name: 'Nail Trim', price: 15 }
        ],
        date: tomorrow.toISOString().split('T')[0],
        time: '09:00:00',
        status: 'confirmed',
        notes: 'Both pets - Max and Luna',
        totalAmount: 80.00
      },
      {
        clientId: clients[1].id,
        services: [
          { name: 'Bath & Brush', price: 45 }
        ],
        date: tomorrow.toISOString().split('T')[0],
        time: '11:00:00',
        status: 'pending',
        notes: 'Large dog - Buddy',
        totalAmount: 45.00
      },
      {
        clientId: clients[2].id,
        services: [
          { name: 'Puppy Introduction', price: 35 }
        ],
        date: nextWeek.toISOString().split('T')[0],
        time: '14:00:00',
        status: 'confirmed',
        notes: 'First grooming session for Coco',
        totalAmount: 35.00
      },
      {
        clientId: clients[3].id,
        services: [
          { name: 'Full Grooming', price: 60 },
          { name: 'Special Shampoo', price: 10 }
        ],
        date: nextWeek.toISOString().split('T')[0],
        time: '16:00:00',
        status: 'pending',
        notes: 'Princess needs hypoallergenic shampoo',
        totalAmount: 70.00
      }
    ], { returning: true });

    console.log(`✅ Added ${appointments.length} sample appointments`);

    console.log('✅ Sample data added successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${clients.length} clients added`);
    console.log(`- ${appointments.length} appointments added`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    process.exit(1);
  }
}

// Load environment variables and run
require('dotenv').config({ path: '.env.mysql' });
addSampleData();

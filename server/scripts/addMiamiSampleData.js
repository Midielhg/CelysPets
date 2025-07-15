const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://CepysPets:9O9WbqcxUwYhFuuQ@cluster0.qejw5mq.mongodb.net/mobile-grooming');

// Define schemas
const clientSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  pets: [{
    name: String,
    breed: String,
    age: Number,
    weight: Number,
    specialInstructions: String
  }]
});

const appointmentSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  dateTime: Date,
  services: [String],
  status: { type: String, enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'], default: 'scheduled' },
  notes: String,
  totalAmount: Number,
  duration: Number,
  createdAt: { type: Date, default: Date.now }
});

const Client = mongoose.model('Client', clientSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

async function addMiamiSampleData() {
  try {
    console.log('Adding Miami sample clients and appointments...');

    // Clear existing data
    await Client.deleteMany({});
    await Appointment.deleteMany({});
    console.log('Cleared existing data');

    // Create Miami clients with real addresses
    const clients = await Client.insertMany([
      {
        name: 'Sofia Martinez',
        email: 'sofia.martinez@email.com',
        phone: '(305) 555-0101',
        address: '801 Brickell Ave, Miami, FL 33131',
        pets: [{
          name: 'Bella',
          breed: 'Golden Retriever',
          age: 3,
          weight: 65,
          specialInstructions: 'Loves treats, afraid of loud noises'
        }]
      },
      {
        name: 'Carlos Rodriguez',
        email: 'carlos.rodriguez@email.com',
        phone: '(305) 555-0102',
        address: '1717 N Bayshore Dr, Miami, FL 33132',
        pets: [{
          name: 'Max',
          breed: 'German Shepherd',
          age: 5,
          weight: 80,
          specialInstructions: 'Very friendly, needs nail trim'
        }]
      },
      {
        name: 'Isabella Garcia',
        email: 'isabella.garcia@email.com',
        phone: '(305) 555-0103',
        address: '2025 Biscayne Blvd, Miami, FL 33137',
        pets: [{
          name: 'Luna',
          breed: 'French Bulldog',
          age: 2,
          weight: 25,
          specialInstructions: 'Sensitive skin, use hypoallergenic products'
        }]
      },
      {
        name: 'Miguel Santos',
        email: 'miguel.santos@email.com',
        phone: '(305) 555-0104',
        address: '200 S Biscayne Blvd, Miami, FL 33131',
        pets: [{
          name: 'Rocky',
          breed: 'Labrador Mix',
          age: 4,
          weight: 70,
          specialInstructions: 'High energy, loves water'
        }]
      },
      {
        name: 'Ana Fernandez',
        email: 'ana.fernandez@email.com',
        phone: '(305) 555-0105',
        address: '100 Lincoln Rd, Miami Beach, FL 33139',
        pets: [{
          name: 'Coco',
          breed: 'Poodle',
          age: 6,
          weight: 15,
          specialInstructions: 'Regular customer, likes specific shampoo'
        }]
      },
      {
        name: 'Roberto Diaz',
        email: 'roberto.diaz@email.com',
        phone: '(305) 555-0106',
        address: '901 Collins Ave, Miami Beach, FL 33139',
        pets: [{
          name: 'Thor',
          breed: 'Husky',
          age: 3,
          weight: 55,
          specialInstructions: 'Thick coat, needs thorough brushing'
        }]
      }
    ]);

    console.log('Created clients:', clients.length);

    // Create appointments for today and tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const appointments = await Appointment.insertMany([
      // Today's appointments
      {
        client: clients[0]._id,
        dateTime: new Date(today.setHours(9, 0, 0, 0)),
        services: ['Full Grooming', 'Nail Trim'],
        status: 'confirmed',
        notes: 'Regular grooming appointment',
        totalAmount: 85,
        duration: 90
      },
      {
        client: clients[1]._id,
        dateTime: new Date(today.setHours(11, 0, 0, 0)),
        services: ['Bath & Brush', 'Nail Trim'],
        status: 'confirmed',
        notes: 'Large dog, extra time needed',
        totalAmount: 65,
        duration: 75
      },
      {
        client: clients[2]._id,
        dateTime: new Date(today.setHours(14, 0, 0, 0)),
        services: ['Full Grooming', 'Teeth Cleaning'],
        status: 'scheduled',
        notes: 'Sensitive skin, hypoallergenic products',
        totalAmount: 95,
        duration: 85
      },
      {
        client: clients[3]._id,
        dateTime: new Date(today.setHours(16, 0, 0, 0)),
        services: ['Bath & Brush'],
        status: 'confirmed',
        notes: 'High energy dog',
        totalAmount: 55,
        duration: 60
      },
      // Tomorrow's appointments
      {
        client: clients[4]._id,
        dateTime: new Date(tomorrow.setHours(9, 30, 0, 0)),
        services: ['Full Grooming', 'Styling'],
        status: 'scheduled',
        notes: 'Regular customer - poodle cut',
        totalAmount: 120,
        duration: 105
      },
      {
        client: clients[5]._id,
        dateTime: new Date(tomorrow.setHours(13, 0, 0, 0)),
        services: ['De-shedding Treatment', 'Bath & Brush'],
        status: 'confirmed',
        notes: 'Thick coat requires extra attention',
        totalAmount: 85,
        duration: 90
      }
    ]);

    console.log('Created appointments:', appointments.length);
    console.log('✅ Miami sample data added successfully!');
    
    console.log('\nToday\'s appointments:');
    appointments.slice(0, 4).forEach((apt, index) => {
      console.log(`${index + 1}. ${new Date(apt.dateTime).toLocaleTimeString()} - ${clients.find(c => c._id.equals(apt.client)).name}`);
    });

    console.log('\nTomorrow\'s appointments:');
    appointments.slice(4).forEach((apt, index) => {
      console.log(`${index + 1}. ${new Date(apt.dateTime).toLocaleTimeString()} - ${clients.find(c => c._id.equals(apt.client)).name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error adding sample data:', error);
    process.exit(1);
  }
}

addMiamiSampleData();
